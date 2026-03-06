---
name: decision-tracker
description: Use at session start and during brainstorming, writing-plans, refactor-analysis, and subagent dispatch to persist and recall cross-cutting project decisions via long-term memory
---

# Decision Tracker Skill

## Prerequisites

This skill requires LongtermMemory-MCP tools (`save_memory`, `search_memory`, `search_by_tags`, `update_memory`) for full functionality. Install with:

```bash
claude install gh:MarcelRoozekrans/LongtermMemory-MCP
```

The skill degrades gracefully when these tools are not available — see the [Graceful Degradation](#graceful-degradation) section.

## Overview

This skill automatically extracts cross-cutting decisions during design and planning workflows, persists them to long-term memory, and recalls them at session start and subagent dispatch. The core principle is:

**"Decisions made once should never be forgotten."**

This is not a standalone workflow. It enriches existing superpowers skills with persistent decision context, ensuring that architectural choices, naming conventions, and project constraints survive across sessions and are available to every agent working on the project.

## Announce Line

When this skill is activated, begin with:

> "Checking for project decisions in long-term memory. I'll recall existing decisions and track new ones throughout this session."

## When to Use

Invoke this skill when:

- **Starting any session** on a project with existing decisions
- **During brainstorming** when design choices are approved
- **During writing-plans** when conventions apply across tasks
- **During refactor-analysis** when constraints are identified
- **When subagent-driven-development dispatches agents** to inject relevant decisions into agent prompts

Do NOT use this skill when:

- The project is brand new with no prior decisions
- Working on a one-off task with no cross-cutting impact
- LongtermMemory-MCP is not installed AND no plan documents exist

## Decision Categories

| Category | Memory Type | Importance | Tags | Example |
|---|---|---|---|---|
| **Architectural** | `fact` | 9 | `decision`, `project:<name>`, `architectural`, domain tags | "We use the repository pattern with unit of work" |
| **Convention** | `fact` | 7 | `decision`, `project:<name>`, `convention`, domain tags | "All DTOs go in the Contracts project" |
| **Task-specific** | `task` | 5 | `decision`, `project:<name>`, `task-specific`, domain tags | "UserService refactor must preserve backward compat with v2 API" |

## Project Name Detection

Derive the project name from (in priority order):

1. **Git remote origin** — run `git remote get-url origin` and extract the repository name
2. **Solution file name** — for .NET projects, use the `*.sln` filename in the working directory
3. **package.json name field** — read the `name` field from `package.json`
4. **Working directory name** — use the directory name as a fallback

## Decision Recall (Session Start)

When any superpowers skill activates, recall existing decisions:

1. **Detect the project name** using the priority order above.
2. **Call `search_by_tags`** with `["decision", "project:<name>"]`.
3. **Group results by category** — architectural first, then convention, then task-specific.
4. **Present the results:**

   > "Recalled N decisions for ProjectName:"

   Followed by the grouped list of decisions.

5. **Validate stale decisions** — for decisions older than 90 days, ask:

   > "This decision was made N months ago: [decision]. Still valid?"

6. **Once per session** — this recall happens once at the start. Do NOT re-recall on every skill invocation.

7. **If `search_by_tags` is not available:** Skip recall and announce:

   > "LongtermMemory-MCP not detected. Install it to persist decisions across sessions: `claude install gh:MarcelRoozekrans/LongtermMemory-MCP`"

## Decision Extraction (Save)

Decision extraction is automatic — no explicit "save this" step is needed.

### What Qualifies as a Decision

- Technology or pattern choices ("we'll use the repository pattern")
- Placement rules ("DTOs go in Contracts")
- Constraints ("must preserve backward compat")
- Naming conventions ("all handlers end with Handler")
- Cross-cutting rules ("every service must log to ILogger")

### When to Extract

- **During brainstorming:** When the user approves a design section, scan for cross-cutting statements. Save each as a decision.
- **During writing-plans:** When conventions apply across all tasks, save as convention decisions.
- **During refactor-analysis:** Phase 1 approach and Phase 4 constraints — save as task-specific decisions.

### Deduplication

Before saving, call `search_memory` with the decision text. If a semantically similar decision already exists (returned with high relevance), call `update_memory` on the existing one instead of creating a duplicate.

### Announce

After saving, say:

> "Saved N decisions to long-term memory: [numbered list]"

### Without LongtermMemory-MCP

If `save_memory` is not available, embed decisions in the plan document under a `## Cross-Cutting Decisions` section. Nudge:

> "Install LongtermMemory-MCP to persist these decisions across sessions."

## Subagent Injection

When subagent-driven-development dispatches an agent:

1. **Derive a natural language query** from the task description.
2. **Call `search_memory`** with that query.
3. **Filter results** to those tagged with `decision` and `project:<name>`.
4. **Include only the top 2-3 most relevant decisions** in the agent's prompt.
5. **Format as:**

   > "Cross-cutting decisions relevant to this task: [list]"

## Graceful Degradation

| Action | With LongtermMemory-MCP | Without |
|---|---|---|
| Recall at session start | `search_by_tags` → grouped list | Skip, nudge to install |
| Save during brainstorming | `save_memory` with tags | Embed in plan doc |
| Save during writing-plans | `save_memory` with tags | Embed in plan doc |
| Save during refactor-analysis | `save_memory` with tags | Embed in plan doc |
| Subagent injection | `search_memory` → targeted | Include plan doc decisions section in prompt |

## Relationship to Superpowers Skills

This skill is designed to complement — not replace — the superpowers workflow skills. Here is how they fit together:

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | **Always-on when available.** Recalls existing decisions at brainstorming start to inform design. Extracts and saves new decisions when design choices are approved. | Decisions from prior sessions prevent contradictory designs. |
| `superpowers:writing-plans` | **Embeds decisions in plan header.** Recalls all project decisions and adds a "Cross-Cutting Decisions" section to the plan so every task references them. Saves new convention decisions. | Subagents executing the plan inherit these decisions. |
| `superpowers:subagent-driven-development` | **Injects targeted decisions per agent.** Uses semantic search to find the 2-3 decisions most relevant to each subagent's task and includes them in the prompt. | Keeps subagent context focused rather than flooding with all decisions. |
| `refactor-analysis` | **Saves constraints, recalls architecture.** Refactor approach (Phase 1) and constraints (Phase 4) are saved as task-specific decisions. Architectural decisions are recalled to inform impact classification. | Ensures refactor respects established patterns. |

**Recommended workflow chain:**

```text
session start (decisions recalled from long-term memory)
  → brainstorming (new decisions extracted and saved)
  → refactor-analysis (constraints saved, architectural decisions recalled)
  → writing-plans (all decisions embedded in plan header)
  → subagent-driven-development (targeted decisions injected per agent)
  → pre-push-review (no integration — reviews code, not decisions)
```
