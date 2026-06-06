from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BOOKS_PATH = Path("registry/books.json")
CHAPTERS_PATH = Path("registry/chapters.json")


def _ensure_file(path: Path, default: str = "[]\n") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(default, encoding="utf-8")


def _load_json(path: Path) -> list[dict[str, Any]]:
    _ensure_file(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def _save_json(path: Path, data: list[dict[str, Any]]) -> None:
    _ensure_file(path)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def register_book(record: dict[str, Any]) -> dict[str, Any]:
    books = _load_json(BOOKS_PATH)
    now = datetime.now(timezone.utc).isoformat()
    existing_index = next((idx for idx, item in enumerate(books) if item.get("book_id") == record["book_id"]), None)

    entry = {
        "book_id": record["book_id"],
        "book_name": record["book_name"],
        "class_level": str(record["class_level"]),
        "subject": record["subject"],
        "chapters": record.get("chapters", []),
        "indexed_at": record.get("indexed_at", now),
        "source_file": record.get("source_file", ""),
        "chunk_count": int(record.get("chunk_count", 0)),
    }

    if existing_index is None:
        books.append(entry)
    else:
        books[existing_index] = entry

    _save_json(BOOKS_PATH, books)
    return entry


def upsert_chapters(book_id: str, chapters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = _load_json(CHAPTERS_PATH)
    items = [item for item in items if item.get("book_id") != book_id]
    items.extend(chapters)
    _save_json(CHAPTERS_PATH, items)
    return chapters


def list_books() -> list[dict[str, Any]]:
    return _load_json(BOOKS_PATH)


def get_book(book_id: str) -> dict[str, Any] | None:
    return next((item for item in _load_json(BOOKS_PATH) if item.get("book_id") == book_id), None)


def remove_book(book_id: str) -> bool:
    books = _load_json(BOOKS_PATH)
    filtered = [item for item in books if item.get("book_id") != book_id]
    if len(filtered) == len(books):
        return False
    _save_json(BOOKS_PATH, filtered)

    chapters = _load_json(CHAPTERS_PATH)
    _save_json(CHAPTERS_PATH, [item for item in chapters if item.get("book_id") != book_id])
    return True


def list_chapters(book_id: str | None = None) -> list[dict[str, Any]]:
    chapters = _load_json(CHAPTERS_PATH)
    if book_id:
        return [chapter for chapter in chapters if chapter.get("book_id") == book_id]
    return chapters
