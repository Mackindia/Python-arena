# Educational Intelligence Engine

This package provides the next-generation educational knowledge layer:

- Multi-book ingestion with subject and chapter metadata
- Subject-aware and class-aware retrieval
- Retrieval-time reranking
- Notes, MCQ, question bank, and worksheet generation
- Registry management for books and chapters

## Routes

- POST /educational/books/upload
- GET /educational/books
- GET /educational/books/{book_id}
- DELETE /educational/books/{book_id}
- POST /educational/search
- POST /educational/search/global
- POST /educational/generate/notes
- POST /educational/generate/mcq
- POST /educational/generate/question-bank
- POST /educational/generate/worksheet

## Storage

- registry/books.json
- registry/chapters.json
- faiss_multi_index/

## Notes

The package reuses the existing Gemini and FAISS stack and adds subject-aware metadata, chapter detection, and reranker-backed search.
