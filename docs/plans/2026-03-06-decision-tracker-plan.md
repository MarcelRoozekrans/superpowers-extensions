# Decision Tracker & Hub Model Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a decision-tracker plugin to superpowers-extensions and upgrade the marketplace to a hub that references companion plugins.

**Architecture:** Pure skill plugin (no code, just SKILL.md + plugin.json) following the same pattern as regression-test, pre-push-review, and refactor-analysis. The marketplace.json gains dependencies on external repos.

**Tech Stack:** Markdown (SKILL.md), JSON (plugin.json, marketplace.json), JavaScript (commitlint config)

---

### Task 1: Create plugin.json for decision-tracker

**Files:**
- Create: `plugins/decision-tracker/.claude-plugin/plugin.json`

**Step 1: Create the plugin manifest**

```json
{
  "name": "decision-tracker",
  "description": "Persistent cross-cutting decision tracking using long-term memory. Automatically extracts decisions during brainstorming and planning, recalls them at session start and subagent dispatch.",
  "author": {
    "name": "Marcel Roozekrans"
  }
}
```

No `mcp_servers` section — this skill uses LongtermMemory-MCP's tools directly.

**Step 2: Verify structure matches other plugins**

Run: `ls plugins/decision-tracker/.claude-plugin/`
Expected: `plugin.json`

**Step 3: Commit**

```bash
git add plugins/decision-tracker/.claude-plugin/plugin.json
git commit -m "feat(decision-tracker): add plugin manifest"
```

---

### Task 2: Write the SKILL.md

**Files:**
- Create: `plugins/decision-tracker/skills/decision-tracker/SKILL.md`

**Step 1: Write the skill file**

The skill must follow the established pattern from other skills in this repo. Use the refactor-analysis SKILL.md as the structural template. The skill must include these sections in order:

**Frontmatter:**
```yaml
---
name: decision-tracker
description: Use at session start and during brainstorming, writing-plans, refactor-analysis, and subagent dispatch to persist and recall cross-cutting project decisions via long-term memory
---
```

**Sections to include (in order):**

1. **Prerequisites** — Requires LongtermMemory-MCP tools (`save_memory`, `search_memory`, `search_by_tags`, `update_memory`). Degrades gracefully without them.

2. **Overview** — Core principle: *"Decisions made once should never be forgotten."* This skill automatically extracts cross-cutting decisions during design and planning workflows, persists them to long-term memory, and recalls them at session start and subagent dispatch.

3. **Announce Line** — When activated:
   > "Checking for project decisions in long-term memory. I'll recall existing decisions and track new ones throughout this session."

4. **When to Use** — Invoke when:
   - Starting any session on a project with existing decisions
   - During brainstorming when design choices are approved
   - During writing-plans when conventions apply across tasks
   - During refactor-analysis when constraints are identified
   - When subagent-driven-development dispatches agents

5. **Decision Categories** — Table from design doc:

   | Category | Memory Type | Importance | Tags | Example |
   |---|---|---|---|---|
   | Architectural | `fact` | 9 | `decision`, `project:<name>`, `architectural`, domain tags | "We use the repository pattern with unit of work" |
   | Convention | `fact` | 7 | `decision`, `project:<name>`, `convention`, domain tags | "All DTOs go in the Contracts project" |
   | Task-specific | `task` | 5 | `decision`, `project:<name>`, `task-specific`, domain tags | "UserService refactor must preserve backward compat with v2 API" |

6. **Project Name Detection** — Derive project name from (in order):
   1. Git remote origin (repo name): `git remote get-url origin` → extract repo name
   2. Solution file name (for .NET): `*.sln` in working directory
   3. `package.json` name field
   4. Working directory name as fallback

7. **Decision Recall (Session Start)** — When any superpowers skill activates:
   1. Detect project name
   2. Call `search_by_tags` with `["decision", "project:<name>"]`
   3. Group results by category (architectural → convention → task-specific)
   4. Present: *"Recalled N decisions for ProjectName:"* followed by grouped list
   5. For decisions older than 90 days, ask: *"This decision was made N months ago: [decision]. Still valid?"*
   6. This happens once per session — do NOT re-recall on every skill invocation
   7. **If `search_by_tags` is not available:** Skip recall, announce: *"LongtermMemory-MCP not detected. Install it to persist decisions across sessions: `claude install gh:MarcelRoozekrans/LongtermMemory-MCP`"*

8. **Decision Extraction (Save)** — Automatic, no explicit "save this" step.

   **What qualifies as a decision:**
   - Technology or pattern choices ("we'll use the repository pattern")
   - Placement rules ("DTOs go in Contracts")
   - Constraints ("must preserve backward compat")
   - Naming conventions ("all handlers end with Handler")
   - Cross-cutting rules ("every service must log to ILogger")

   **When to extract:**
   - **During brainstorming:** When user approves a design section, scan for cross-cutting statements. Save each as a decision.
   - **During writing-plans:** When conventions apply across all tasks, save as convention decisions.
   - **During refactor-analysis:** Phase 1 approach and Phase 4 constraints → save as task-specific decisions.

   **Deduplication:** Before saving, call `search_memory` with the decision text. If a semantically similar decision exists (returned with high relevance), call `update_memory` on the existing one instead of creating a duplicate.

   **Announce:** After saving, say: *"Saved N decisions to long-term memory: [numbered list]"*

   **If `save_memory` is not available:** Embed decisions in the plan document under a `## Cross-Cutting Decisions` section. Nudge: *"Install LongtermMemory-MCP to persist these decisions across sessions."*

9. **Subagent Injection** — When subagent-driven-development dispatches an agent:
   1. Derive a natural language query from the task description
   2. Call `search_memory` with that query
   3. Filter results to those tagged with `decision` and `project:<name>`
   4. Include only the top 2-3 most relevant decisions in the agent's prompt
   5. Format as: *"Cross-cutting decisions relevant to this task: [list]"*

10. **Graceful Degradation** — Summary of behavior when LongtermMemory-MCP is not available:

    | Action | With LongtermMemory-MCP | Without |
    |---|---|---|
    | Recall at session start | `search_by_tags` → grouped list | Skip, nudge to install |
    | Save during brainstorming | `save_memory` with tags | Embed in plan doc |
    | Save during writing-plans | `save_memory` with tags | Embed in plan doc |
    | Save during refactor-analysis | `save_memory` with tags | Embed in plan doc |
    | Subagent injection | `search_memory` → targeted | Include plan doc decisions section in prompt |

11. **Relationship to Superpowers Skills** — Follow the established pattern:

    Intro: "This skill is designed to complement — not replace — the superpowers workflow skills. Here is how they fit together:"

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

**Step 2: Verify the file exists and follows the pattern**

Run: `ls plugins/decision-tracker/skills/decision-tracker/`
Expected: `SKILL.md`

Verify frontmatter, all 11 sections, and the Relationship table are present.

**Step 3: Commit**

```bash
git add plugins/decision-tracker/skills/decision-tracker/SKILL.md
git commit -m "feat(decision-tracker): add skill for persistent decision tracking"
```

---

### Task 3: Update marketplace.json to hub model

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: Read the current marketplace.json**

Verify current content matches what we expect (v1.2.0, 3 plugins).

**Step 2: Update to v2.0.0 with dependencies and new plugin**

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
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
      "description": "AI-powered regression testing for web applications. Discovers existing test suites, runs them, then performs functional checks and visual evaluation via Playwright MCP browser automation at desktop, tablet, and mobile viewports. Generates detailed markdown reports with screenshots.",
      "version": "1.0.0",
      "author": {
        "name": "Marcel Roozekrans"
      },
      "source": "./plugins/regression-test",
      "category": "testing"
    },
    {
      "name": "pre-push-review",
      "description": "Comprehensive branch review before push or PR. Diffs against the base branch and reviews plan adherence, code quality, commit hygiene, and regression testing. Produces a PASS/FAIL verdict with a prioritized remediation plan on failure.",
      "version": "1.0.0",
      "author": {
        "name": "Marcel Roozekrans"
      },
      "source": "./plugins/pre-push-review",
      "category": "code-quality"
    },
    {
      "name": "refactor-analysis",
      "description": "Transitive impact analysis for complex refactorings. Maps all affected files, classifies breaking vs cosmetic changes, identifies risks like dynamic references and cross-boundary impacts, and produces a safe execution order with checkpoint boundaries.",
      "version": "1.0.0",
      "author": {
        "name": "Marcel Roozekrans"
      },
      "source": "./plugins/refactor-analysis",
      "category": "code-quality"
    },
    {
      "name": "decision-tracker",
      "description": "Persistent cross-cutting decision tracking using long-term memory. Automatically extracts decisions during brainstorming and planning, recalls them at session start and subagent dispatch.",
      "version": "1.0.0",
      "author": {
        "name": "Marcel Roozekrans"
      },
      "source": "./plugins/decision-tracker",
      "category": "workflow"
    }
  ]
}
```

**Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat: upgrade marketplace to v2.0.0 hub with ecosystem dependencies"
```

---

### Task 4: Update commitlint config

**Files:**
- Modify: `commitlint.config.js`

**Step 1: Add `decision-tracker` to scope-enum**

Change line 7 from:
```javascript
['regression-test', 'pre-push-review', 'refactor-analysis', 'deps'],
```
to:
```javascript
['regression-test', 'pre-push-review', 'refactor-analysis', 'decision-tracker', 'deps'],
```

**Step 2: Verify the config**

Run: `node -e "const c = require('./commitlint.config.js'); console.log(c.rules['scope-enum'][2])"`
Expected: `['regression-test', 'pre-push-review', 'refactor-analysis', 'decision-tracker', 'deps']`

**Step 3: Commit**

```bash
git add commitlint.config.js
git commit -m "chore: add decision-tracker scope to commitlint"
```

---

### Task 5: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Read the full README**

Read the entire file to understand the structure.

**Step 2: Update the intro paragraph**

Change "It includes three skills:" to "It includes four skills:" and add the decision-tracker bullet:

```markdown
- **decision-tracker** -- Persistent cross-cutting decision tracking using [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP). Automatically extracts architectural decisions, conventions, and constraints during brainstorming and planning, persists them to semantic long-term memory, and recalls them at session start and subagent dispatch to prevent decision amnesia.
```

**Step 3: Add a Decision Tracker Skill section**

After the Refactor Analysis Skill section and before the Installation section, add:

```markdown
---

## Decision Tracker Skill

The decision tracker skill provides persistent cross-cutting decision tracking that integrates with the superpowers brainstorming and planning workflow. It uses [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) as its persistence layer.

### What It Does

The skill operates in two modes:

1. **Recall** -- At session start, searches long-term memory for decisions tagged with the current project and presents them grouped by category (architectural, convention, task-specific).

2. **Extract** -- During brainstorming, writing-plans, and refactor-analysis, automatically identifies cross-cutting decisions and saves them to long-term memory with appropriate tags, types, and importance levels.

### Decision Categories

| Category | Importance | Decay | Example |
|---|---|---|---|
| Architectural | 9 | 120 days | "We use the repository pattern with unit of work" |
| Convention | 7 | 120 days | "All DTOs go in the Contracts project" |
| Task-specific | 5 | 30 days | "UserService refactor must preserve v2 API compat" |

### Subagent Integration

When subagent-driven-development dispatches parallel agents, the skill injects only the 2-3 most relevant decisions into each agent's prompt using semantic search -- keeping context focused rather than flooding agents with every decision.

### Graceful Degradation

Without LongtermMemory-MCP installed, the skill still identifies decisions and embeds them in plan documents. It nudges the user to install LongtermMemory-MCP for cross-session persistence.

### Usage

The skill activates automatically during superpowers workflows. No explicit invocation needed. You can also invoke it directly:

- `/decision-tracker`
```

**Step 4: Add an Ecosystem section before Installation**

```markdown
---

## Ecosystem

Superpowers Extensions serves as the hub for the superpowers extension ecosystem. Installing this marketplace also pulls in companion plugins:

| Plugin | Repository | Purpose |
|---|---|---|
| **LongtermMemory-MCP** | [MarcelRoozekrans/LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) | Semantic long-term memory for AI agents -- persistence layer for decision-tracker |
| **roslyn-codegraph-mcp** | [MarcelRoozekrans/roslyn-codegraph-mcp](https://github.com/MarcelRoozekrans/roslyn-codegraph-mcp) | Roslyn-based .NET code graph intelligence -- enhances brainstorming and refactor-analysis with semantic code understanding |
```

**Step 5: Update the Installation section**

In Option A, add decision-tracker to the install examples:

```bash
# Install the decision tracker skill
claude plugin install decision-tracker
```

In the "Verify Installation" section, add `/decision-tracker` to the list of skills.

**Step 6: Update the Project Structure tree**

Add the decision-tracker plugin to the tree:

```
├── plugins/
│   ├── decision-tracker/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── decision-tracker/
│   │           └── SKILL.md
```

**Step 7: Commit**

```bash
git add README.md
git commit -m "docs: add decision-tracker skill and ecosystem section to README"
```

---

### Task 6: Lint and verify

**Step 1: Run markdownlint on new and changed files**

Run: `npx markdownlint-cli2 plugins/decision-tracker/skills/decision-tracker/SKILL.md README.md`
Expected: No errors

**Step 2: Run commitlint on recent commits**

Run: `git log --oneline -5`
Verify all commit messages follow conventional commits with valid scopes.

**Step 3: Verify plugin structure matches other plugins**

Run: `ls -R plugins/decision-tracker/`
Expected:
```
plugins/decision-tracker/:
.claude-plugin/  skills/

plugins/decision-tracker/.claude-plugin:
plugin.json

plugins/decision-tracker/skills:
decision-tracker/

plugins/decision-tracker/skills/decision-tracker:
SKILL.md
```

**Step 4: Fix any lint errors and commit**

If markdownlint reports errors, fix them and commit:
```bash
git add -A
git commit -m "fix(decision-tracker): resolve markdown lint errors"
```
