#!/usr/bin/env python3
import argparse
import json
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
            row = dict(row)
            row.pop("embedding", None)
            records.append(row)
    return records, np.asarray(vectors, dtype=np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run local similarity search on embedded chunks.")
    parser.add_argument("--query", required=True, help="User question")
    parser.add_argument(
        "--input-jsonl",
        default="backend/rag/data/embeddings/chunks_with_embeddings.jsonl",
        help="Embedded chunks JSONL path",
    )
    parser.add_argument("--top-k", type=int, default=3, help="Top K results")
    parser.add_argument(
        "--model",
        default="intfloat/e5-small-v2",
        help="SentenceTransformers model name",
    )
    parser.add_argument(
        "--e5-prefix-mode",
        choices=["auto", "on", "off"],
        default="auto",
        help="Prefix query with 'query: ' when using E5 models",
    )
    args = parser.parse_args()

    input_jsonl = Path(args.input_jsonl)
    if not input_jsonl.exists():
        raise FileNotFoundError(f"Missing input file: {input_jsonl}")

    records, vectors = load_embedded_chunks(input_jsonl)
    if len(records) == 0:
        print("No embedded chunks found.")
        return

    model = SentenceTransformer(args.model)
    use_prefix = should_use_e5_prefix(args.model, args.e5_prefix_mode)
    query_text = f"query: {args.query}" if use_prefix else args.query
    query_vec = model.encode([query_text], normalize_embeddings=True)
    query_vec = np.asarray(query_vec, dtype=np.float32)

    # Cosine similarity because vectors are normalized.
    scores = (vectors @ query_vec.T).squeeze(axis=1)
    top_idx = np.argsort(scores)[::-1][: args.top_k]

    print(f"Query: {args.query}")
    print(f"Model: {args.model}")
    print(f"E5 query prefix enabled: {use_prefix}")
    print("")
    for rank, idx in enumerate(top_idx, start=1):
        record = records[idx]
        score = float(scores[idx])
        preview = record["text"][:280].replace("\n", " ")
        print(f"[{rank}] score={score:.4f} doc={record['doc_id']} chunk={record['chunk_id']}")
        print(f"    {preview}...")
        print("")


if __name__ == "__main__":
    main()
