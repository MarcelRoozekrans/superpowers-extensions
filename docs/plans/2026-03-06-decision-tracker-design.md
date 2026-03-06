# Decision Tracker & Hub Model — Design Document

**Date:** 2026-03-06
**Status:** Approved
**Repo:** `MarcelRoozekrans/superpowers-extensions`

## Problem Statement

When Claude Code works on large projects across multiple sessions, cross-cutting decisions are lost. Subagents dispatched in parallel don't know about architectural choices made earlier. This leads to contradictory implementations and wasted rework.

The existing LongtermMemory-MCP provides a persistence layer with semantic search, tags, decay, and importance. What's missing is a skill that teaches Claude when and how to extract, persist, and recall project decisions using those tools.

Additionally, superpowers-extensions should serve as the single entrypoint for the entire superpowers ecosystem, pulling in companion plugins automatically.

## Solution

1. A new `decision-tracker` plugin (pure skill) in superpowers-extensions that uses LongtermMemory-MCP tools to persist cross-cutting decisions
2. An updated `marketplace.json` that references external companion plugins as dependencies

## Plugin Structure

```
plugins/
└── decision-tracker/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── decision-tracker/
            └── SKILL.md
```

No MCP server config — the skill uses LongtermMemory-MCP's tools directly.

## Hub Model

### marketplace.json (v2.0.0)

```json
{
  "name": "superpowers-extensions",
  "description": "Extension skills for the superpowers suite: regression testing, pre-push review, refactor analysis, decision tracking, and companion ecosystem plugins",
  "version": "2.0.0",
  "owner": {
    "name": "Marcel Roozekrans"
  },
  "dependencies": [
    "gh:MarcelRoozekrans/LongtermMemory-MCP",
    "gh:MarcelRoozekrans/roslyn-codegraph-mcp"
  ],
  "plugins": [
    {
      "name": "regression-test",
      "description": "AI-powered regression testing for web applications via Playwright MCP browser automation.",
      "version": "1.0.0",
      "author": { "name": "Marcel Roozekrans" },
      "source": "./plugins/regression-test",
      "category": "testing"
    },
    {
      "name": "pre-push-review",
      "description": "Comprehensive branch review before push or PR with PASS/FAIL verdict.",
      "version": "1.0.0",
      "author": { "name": "Marcel Roozekrans" },
      "source": "./plugins/pre-push-review",
      "category": "code-quality"
    },
    {
      "name": "refactor-analysis",
      "description": "Transitive impact analysis for complex refactorings with safe execution order.",
      "version": "1.0.0",
      "author": { "name": "Marcel Roozekrans" },
      "source": "./plugins/refactor-analysis",
      "category": "code-quality"
    },
    {
      "name": "decision-tracker",
      "description": "Persistent cross-cutting decision tracking using long-term memory. Automatically extracts decisions during brainstorming and planning, recalls them at session start and subagent dispatch.",
      "version": "1.0.0",
      "author": { "name": "Marcel Roozekrans" },
      "source": "./plugins/decision-tracker",
      "category": "workflow"
    }
  ]
}
```

Installing `claude install gh:MarcelRoozekrans/superpowers-extensions` pulls in everything: the 4 local skills plus LongtermMemory-MCP and roslyn-codegraph-mcp.

## Decision Format & Storage

### Decision Categories

| Category | Memory Type | Importance | Decay Half-Life | Example |
|---|---|---|---|---|
| Architectural | `fact` | 9 | 120 days | "We use the repository pattern with unit of work" |
| Convention | `fact` | 7 | 120 days | "All DTOs go in the Contracts project" |
| Task-specific | `task` | 5 | 30 days | "UserService refactor must preserve backward compat with v2 API" |

### Tagging Convention

Every decision is saved with:
- `decision` — always present
- `project:<name>` — scoped to the project
- Category tag: `architectural`, `convention`, or `task-specific`
- Domain tags: free-form (e.g., `auth`, `api`, `database`, `di`)

### Example save_memory Call

```json
{
  "content": "All repository interfaces live in MyApp.Domain, implementations in MyApp.Infrastructure. Never put implementations in Domain.",
  "tags": ["decision", "project:myapp", "architectural", "di", "architecture"],
  "memory_type": "fact",
  "importance": 9
}
```

### Project Name Detection

Derived from (in order):
1. Git remote origin (repo name)
2. Solution file name (for .NET)
3. `package.json` name
4. Working directory name as fallback

## Decision Extraction (Save)

Decisions are extracted automatically — no explicit "save this" step.

### During brainstorming

When a design choice is approved, the skill identifies cross-cutting statements:
- Technology/pattern choices ("we'll use the repository pattern")
- Placement rules ("DTOs go in Contracts")
- Constraints ("must preserve backward compat")
- Naming conventions ("all handlers end with Handler")

Claude announces: *"Saved 2 decisions to long-term memory: [list]"*

### During writing-plans

Convention decisions that apply across tasks (e.g., "every task must run tests before committing") are saved.

### During refactor-analysis

Phase 1 (Scope Definition) refactor approach and Phase 4 (Impact Classification) constraints are saved as task-specific decisions.

### Deduplication

Before saving, `search_memory` checks for semantic duplicates. If a similar decision exists (high cosine similarity), `update_memory` refines the existing one instead of creating a duplicate.

### Graceful Degradation

If `save_memory` isn't available:
- Decisions are still identified and embedded in the plan document under a "Cross-Cutting Decisions" section
- Claude nudges: *"Install LongtermMemory-MCP to persist these decisions across sessions."*

## Decision Recall (Load)

### At Session Start

When any superpowers skill activates:
1. `search_by_tags` with `["decision", "project:<name>"]`
2. Group by category (architectural → convention → task-specific)
3. Present: *"Recalled 7 decisions for MyApp: [grouped list]"*

Happens once per session, not on every skill invocation.

### At Subagent Dispatch

When subagent-driven-development dispatches an agent:
1. `search_memory` with a query derived from the task description
2. Filter to `project:<name>` tagged decisions
3. Inject only the 2-3 relevant decisions into the agent's prompt

Keeps subagent context focused rather than flooding with all decisions.

### Stale Decision Handling

Task-specific decisions decay naturally (30-day half-life). Architectural decisions persist (120-day half-life, importance 9). If a recalled decision seems outdated, Claude asks: *"This decision was made 3 months ago: [decision]. Still valid?"* — and updates or deletes accordingly.

## Relationship to Superpowers Skills

| Superpowers Skill | Integration | Direction |
|---|---|---|
| `brainstorming` | Extracts and saves decisions when design choices are approved. Recalls existing decisions at start to inform new designs. | Read + Write |
| `writing-plans` | Recalls decisions and embeds them in the plan header. Saves new convention decisions. | Read + Write |
| `subagent-driven-development` | Injects targeted decisions into each subagent's prompt based on task scope. | Read |
| `refactor-analysis` | Saves refactor constraints as task-specific decisions. Recalls architectural decisions for impact classification. | Read + Write |

### Workflow Chain

```
brainstorming (decisions extracted and saved)
  → refactor-analysis (constraints saved, architectural decisions recalled)
  → writing-plans (all decisions embedded in plan header)
  → subagent-driven-development (targeted decisions injected per agent)
  → pre-push-review (no integration — reviews code, not decisions)
```

Not a new phase in any workflow. Enriches existing phases with persistent decision context.

## Out of Scope (v1.0)

- Decision conflict detection (two contradictory decisions)
- Decision versioning / history
- Decision approval workflows
- UI for browsing decisions
- Integration with pre-push-review
