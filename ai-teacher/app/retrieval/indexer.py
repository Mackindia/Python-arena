from __future__ import annotations

import hashlib
from functools import lru_cache
from pathlib import Path
from typing import Any

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.retrieval.registry import get_book, register_book

INDEX_DIR = Path("faiss_multi_index")


@lru_cache(maxsize=1)
def get_embeddings_model() -> HuggingFaceEmbeddings:
    """Cache embedding model to avoid repeated initialization overhead."""
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


def _file_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with file_path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _extract_page_number(metadata: dict[str, Any]) -> int:
    page_value = metadata.get("page")
    if isinstance(page_value, int):
        return page_value + 1
    try:
        return int(page_value) + 1
    except (TypeError, ValueError):
        return 1


def _infer_chapter(page_text: str) -> str:
    """Best-effort chapter name inference from page heading lines."""
    lines = [line.strip() for line in page_text.splitlines() if line.strip()]
    sample = lines[:8]

    for line in sample:
        lower = line.lower()
        if lower.startswith("chapter"):
            return line

    for line in sample:
        if 4 <= len(line) <= 80 and line == line.title():
            return line

    return "Unknown Chapter"


def _build_chunks_with_metadata(
    pages: list[Document],
    book_id: str,
    book_name: str,
    class_level: str,
    source_file: str,
    subject: str | None = None,
    chapter_lookup: dict[int, dict[str, Any]] | None = None,
) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(pages)
    if not chunks:
        return []

    enriched: list[Document] = []
    for idx, chunk in enumerate(chunks, start=1):
        page_no = _extract_page_number(chunk.metadata)
        chapter_data = (chapter_lookup or {}).get(page_no, {})
        chapter_name = str(chapter_data.get("chapter_name", "")).strip() or _infer_chapter(chunk.page_content)
        chapter_number = chapter_data.get("chapter_number")

        metadata = {
            "book_id": book_id,
            "book_name": book_name,
            "subject": subject or "",
            "chapter": chapter_name,
            "chapter_name": chapter_name,
            "chapter_number": chapter_number if chapter_number is not None else "",
            "page": page_no,
            "source_file": source_file,
            "class_level": str(class_level),
            "chunk_id": f"{book_id}:{page_no}:{idx}",
        }

        enriched.append(Document(page_content=chunk.page_content, metadata=metadata))

    return enriched


def _load_or_create_index() -> FAISS:
    embeddings = get_embeddings_model()
    if INDEX_DIR.exists():
        return FAISS.load_local(
            str(INDEX_DIR),
            embeddings,
            allow_dangerous_deserialization=True,
        )

    # Create an empty index by initializing with one harmless placeholder
    placeholder = Document(page_content="index-initialized", metadata={"system": "bootstrap"})
    index = FAISS.from_documents([placeholder], embeddings)
    index.delete([list(index.index_to_docstore_id.values())[0]])
    return index


def index_book(
    pdf_path: str,
    book_id: str,
    book_name: str,
    class_level: str,
    subject: str | None = None,
    chapter_lookup: dict[int, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Parse PDF, chunk, attach metadata, embed, and store in FAISS.

    This function supports repeated calls for unlimited books. If the same
    book_id + source file hash is already indexed, embedding is skipped.
    """
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    source_hash = _file_sha256(path)
    existing = get_book(book_id)
    if existing and str(existing.get("source_hash", "")) == source_hash:
        return {
            "status": "already_indexed",
            "book_id": book_id,
            "book_name": book_name,
            "class_level": str(class_level),
            "source_file": path.name,
            "source_hash": source_hash,
            "chunk_count": int(existing.get("chunk_count", 0)),
        }

    loader = PyPDFLoader(str(path))
    pages = loader.load()
    if not pages:
        raise ValueError("No pages were loaded from the PDF.")

    chunks = _build_chunks_with_metadata(
        pages=pages,
        book_id=book_id,
        book_name=book_name,
        class_level=class_level,
        source_file=path.name,
        subject=subject,
        chapter_lookup=chapter_lookup,
    )
    if not chunks:
        raise ValueError("Chunking produced no output.")

    index = _load_or_create_index()

    # Remove old chunks for the same book_id when re-indexing to avoid stale conflicts.
    old_ids: list[str] = []
    for vector_id, docstore_id in index.index_to_docstore_id.items():
        doc = index.docstore.search(docstore_id)
        if isinstance(doc, Document) and str(doc.metadata.get("book_id", "")) == book_id:
            old_ids.append(docstore_id)

    if old_ids:
        try:
            index.delete(old_ids)
        except Exception:
            # Non-fatal fallback: keep old vectors if underlying FAISS delete fails.
            pass

    index.add_documents(chunks)
    index.save_local(str(INDEX_DIR))

    registry_entry = register_book(
        book_id=book_id,
        book_name=book_name,
        class_level=str(class_level),
        source_file=path.name,
        source_hash=source_hash,
        chunk_count=len(chunks),
    )

    return {
        "status": "indexed",
        "book": registry_entry,
        "pages": len(pages),
        "chunks": len(chunks),
        "index_path": str(INDEX_DIR),
    }
