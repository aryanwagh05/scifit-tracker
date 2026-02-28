# RAG Pipeline (SciFit)

This directory holds the end-to-end RAG pipeline for the SciFit assistant.

## Project Conventions
- Treat this as a backend subproject with its own runbook and ignore rules.
- Keep generated artifacts local (`backend/rag/data/`) and out of git.
- Keep research source PDFs local (`backend/rag/sources/*.pdf`) and out of git by default.
- Commit scripts, prompts, schemas, and docs only.

## Goal
Answer fitness questions using curated research with traceable citations.

## Local-First Flow (No Supabase)
1. Put PDFs in `backend/rag/sources/`
2. Parse PDFs to text JSONL
3. Chunk parsed text with overlap
4. Generate embeddings
5. Run local similarity search to validate retrieval

## Quick Start
From repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/rag/requirements.txt
```

Or use Makefile targets:

```bash
make -C backend/rag install
```

Parse PDFs:

```bash
python backend/rag/scripts/parse_pdf_to_text.py
```

Chunk parsed docs:

```bash
python backend/rag/scripts/chunk_documents.py --chunk-size 1000 --overlap 200
```

Embed chunks:

```bash
python backend/rag/scripts/embed_chunks.py --model intfloat/e5-small-v2 --e5-prefix-mode auto
```

Test retrieval:

```bash
python backend/rag/scripts/search_local.py --query "Does higher training frequency increase hypertrophy when volume is equal?" --top-k 3 --model intfloat/e5-small-v2 --e5-prefix-mode auto
```

Equivalent Makefile flow:

```bash
make -C backend/rag parse
make -C backend/rag chunk
make -C backend/rag embed
make -C backend/rag search q="Does higher training frequency increase hypertrophy when volume is equal?" top_k=3
```

Generate a template answer (no API key required):

```bash
python backend/rag/scripts/generate_answer.py --query "How many weekly sets should trained adults do for hypertrophy?" --mode mock --top-k 5 --embed-model intfloat/e5-small-v2 --e5-prefix-mode auto
```

Generate with OpenAI later (when you have a key):

```bash
export OPENAI_API_KEY="your_key_here"
python backend/rag/scripts/generate_answer.py --query "How many weekly sets should trained adults do for hypertrophy?" --mode openai --llm-model gpt-4o-mini --top-k 5 --embed-model intfloat/e5-small-v2 --e5-prefix-mode auto
```

## Generated Artifacts
- `backend/rag/data/parsed/documents.jsonl`
- `backend/rag/data/chunks/chunks.jsonl`
- `backend/rag/data/embeddings/chunks_with_embeddings.jsonl`
- `backend/rag/data/answers/last_answer.json`

## Notes
- File naming like `PMID_12345678_topic_year.pdf` is important for citations.
- Current chunking is character-based for speed and simplicity.
- You can later swap `search_local.py` for Chroma/FAISS without changing earlier steps.
- `generate_answer.py` is your LLM template layer; start in `--mode mock` and switch to `--mode openai` when ready.
- E5 models require prefixes for best retrieval quality: use `passage: ` for document chunks and `query: ` for user queries. The scripts above handle this automatically in `--e5-prefix-mode auto`.
