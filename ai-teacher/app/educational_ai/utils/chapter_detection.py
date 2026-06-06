from __future__ import annotations

import re
from typing import Any

from langchain_core.documents import Document


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def detect_chapters(pages: list[Document]) -> list[dict[str, Any]]:
    """
    Best-effort chapter detection using PDF page structure.

    Detects heading patterns such as:
    - Chapter 3: Variables and Data Types
    - CHAPTER 5 - Control Structures
    - Unit 2 Python Basics
    """
    chapters: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    chapter_patterns = [
        re.compile(r"(?im)^chapter\s*(\d+)[\s:.-]+(.+)$"),
        re.compile(r"(?im)^unit\s*(\d+)[\s:.-]+(.+)$"),
        re.compile(r"(?im)^lesson\s*(\d+)[\s:.-]+(.+)$"),
    ]

    for page_index, page in enumerate(pages, start=1):
        text = _normalize(str(page.page_content or ""))
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        heading: tuple[int, str] | None = None

        for line in lines[:12]:
            for pattern in chapter_patterns:
                match = pattern.match(line)
                if match:
                    heading = (int(match.group(1)), match.group(2).strip())
                    break
            if heading:
                break

        if heading:
            chapter_number, chapter_name = heading
            current = {
                "chapter_number": chapter_number,
                "chapter_name": chapter_name,
                "start_page": page_index,
                "end_page": page_index,
            }
            chapters.append(current)
        elif current is not None:
            current["end_page"] = page_index

    if not chapters and pages:
        # Fallback: infer the first meaningful heading-like line as a single chapter.
        first_page_lines = [line.strip() for line in str(pages[0].page_content or "").splitlines() if line.strip()]
        chapter_name = first_page_lines[0] if first_page_lines else "Introduction"
        chapters.append({
            "chapter_number": 1,
            "chapter_name": chapter_name[:120],
            "start_page": 1,
            "end_page": len(pages),
        })

    return chapters


def build_chapter_lookup(chapters: list[dict[str, Any]], total_pages: int) -> dict[int, dict[str, Any]]:
    lookup: dict[int, dict[str, Any]] = {}
    if not chapters:
        return lookup

    for chapter in chapters:
        start = int(chapter.get("start_page", 1) or 1)
        end = int(chapter.get("end_page", start) or start)
        for page_no in range(start, min(end, total_pages) + 1):
            lookup[page_no] = {
                "chapter_number": int(chapter.get("chapter_number", 1) or 1),
                "chapter_name": str(chapter.get("chapter_name", "")).strip() or "Unknown Chapter",
            }

    return lookup
