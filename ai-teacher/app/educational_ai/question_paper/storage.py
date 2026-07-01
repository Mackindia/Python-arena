"""JSON-file persistence for solved question papers."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

STORE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "solved_papers")
INDEX_FILE = os.path.join(STORE_DIR, "index.json")


def _ensure_store() -> None:
    os.makedirs(STORE_DIR, exist_ok=True)
    if not os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def _read_index() -> list[dict]:
    _ensure_store()
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_index(entries: list[dict]) -> None:
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def _paper_path(paper_id: str) -> str:
    safe_id = paper_id.replace("/", "_").replace("\\", "_")
    return os.path.join(STORE_DIR, f"{safe_id}.json")


def save_paper(result: dict[str, Any], source: str = "upload") -> dict[str, Any]:
    """
    Save a solved paper to disk. Returns the paper record with generated ID.
    """
    _ensure_store()

    paper_id = f"paper_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    now = datetime.now(timezone.utc).isoformat()

    # Extract metadata for index
    paper_info = result.get("paper_info", {})
    solved = result.get("solved_questions", [])

    record = {
        "paper_id": paper_id,
        "source": source,
        "class_level": result.get("class_level", ""),
        "subject": result.get("subject", ""),
        "total_marks": paper_info.get("total_marks", 0),
        "question_count": len(solved),
        "created_at": now,
    }

    # Full data file
    full_data = {
        **record,
        "paper_info": paper_info,
        "solved_questions": solved,
        "pattern_analysis": result.get("pattern_analysis", {}),
        "validation": result.get("validation", {}),
    }

    # Write full data
    with open(_paper_path(paper_id), "w", encoding="utf-8") as f:
        json.dump(full_data, f, indent=2, ensure_ascii=False)

    # Update index
    index = _read_index()
    index.insert(0, record)  # newest first
    _write_index(index)

    return record


def get_paper(paper_id: str) -> dict[str, Any] | None:
    """Load a full solved paper by ID."""
    path = _paper_path(paper_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_papers(
    class_level: str | None = None,
    subject: str | None = None,
) -> list[dict[str, Any]]:
    """List all solved papers, optionally filtered."""
    index = _read_index()

    if class_level:
        index = [e for e in index if e.get("class_level") == class_level]
    if subject:
        index = [e for e in index if e.get("subject") == subject]

    return index


def delete_paper(paper_id: str) -> bool:
    """Delete a solved paper from disk and index."""
    path = _paper_path(paper_id)
    if os.path.exists(path):
        os.remove(path)

    index = _read_index()
    new_index = [e for e in index if e.get("paper_id") != paper_id]
    _write_index(new_index)

    return len(new_index) < len(index)


def get_all_papers_full(paper_ids: list[str] | None = None) -> list[dict[str, Any]]:
    """Load full data for multiple papers (for cross-paper analysis)."""
    index = _read_index()
    if paper_ids:
        entries = [e for e in index if e.get("paper_id") in paper_ids]
    else:
        entries = index

    papers = []
    for entry in entries:
        full = get_paper(entry["paper_id"])
        if full:
            papers.append(full)
    return papers
