.PHONY: venv install parse chunk embed search answer-mock answer-openai pipeline dry-upload

venv:
	python3 -m venv .venv

install:
	. .venv/bin/activate && pip install -r backend/rag/requirements.txt

parse:
	. .venv/bin/activate && python backend/rag/scripts/parse_pdf_to_text.py

chunk:
	. .venv/bin/activate && python backend/rag/scripts/chunk_documents.py --chunk-size 1000 --overlap 200

embed:
	. .venv/bin/activate && python backend/rag/scripts/embed_chunks.py --model intfloat/e5-small-v2 --e5-prefix-mode auto

search:
	. .venv/bin/activate && python backend/rag/scripts/search_local.py --query "$(q)" --top-k $(or $(top_k),3) --model intfloat/e5-small-v2 --e5-prefix-mode auto

answer-mock:
	. .venv/bin/activate && python backend/rag/scripts/generate_answer.py --query "$(q)" --mode mock --top-k $(or $(top_k),5) --embed-model intfloat/e5-small-v2 --e5-prefix-mode auto

answer-openai:
	. .venv/bin/activate && python backend/rag/scripts/generate_answer.py --query "$(q)" --mode openai --llm-model gpt-4o-mini --top-k $(or $(top_k),5) --embed-model intfloat/e5-small-v2 --e5-prefix-mode auto

pipeline:
	. .venv/bin/activate && bash backend/rag/scripts/run_pipeline.sh "$(q)" $(or $(top_k),3)

dry-upload:
	. .venv/bin/activate && python backend/rag/scripts/upload_embeddings_to_supabase.py --dry-run
