from __future__ import annotations

from typing import Any

from app.educational_ai.generation.engine import generate_bloom_analysis, generate_concept_map, generate_lesson_plan, generate_mcq, generate_notes, generate_question_bank, generate_worksheet
from app.educational_ai.ingestion.engine import ingest_pdf
from app.educational_ai.registry.store import get_book, list_books, remove_book
from app.educational_ai.retrieval.engine import global_search, search


class EducationalService:
    def upload_book(self, pdf_path: str, book_name: str, class_level: str, subject: str, book_id: str | None = None) -> dict[str, Any]:
        return ingest_pdf(pdf_path=pdf_path, book_name=book_name, class_level=class_level, subject=subject, book_id=book_id)

    def list_books(self) -> list[dict[str, Any]]:
        return list_books()

    def get_book(self, book_id: str) -> dict[str, Any] | None:
        return get_book(book_id)

    def delete_book(self, book_id: str) -> bool:
        return remove_book(book_id)

    def search(self, query: str, class_level: str | None = None, subject: str | None = None, chapter: str | None = None, book_id: str | None = None, k: int = 10) -> dict[str, Any]:
        return search(query=query, class_level=class_level, subject=subject, chapter=chapter, book_id=book_id, k=k)

    def search_global(self, query: str, k: int = 10) -> dict[str, Any]:
        return global_search(query=query, k=k)

    def notes(self, class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
        return generate_notes(class_level=class_level, subject=subject, topic=topic, book_id=book_id)

    def mcq(self, class_level: str, subject: str, topic: str, difficulty: str = "medium", count: int = 10, book_id: str | None = None) -> dict[str, Any]:
        return generate_mcq(class_level=class_level, subject=subject, topic=topic, difficulty=difficulty, count=count, book_id=book_id)

    def question_bank(self, class_level: str, subject: str, topic: str, count: int = 100, book_id: str | None = None) -> dict[str, Any]:
        return generate_question_bank(class_level=class_level, subject=subject, topic=topic, count=count, book_id=book_id)

    def worksheet(self, class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
        return generate_worksheet(class_level=class_level, subject=subject, topic=topic, book_id=book_id)

    def lesson_plan(self, class_level: str, subject: str, topic: str, duration_minutes: int = 45, book_id: str | None = None) -> dict[str, Any]:
        return generate_lesson_plan(class_level=class_level, subject=subject, topic=topic, duration_minutes=duration_minutes, book_id=book_id)

    def bloom_analysis(self, class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
        return generate_bloom_analysis(class_level=class_level, subject=subject, topic=topic, book_id=book_id)

    def concept_map(self, class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
        return generate_concept_map(class_level=class_level, subject=subject, topic=topic, book_id=book_id)
