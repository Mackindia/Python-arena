from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path("data")
REGISTRY_FILE = DATA_DIR / "books_registry.json"


def _ensure_registry_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not REGISTRY_FILE.exists():
        REGISTRY_FILE.write_text("[]\n", encoding="utf-8")


def _load_registry() -> list[dict[str, Any]]:
    _ensure_registry_file()
    try:
        data = json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"books_registry.json is invalid JSON: {exc}") from exc

    if not isinstance(data, list):
        raise ValueError("books_registry.json must contain a JSON list")

    return data


def _save_registry(items: list[dict[str, Any]]) -> None:
    _ensure_registry_file()
    REGISTRY_FILE.write_text(json.dumps(items, indent=2), encoding="utf-8")


def register_book(
    book_id: str,
    book_name: str,
    class_level: str,
    source_file: str | None = None,
    source_hash: str | None = None,
    chunk_count: int | None = None,
    subject: str | None = None,
) -> dict[str, Any]:
    """Register or update a book entry in books_registry.json."""
    if not book_id.strip():
        raise ValueError("book_id is required")

    entries = _load_registry()
    now = datetime.now(timezone.utc).isoformat()

    updated: dict[str, Any] | None = None
    for entry in entries:
        if str(entry.get("book_id", "")) == book_id:
            entry["book_name"] = book_name
            entry["class_level"] = str(class_level)
            if source_file is not None:
                entry["source_file"] = source_file
            if source_hash is not None:
                entry["source_hash"] = source_hash
            if chunk_count is not None:
                entry["chunk_count"] = chunk_count
            if subject is not None:
                entry["subject"] = subject
            entry["updated_at"] = now
            updated = entry
            break

    if updated is None:
        updated = {
            "book_id": book_id,
            "book_name": book_name,
            "class_level": str(class_level),
            "subject": subject or "",
            "source_file": source_file or "",
            "source_hash": source_hash or "",
            "chunk_count": chunk_count or 0,
            "created_at": now,
            "updated_at": now,
        }
        entries.append(updated)

    _save_registry(entries)
    return updated


def remove_book(book_id: str) -> bool:
    """Remove a book from the registry. Does not delete vectors from FAISS."""
    entries = _load_registry()
    filtered = [entry for entry in entries if str(entry.get("book_id", "")) != book_id]

    if len(filtered) == len(entries):
        return False

    _save_registry(filtered)
    return True


def list_books() -> list[dict[str, Any]]:
    """List all registered books."""
    return _load_registry()


def get_book(book_id: str) -> dict[str, Any] | None:
    """Get one book by id if present in registry."""
    for entry in _load_registry():
        if str(entry.get("book_id", "")) == book_id:
            return entry
    return None
