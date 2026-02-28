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


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed chunked text and save vectors.")
    parser.add_argument(
        "--input-jsonl",
        default="backend/rag/data/chunks/chunks.jsonl",
        help="Input chunks JSONL path",
    )
    parser.add_argument(
        "--output-jsonl",
        default="backend/rag/data/embeddings/chunks_with_embeddings.jsonl",
        help="Output JSONL path including embeddings",
    )
    parser.add_argument(
        "--model",
        default="intfloat/e5-small-v2",
        help="SentenceTransformers model name",
    )
    parser.add_argument(
        "--e5-prefix-mode",
        choices=["auto", "on", "off"],
        default="auto",
        help="Prefix chunks with 'passage: ' when using E5 models",
    )
    args = parser.parse_args()

    input_jsonl = Path(args.input_jsonl)
    output_jsonl = Path(args.output_jsonl)
    output_jsonl.parent.mkdir(parents=True, exist_ok=True)

    if not input_jsonl.exists():
        raise FileNotFoundError(f"Missing input file: {input_jsonl}")

    records = []
    with input_jsonl.open("r", encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))

    if not records:
        print("No chunk records found.")
        return

    model = SentenceTransformer(args.model)
    use_prefix = should_use_e5_prefix(args.model, args.e5_prefix_mode)
    texts = [
        f"passage: {r['text']}" if use_prefix else r["text"]
        for r in records
    ]
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)
    embeddings = np.asarray(embeddings, dtype=np.float32)

    with output_jsonl.open("w", encoding="utf-8") as f:
        for record, vec in zip(records, embeddings):
            out = dict(record)
            out["embedding"] = vec.tolist()
            f.write(json.dumps(out, ensure_ascii=True) + "\n")

    print(f"Wrote {len(records)} embedded chunks to {output_jsonl}")
    print(f"Model: {args.model}")
    print(f"E5 passage prefix enabled: {use_prefix}")


if __name__ == "__main__":
    main()
