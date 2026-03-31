import { Platform } from 'react-native';
import {
  EncodingType,
  FileSystemUploadType,
  getInfoAsync,
  readAsStringAsync,
  uploadAsync,
} from 'expo-file-system/legacy';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_UPLOAD_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta';
const GEMINI_MODEL = 'gemini-flash-latest';

export type KeyMoment = {
  timestamp: string;
  description: string;
};

export type MediaAnalysisResult = {
  summary: string;
  detected_objects: string[];
  sentiment: string;
  key_moments: KeyMoment[];
  safety_score: number;
  tags: string[];
};

export type FormIssue = {
  issue: string;
  severity: 'critical' | 'moderate' | 'minor';
  timestamp?: string;
  correction: string;
};

export type FormAnalysisResult = {
  id: string;
  exercise: string;
  overall_score: number;
  confidence: number;
  form_issues: FormIssue[];
  positive_points: string[];
  coaching_cues: string[];
  rep_count: number;
  media_url?: string;
  rag_evidence?: string;
  rag_citations?: { title: string; source: string }[];
  created_at: string;
};

type GeminiFileUploadResponse = {
  file?: { uri?: string; state?: string };
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

const DEFAULT_PROMPT = [
  'Analyze this media carefully and return ONLY a JSON object with these exact fields:',
  '- summary: detailed description of what you see (string)',
  '- detected_objects: array of things/objects/people/items detected (string[])',
  '- sentiment: overall mood or energy, e.g. "energetic", "calm", "intense" (string)',
  '- key_moments: for videos, array of {timestamp: "MM:SS", description: "..."} for notable events; for images, empty array []',
  '- safety_score: number from 0.0 to 1.0 where 1.0 means completely safe content (number)',
  '- tags: short relevant labels for the content (string[])',
  'Return ONLY valid JSON. No markdown fences, no extra text.',
].join('\n');

// ─── Web helpers (browser fetch + FileReader) ─────────────────────────────────

async function readAsBase64Web(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadVideoWeb(uri: string, mimeType: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  const fileSize = blob.size;

  const startRes = await fetch(`${GEMINI_UPLOAD_BASE}/files?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileSize),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'scifit_web_upload' } }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Gemini Files API session start failed (${startRes.status}): ${err}`);
  }

  const uploadUrl = startRes.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) throw new Error('No upload URL from Gemini Files API');

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(fileSize),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Video upload failed (${uploadRes.status}): ${err.slice(0, 300)}`);
  }

  const data = (await uploadRes.json()) as GeminiFileUploadResponse;
  const geminiUri = data.file?.uri;
  if (!geminiUri) throw new Error('No file URI in Gemini upload response');

  return await pollUntilFileActive(geminiUri);
}

// ─── Native helpers (expo-file-system/legacy) ─────────────────────────────────

async function uploadVideoNative(fileUri: string, mimeType: string): Promise<string> {
  const fileInfo = await getInfoAsync(fileUri);
  if (!fileInfo.exists) throw new Error('Video file does not exist at: ' + fileUri);
  const fileSize = fileInfo.size;

  const startRes = await fetch(`${GEMINI_UPLOAD_BASE}/files?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileSize),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'scifit_upload' } }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Gemini Files API session start failed (${startRes.status}): ${err}`);
  }

  const uploadUrl = startRes.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) throw new Error('Gemini Files API did not return an upload URL');

  const uploadResult = await uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Length': String(fileSize),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Video upload failed (${uploadResult.status}): ${uploadResult.body.slice(0, 300)}`);
  }

  const uploadData = JSON.parse(uploadResult.body) as GeminiFileUploadResponse;
  const geminiFileUri = uploadData.file?.uri;
  if (!geminiFileUri) throw new Error('Gemini Files API returned no file URI after upload');

  return await pollUntilFileActive(geminiFileUri);
}

// ─── Shared ───────────────────────────────────────────────────────────────────

async function pollUntilFileActive(fileUri: string): Promise<string> {
  const fileName = fileUri.split('/').pop() ?? '';
  const pollUrl = `${GEMINI_BASE}/files/${fileName}?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise<void>((r) => setTimeout(r, 2000));
    const res = await fetch(pollUrl);
    if (!res.ok) break;
    const data = (await res.json()) as { state?: string };
    if (data.state === 'ACTIVE') return fileUri;
    if (data.state === 'FAILED') throw new Error('Gemini video processing failed — try a shorter clip');
  }

  return fileUri;
}

export async function analyzeMedia(
  fileUri: string,
  mimeType: string,
  customPrompt?: string
): Promise<MediaAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const prompt = customPrompt?.trim() || DEFAULT_PROMPT;
  const isVideo = mimeType.startsWith('video/');

  let mediaPart: Record<string, unknown>;

  if (Platform.OS === 'web') {
    // Web: browser fetch + FileReader — no expo-file-system needed
    if (isVideo) {
      const geminiUri = await uploadVideoWeb(fileUri, mimeType);
      mediaPart = { fileData: { mimeType, fileUri: geminiUri } };
    } else {
      const base64 = await readAsBase64Web(fileUri);
      mediaPart = { inlineData: { mimeType, data: base64 } };
    }
  } else {
    // Native: expo-file-system/legacy
    if (isVideo) {
      const geminiUri = await uploadVideoNative(fileUri, mimeType);
      mediaPart = { fileData: { mimeType, fileUri: geminiUri } };
    } else {
      const base64 = await readAsStringAsync(fileUri, { encoding: EncodingType.Base64 });
      mediaPart = { inlineData: { mimeType, data: base64 } };
    }
  }

  const generateUrl = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const requestBody = JSON.stringify({
    contents: [{ parts: [mediaPart, { text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  // Retry up to 3 times with exponential backoff for rate-limit (429) responses
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise<void>((r) => setTimeout(r, 2000 * attempt));
    res = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });
    if (res.status !== 429) break;
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 0;
    const err = res ? await res.text() : 'No response';
    if (status === 429) {
      throw new Error(
        'Gemini API quota exceeded (429).\n\n' +
          'Fix: Go to https://aistudio.google.com → click your avatar → Manage API keys → ' +
          'open the linked Google Cloud project → Enable billing.\n\n' +
          'Free tier resets every 24 hours. You can also wait and try again.'
      );
    }
    throw new Error(`Gemini generateContent failed (${status}): ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as GeminiGenerateResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    return JSON.parse(rawText) as MediaAnalysisResult;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as MediaAnalysisResult;
    throw new Error(`Could not parse Gemini response as JSON: ${rawText.slice(0, 300)}`);
  }
}

function buildFormPrompt(exercise: string): string {
  return [
    `You are a biomechanics expert analyzing a ${exercise} video.`,
    'Evaluate the athlete\'s form with technical precision.',
    'Return ONLY a JSON object with these exact fields:',
    `- exercise: "${exercise}" (string)`,
    '- overall_score: 0-100 overall form quality score (number)',
    '- confidence: 0.0-1.0 confidence in your analysis (number)',
    '- form_issues: array of { issue: string, severity: "critical"|"moderate"|"minor", timestamp: "MM:SS" (optional), correction: string }',
    '- positive_points: things the athlete executed well (string[])',
    '- coaching_cues: specific actionable coaching instructions (string[])',
    '- rep_count: number of reps visible in the video (number, 0 if unclear)',
    'Return ONLY valid JSON. No markdown fences, no extra text.',
  ].join('\n');
}

export async function analyzeFormVideo(
  fileUri: string,
  mimeType: string,
  exercise: string
): Promise<FormAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const isVideo = mimeType.startsWith('video/');
  let mediaPart: Record<string, unknown>;

  if (Platform.OS === 'web') {
    if (isVideo) {
      const geminiUri = await uploadVideoWeb(fileUri, mimeType);
      mediaPart = { fileData: { mimeType, fileUri: geminiUri } };
    } else {
      const base64 = await readAsBase64Web(fileUri);
      mediaPart = { inlineData: { mimeType, data: base64 } };
    }
  } else {
    if (isVideo) {
      const geminiUri = await uploadVideoNative(fileUri, mimeType);
      mediaPart = { fileData: { mimeType, fileUri: geminiUri } };
    } else {
      const base64 = await readAsStringAsync(fileUri, { encoding: EncodingType.Base64 });
      mediaPart = { inlineData: { mimeType, data: base64 } };
    }
  }

  const generateUrl = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const requestBody = JSON.stringify({
    contents: [{ parts: [mediaPart, { text: buildFormPrompt(exercise) }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise<void>((r) => setTimeout(r, 2000 * attempt));
    res = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });
    if (res.status !== 429) break;
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 0;
    const err = res ? await res.text() : 'No response';
    if (status === 429) {
      throw new Error('Gemini API quota exceeded (429). Free tier resets every 24 hours.');
    }
    throw new Error(`Gemini generateContent failed (${status}): ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as GeminiGenerateResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let parsed: Partial<FormAnalysisResult>;
  try {
    parsed = JSON.parse(rawText) as Partial<FormAnalysisResult>;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]) as Partial<FormAnalysisResult>;
    } else {
      throw new Error(`Could not parse Gemini form analysis response: ${rawText.slice(0, 300)}`);
    }
  }

  return {
    id: Date.now().toString(),
    exercise: parsed.exercise ?? exercise,
    overall_score: typeof parsed.overall_score === 'number' ? parsed.overall_score : 0,
    confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0,
    form_issues: Array.isArray(parsed.form_issues) ? parsed.form_issues : [],
    positive_points: Array.isArray(parsed.positive_points) ? parsed.positive_points : [],
    coaching_cues: Array.isArray(parsed.coaching_cues) ? parsed.coaching_cues : [],
    rep_count: typeof parsed.rep_count === 'number' ? parsed.rep_count : 0,
    created_at: new Date().toISOString(),
  };
}
