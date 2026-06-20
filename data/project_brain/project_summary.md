# Project Summary

The `python-arena` codebase represents a dual-component platform containing an **educational portal (LMS + AI Study Assistant)** and a **school timetable scheduler**.

---

## 1. Project Purpose
The platform's goal is to digitize learning management and automate curriculum study aids. By uploading textbooks (PDFs), teachers can index educational material and automatically generate study notes, multiple-choice questions (MCQs), and worksheets tailored to specific class levels and chapters. In parallel, the platform integrates a specialized timetable scheduler for school management.

---

## 2. Major Components
1. **Next.js Web Portal (app/)**: Runs on port 3000 in development. Hosts the student LMS, progress dashboard, and admin tools. Connects to MongoDB via Mongoose and handles user sessions via Clerk.
2. **AI Teacher API Server (ai-teacher/)**: Runs on port 8000. FastAPI application that handles text chunking, embedding, vector storage (FAISS), semantic search (MMR + Cross-Encoder reranking), and generation (Google Gemini API).
3. **Timetable Client (VS CODE Final TT project Doon Scholars/)**: Runs on port 5173. A standalone Vite/React single-page application that provides visual scheduling utilities.

---

## 3. High-Level Dependency Map

```
+------------------------------------------------------------------------------------------+
|                                    Next.js Web Portal                                    |
|                                                                                          |
|    +------------------+         +-----------------------+         +-----------------+    |
|    |  Clerk Auth      |         |  MongoDB / Mongoose   |         |  Cloudinary JS  |    |
|    |  (proxy.ts)      |         |  (lib/mongodb.ts)     |         |  (lib/cloud.ts) |    |
|    +--------+---------+         +-----------+-----------+         +--------+--------+    |
|             |                               |                              |             |
|             v                               v                              v             |
|    +--------+-------------------------------+------------------------------+--------+    |
|    |  LMS & Progress Core (lib/lms-progress.ts, lib/lms-progress-enhanced.ts)      |    |
|    +----------------------------------------+---------------------------------------+    |
+---------------------------------------------|--------------------------------------------+
                                              |
                                              | (Calls HTTP API)
                                              v
+------------------------------------------------------------------------------------------+
|                                  AI Teacher API Server                                   |
|                                                                                          |
|    +--------------------------------------------------------------------------------+    |
|    |  API Endpoints / FastAPI Router (ai-teacher/app/educational_ai/api/routes.py)  |    |
|    +----------------------------------------+---------------------------------------+    |
|                                             |                                            |
|                                             v                                            |
|    +----------------------------------------+---------------------------------------+    |
|    |  Retrieval & Search Layer (ai-teacher/app/retrieval/retriever.py)             |    |
|    |  - Vector Indexing (indexer.py)                                                |    |
|    |  - Reranker Layer (reranker.py)                                                |    |
|    |  - Vector DB (faiss_multi_index/)                                              |    |
|    +----------------------------------------+---------------------------------------+    |
|                                             |                                            |
|                                             v                                            |
|    +----------------------------------------+---------------------------------------+    |
|    |  Generation Engines (ai-teacher/app/core/generator.py, worksheet_generator.py) |    |
|    |  - Google Generative AI (Gemini API)                                           |    |
|    |  - Validators (worksheet_validator.py)                                         |    |
|    +--------------------------------------------------------------------------------+    |
+------------------------------------------------------------------------------------------+
```

---

## 4. Key Configurations
* **Next.js port**: Default port `3000` (next dev).
* **FastAPI port**: Default port `8000` (uvicorn main:app).
* **Timetable port**: Default port `5173` (python start_server.py).
* **DB**: MongoDB Atlas configured via `MONGODB_URI` in `.env.local`.
* **AI Provider**: Google Generative AI configured via `GEMINI_API_KEY` in `.env.local`.
