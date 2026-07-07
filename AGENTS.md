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
