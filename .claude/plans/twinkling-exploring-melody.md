# Plan - Fix Model Recommendation Engine, Review Educational AI, & Generate Architecture Graph

## Context
The user requested:
1. To troubleshoot the model recommendation engine (which was suggesting which model to use but is not working).
2. To use the review graph technique and create a graph presentation to explain the architecture.
3. To review the educational AI functionality and give a report.

During exploration, we identified:
- The **Model Recommendation Engine** fails to suggest models when the MongoDB collection is unseeded or empty. The `getRecommendations` function returns `null` properties, causing UI/API consumer failures.
- The **Educational AI** in `ai-teacher` is a FastAPI-based RAG system that processes textbook PDFs, indexes them using FAISS, retrieves context via MMR/Rerank, and generates notes/MCQs/worksheets/question banks with a self-correcting validation loop.
- We can construct a visual graph presentation of this architecture using the `jet_render` canvas frame tool (embedding Mermaid.js / Tailwind SVG).

---

## Phase 1: Fix Model Recommendation Engine

### Proposed Changes
1. **Auto-seeding in Recommendation API Routes**:
   In `app/api/admin/model-intelligence/recommend/route.ts`, if `activeModels` is empty, we will auto-seed the database using `defaultModelsConfig` and reload the active models.
2. **Robust Recommender Fallbacks**:
   Modify `src/lib/ai-engines/recommendation/recommender.ts` to utilize default model specifications as a fallback if the registry is empty, preventing `null` property crashes.

### Critical Files
- `app/api/admin/model-intelligence/recommend/route.ts`
- `src/lib/ai-engines/recommendation/recommender.ts`

---

## Phase 2: Create Visual Architecture Graph Presentation

### Proposed Changes
We will create a canvas element representing the architecture. We will render an interactive HTML dashboard containing a SVG/Mermaid.js-based DAG showing the structure of the RAG Pipeline and Model Recommendation Routing:
- **User Prompt** -> **Prompt Analyzer** (Reasoning, Coding, Context, Agentic scores) -> **Recommender Routing** -> **Workflow DAG** / **Review Graph** (Security, Architecture, Performance, Code Quality nodes).
- **Textbook PDF Ingestion** -> **FAISS Vector Indexing** -> **MMR Retrieval & Reranker** -> **LLM Generation** -> **Validation Loop** -> **Final Output**.

### Implementation
Use `jet_render` to push a `frame` element to the active canvas with the interactive architectural diagram.

---

## Phase 3: Educational AI Functionality Review & Report
Provide a detailed report in the chat summary covering:
- Ingestion Pipeline (`pdf_processor.py`, `ingestion/engine.py`)
- Retrieval Engine (`retriever.py`, `retrieval/engine.py`)
- Generation & Self-Correcting Validation (`generation/engine.py`, `validation/engine.py`)

---

## Verification Plan
1. Test `/api/admin/model-intelligence/recommend` with a test payload and verify it returns valid recommended model objects.
2. Check that the `ModelRegistry` collection is successfully auto-seeded on first run.
3. Verify that the visual architecture graph renders on the Jetro canvas.
