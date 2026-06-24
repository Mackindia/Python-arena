# Application Architecture

The project consists of three main components:
1. **Next.js Frontend**: A React-based web application providing user dashboards, LMS, timetable management, and AI teacher tools.
2. **AI Teacher Backend (FastAPI)**: A Python FastAPI application implementing PDF ingestion, indexing (FAISS), retrieval, and AI generation (Gemini).
3. **Timetable Frontend (Vite/React)**: A standalone web app in `VS CODE Final TT project Doon Scholars/timetable-web-app` served on port 5173, which integrates with the Next.js frontend in development.

---

## 1. System Overview & Component Diagram

```
+-------------------------------------------------------------------------------+
|                             Next.js Frontend (3000)                           |
|  - Pages: /admin, /dashboard, /educational-ai, /learn, /lms                   |
|  - Authentication: Clerk (Auth Middleware)                                    |
|  - Database Client: Mongoose (MongoDB Atlas)                                  |
+-------------------+------------------------------------+----------------------+
                    |                                    |
                    | (REST API / Fetch)                 | (Static iframe / Dev Mode redirect)
                    v                                    v
+-------------------+-------------------+  +-------------+----------------------+
|          AI Teacher Backend (8000)    |  |       Timetable Web App (5173)       |
|  - Framework: FastAPI                 |  |  - Built with: Vite + React          |
|  - Vector DB: FAISS Multi-Index       |  |  - Served by: Python http.server     |
|  - LLM: Google Gemini API             |  |  - Purpose: Visual Timetable Builder |
|  - Reranker: Cross-Encoder (PyTorch)  |  |  - Data: Excel xlsx/csv              |
+---------------------------------------+  +--------------------------------------+
```

---

## 2. Component Breakdown

### A. Next.js Frontend
* **Routing**: Uses the Next.js App Router (located in `app/`). Major routes include:
  * `/admin`: Admin controls, user management, and LMS settings.
  * `/dashboard`: General landing and study dashboards.
  * `/educational-ai`: Interface to upload textbooks and generate materials.
  * `/lms`: Learning Management System lesson viewer and progress tracker.
* **Authentication**: Clerk (`@clerk/nextjs`) manages session tokens and routes. Protected paths are guarded via `proxy.ts`.
* **State & DB**: Mongoose connects to MongoDB for:
  * Teacher models
  * LMS bookmarks and lesson completion states
  * Timetable grid settings and templates

### B. AI Teacher Backend
* **FastAPI Server**: Configured in `ai-teacher/main.py` and routed via `app/educational_ai/api/routes.py`.
* **PDF Ingestion & Parsing**:
  * Extracts text from uploaded books (`pdf_processor.py` / `ingestion/engine.py`).
  * Generates hash signatures of PDF files to skip re-indexing if unchanged.
* **FAISS Vector DB**:
  * Multi-book retrieval is enabled by storing text embeddings with metadata in `faiss_multi_index/`.
  * Registry `data/books_registry.json` tracks names, IDs, subject mappings, and chapter limits.
* **LLM Layer**:
  * Leverages Google's Generative AI (Gemini) for note compilation, MCQ evaluation, and worksheet creation.
  * System prompts are stored in `app/educational_ai/prompts/educational_prompts.py` and `prompts/`.
* **Reranker Layer**:
  * Uses a Cross-Encoder model (`cross-encoder/ms-marco-MiniLM-L-6-v2`) to re-score candidate text chunks retrieved by FAISS, improving context relevance before feeding it to Gemini.

### C. Timetable Standalone App
* **Vite + React**: Designed as a visual school timetable builder with drag-and-drop slots, teacher load checks, and PDF exports.
* **Development Service**: Can be run locally using the `start_server.py` utility which starts Python's `http.server` on port `5173`.
