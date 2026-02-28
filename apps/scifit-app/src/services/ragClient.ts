export type RagCitation = {
  title: string;
  source: string;
  chunk_id: string;
};

export type RagResponse = {
  answer: string;
  citations: RagCitation[];
  confidence: number;
  retrieved_chunks: string[];
};

const RAG_API_URL = process.env.EXPO_PUBLIC_RAG_API_URL?.trim();
const RAG_API_KEY = process.env.EXPO_PUBLIC_RAG_API_KEY?.trim();

const FALLBACK: RagResponse = {
  answer:
    'RAG API is not connected yet. Set EXPO_PUBLIC_RAG_API_URL to your rag-chat endpoint and try again.',
  citations: [],
  confidence: 0,
  retrieved_chunks: []
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toCitations(value: unknown): RagCitation[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title : 'Unknown source',
      source: typeof item.source === 'string' ? item.source : 'unknown',
      chunk_id: typeof item.chunk_id === 'string' ? item.chunk_id : ''
    }));
}

function toConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export async function askRag(userMessage: string, topK = 5): Promise<RagResponse> {
  const message = userMessage.trim();
  if (!message) {
    return {
      answer: 'Enter a question first.',
      citations: [],
      confidence: 0,
      retrieved_chunks: []
    };
  }

  if (!RAG_API_URL) {
    return FALLBACK;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (RAG_API_KEY) {
    headers.apikey = RAG_API_KEY;
    headers.Authorization = `Bearer ${RAG_API_KEY}`;
  }

  const response = await fetch(RAG_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_message: message, top_k: topK })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`RAG request failed (${response.status}): ${details}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    answer: typeof data.answer === 'string' ? data.answer : 'No answer returned.',
    citations: toCitations(data.citations),
    confidence: toConfidence(data.confidence),
    retrieved_chunks: toStringArray(data.retrieved_chunks)
  };
}
