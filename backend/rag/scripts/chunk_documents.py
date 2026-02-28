#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    chunks: list[str] = []
    start = 0
    n = len(text)
    step = max(1, chunk_size - overlap)
    while start < n:
        end = min(n, start + chunk_size)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk parsed documents into overlapping text chunks.")
    parser.add_argument(
        "--input-jsonl",
        default="backend/rag/data/parsed/documents.jsonl",
        help="Input documents JSONL path",
    )
    parser.add_argument(
        "--output-jsonl",
        default="backend/rag/data/chunks/chunks.jsonl",
        help="Output chunks JSONL path",
    )
    parser.add_argument("--chunk-size", type=int, default=1000, help="Chunk size in characters")
    parser.add_argument("--overlap", type=int, default=200, help="Character overlap")
    args = parser.parse_args()

    input_jsonl = Path(args.input_jsonl)
    output_jsonl = Path(args.output_jsonl)
    output_jsonl.parent.mkdir(parents=True, exist_ok=True)

    if not input_jsonl.exists():
        raise FileNotFoundError(f"Missing input file: {input_jsonl}")

    total_chunks = 0
    with input_jsonl.open("r", encoding="utf-8") as f_in, output_jsonl.open("w", encoding="utf-8") as f_out:
        for line in f_in:
            doc = json.loads(line)
            doc_chunks = chunk_text(doc["text"], args.chunk_size, args.overlap)
            for idx, chunk in enumerate(doc_chunks):
                chunk_id = f'{doc["doc_id"]}_chunk_{idx:04d}'
                record = {
                    "chunk_id": chunk_id,
                    "doc_id": doc["doc_id"],
                    "filename": doc["filename"],
                    "chunk_index": idx,
                    "text": chunk,
                }
                f_out.write(json.dumps(record, ensure_ascii=True) + "\n")
                total_chunks += 1

    print(f"Wrote {total_chunks} chunks to {output_jsonl}")


if __name__ == "__main__":
    main()
