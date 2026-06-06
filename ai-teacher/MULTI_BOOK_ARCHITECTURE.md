# Multi-PDF Retrieval Architecture

## New Modules

- app/retrieval/indexer.py
- app/retrieval/registry.py
- app/retrieval/retriever.py
- app/retrieval/reranker.py
- app/generators/case_study_generator.py
- app/generators/question_bank_generator.py
- app/validators/case_study_validator.py
- app/validators/question_bank_validator.py

## Storage

- Multi-book FAISS index: faiss_multi_index/
- Book registry: data/books_registry.json
- Question banks: question_bank/*.json and question_bank/*.csv

## Metadata Schema Per Chunk

{
  "book_id": "string",
  "book_name": "string",
  "chapter": "string",
  "page": 1,
  "source_file": "string",
  "class_level": "string"
}

## Core APIs

- index_book(pdf_path, book_id, book_name, class_level)
- register_book(), remove_book(), list_books()
- retrieve_context(query, book_id=None, class_level=None, chapter=None, k=10)
- generate_case_studies(topic, num_cases=5, book_id=None)
- generate_question_bank(topic, total_questions=500, book_id=None)

## Retrieval-Time Reranker Layer

- Cross-encoder reranking is applied after FAISS candidate retrieval.
- Default model: cross-encoder/ms-marco-MiniLM-L-6-v2
- Default behavior: enabled for /retrieve/context and retriever module calls.
- Fallback-safe: if reranker load/inference fails, system returns FAISS-ranked results.

### API Controls (POST /retrieve/context)

- use_reranker: true|false
- rerank_top_n: int (candidate pool to rerank; default 80)
- reranker_model: string model id

Rerank score is returned per source as `rerank_score` when applied.

## FastAPI Endpoints

- POST /books/index
- GET /books/list
- DELETE /books/{book_id}
- POST /retrieve/context
- POST /generate/case-studies
- POST /generate/question-bank

## Migration Path From Single-Index Setup

1. Keep current single-index files untouched (faiss_index/).
2. Run migrate_to_multi_book.py to seed first book into faiss_multi_index/.
3. Index additional books via POST /books/index.
4. Move new retrieval/generation flows to /retrieve/context and new generator endpoints.
5. Keep existing MCQ and Worksheet endpoints intact until cutover is complete.

## Performance Notes

- Embedding model is cached in-process via lru_cache.
- Re-index skip when source hash unchanged for same book_id.
- MMR retrieval enabled by default to reduce duplicate chunks.
- Retrieval supports metadata filters without creating separate indexes per book.

## Example Retrieval Modes

1) Book-scoped
POST /retrieve/context
{"query":"What is AI?", "book_id":"class6_ai"}

2) Class-scoped
POST /retrieve/context
{"query":"What is AI?", "class_level":"6"}

3) Global
POST /retrieve/context
{"query":"What is AI?"}

4) Chapter-scoped
POST /retrieve/context
{"query":"Computational Thinking", "chapter":"Computational Thinking"}
