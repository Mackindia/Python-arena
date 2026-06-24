from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.educational_ai.models.schemas import (
    EducationalBloomRequest,
    EducationalBookUploadRequest,
    EducationalConceptMapRequest,
    EducationalGlobalSearchRequest,
    EducationalLessonPlanRequest,
    EducationalMCQRequest,
    EducationalNotesRequest,
    EducationalQuestionBankRequest,
    EducationalSearchRequest,
    EducationalWorksheetRequest,
)
from app.educational_ai.services.educational_service import EducationalService

router = APIRouter(prefix="/educational", tags=["educational-ai"])
service = EducationalService()


@router.post("/books/upload")
async def upload_book(
    file: UploadFile = File(...),
    book_name: str = Form(...),
    class_level: str = Form(...),
    subject: str = Form(...),
    book_id: str | None = Form(None),
) -> dict[str, Any]:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    from app.core.pdf_processor import save_pdf

    file_bytes = await file.read()
    saved_path = save_pdf(file_bytes, file.filename)
    return service.upload_book(saved_path, book_name=book_name, class_level=class_level, subject=subject, book_id=book_id)


@router.get("/books")
def books() -> dict[str, Any]:
    return {"books": service.list_books()}


@router.get("/books/{book_id}")
def book_by_id(book_id: str) -> dict[str, Any]:
    book = service.get_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.delete("/books/{book_id}")
def delete_book(book_id: str) -> dict[str, Any]:
    removed = service.delete_book(book_id)
    return {"book_id": book_id, "removed": removed}


@router.post("/search")
def search(request: EducationalSearchRequest) -> dict[str, Any]:
    return service.search(
        query=request.query,
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        book_id=request.book_id,
        k=request.k,
    )


@router.post("/search/global")
def search_global(request: EducationalGlobalSearchRequest) -> dict[str, Any]:
    return service.search_global(query=request.query, k=request.k)


@router.post("/generate/notes")
def notes(request: EducationalNotesRequest) -> dict[str, Any]:
    return service.notes(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        book_id=request.book_id,
    )


@router.post("/generate/mcq")
def mcq(request: EducationalMCQRequest) -> dict[str, Any]:
    return service.mcq(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        difficulty=request.difficulty,
        count=request.count,
        book_id=request.book_id,
    )


@router.post("/generate/question-bank")
def question_bank(request: EducationalQuestionBankRequest) -> dict[str, Any]:
    return service.question_bank(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        count=request.count,
        book_id=request.book_id,
    )


@router.post("/generate/worksheet")
def worksheet(request: EducationalWorksheetRequest) -> dict[str, Any]:
    return service.worksheet(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        book_id=request.book_id,
    )


@router.post("/generate/lesson-plan")
def lesson_plan(request: EducationalLessonPlanRequest) -> dict[str, Any]:
    return service.lesson_plan(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        duration_minutes=request.duration_minutes,
        book_id=request.book_id,
    )


@router.post("/generate/bloom")
def bloom_analysis(request: EducationalBloomRequest) -> dict[str, Any]:
    return service.bloom_analysis(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        book_id=request.book_id,
    )


@router.post("/generate/concept-map")
def concept_map(request: EducationalConceptMapRequest) -> dict[str, Any]:
    return service.concept_map(
        class_level=request.class_level,
        subject=request.subject,
        topic=request.topic,
        book_id=request.book_id,
    )
