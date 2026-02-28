#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 \"your query\" [top_k]"
  exit 1
fi

QUERY="$1"
TOP_K="${2:-3}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d ".venv" ]]; then
  echo "Missing .venv. Create it first:"
  echo "  python3 -m venv .venv"
  exit 1
fi

source .venv/bin/activate

echo "Step 1/4: parse PDFs"
python backend/rag/scripts/parse_pdf_to_text.py

echo "Step 2/4: chunk documents"
python backend/rag/scripts/chunk_documents.py --chunk-size 1000 --overlap 200

echo "Step 3/4: embed chunks"
python backend/rag/scripts/embed_chunks.py

echo "Step 4/4: search"
python backend/rag/scripts/search_local.py --query "$QUERY" --top-k "$TOP_K"

echo "Done."
