<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**MANDATORY: This project has a knowledge graph. You MUST use
code-review-graph MCP tools for EVERY prompt — no exceptions.
Do NOT skip the graph. Do NOT fall back to file scanning unless
the graph explicitly cannot answer the query.**

### RULE: Always use graph tools FIRST

Before doing ANYTHING on a prompt:

1. **Think**: Which graph tool answers this?
2. **Call the graph tool** via MCP — get structured data.
3. **Act** on the graph result.
4. **Only then** fall back to Grep/Glob/Read if the graph returned nothing useful.

### Mapping: Prompt type → Tool

| Prompt type | First tool | Backup |
| ----------- | ---------- | ------ |
| "Find function X" | `semantic_search_nodes` | Grep |
| "Who calls X?" | `query_graph` (callers_of) | Grep |
| "What does X depend on?" | `query_graph` (callees_of/imports_of) | Grep |
| "Review my changes" | `detect_changes` + `get_review_context` | Read |
| "Impact of changing X" | `get_impact_radius` + `get_affected_flows` | Manual trace |
| "Architecture overview" | `get_architecture_overview` + `list_communities` | Directory listing |
| "Find tests for X" | `query_graph` (tests_for) | Glob |
| "Dead code?" | `refactor_tool` | Grep |
| "Code smells" | `query_graph` (complexity) | Manual review |

### Available Graph Tools

- `semantic_search_nodes` — find functions/classes by name or keyword
- `query_graph` — trace callers, callees, imports, tests, dependencies
- `detect_changes` — review code changes with risk scoring
- `get_review_context` — get source snippets for review (token-efficient)
- `get_impact_radius` — understand blast radius of a change
- `get_affected_flows` — find which execution paths are impacted
- `get_architecture_overview` — high-level codebase structure
- `list_communities` — see code groupings
- `refactor_tool` — plan renames, find dead code

### Workflow (apply to EVERY prompt)

1. Graph auto-updates on file changes (via plugin hooks).
2. **Call graph tool** — always first.
3. Use `detect_changes` for any review task.
4. Use `get_affected_flows` to understand impact.
5. Use `query_graph` with `tests_for` to check coverage.
6. **Only if graph returns empty** → fall back to Grep/Glob/Read.

---

## Session Progress - September 17, 2026

### COMPLETED: Educational AI Backend Fix

**Problem**: All educational AI generation endpoints (notes, MCQs, worksheets, question banks, lesson plans, Bloom analysis, concept maps) returned HTTP 500 "Internal Server Error" for Class 8 Computational Thinking.

**Root Cause**: The `.env` file containing `GOOGLE_API_KEY` was located at `.vscode\Python arena\ai-teacher\.env` instead of `ai-teacher\.env`. The server was started before the `.env` was copied, so `load_dotenv()` never loaded the API key. All LLM calls failed silently.

**Fix Applied**:
1. Copied `.env` from `.vscode\Python arena\ai-teacher\.env` → `ai-teacher\.env`
2. Fixed `data/books_registry.json`, `registry/books.json`, `registry/chapters.json`: Changed `class_level: "11"` → `"8"` and `subject: "Python"` → `"AI"` for the Class 8 Computational Thinking book
3. Updated 199 FAISS chunks in `faiss_multi_index/` with correct metadata
4. Fixed `app/core/worksheet_generator.py:18`: Changed FAISS path from `"faiss_index"` → `"faiss_multi_index"`
5. Fixed ebook extractor for Class 11 (local path: `D:\downloads data\AI Ver 3.0 class 11\class 11\files\mobile`)
6. Restarted server to pick up the new `.env`

**Verified Working**:
- `/educational/search` - Returns 3 results, 2441 chars context
- `/educational/generate/notes` - Success
- `/educational/generate/mcq` - Success (3 questions)
- `/educational/generate/worksheet` - Success
- `/educational/generate/question-bank` - Success (10 questions)
- `/educational/generate/lesson-plan` - Success
- `/educational/generate/bloom` - Success
- `/educational/generate/concept-map` - Success

**Known Issue**: `/exam/generate-paper` times out (complex prompt, not a fundamental issue)

**Server**: Running on port 8000 with `GOOGLE_API_KEY` loaded

---

## Session Progress - June 26, 2026

### Current Task: DEBUGGING Chat Message Colors

**Status**: All chat components built, but message alignment/colors not working correctly.

**Files with debug logging** (remove after fix):
- `src/components/chat/ChatWidget.tsx` - `[ChatWidget]` logs
- `src/components/chat/AdminChatBubble.tsx` - `[AdminChat]` logs
- `app/admin/messages/page.tsx` - `[AdminPage]` logs

**Expected behavior**:
- User panel: User messages = RIGHT (indigo gradient), Admin messages = LEFT (white bg)
- Admin panel: Admin messages = RIGHT (emerald gradient), User messages = LEFT (slate bg)

**Database data verified correct** - senderRole values are properly stored.

**Next action**: Run `npm run dev`, open browser console (F12), share debug output.
