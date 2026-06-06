from __future__ import annotations

from pathlib import Path
from typing import Any

from langchain_community.document_loaders import PyPDFLoader

from app.retrieval.indexer import index_book
from app.educational_ai.registry.store import register_book, upsert_chapters
from app.educational_ai.utils.chapter_detection import build_chapter_lookup, detect_chapters


def build_book_id(subject: str, class_level: str, book_name: str) -> str:
    raw = f"{subject}-{class_level}-{book_name}".lower()
    cleaned = [ch if ch.isalnum() else "-" for ch in raw]
    book_id = "".join(cleaned)
    while "--" in book_id:
        book_id = book_id.replace("--", "-")
    return book_id.strip("-")


def ingest_pdf(
    pdf_path: str,
    book_name: str,
    class_level: str,
    subject: str,
    book_id: str | None = None,
) -> dict[str, Any]:
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    resolved_book_id = book_id or build_book_id(subject, class_level, book_name)
    loader = PyPDFLoader(str(path))
    pages = loader.load()
    if not pages:
        raise ValueError("No pages were loaded from the PDF")

    chapters = detect_chapters(pages)
    chapter_lookup = build_chapter_lookup(chapters, total_pages=len(pages))

    result = index_book(
        pdf_path=str(path),
        book_id=resolved_book_id,
        book_name=book_name,
        class_level=class_level,
        subject=subject,
        chapter_lookup=chapter_lookup,
    )

    chapter_records = []
    for chapter in chapters:
        chapter_records.append(
            {
                "book_id": resolved_book_id,
                "chapter_number": int(chapter.get("chapter_number", 1) or 1),
                "chapter_name": str(chapter.get("chapter_name", "Unknown Chapter")),
                "subject": subject,
                "class_level": class_level,
                "start_page": chapter.get("start_page"),
                "end_page": chapter.get("end_page"),
            }
        )

    upsert_chapters(resolved_book_id, chapter_records)
    register_book(
        {
            "book_id": resolved_book_id,
            "book_name": book_name,
            "class_level": class_level,
            "subject": subject,
            "chapters": chapter_records,
            "indexed_at": result["book"].get("updated_at") if isinstance(result.get("book"), dict) else "",
            "source_file": path.name,
            "chunk_count": result.get("chunks", 0),
        }
    )

    return {
        "success": True,
        "book_id": resolved_book_id,
        "book_name": book_name,
        "class_level": class_level,
        "subject": subject,
        "chapters": chapter_records,
        "chunks": result.get("chunks", 0),
        "index_path": result.get("index_path", ""),
    }
