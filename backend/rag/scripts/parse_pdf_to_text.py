#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader


def extract_doc_id(filename: str) -> str:
    pmid_match = re.search(r"(PMID_\d+)", filename, flags=re.IGNORECASE)
    if pmid_match:
        return pmid_match.group(1).upper()
    pmcid_match = re.search(r"(PMCID_[A-Za-z0-9]+)", filename, flags=re.IGNORECASE)
    if pmcid_match:
        return pmcid_match.group(1).upper()
    return Path(filename).stem


def parse_pdf(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            pages.append(text)
    joined = "\n\n".join(pages)
    # Basic normalization to reduce noisy whitespace.
    joined = re.sub(r"[ \t]+", " ", joined)
    joined = re.sub(r"\n{3,}", "\n\n", joined)
    return joined.strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract text from all PDFs in a folder.")
    parser.add_argument("--input-dir", default="backend/rag/sources", help="Directory containing PDFs")
    parser.add_argument(
        "--output-jsonl",
        default="backend/rag/data/parsed/documents.jsonl",
        help="Output JSONL path for parsed documents",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_jsonl = Path(args.output_jsonl)
    output_jsonl.parent.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(input_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in: {input_dir}")
        return

    written = 0
    with output_jsonl.open("w", encoding="utf-8") as f:
        for pdf in pdf_files:
            text = parse_pdf(pdf)
            if not text:
                continue
            record = {
                "doc_id": extract_doc_id(pdf.name),
                "filename": pdf.name,
                "source_path": str(pdf),
                "text": text,
            }
            f.write(json.dumps(record, ensure_ascii=True) + "\n")
            written += 1

    print(f"Parsed {written} documents to {output_jsonl}")


if __name__ == "__main__":
    main()
