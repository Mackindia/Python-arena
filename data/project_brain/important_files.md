# Critical Files and Entry Points

This document provides a guide to the most important source files in the codebase, highlighting system entry points and recommending a reading order for developers or agents new to the project.

---

## 1. System Entry Points

* **Next.js Frontend Entry**:
  * `app/page.tsx`: Main landing page of the application.
  * `proxy.ts` (Next.js middleware): Handles authentication checks via Clerk and protects dashboard, admin, and learn routes.
  * `lib/mongodb.ts`: Database client initialization connecting Mongoose to MongoDB Atlas.

* **AI Teacher Backend Entry**:
  * `ai-teacher/main.py`: Entry point for the FastAPI application. Sets up CORS, imports routes, and spins up the server on port 8000.
  * `ai-teacher/app/educational_ai/api/routes.py`: Registers API endpoints for book uploads, searches, notes, MCQs, and worksheets.

* **Timetable Standalone Entry**:
  * `VS CODE Final TT project Doon Scholars/start_server.py`: Executable python script that cleans up port 5173 and hosts the compiled React timetable application.
  * `VS CODE Final TT project Doon Scholars/timetable-web-app/src/main.tsx`: Entry point for the Vite-built React frontend.

---

## 2. Core Functional Files

### A. Next.js Frontend Core:
1. `lib/educational-ai.ts`: Bridges Next.js with the Python FastAPI AI Teacher server.
2. `lib/lms-progress.ts` & `lib/lms-progress-enhanced.ts`: Algorithms for tracking course completion percentage and completion dates.
3. `lib/lms-lessons.ts`: Manages lesson verification, slug creation, and DB reads.
4. `app/admin/online-scheduler/page.tsx`: Heavy UI grid scheduler logic.

### B. AI Teacher Python Core:
1. `ai-teacher/app/retrieval/indexer.py`: Handles vector indexing and FAISS multi-index updates.
2. `ai-teacher/app/retrieval/retriever.py` & `reranker.py`: Logic for semantic query search, MMR context extraction, and Cross-Encoder ranking.
3. `ai-teacher/app/core/generator.py`: Generates notes and multiple-choice questions from chunked text via the Gemini API.
4. `ai-teacher/app/core/worksheet_generator.py` & `worksheet_validator.py`: Orchestrates worksheet creation and validates quality (filters duplicate questions, checks distribution targets).

---

## 3. Recommended Startup Reading Order

If you are a new developer or an AI agent looking to understand or modify the codebase, read these files first, in order:

1. **`data/project_brain/project_summary.md`**: Start here to understand the business goals.
2. **`data/project_brain/architecture.md`**: Understand how the components communicate.
3. **`ai-teacher/MULTI_BOOK_ARCHITECTURE.md`**: Understand the custom vector indexing system.
4. **`ai-teacher/main.py`**: Read to see how the API routes are registered.
5. **`lib/educational-ai.ts`**: Understand how the Next.js client interacts with the FastAPI backend.
6. **`VS CODE Final TT project Doon Scholars/start_server.py`**: Understand how the timetable client is hosted in development.
7. **`proxy.ts`**: Review the route protection rules.
