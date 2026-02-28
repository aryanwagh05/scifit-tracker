#!/usr/bin/env python3
import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer


def should_use_e5_prefix(model_name: str, mode: str) -> bool:
    if mode == "on":
        return True
    if mode == "off":
        return False
    lowered = model_name.lower()
    return "e5" in lowered


def load_embedded_chunks(path: Path) -> tuple[list[dict], np.ndarray]:
    records: list[dict] = []
    vectors: list[list[float]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            vectors.append(row["embedding"])
            clean = dict(row)
            clean.pop("embedding", None)
            records.append(clean)
    return records, np.asarray(vectors, dtype=np.float32)


def retrieve_top_chunks(
    query: str,
    records: list[dict],
    vectors: np.ndarray,
    model_name: str,
    top_k: int,
    e5_prefix_mode: str,
) -> list[dict]:
    model = SentenceTransformer(model_name)
    use_prefix = should_use_e5_prefix(model_name, e5_prefix_mode)
    query_text = f"query: {query}" if use_prefix else query
    query_vec = model.encode([query_text], normalize_embeddings=True)
    query_vec = np.asarray(query_vec, dtype=np.float32)

    scores = (vectors @ query_vec.T).squeeze(axis=1)
    top_idx = np.argsort(scores)[::-1][:top_k]

    results: list[dict] = []
    for idx in top_idx:
        r = dict(records[idx])
        r["score"] = float(scores[idx])
        results.append(r)
    return results


def build_prompt(query: str, retrieved: list[dict]) -> str:
    context_blocks = []
    for i, r in enumerate(retrieved, start=1):
        context_blocks.append(
            (
                f"[{i}] doc_id={r['doc_id']} chunk_id={r['chunk_id']} score={r['score']:.4f}\n"
                f"{r['text'][:1400]}"
            )
        )
    context_text = "\n\n".join(context_blocks)

    return (
        "You are a fitness research assistant. Use only the provided context.\n"
        "If context is insufficient, say 'Insufficient evidence in the current corpus.'\n"
        "Return valid JSON with keys: answer, evidence, confidence.\n"
        "The evidence field is an array of objects with keys: doc_id, chunk_id, claim.\n\n"
        f"User question:\n{query}\n\n"
        f"Context:\n{context_text}\n"
    )


def call_openai_chat(prompt: str, model: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You must return strict JSON only."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        message = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error: {message}") from e

    return body["choices"][0]["message"]["content"]


def build_mock_response(query: str, retrieved: list[dict]) -> dict:
    if not retrieved:
        return {
            "answer": "Insufficient evidence in the current corpus.",
            "evidence": [],
            "confidence": "low",
        }

    top = retrieved[0]
    return {
        "answer": (
            "Template answer (mock mode): top retrieved evidence suggests you should "
            "match volume first, then evaluate frequency effects for hypertrophy."
        ),
        "evidence": [
            {
                "doc_id": top["doc_id"],
                "chunk_id": top["chunk_id"],
                "claim": "Top retrieved chunk matched the query.",
            }
        ],
        "confidence": "medium",
        "note": f"Mock mode is active. Query was: {query}",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a RAG answer from local embeddings.")
    parser.add_argument("--query", required=True, help="User question")
    parser.add_argument(
        "--input-jsonl",
        default="backend/rag/data/embeddings/chunks_with_embeddings.jsonl",
        help="Embedded chunks JSONL path",
    )
    parser.add_argument("--top-k", type=int, default=5, help="Top K chunks")
    parser.add_argument(
        "--embed-model",
        default="intfloat/e5-small-v2",
        help="Embedding model for query vector",
    )
    parser.add_argument(
        "--e5-prefix-mode",
        choices=["auto", "on", "off"],
        default="auto",
        help="Prefix query with 'query: ' when using E5 models",
    )
    parser.add_argument(
        "--mode",
        choices=["mock", "openai"],
        default="mock",
        help="Generation mode",
    )
    parser.add_argument(
        "--llm-model",
        default="gpt-4o-mini",
        help="LLM model name when --mode openai",
    )
    parser.add_argument(
        "--output-json",
        default="backend/rag/data/answers/last_answer.json",
        help="Where to save the generated output JSON",
    )
    args = parser.parse_args()

    input_jsonl = Path(args.input_jsonl)
    output_json = Path(args.output_json)
    output_json.parent.mkdir(parents=True, exist_ok=True)

    if not input_jsonl.exists():
        raise FileNotFoundError(f"Missing input file: {input_jsonl}")

    records, vectors = load_embedded_chunks(input_jsonl)
    if len(records) == 0:
        raise RuntimeError("No embedded chunks found.")

    retrieved = retrieve_top_chunks(
        query=args.query,
        records=records,
        vectors=vectors,
        model_name=args.embed_model,
        top_k=args.top_k,
        e5_prefix_mode=args.e5_prefix_mode,
    )
    prompt = build_prompt(args.query, retrieved)

    if args.mode == "openai":
        content = call_openai_chat(prompt=prompt, model=args.llm_model)
        try:
            answer_json = json.loads(content)
        except json.JSONDecodeError:
            answer_json = {
                "answer": content,
                "evidence": [],
                "confidence": "unknown",
                "warning": "Model did not return strict JSON.",
            }
    else:
        answer_json = build_mock_response(args.query, retrieved)

    answer_json["retrieval"] = [
        {
            "doc_id": r["doc_id"],
            "chunk_id": r["chunk_id"],
            "score": r["score"],
        }
        for r in retrieved
    ]

    with output_json.open("w", encoding="utf-8") as f:
        json.dump(answer_json, f, ensure_ascii=True, indent=2)

    print(f"Wrote answer to {output_json}")
    print(json.dumps(answer_json, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
