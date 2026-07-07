"""API routes for Question Paper Intelligence."""

from __future__ import annotations

import io
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.educational_ai.question_paper.schemas import (
    AnalyzePatternRequest,
    CrossPaperAnalysisRequest,
    ExportInlineRequest,
    ExportRequest,
    GeneratePaperRequest,
    SavePaperRequest,
    SolvePaperRequest,
)

router = APIRouter(prefix="/exam", tags=["exam-intelligence"])


@router.post("/solve-paper")
async def solve_paper(
    file: UploadFile = File(None),
    class_level: str = Form("Class 10"),
    subject: str = Form("Science"),
    topic: str = Form("General"),
    book_id: str | None = Form(None),
    total_marks: int = Form(80),
) -> dict[str, Any]:
    """
    Upload a question paper (PDF/image) and get it solved with mark-wise answers.
    If no file is uploaded, generates questions from the book library.
    """
    from app.educational_ai.question_paper.extractor import (
        extract_questions_from_text,
    )
    from app.educational_ai.question_paper.ocr import extract_text_from_file
    from app.educational_ai.question_paper.solver import generate_answer_key
    from app.educational_ai.question_paper.analyzer import analyze_pattern
    from app.educational_ai.question_paper.validators import validate_solved_paper
    from app.core.pdf_processor import save_pdf

    try:
        raw_text = ""

        if file:
            # Save uploaded file
            file_bytes = await file.read()
            ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "pdf"

            if ext == "pdf":
                saved_path = save_pdf(file_bytes, file.filename or "paper.pdf")
                raw_text = extract_text_from_file(saved_path)
            else:
                # Save image temporarily
                import tempfile
                import os

                suffix = f".{ext}"
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                try:
                    raw_text = extract_text_from_file(tmp_path)
                finally:
                    os.unlink(tmp_path)

            if not raw_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from the uploaded file. Try a clearer image or typed PDF.",
                )

        # Extract questions
        extraction = extract_questions_from_text(raw_text, class_level, subject)
        questions = extraction["questions"]

        if not questions:
            raise HTTPException(
                status_code=400, detail="No questions found in the uploaded file."
            )

        # Solve all questions
        solved = generate_answer_key(questions, class_level, subject, book_id)

        # Analyze pattern
        paper_info = {
            "total_marks": extraction.get("total_marks", total_marks),
            "duration": extraction.get("duration", ""),
            "sections": extraction.get("sections", []),
        }
        pattern = analyze_pattern(paper_info, solved, class_level, subject)

        # Validate
        validation = validate_solved_paper(solved)

        return {
            "paper_info": paper_info,
            "solved_questions": solved,
            "pattern_analysis": pattern,
            "source": "uploaded_file",
            "validation": validation,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paper solving failed: {str(e)}")


@router.post("/solve-topic")
def solve_topic(request: SolvePaperRequest) -> dict[str, Any]:
    """
    Generate and solve questions for a specific topic from the book library.
    No file upload needed — uses RAG to create questions.
    """
    from app.educational_ai.question_paper.solver import solve_all_questions
    from app.educational_ai.question_paper.analyzer import analyze_pattern
    from app.educational_ai.question_paper.validators import validate_solved_paper
    from app.educational_ai.retrieval.engine import search

    try:
        # Generate questions from retrieved context
        context_result = search(
            query=f"exam questions {request.topic}",
            class_level=request.class_level,
            subject=request.subject,
            book_id=request.book_id,
            k=20,
        )

        from app.core.llm import get_model
        import json
        import re

        model = get_model("pro")
        context = context_result["context"]

        prompt = f"""Generate a {request.total_marks}-mark question paper for class {request.class_level} {request.subject}.
Topic: {request.topic}

Include a mix of:
- 1-mark MCQs or very short answers (20% of marks)
- 2-mark short answers (20% of marks)
- 3-mark medium answers (30% of marks)
- 5-mark long answers (30% of marks)

Return STRICTLY valid JSON array with these fields per question:
question_number, question_text, marks, section (A/B/C/D), chapter_hint, difficulty

Use ONLY the retrieved context for factual accuracy.

Retrieved Context:
{context}
"""
        response = model.generate_content(prompt)
        text = response.text or ""
        fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL)
        if fenced:
            text = fenced.group(1).strip()
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            text = text[start : end + 1]
        questions = json.loads(text)

        # Solve each question
        solved = solve_all_questions(questions, request.class_level, request.subject, request.book_id)

        # Analyze pattern
        paper_info = {
            "total_marks": request.total_marks,
            "duration": "",
            "sections": [],
        }
        pattern = analyze_pattern(paper_info, solved, request.class_level, request.subject)

        # Validate
        validation = validate_solved_paper(solved)

        return {
            "paper_info": paper_info,
            "solved_questions": solved,
            "pattern_analysis": pattern,
            "source": "topic_generation",
            "validation": validation,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic solving failed: {str(e)}")


@router.post("/generate-paper")
def generate_paper(request: GeneratePaperRequest) -> dict[str, Any]:
    """
    Generate a new question paper matching a specific pattern.
    Can use manual section specs or pattern distribution.
    """
    from app.educational_ai.question_paper.generator import generate_with_answers
    from app.educational_ai.question_paper.validators import validate_generated_paper

    try:
        sections = None
        if request.sections:
            sections = [s.model_dump() for s in request.sections]

        result = generate_with_answers(
            class_level=request.class_level,
            subject=request.subject,
            topic=request.topic,
            total_marks=request.total_marks,
            sections=sections,
            topic_distribution=request.topic_distribution,
            difficulty_distribution=request.difficulty_distribution,
            book_id=request.book_id,
            difficulty_profile=request.difficulty_profile,
            use_cbse_pattern=request.use_cbse_pattern,
        )

        # Validate
        validation = validate_generated_paper(result, request.total_marks)
        result["validation"] = validation

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paper generation failed: {str(e)}")


@router.post("/analyze-pattern")
def analyze_uploaded_pattern(request: AnalyzePatternRequest) -> dict[str, Any]:
    """Analyze pattern from a previously solved paper."""
    from app.educational_ai.question_paper.storage import get_paper

    paper = get_paper(request.paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper {request.paper_id} not found")

    from app.educational_ai.question_paper.analyzer import analyze_pattern

    pattern = analyze_pattern(
        paper_info=paper.get("paper_info", {}),
        solved_questions=paper.get("solved_questions", []),
        class_level=paper.get("class_level", "Class 10"),
        subject=paper.get("subject", "General"),
    )
    return {"paper_id": request.paper_id, "pattern_analysis": pattern}


@router.post("/save-paper")
def save_paper_endpoint(request: SavePaperRequest) -> dict[str, Any]:
    """Save a solved paper to storage for later retrieval."""
    from app.educational_ai.question_paper.storage import save_paper

    paper_data = request.paper_data
    paper_data["class_level"] = request.class_level or paper_data.get("class_level", "")
    paper_data["subject"] = request.subject or paper_data.get("subject", "")
    record = save_paper(paper_data, source=request.source)
    return {"saved": True, **record}


@router.get("/papers")
def list_papers(
    class_level: str | None = None,
    subject: str | None = None,
) -> dict[str, Any]:
    """List all saved solved papers."""
    from app.educational_ai.question_paper.storage import list_papers as _list

    papers = _list(class_level=class_level, subject=subject)
    return {"papers": papers, "count": len(papers)}


@router.get("/papers/{paper_id}")
def get_paper_endpoint(paper_id: str) -> dict[str, Any]:
    """Get a full solved paper by ID."""
    from app.educational_ai.question_paper.storage import get_paper

    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper {paper_id} not found")
    return paper


@router.delete("/papers/{paper_id}")
def delete_paper_endpoint(paper_id: str) -> dict[str, Any]:
    """Delete a saved paper."""
    from app.educational_ai.question_paper.storage import delete_paper

    deleted = delete_paper(paper_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Paper {paper_id} not found")
    return {"paper_id": paper_id, "deleted": True}


@router.post("/analyze-cross-paper")
def analyze_cross_paper(request: CrossPaperAnalysisRequest) -> dict[str, Any]:
    """Analyze patterns across multiple solved papers."""
    from app.educational_ai.question_paper.storage import get_all_papers_full
    from app.educational_ai.question_paper.cross_paper import cross_paper_analysis

    papers = get_all_papers_full(request.paper_ids)
    if len(papers) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 2 papers for cross-paper analysis, found {len(papers)}",
        )

    return cross_paper_analysis(papers)


@router.post("/export")
def export_paper(request: ExportRequest):
    """Export a solved paper to PDF, DOCX, or text format."""
    from app.educational_ai.question_paper.storage import get_paper
    from fastapi.responses import StreamingResponse

    paper = get_paper(request.paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper {request.paper_id} not found")

    if request.format == "pdf":
        from app.educational_ai.question_paper.export import export_to_pdf

        pdf_bytes = export_to_pdf(paper)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={request.paper_id}.pdf"},
        )
    elif request.format == "docx":
        from app.educational_ai.question_paper.export import export_to_docx

        docx_bytes = export_to_docx(paper)
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={request.paper_id}.docx"},
        )
    else:
        from app.educational_ai.question_paper.export import export_to_text

        text = export_to_text(paper)
        return StreamingResponse(
            io.BytesIO(text.encode("utf-8")),
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={request.paper_id}.txt"},
        )


@router.post("/export-inline")
def export_inline(request: ExportInlineRequest) -> dict[str, Any]:
    """Export paper data inline (no save required) — returns base64 content."""
    import base64

    data = request.data

    if request.format == "pdf":
        from app.educational_ai.question_paper.export import export_to_pdf

        content = export_to_pdf(data)
        encoded = base64.b64encode(content).decode("utf-8")
        return {"format": "pdf", "content": encoded, "filename": "paper.pdf"}
    elif request.format == "docx":
        from app.educational_ai.question_paper.export import export_to_docx

        content = export_to_docx(data)
        encoded = base64.b64encode(content).decode("utf-8")
        return {"format": "docx", "content": encoded, "filename": "paper.docx"}
    else:
        from app.educational_ai.question_paper.export import export_to_text

        content = export_to_text(data)
        return {"format": "txt", "content": content, "filename": "paper.txt"}


@router.get("/cbse-profiles")
def get_cbse_profiles() -> dict[str, Any]:
    """List available CBSE difficulty profiles and section patterns."""
    from app.educational_ai.question_paper.schemas import (
        CBSE_DIFFICULTY_PROFILES,
        CBSE_SECTION_PATTERNS,
    )

    return {
        "difficulty_profiles": CBSE_DIFFICULTY_PROFILES,
        "section_patterns": {
            k: {"description": v[0].get("description", ""), "sections": len(v), "total_marks": sum(s["mark_type"] * s["count"] for s in v)}
            for k, v in CBSE_SECTION_PATTERNS.items()
        },
    }


@router.get("/most-important")
def get_most_important(
    class_level: str | None = None,
    subject: str | None = None,
) -> dict[str, Any]:
    """
    Get the most important questions across all saved papers.
    Ranks by repeat frequency + mark weightage.
    """
    from app.educational_ai.question_paper.storage import get_all_papers_full
    from app.educational_ai.question_paper.cross_paper import cross_paper_analysis

    papers = get_all_papers_full()
    if not papers:
        return {
            "papers_analyzed": 0,
            "most_important_questions": [],
            "topic_importance": [],
            "message": "No saved papers yet. Solve some papers first to get importance rankings.",
        }

    # Filter by class/subject if provided
    if class_level:
        papers = [p for p in papers if p.get("class_level") == class_level]
    if subject:
        papers = [p for p in papers if p.get("subject") == subject]

    if len(papers) < 1:
        return {
            "papers_analyzed": 0,
            "most_important_questions": [],
            "topic_importance": [],
            "message": "No matching papers found.",
        }

    analysis = cross_paper_analysis(papers)

    # Build importance ranking
    all_questions: dict[str, dict] = {}
    for paper in papers:
        pid = paper.get("paper_id", "")
        for q in paper.get("solved_questions", []):
            text = q.get("question_text", "").strip()
            if not text:
                continue
            key = text[:100].lower()
            if key not in all_questions:
                all_questions[key] = {
                    "question": text,
                    "marks": q.get("marks", 1),
                    "chapter": q.get("chapter", "") or q.get("chapter_hint", ""),
                    "difficulty": q.get("difficulty", ""),
                    "appeared_in_papers": [],
                    "total_marks_weight": 0,
                }
            entry = all_questions[key]
            if pid not in entry["appeared_in_papers"]:
                entry["appeared_in_papers"].append(pid)
            entry["total_marks_weight"] += q.get("marks", 1)

    # Score and rank
    num_papers = len(papers) or 1
    ranked = []
    for key, entry in all_questions.items():
        frequency = len(entry["appeared_in_papers"]) / num_papers
        marks_weight = min(entry["total_marks_weight"] / num_papers, 20)
        importance_score = round(frequency * 60 + marks_weight * 2, 1)
        ranked.append({
            "question": entry["question"],
            "marks": entry["marks"],
            "chapter": entry["chapter"],
            "difficulty": entry["difficulty"],
            "frequency_pct": round(frequency * 100, 1),
            "appeared_in": len(entry["appeared_in_papers"]),
            "importance_score": importance_score,
        })

    ranked.sort(key=lambda x: x["importance_score"], reverse=True)

    return {
        "papers_analyzed": len(papers),
        "most_important_questions": ranked[:30],
        "topic_importance": analysis.get("most_important_chapters", []),
        "repeat_prediction": analysis.get("repeat_prediction", {}),
        "study_plan": analysis.get("recommended_study_plan", {}),
    }
