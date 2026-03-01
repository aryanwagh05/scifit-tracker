/**
 * media-analysis — Supabase Edge Function
 *
 * Accepts a file (as base64 or a public URL) plus a MIME type, calls the
 * Gemini 2.0 Flash API, and returns a structured JSON analysis.
 *
 * Required Supabase secret (set via `supabase secrets set`):
 *   GEMINI_API_KEY=<your key>
 *
 * Optional secrets (for storing results in DB):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Request body (POST application/json):
 *   { base64?: string, file_url?: string, mime_type: string, prompt?: string }
 *
 * Response:
 *   { summary, detected_objects, sentiment, key_moments, safety_score, tags }
 */

type MediaAnalysisRequest = {
  /** Base64-encoded file bytes (preferred for images). */
  base64?: string;
  /** Public URL to a file already hosted somewhere (e.g. Supabase Storage). */
  file_url?: string;
  /** MIME type, e.g. "image/jpeg" or "video/mp4". Required. */
  mime_type: string;
  /** Optional custom analysis prompt. Falls back to the default structured prompt. */
  prompt?: string;
};

type KeyMoment = { timestamp: string; description: string };

type MediaAnalysisResult = {
  summary: string;
  detected_objects: string[];
  sentiment: string;
  key_moments: KeyMoment[];
  safety_score: number;
  tags: string[];
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type GeminiFileUploadResponse = {
  file?: { uri?: string; state?: string };
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta";
const GEMINI_MODEL = "gemini-flash-latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_PROMPT = [
  "Analyze this media carefully and return ONLY a JSON object with these exact fields:",
  "- summary: detailed description of what you see (string)",
  "- detected_objects: array of things/objects/people/items detected (string[])",
  "- sentiment: overall mood or energy, e.g. 'energetic', 'calm', 'intense' (string)",
  "- key_moments: for videos, array of {timestamp: 'MM:SS', description: '...'} for notable events; for images, empty array []",
  "- safety_score: number from 0.0 to 1.0 where 1.0 means completely safe content (number)",
  "- tags: short relevant labels for the content (string[])",
  "Return ONLY valid JSON. No markdown fences, no extra text.",
].join("\n");

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ─── Upload a file URL to the Gemini Files API ────────────────────────────────

async function uploadUrlToGeminiFiles(
  fileUrl: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  // Fetch the file bytes from the URL
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch file from URL: ${fileRes.status}`);
  const blob = await fileRes.blob();
  const fileSize = blob.size;

  // Start resumable upload session
  const startRes = await fetch(`${GEMINI_UPLOAD_BASE}/files?key=${apiKey}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(fileSize),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "media_upload" } }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Gemini Files API session start failed (${startRes.status}): ${err}`);
  }

  const uploadUrl = startRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) throw new Error("No upload URL from Gemini Files API");

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(fileSize),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`File upload to Gemini failed (${uploadRes.status}): ${err.slice(0, 300)}`);
  }

  const data = (await uploadRes.json()) as GeminiFileUploadResponse;
  const geminiUri = data.file?.uri;
  if (!geminiUri) throw new Error("No file URI in Gemini upload response");

  return await pollUntilFileActive(geminiUri, apiKey);
}

// ─── Poll until Gemini file is ready ─────────────────────────────────────────

async function pollUntilFileActive(fileUri: string, apiKey: string): Promise<string> {
  const fileName = fileUri.split("/").pop() ?? "";
  const pollUrl = `${GEMINI_BASE}/files/${fileName}?key=${apiKey}`;

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise<void>((r) => setTimeout(r, 2000));
    const res = await fetch(pollUrl);
    if (!res.ok) break;
    const data = (await res.json()) as { state?: string };
    if (data.state === "ACTIVE") return fileUri;
    if (data.state === "FAILED") throw new Error("Gemini file processing failed");
  }

  return fileUri;
}

// ─── Call Gemini generateContent ─────────────────────────────────────────────

async function callGemini(
  mediaPart: Record<string, unknown>,
  prompt: string,
  apiKey: string
): Promise<MediaAnalysisResult> {
  const generateUrl = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(generateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [mediaPart, { text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini generateContent failed (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as GeminiGenerateResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return JSON.parse(rawText) as MediaAnalysisResult;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as MediaAnalysisResult;
    throw new Error(`Could not parse Gemini response as JSON: ${rawText.slice(0, 300)}`);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Use POST." });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
  if (!apiKey) {
    return jsonResponse(500, {
      error: "GEMINI_API_KEY secret is not set. Run: supabase secrets set GEMINI_API_KEY=<key>",
    });
  }

  let body: MediaAnalysisRequest;
  try {
    body = (await req.json()) as MediaAnalysisRequest;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const { base64, file_url, mime_type, prompt } = body;

  if (!mime_type) {
    return jsonResponse(400, { error: "mime_type is required." });
  }

  if (!base64 && !file_url) {
    return jsonResponse(400, { error: "Provide either base64 or file_url." });
  }

  const analysisPrompt = prompt?.trim() || DEFAULT_PROMPT;
  const isVideo = mime_type.startsWith("video/");

  try {
    let mediaPart: Record<string, unknown>;

    if (base64) {
      // Inline base64 — works well for images, avoid for large videos
      mediaPart = { inlineData: { mimeType: mime_type, data: base64 } };
    } else {
      // URL path: upload to Gemini Files API first (required for video)
      if (isVideo || file_url!.startsWith("https://")) {
        const geminiUri = await uploadUrlToGeminiFiles(file_url!, mime_type, apiKey);
        mediaPart = { fileData: { mimeType: mime_type, fileUri: geminiUri } };
      } else {
        mediaPart = { fileData: { mimeType: mime_type, fileUri: file_url! } };
      }
    }

    const result = await callGemini(mediaPart, analysisPrompt, apiKey);
    return jsonResponse(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
