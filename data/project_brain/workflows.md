# System Workflows

This document outlines the core business logic and execution workflows within the codebase.

---

## 1. Book Ingestion and Indexing Workflow
This workflow is responsible for taking a textbook PDF, extracting its content, generating vector embeddings, and storing it in the FAISS vector database.

```
[Next.js Frontend]
        | (Upload PDF Form / FormData)
        v
[FastAPI /educational/books/upload]
        |
        v
[Ingestion Engine (ingest_pdf)]
        |
        +---> Calculate PDF File Hash (Skip if already indexed)
        |
        +---> Extract Text (pdf_processor.py)
        |
        +---> Chunk Text (chunker.py)
        |
        +---> Generate Embeddings (Gemini API)
        |
        +---> Update FAISS index (faiss_multi_index/)
        |
        +---> Register Book (data/books_registry.json)
        |
        v
[Success Response to Frontend]
```

### Ingestion Details:
* **Entry Point**: `ai-teacher/app/educational_ai/api/routes.py::upload_book()`
* **Chunker**: Splits text by paragraphs and sentences, aiming for optimal token sizes.
* **Vector Store**: Appends chunks with `book_id`, `book_name`, `class_level`, `chapter`, and `page` metadata.

---

## 2. RAG Content Generation Workflow (Notes, MCQs, Worksheets)
This workflow handles user requests for generated educational material, utilizing Retrieval-Augmented Generation (RAG).

```
[Next.js Frontend]
        | (Requests topic generation for a specific book/class)
        v
[FastAPI /educational/generate/notes or /mcq or /worksheet]
        |
        v
[Retrieval Layer (retrieve_context)]
        |
        +---> FAISS Similarity Search (returns top-k candidates, e.g., 80)
        |
        +---> Metadata Filter (filter by book_id, class_level, or chapter)
        |
        +---> MMR (Maximal Marginal Relevance) filtering
        |
        v
[Reranking Layer (Cross-Encoder)]
        | (Score candidates against the user query; select top-n, e.g., 10)
        v
[Prompt Construction (educational_prompts.py)]
        | (Inject top-n context chunks into prompt)
        v
[Gemini Generation Engine]
        | (Request JSON structure output)
        v
[Validation & Formatting]
        | (Validate JSON Schema, filter duplicates, format Markdown/HTML)
        v
[Response to Frontend]
```

### Key Components:
* **Retrieval & Rerank**: `ai-teacher/app/retrieval/retriever.py` and `reranker.py`
* **Prompt Registry**: `ai-teacher/app/educational_ai/prompts/educational_prompts.py`
* **Validators**: `ai-teacher/app/core/worksheet_validator.py` and `generator.py` (for MCQs)

---

## 3. LMS Lesson & Progress Tracking Workflow
This workflow logs student course progression, calculates stats, and predicts completion timelines.

```
[Next.js LMS Page]
        | (Student completes a quiz/lesson)
        v
[Next.js API Route (/api/lms/lessons/complete)]
        |
        v
[Mongoose Progress Handler (markLessonCompleted)]
        | (Write completion status & timestamp to MongoDB)
        v
[Enhanced Progress Engine (getUserProgressDashboard)]
        |
        +---> Get total lessons for course
        |
        +---> Calculate Completion Percentage
        |
        +---> Compute Completion Velocity (lessons per day)
        |
        +---> Project Estimated Completion Date
        |
        v
[JSON Response to User Dashboard]
```

### Key Files:
* **Client Library**: `lib/lms-progress.ts` and `lib/lms-progress-enhanced.ts`
* **API Route**: `app/api/lms/progress/route.ts`

---

## 4. Timetable Management & Dev Setup Workflow
This workflow is used in development to run the interactive timetable scheduler and synchronize school data.

```
[Developer runs start_server.py or start_server.bat]
        |
        v
[Script kills any existing process on port 5173]
        |
        v
[Launches Python's http.server on port 5173]
        | (Serves timetable-web-app/dist/)
        v
[Browser opens http://127.0.0.1:5173]
        |
        v
[Admin uploads spreadsheet or edits slots]
        |
        v
[Next.js Sync Script (sync-timetable.mjs)]
        | (Syncs local JSON/CSV configurations to MongoDB)
        v
[MongoDB Updated]
```

### Key Files:
* **Server Script**: `VS CODE Final TT project Doon Scholars/start_server.py`
* **Sync Script**: `scripts/sync-timetable.mjs`
