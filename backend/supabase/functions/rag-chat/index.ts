type RagRequest = {
  user_message: string;
  user_profile?: Record<string, unknown>;
  top_k?: number;
};

type MatchRow = {
  id: string;
  doc_id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
};

type RagResponse = {
  answer: string;
  citations: Array<{ title: string; source: string; chunk_id: string }>;
  confidence: number;
  retrieved_chunks: string[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_KEY") ?? "";
const OPENAI_API_KEY =
  Deno.env.get("OPENAI_API_KEY") ?? Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENAI_CHAT_MODEL = Deno.env.get("OPENAI_MODEL") ?? "openrouter/free";
const OPENAI_BASE_URL = Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
const OPENROUTER_SITE_URL = Deno.env.get("OPENROUTER_SITE_URL") ?? "";
const OPENROUTER_APP_NAME = Deno.env.get("OPENROUTER_APP_NAME") ?? "";
const HF_TOKEN = Deno.env.get("HF_TOKEN") ?? "";
const HF_EMBED_MODEL = Deno.env.get("HF_EMBED_MODEL") ?? "intfloat/e5-small-v2";
const HF_EMBED_ENDPOINT =
  Deno.env.get("HF_EMBED_ENDPOINT") ??
  `https://router.huggingface.co/hf-inference/models/${HF_EMBED_MODEL}/pipeline/feature-extraction`;

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

const toVectorLiteral = (values: number[]) => `[${values.join(",")}]`;

const extractEmbedding = (data: unknown): number[] => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Embedding response did not contain a valid vector.");
  }

  if (typeof data[0] === "number") {
    return data as number[];
  }

  if (Array.isArray(data[0]) && data[0].length && typeof data[0][0] === "number") {
    return data[0] as number[];
  }

  throw new Error("Embedding response shape is not supported.");
};

const embedQuery = async (text: string): Promise<number[]> => {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is required to embed the query with E5.");
  }

  // E5 query encoding requires query prefix for best retrieval quality.
  const e5Query = text.startsWith("query: ") ? text : `query: ${text}`;
  const res = await fetch(HF_EMBED_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HF_TOKEN}`
    },
    body: JSON.stringify({
      inputs: e5Query,
      normalize: true,
      options: { wait_for_model: true }
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HF embedding request failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return extractEmbedding(data);
};

const retrieveMatches = async (queryEmbedding: number[], topK: number): Promise<MatchRow[]> => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      query_embedding: toVectorLiteral(queryEmbedding),
      match_count: topK
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`match_documents RPC failed: ${res.status} ${errorText}`);
  }

  return (await res.json()) as MatchRow[];
};

const buildPrompt = (question: string, rows: MatchRow[]): string => {
  const context = rows
    .map((row, idx) => {
      const meta = row.metadata ?? {};
      const filename = String(meta.filename ?? "unknown");
      const chunkIndex = String(meta.chunk_index ?? "unknown");
      return `Source ${idx + 1} (doc_id=${row.doc_id}, file=${filename}, chunk=${chunkIndex}):\n${row.content}`;
    })
    .join("\n\n");

  return [
    "You are a retrieval assistant. Use only the provided sources.",
    "If the sources are insufficient, say so explicitly.",
    "Return concise, practical guidance and cite source numbers inline like [1], [2].",
    "",
    `User question: ${question}`,
    "",
    "Retrieved sources:",
    context
  ].join("\n");
};

const buildRankingFallback = (question: string, rows: MatchRow[]): string => {
  if (!rows.length) {
    return [
      `Question: ${question}`,
      "",
      "No relevant chunks were retrieved, so I cannot answer from sources yet."
    ].join("\n");
  }

  const lines: string[] = [
    `Question: ${question}`,
    "",
    "OPENAI_API_KEY is not configured. Showing retrieval-based fallback ranked by similarity:",
    ""
  ];

  rows.forEach((row, idx) => {
    const filename = String(row.metadata?.filename ?? "unknown");
    const chunkIndex = String(row.metadata?.chunk_index ?? "unknown");
    const preview = row.content.replace(/\s+/g, " ").slice(0, 220);
    lines.push(
      `[${idx + 1}] score=${row.similarity.toFixed(4)} doc=${row.doc_id} file=${filename} chunk=${chunkIndex}`
    );
    lines.push(`    ${preview}${row.content.length > 220 ? "..." : ""}`);
    lines.push("");
  });

  return lines.join("\n");
};

const generateAnswer = async (question: string, rows: MatchRow[]): Promise<string> => {
  if (!OPENAI_API_KEY) {
    return buildRankingFallback(question, rows);
  }

  const prompt = buildPrompt(question, rows);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    };
    if (OPENAI_BASE_URL.includes("openrouter.ai")) {
      if (OPENROUTER_SITE_URL) {
        headers["HTTP-Referer"] = OPENROUTER_SITE_URL;
      }
      if (OPENROUTER_APP_NAME) {
        headers["X-Title"] = OPENROUTER_APP_NAME;
      }
    }

    const res = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: OPENAI_CHAT_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Answer with evidence from provided chunks and keep it concise."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Chat completion failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    return (
      data?.choices?.[0]?.message?.content?.trim() ??
      "No answer generated. Check your model and API key settings."
    );
  } catch {
    return buildRankingFallback(question, rows);
  }
};

export const handleRagChat = async (payload: RagRequest): Promise<RagResponse> => {
  const userMessage = payload.user_message?.trim() || "";
  const topK = Math.max(1, Math.min(10, payload.top_k ?? 5));
  if (!userMessage) {
    return {
      answer: "Please provide a user_message.",
      citations: [],
      confidence: 0,
      retrieved_chunks: []
    };
  }

  const queryEmbedding = await embedQuery(userMessage);
  const matches = await retrieveMatches(queryEmbedding, topK);
  const answer = await generateAnswer(userMessage, matches);

  return {
    answer,
    citations: matches.map((m) => {
      const filename = String(m.metadata?.filename ?? "unknown");
      return {
        title: m.doc_id,
        source: filename,
        chunk_id: m.doc_id
      };
    }),
    confidence: matches.length ? Math.max(0, Math.min(1, matches[0].similarity ?? 0)) : 0,
    retrieved_chunks: matches.map((m) => m.content)
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed. Use POST." });
  }

  try {
    const body = (await req.json()) as RagRequest;
    const result = await handleRagChat(body);
    return jsonResponse(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
