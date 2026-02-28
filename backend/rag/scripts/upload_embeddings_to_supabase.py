#!/usr/bin/env python3
"""
Upload local JSONL embeddings into Supabase PostgREST.

Expected input JSONL records include:
- chunk_id
- doc_id
- filename
- chunk_index
- text
- embedding (list[float])
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


def parse_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def get_env_var(key: str, env_file_vars: dict[str, str]) -> str:
    value = os.getenv(key) or env_file_vars.get(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


def chunks(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload embeddings JSONL to Supabase.")
    parser.add_argument(
        "--input-jsonl",
        type=Path,
        default=Path("backend/rag/data/embeddings/chunks_with_embeddings.jsonl"),
        help="Path to embeddings JSONL file",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=Path("backend/.env"),
        help="Path to env file containing Supabase credentials",
    )
    parser.add_argument(
        "--table",
        default="document_embeddings",
        help="Target table name in public schema",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Rows per upsert request",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and print stats without uploading",
    )
    args = parser.parse_args()

    if not args.input_jsonl.exists():
        raise RuntimeError(f"Input file not found: {args.input_jsonl}")

    env_file_vars = parse_env_file(args.env_file)
    supabase_url = get_env_var("SUPABASE_URL", env_file_vars).rstrip("/")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or env_file_vars.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    if not supabase_key:
        # Backward-compatible alias the user already has in code.
        supabase_key = os.getenv("SUPABASE_KEY") or env_file_vars.get("SUPABASE_KEY")
    if not supabase_key:
        raise RuntimeError(
            "Missing required env var: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)"
        )

    rows: list[dict[str, Any]] = []
    dims: set[int] = set()

    with args.input_jsonl.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            if not line.strip():
                continue
            rec = json.loads(line)
            embedding = rec.get("embedding")
            if not isinstance(embedding, list) or not embedding:
                raise RuntimeError(f"Invalid embedding at line {line_no}")
            dims.add(len(embedding))

            rows.append(
                {
                    "doc_id": rec["chunk_id"],
                    "content": rec.get("text", ""),
                    "metadata": {
                        "doc_id": rec.get("doc_id"),
                        "filename": rec.get("filename"),
                        "chunk_index": rec.get("chunk_index"),
                    },
                    # Supabase/Postgres can parse pgvector text input.
                    "embedding": "[" + ",".join(str(x) for x in embedding) + "]",
                }
            )

    if len(dims) != 1:
        raise RuntimeError(f"Inconsistent embedding dimensions found: {sorted(dims)}")

    dim = next(iter(dims))
    print(f"Prepared {len(rows)} rows from {args.input_jsonl}")
    print(f"Detected embedding dimension: {dim}")

    if args.dry_run:
        print("Dry run complete. No data uploaded.")
        return 0

    endpoint = (
        f"{supabase_url}/rest/v1/{args.table}"
        "?on_conflict=doc_id&columns=doc_id,content,metadata,embedding"
    )
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    total_uploaded = 0
    for idx, batch in enumerate(chunks(rows, args.batch_size), start=1):
        payload = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(endpoint, data=payload, method="POST")
        for k, v in headers.items():
            req.add_header(k, v)

        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status not in (200, 201, 204):
                    body = resp.read().decode("utf-8", errors="replace")
                    raise RuntimeError(
                        f"Unexpected response status {resp.status} for batch {idx}: {body}"
                    )
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Upload failed on batch {idx} with HTTP {e.code}: {error_body}"
            ) from e

        total_uploaded += len(batch)
        print(f"Uploaded batch {idx}: {len(batch)} rows (total {total_uploaded})")

    print(f"Upload complete. Upserted {total_uploaded} rows into public.{args.table}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
