from fastapi.responses import HTMLResponse
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.llm import get_model, get_token_budget, get_registry
from app.core.pdf_processor import save_pdf, extract_text
from app.core.generator import generate_notes, generate_mcqs
from app.core.worksheet_generator import generate_worksheet
from app.retrieval.indexer import index_book
from app.retrieval.registry import list_books, register_book, remove_book
from app.retrieval.retriever import retrieve_context
from app.retrieval.reranker import DEFAULT_RERANKER_MODEL
from app.generators.case_study_generator import generate_case_studies
from app.generators.question_bank_generator import generate_question_bank
from app.educational_ai.api.routes import router as educational_router


app = FastAPI(title="AI Teacher Assistant", version="1.0")

app.include_router(educational_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request schemas ──────────────────────────────────────────────────────────
class QuestionRequest(BaseModel):
    question: str
    model: str = "fast"   # optional — defaults to gemini-2.5-flash

# ─── Routes ──────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "AI Teacher Assistant is running ✅"}


@app.get("/models")
def list_models():
    """Shows all available models with token limits."""
    registry = get_registry()
    result = {}
    for key, config in registry.items():
        result[key] = {
            "model_id": config["id"],
            "input_token_limit": config["input_token_limit"],
            "output_token_limit": config["output_token_limit"],
            "safe_input_limit": int(config["input_token_limit"] * 0.8),
            "best_for": config["best_for"],
            "description": config["description"],
        }
    return result


@app.get("/models/budget/{task}")
def token_budget(task: str):
    """
    Check the token budget for a specific task before sending large content.
    Example: GET /models/budget/fast
    """
    return get_token_budget(task)


@app.post("/ask")
def ask(request: QuestionRequest):
    """
    Ask the AI Teacher a question.
    Optionally pass 'model': 'fast' | 'pro' | 'lite'
    """
    try:
        model = get_model(request.model)

        prompt = f"""You are a helpful AI Teacher Assistant.
Answer this question clearly, as if explaining to a student:

{request.question}"""

        response = model.generate_content(prompt)
        return {
            "question": request.question,
            "model_used": request.model,
            "answer": response.text
        }

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "ResourceExhausted" in error_msg:
            raise HTTPException(status_code=429, detail="Quota exceeded. Wait a minute and retry.")
        if "404" in error_msg:
            raise HTTPException(status_code=404, detail="Model not found. Check /models for available options.")
        raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF. Returns extracted text + token estimate.
    This is Step 1 of our pipeline: PDF → Text.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        file_bytes = await file.read()
        file_path = save_pdf(file_bytes, file.filename)
        result = extract_text(file_path)

        return {
            "filename": file.filename,
            "pages": result["pages"],
            "characters": result["characters"],
            "estimated_tokens": result["estimated_tokens"],
            "fits_in_model": result["fits_in_model"],
            "preview": result["text"][:500] + "...",  # first 500 chars
            "file_path": result["file_path"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")


# ─── Request schema for generation endpoints ──────────────────────────────────
class GenerateRequest(BaseModel):
    file_path: str          # from /upload response
    grade: str = "Class 6"  # target grade level

class MCQRequest(BaseModel):
    file_path: str
    grade: str = "Class 6"
    num_questions: int = 20
    difficulty: str = "medium-hard"
    question_type: str = "mixed"


class WorksheetRequest(BaseModel):
    topic: str
    grade_level: str = "class6"
    difficulty: str = "medium-hard"


class IndexBookRequest(BaseModel):
    pdf_path: str
    book_id: str
    book_name: str
    class_level: str


class RetrieveContextRequest(BaseModel):
    query: str
    book_id: str | None = None
    class_level: str | None = None
    chapter: str | None = None
    k: int = 10
    search_type: str = "mmr"
    fetch_k: int = 40
    use_reranker: bool = True
    rerank_top_n: int = 80
    reranker_model: str = DEFAULT_RERANKER_MODEL


class CaseStudyRequest(BaseModel):
    topic: str
    num_cases: int = 5
    book_id: str | None = None


class QuestionBankRequest(BaseModel):
    topic: str
    total_questions: int = 500
    book_id: str | None = None

@app.post("/generate/notes")
def notes(request: GenerateRequest):
    """
    Generate structured study notes from an uploaded PDF.
    Uses the file_path returned by /upload.
    """
    try:
        result = generate_notes(request.file_path, request.grade)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notes generation failed: {str(e)}")

@app.post("/generate/mcqs")
def mcqs(request: MCQRequest):

    try:
        result = generate_mcqs(
            file_path=request.file_path,
            grade=request.grade,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            question_type=request.question_type,
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"MCQ generation failed: {str(e)}"
        )


@app.post("/generate/worksheet")
def worksheet(request: WorksheetRequest):
    """
    Generate a teacher-ready worksheet from retrieved PDF chunks.
    Uses the existing FAISS retrieval index + Gemini + quality validation loop.
    """
    try:
        return generate_worksheet(
            topic=request.topic,
            grade_level=request.grade_level,
            difficulty=request.difficulty,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Worksheet generation failed: {str(e)}"
        )


@app.post("/books/index")
def index_book_endpoint(request: IndexBookRequest):
    """Index a PDF into the multi-book FAISS knowledge base with metadata."""
    try:
        return index_book(
            pdf_path=request.pdf_path,
            book_id=request.book_id,
            book_name=request.book_name,
            class_level=request.class_level,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Book indexing failed: {str(e)}")


@app.get("/books/list")
def list_books_endpoint():
    """List all books currently registered in books_registry.json."""
    try:
        return {"books": list_books()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List books failed: {str(e)}")


@app.delete("/books/{book_id}")
def remove_book_endpoint(book_id: str):
    """Remove a book from registry metadata (vectors are retained)."""
    try:
        removed = remove_book(book_id)
        return {"book_id": book_id, "removed": removed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Remove book failed: {str(e)}")


@app.post("/retrieve/context")
def retrieve_context_endpoint(request: RetrieveContextRequest):
    """Metadata-aware retrieval supporting book, class, chapter, and global modes."""
    try:
        return retrieve_context(
            query=request.query,
            book_id=request.book_id,
            class_level=request.class_level,
            chapter=request.chapter,
            k=request.k,
            search_type=request.search_type,
            fetch_k=request.fetch_k,
            use_reranker=request.use_reranker,
            rerank_top_n=request.rerank_top_n,
            reranker_model=request.reranker_model,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context retrieval failed: {str(e)}")


@app.post("/generate/case-studies")
def case_studies_endpoint(request: CaseStudyRequest):
    """Generate classroom case studies from metadata-filtered retrieved context."""
    try:
        return generate_case_studies(
            topic=request.topic,
            num_cases=request.num_cases,
            book_id=request.book_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Case study generation failed: {str(e)}")


@app.post("/generate/question-bank")
def question_bank_endpoint(request: QuestionBankRequest):
    """Generate and persist a validated large question bank (JSON + CSV)."""
    try:
        return generate_question_bank(
            topic=request.topic,
            total_questions=request.total_questions,
            book_id=request.book_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question bank generation failed: {str(e)}")
