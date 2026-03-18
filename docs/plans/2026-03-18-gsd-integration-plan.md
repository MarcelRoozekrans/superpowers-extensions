# GSD Integration — project-orchestration & ui-workflow Plugins

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create two new superpowers-native plugins (`project-orchestration` and `ui-workflow`) that bring GSD's project lifecycle and UI design workflow capabilities into the superpowers-extensions ecosystem.

**Architecture:** Two independent plugins following the exact same structure as existing plugins (`.claude-plugin/plugin.json` + `skills/<name>/SKILL.md` + optional reference docs). Each plugin is registered in `.claude-plugin/marketplace.json`. No external dependencies — pure markdown skill files.

**Tech Stack:** Markdown skill files, JSON plugin manifests. No code, no MCP servers required.

**Design doc:** `docs/plans/2026-03-18-gsd-integration-design.md`

---

### Task 1: Create project-orchestration directory structure and plugin.json

**Files:**
- Create: `plugins/project-orchestration/.claude-plugin/plugin.json`

**Step 1: Verify the directory pattern from an existing plugin**

Read `plugins/decision-tracker/.claude-plugin/plugin.json` to confirm the exact JSON schema used.

**Step 2: Create `plugins/project-orchestration/.claude-plugin/plugin.json`**

```json
{
  "$schema": "https://anthropic.com/claude-code/plugin.schema.json",
  "name": "project-orchestration",
  "version": "1.6.0",
  "description": "GSD-inspired project lifecycle management for larger multi-session projects. Brownfield codebase mapping, milestone tracking, phase management, session pause/resume, progress overview, and release cycle management.",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "skills": [
    {
      "name": "project-orchestration",
      "path": "./skills/project-orchestration/SKILL.md"
    }
  ]
}
```

**Step 3: Verify file exists**

Run: `ls plugins/project-orchestration/.claude-plugin/`
Expected: `plugin.json` listed

**Step 4: Commit**

```bash
git add plugins/project-orchestration/.claude-plugin/plugin.json
git commit -m "feat(project-orchestration): scaffold plugin structure"
```

---

### Task 2: Create project-orchestration state-files.md

**Files:**
- Create: `plugins/project-orchestration/skills/project-orchestration/state-files.md`

**Step 1: Create the reference doc**

```markdown
# .planning/ State Files Reference

This document defines the format for the `.planning/` directory files used by
the `project-orchestration` skill to persist project lifecycle state across sessions.

## Directory

`.planning/` in the project root. Add to `.gitignore` or commit — user's choice.
Recommended: commit so state survives machine changes.

## ROADMAP.md

Tracks all milestones, their phases, and completion status.

```markdown
# Project Roadmap

## Milestone 1: <Name> [status: active|complete]
**Goal:** One sentence
**Definition of Done:**
- [ ] Criterion 1
- [ ] Criterion 2

### Phase 1.1: <Name> [status: complete|active|pending]
**Goal:** One sentence
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`

### Phase 1.2: <Name> [status: pending]
...

## Milestone 2: <Name> [status: pending]
...
```

## STATE.md

Session handoff document. Written by `pause-work`, read by `resume-work`.

```markdown
# Session State — <Date>

## Current Position
- **Milestone:** <N> — <Name>
- **Phase:** <N.M> — <Name>
- **Last completed task:** Task N from `docs/plans/<plan-file>.md`
- **Next task:** Task N+1 — <task title>

## Open Decisions
- Decision 1 needing resolution
- Decision 2 needing resolution

## Blockers
- Blocker description (if any)

## Recommended Next Step
One sentence: what to do when resuming.
```

## MILESTONE.md

Current active milestone definition.

```markdown
# Milestone <N>: <Name>

**Status:** active
**Started:** YYYY-MM-DD
**Target:** YYYY-MM-DD (optional)

## Goal
One paragraph.

## Definition of Done
- [ ] All planned phases complete
- [ ] All tests passing
- [ ] Regression test PASS
- [ ] Release tagged in git

## Phases
1. Phase 1.1 — <name> [complete]
2. Phase 1.2 — <name> [active]
3. Phase 1.3 — <name> [pending]

## Audit History
| Date | Verdict | Gaps |
|---|---|---|
| YYYY-MM-DD | PASS | none |
```
```

**Step 2: Verify file exists**

Run: `ls plugins/project-orchestration/skills/project-orchestration/`
Expected: `state-files.md` listed

**Step 3: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/state-files.md
git commit -m "feat(project-orchestration): add state-files reference doc"
```

---

### Task 3: Create project-orchestration SKILL.md

**Files:**
- Create: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`

This is the main skill file. It must follow the exact same structure as existing skills: frontmatter, prerequisites, overview, announce line, when to use, checklist, process flow, phase descriptions, red flags, common rationalizations, quick reference, and relationship table.

**Step 1: Create the SKILL.md**

```markdown
---
name: project-orchestration
description: Use when starting work on a larger multi-session project, managing milestones or phases, checking project status, or pausing/resuming work across sessions. Covers brownfield mapping, phase management, milestone lifecycle, and session handoff.
---

# Project Orchestration Skill

## Prerequisites

No MCP servers or external tools required. Uses only built-in tools (Read, Write, Glob, Bash for git commands).

## Overview

This skill provides project lifecycle management for larger, multi-session projects. The core principle is:

**"Big projects need navigation, not just execution."**

A single brainstorming + writing-plans + executing-plans cycle works well for small features. Multi-milestone projects need a way to track where they are, manage their roadmap, pause and resume cleanly, and mark releases. This skill provides that structure without replacing the superpowers workflow — it wraps around it.

## Sub-Skills

This skill contains multiple sub-skills, each invoked by a specific trigger phrase or context. They share the `.planning/` state directory (see [state-files.md](state-files.md) for file formats).

---

## map-codebase

### When to Use

Invoke before `brainstorming` when starting work on an existing codebase the agent has not previously analyzed. Especially useful when:

- The user says "I have an existing project and want to add features"
- The project has no `docs/plans/` directory or design docs
- The codebase is unfamiliar and context is needed before asking design questions

### Announce Line

> "Mapping the existing codebase. I'll analyze structure, entry points, dependencies, and key patterns before we start designing."

### Process

1. **Read project root** — identify tech stack from `package.json`, `*.csproj`, `*.sln`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, etc.

2. **Map directory structure** — use `Glob` with `**/*` to understand the top-level layout. Identify: source directories, test directories, config files, docs, build artifacts.

3. **Find entry points** — locate main files: `main.*`, `index.*`, `Program.cs`, `app.*`, `server.*`, `cmd/`, etc.

4. **Read key config files** — `package.json` scripts, `.env.example`, CI config (`.github/workflows/`), docker-compose files.

5. **Identify patterns** — grep for: framework indicators (React, ASP.NET, FastAPI, Rails), architectural patterns (repositories, services, controllers, handlers), test framework config.

6. **Summarize** — present a codebase map with:
   - Tech stack and framework
   - Directory layout and purpose of each major directory
   - Entry points and how the application starts
   - Test structure and framework
   - Key patterns and conventions observed
   - Recommended starting points for the planned work

7. **Save to:** `docs/plans/YYYY-MM-DD-codebase-map.md`

8. **Transition** — invoke `brainstorming` with the codebase map as context.

---

## progress

### When to Use

Invoke when the user asks "where are we?", "what's next?", "show me progress", or at the start of a session on a project with `.planning/` state files.

### Announce Line

> "Reading project state to show current progress."

### Process

1. **Check for `.planning/ROADMAP.md`** — if not found, announce: "No .planning/ directory found. This project hasn't been initialized with project-orchestration yet. Start with `map-codebase` or create a milestone with `new-milestone`."

2. **Read `.planning/ROADMAP.md`** — parse milestones and phases, identify which are complete, active, and pending.

3. **Read `.planning/STATE.md`** — get last session handoff (current phase, last task, next step).

4. **Read `.planning/MILESTONE.md`** — get current milestone goal and definition of done.

5. **Present status:**

   > **Project Progress**
   >
   > **Current Milestone:** N — Name (X of Y phases complete)
   > **Current Phase:** N.M — Name
   > **Last completed:** Task description
   > **Next step:** Recommended next action
   >
   > **Roadmap:**
   > - ✅ Milestone 1: Name (complete)
   > - 🔄 Milestone 2: Name (active — phase 2.3 of 5)
   > - ⏳ Milestone 3: Name (pending)

---

## add-phase

### When to Use

When the user wants to append a new phase to the current milestone's roadmap.

### Process

1. Read `.planning/ROADMAP.md` and `.planning/MILESTONE.md` to find the current milestone and its last phase number.
2. Ask the user: "Phase name and goal?"
3. Append the new phase to `.planning/ROADMAP.md` under the current milestone with status `pending`.
4. Update `.planning/MILESTONE.md` phases list.
5. Announce the new phase number and name.
6. Commit: `git commit -m "chore(roadmap): add phase N.M — <name>"`

---

## insert-phase

### When to Use

When urgent work needs to be inserted between two existing phases.

### Process

1. Read `.planning/ROADMAP.md`, present current phase list.
2. Ask: "Insert after which phase?" and "New phase name and goal?"
3. Insert the new phase, renumber all subsequent phases.
4. Update `.planning/MILESTONE.md`.
5. Announce: "Inserted Phase N.M — <name> between N.M-1 and old N.M (now N.M+1)."
6. Commit: `git commit -m "chore(roadmap): insert phase N.M — <name>"`

---

## remove-phase

### When to Use

When a future (pending) phase should be removed from the roadmap.

### Constraints

- Only future (pending) phases may be removed. Active or complete phases cannot be removed.
- Always confirm with the user before removing.

### Process

1. Read `.planning/ROADMAP.md`, present pending phases.
2. Ask: "Which phase to remove?"
3. Confirm: "Remove Phase N.M — <name>? This cannot be undone."
4. Remove the phase, renumber subsequent phases.
5. Commit: `git commit -m "chore(roadmap): remove phase N.M — <name>"`

---

## list-phase-assumptions

### When to Use

Before starting execution of a phase — surfaces Claude's intended implementation approach for the user to review and correct before work begins.

### Process

1. Read the phase's plan document from `docs/plans/`.
2. Read relevant design docs from `docs/plans/`.
3. Present:

   > **Phase N.M — Name: Intended Approach**
   >
   > Before I start, here is my intended approach for this phase:
   >
   > 1. [Assumption about implementation approach]
   > 2. [Assumption about files to touch]
   > 3. [Assumption about test strategy]
   > 4. [Assumption about integration points]
   >
   > Any corrections before I begin?

4. Wait for user confirmation or corrections before invoking executing-plans.

---

## plan-milestone-gaps

### When to Use

After `audit-milestone` identifies gaps — the milestone definition of done is not yet met.

### Process

1. Read the audit report (from `docs/plans/YYYY-MM-DD-<milestone>-audit.md`).
2. For each gap identified, propose a new phase to close it.
3. Present the proposed phases to the user for approval.
4. On approval, invoke `add-phase` for each approved phase.

---

## pause-work

### When to Use

When the user is stopping work and wants to preserve context for next session. Triggers on: "I'm done for today", "pausing", "stopping here", "need to stop".

### Announce Line

> "Creating session handoff. I'll capture current state so we can resume cleanly."

### Process

1. Identify current position: which milestone, which phase, which task was last completed.
2. Identify open decisions or blockers (from the conversation context).
3. Determine recommended next step.
4. Write `.planning/STATE.md` with the handoff note (see [state-files.md](state-files.md) for format).
5. Announce:

   > "Session state saved to `.planning/STATE.md`. Next session, start with `resume-work` or say 'resume' and I'll restore context."

6. Commit: `git commit -m "chore(state): pause-work — phase N.M, last task: <description>"`

---

## resume-work

### When to Use

At the start of a session on a project with existing `.planning/` state. Triggers on: "resume", "where were we?", "continue from last time".

### Process

1. Read `.planning/STATE.md`.
2. Read `.planning/ROADMAP.md` and `.planning/MILESTONE.md` for full context.
3. Present:

   > **Resuming session**
   >
   > **Last session:** YYYY-MM-DD
   > **Current milestone:** N — Name
   > **Current phase:** N.M — Name
   > **Last completed:** Task description
   > **Open decisions:** (list if any)
   > **Recommended next step:** Description
   >
   > Ready to continue?

4. On confirmation, invoke the appropriate next skill (executing-plans, brainstorming, etc.).

---

## audit-milestone

### When to Use

When the user believes a milestone is complete and wants to verify it against its definition of done.

### Announce Line

> "Auditing milestone N — <name>. I'll verify each definition-of-done criterion against git history, test results, and documentation."

### Process

1. Read `.planning/MILESTONE.md` to get the definition of done.
2. For each criterion:
   - **All phases complete** — check ROADMAP.md, verify each phase has status `complete`.
   - **All tests passing** — run `npm test` / `dotnet test` / `pytest` (detect from project). Record pass/fail.
   - **Regression test PASS** — invoke `regression-test` skill if a web UI is available (optional, confirm with user).
   - **Documentation** — check that plan docs exist for each phase, design docs are present.
   - **Release tagged** — check `git tag -l` for expected tag.
3. Produce verdict: **PASS** (all criteria met) or **FAIL** (gaps found).
4. Save audit report to: `docs/plans/YYYY-MM-DD-milestone-N-audit.md`
5. On **PASS**: announce and offer to invoke `complete-milestone`.
6. On **FAIL**: list gaps and offer to invoke `plan-milestone-gaps`.

---

## complete-milestone

### When to Use

After `audit-milestone` returns PASS.

### Announce Line

> "Completing milestone N — <name>. I'll archive the milestone doc, tag the release, and update the roadmap."

### Process

1. Confirm with user: "Mark Milestone N — <name> as complete and tag release?"
2. Update `.planning/ROADMAP.md`: set milestone status to `complete`, record completion date.
3. Update `.planning/MILESTONE.md`: set status to `complete`.
4. Tag the release: `git tag -a vN.0 -m "Milestone N: <name> complete"`
5. Announce: "Milestone N complete. Tagged as vN.0. Ready to start Milestone N+1 with `new-milestone`."

---

## new-milestone

### When to Use

After `complete-milestone`, or when the user wants to start a new version cycle.

### Process

1. Ask: "What is the goal of the next milestone?" (one sentence)
2. Ask: "What are the criteria for 'done'?" (list, one per line)
3. Determine milestone number (current + 1).
4. Create/overwrite `.planning/MILESTONE.md` with the new milestone definition.
5. Add the new milestone to `.planning/ROADMAP.md` with status `active`.
6. Announce: "Milestone N+1 — <name> started. Use `add-phase` to add the first phase, or `brainstorming` to design it."
7. Commit: `git commit -m "chore(milestone): start milestone N+1 — <name>"`

---

## Red Flags

1. **Removing an active or complete phase** — Only pending phases may be removed. Active phases must be completed or paused first.

2. **Completing a milestone without auditing** — Always run `audit-milestone` before `complete-milestone`. Never mark complete without evidence.

3. **Creating STATE.md manually** — Always use `pause-work` to write STATE.md. Manual edits may miss required fields.

4. **Skipping `list-phase-assumptions`** — Assumptions wrong at the start cause rework. Surface them before executing.

5. **Running `new-milestone` before `complete-milestone`** — Milestones must be formally closed before opening new ones. Overlapping milestones create ambiguous state.

## Common Rationalizations

| Rationalization | Why It's Wrong | Correct Action |
|---|---|---|
| "I know where we are, no need to resume" | Memory doesn't persist across sessions; STATE.md does | Always read STATE.md at session start on an active project |
| "Skip the audit, I know all tests pass" | DoD has multiple criteria, not just tests | Run audit-milestone mechanically |
| "The phase is basically done, mark it complete" | "Basically done" is not done | Complete all tasks, then mark complete |
| "I'll add phases later, start executing now" | Unplanned phases cause scope creep | Define roadmap before executing |

## Quick Reference

| Sub-skill | Trigger | State Files Written |
|---|---|---|
| `map-codebase` | Before brainstorming on existing project | `docs/plans/YYYY-MM-DD-codebase-map.md` |
| `progress` | "where are we?" / session start | None (read-only) |
| `add-phase` | "add a phase" | `.planning/ROADMAP.md`, `.planning/MILESTONE.md` |
| `insert-phase` | "insert urgent work" | `.planning/ROADMAP.md`, `.planning/MILESTONE.md` |
| `remove-phase` | "remove phase N.M" | `.planning/ROADMAP.md`, `.planning/MILESTONE.md` |
| `list-phase-assumptions` | Before executing a phase | None (read-only) |
| `plan-milestone-gaps` | After failed audit | `.planning/ROADMAP.md` (via add-phase) |
| `pause-work` | "done for today" / stopping | `.planning/STATE.md` |
| `resume-work` | "resume" / session start | None (read-only) |
| `audit-milestone` | "verify milestone is done" | `docs/plans/YYYY-MM-DD-milestone-N-audit.md` |
| `complete-milestone` | After audit PASS | `.planning/ROADMAP.md`, `.planning/MILESTONE.md`, git tag |
| `new-milestone` | After complete-milestone | `.planning/MILESTONE.md`, `.planning/ROADMAP.md` |

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | `map-codebase` runs before brainstorming on existing projects. `resume-work` restores context before brainstorming a new phase. | Provides codebase context that makes brainstorming questions more grounded. |
| `superpowers:writing-plans` | `add-phase` / `insert-phase` maintain the ROADMAP.md that writing-plans references for context. `list-phase-assumptions` reviews the plan before executing-plans begins. | Phase management and plan writing are complementary — ROADMAP.md is the source of truth for what gets planned. |
| `superpowers:executing-plans` | `list-phase-assumptions` runs before executing-plans to surface and confirm the intended approach. `pause-work` can interrupt executing-plans cleanly. | list-phase-assumptions is a pre-execution gate; pause-work is a clean exit. |
| `superpowers:subagent-driven-development` | `list-phase-assumptions` applies equally before subagent dispatch. `pause-work` captures state when stopping mid-subagent execution. | Both sub-skills work regardless of whether execution uses executing-plans or subagent-driven-development. |
| `superpowers:finishing-a-development-branch` | `audit-milestone` + `complete-milestone` extend the finishing workflow to full milestone release management. | finishing-a-development-branch handles branch integration; complete-milestone handles milestone closure and release tagging. |
| `regression-test` | `audit-milestone` optionally invokes regression-test as part of definition-of-done verification for projects with a web UI. | Regression-test provides the visual and functional evidence for milestone audit. |
| `decision-tracker` | Independent but complementary. Both can be active simultaneously. `resume-work` triggers decision-tracker recall at session start. | decision-tracker handles cross-cutting decisions; project-orchestration handles project state and lifecycle. |
| `pre-push-review` | `audit-milestone` includes a pre-push-review equivalent check (code quality, tests) as one of its DoD criteria. | No direct invocation — audit-milestone performs its own checks. |
```

**Step 2: Verify file exists and has correct frontmatter**

Run: `head -5 plugins/project-orchestration/skills/project-orchestration/SKILL.md`
Expected: frontmatter with `name: project-orchestration`

**Step 3: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): add SKILL.md with all sub-skills"
```

---

### Task 4: Create ui-workflow plugin structure and plugin.json

**Files:**
- Create: `plugins/ui-workflow/.claude-plugin/plugin.json`

**Step 1: Create plugin.json**

```json
{
  "$schema": "https://anthropic.com/claude-code/plugin.schema.json",
  "name": "ui-workflow",
  "version": "1.6.0",
  "description": "Frontend design contracts and visual auditing. Generates structured UI design contracts before implementing frontend phases and performs retroactive visual audits against those contracts using regression-test.",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "skills": [
    {
      "name": "ui-workflow",
      "path": "./skills/ui-workflow/SKILL.md"
    }
  ]
}
```

**Step 2: Verify**

Run: `ls plugins/ui-workflow/.claude-plugin/`
Expected: `plugin.json` listed

**Step 3: Commit**

```bash
git add plugins/ui-workflow/.claude-plugin/plugin.json
git commit -m "feat(ui-workflow): scaffold plugin structure"
```

---

### Task 5: Create ui-workflow ui-contract-template.md

**Files:**
- Create: `plugins/ui-workflow/skills/ui-workflow/ui-contract-template.md`

**Step 1: Create the template**

```markdown
# UI Design Contract: <Phase Name>

> **Purpose:** This contract defines the visual and interaction specification for the `<phase name>` frontend phase.
> It is produced by `ui-phase` before implementation and used by `ui-review` to audit the result.

**Date:** YYYY-MM-DD
**Phase:** N.M — <Phase Name>
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `primary` | #XXXXXX | Primary actions, CTAs |
| `secondary` | #XXXXXX | Secondary actions |
| `surface` | #XXXXXX | Card/panel backgrounds |
| `text` | #XXXXXX | Body text |
| `text-muted` | #XXXXXX | Secondary text, placeholders |
| `danger` | #XXXXXX | Errors, destructive actions |
| `success` | #XXXXXX | Confirmations |

### Typography
| Role | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| H1 | System/Brand | 32px | 700 | 1.2 |
| H2 | System/Brand | 24px | 600 | 1.3 |
| Body | System | 16px | 400 | 1.5 |
| Small | System | 14px | 400 | 1.4 |
| Caption | System | 12px | 400 | 1.4 |

### Spacing
Base unit: 4px or 8px. Scale: 4, 8, 12, 16, 24, 32, 48, 64.

### Component Library
- [ ] None (custom)
- [ ] Tailwind CSS
- [ ] shadcn/ui
- [ ] MUI
- [ ] Ant Design
- [ ] Other: ___

---

## Components

### Component: `<ComponentName>`

**Purpose:** One sentence describing what this component does.

**Props API:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `propName` | `string` | Yes | — | Description |

**Variants:**
- `default` — Description
- `compact` — Description

**States:**
- `loading` — Show skeleton or spinner
- `empty` — "No items yet" message with CTA
- `error` — Inline error message, retry option
- `success` — Confirmation indicator (if applicable)

**Visual notes:** Any specific visual requirements (border radius, shadow, animation).

---

## Layout Specification

### Desktop (≥1280px)
```
┌─────────────────────────────────────┐
│ Header / Navigation                 │
├──────────┬──────────────────────────┤
│ Sidebar  │ Main Content Area        │
│ (240px)  │                          │
│          │  [Component A]           │
│          │  [Component B]           │
└──────────┴──────────────────────────┘
```
- Sidebar: fixed or sticky
- Main: scrollable
- Max content width: 1200px

### Tablet (768px–1279px)
- Sidebar collapses to hamburger menu
- Content takes full width
- Grid: 2 columns → 1 column

### Mobile (<768px)
- Single column layout
- Navigation moves to bottom tab bar
- Cards stack vertically
- Touch targets: minimum 44×44px

---

## Interaction States

### Page-level states
| State | Trigger | UI |
|---|---|---|
| Loading | Initial data fetch | Full-page skeleton |
| Error | API failure | Error banner with retry |
| Empty | No data returned | Illustrated empty state with CTA |
| Success | Action completed | Toast notification (3s auto-dismiss) |

### Form behavior
- Validation: on blur (not on keystroke)
- Error messages: below the field in `danger` color
- Submit: disable button during submission, show loading spinner
- Success: redirect or inline confirmation

---

## Accessibility Requirements

- All interactive elements keyboard-accessible (Tab, Enter, Space, Escape)
- ARIA roles: `main`, `nav`, `dialog`, `alert` where appropriate
- `aria-label` on icon-only buttons
- Color contrast: minimum 4.5:1 for text, 3:1 for UI components
- Focus ring: visible on all interactive elements
- Screen reader: page title updates on route change

---

## Open Questions

List any unresolved design decisions:

1. Question 1 (resolved in: brainstorming session YYYY-MM-DD)
2. Question 2 (TBD — needs product decision)
```

**Step 2: Verify**

Run: `ls plugins/ui-workflow/skills/ui-workflow/`
Expected: `ui-contract-template.md` listed

**Step 3: Commit**

```bash
git add plugins/ui-workflow/skills/ui-workflow/ui-contract-template.md
git commit -m "feat(ui-workflow): add ui-contract template"
```

---

### Task 6: Create ui-workflow SKILL.md

**Files:**
- Create: `plugins/ui-workflow/skills/ui-workflow/SKILL.md`

**Step 1: Create the SKILL.md**

```markdown
---
name: ui-workflow
description: Use before implementing a frontend phase (ui-phase) to produce a UI design contract, or after implementing a frontend phase (ui-review) to audit the result against the contract. Works with any frontend tech stack.
---

# UI Workflow Skill

## Prerequisites

- **`ui-phase`**: No additional tools required — produces a markdown design contract.
- **`ui-review`**: Requires the `regression-test` skill and its Playwright MCP prerequisite. See regression-test prerequisites.

## Overview

This skill provides two complementary capabilities for frontend work:

**Core principle:** "Know what you're building before you build it. Verify what you built against what you designed."

`ui-phase` produces a structured design contract before implementation begins. `ui-review` audits the implemented UI against that contract after implementation. Together they close the design-implementation gap that causes frontend rework.

## Sub-Skills

---

## ui-phase

### When to Use

Invoke after `brainstorming` approves a frontend design and before writing the implementation plan. Specifically:

- When a phase involves UI components, pages, or layout work
- When the design needs to be concrete enough for implementation
- When the user says "let's design the UI" or "what should this look like?"
- Before implementing any phase with significant visual surface area

Do NOT invoke for:
- Backend-only phases (API, database, services)
- Configuration or infrastructure phases
- Phases where UI is trivially simple (a single button with no layout)

### Announce Line

> "Starting ui-phase. I'll produce a UI design contract covering design system, components, layouts, interaction states, and accessibility. This will serve as the implementation spec and audit target."

### Checklist

- [ ] **Design system** — colors, typography, spacing, component library
- [ ] **Component inventory** — list all components needed, their props, variants, states
- [ ] **Layout spec** — desktop, tablet, mobile layouts with structure descriptions
- [ ] **Interaction states** — loading, empty, error, success per component and page
- [ ] **Accessibility** — ARIA roles, keyboard nav, contrast requirements
- [ ] **Open questions** — unresolved decisions flagged for the user
- [ ] **Save contract** — written to `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md`
- [ ] **User approval** — contract reviewed and approved before implementation

### Process

1. **Read the design doc** — read the relevant `docs/plans/YYYY-MM-DD-*-design.md` to understand the approved design.

2. **Identify UI surface area** — list all pages, routes, and components the phase will produce.

3. **Establish design system** — ask the user (or infer from existing code):
   - What color palette to use?
   - What typography scale?
   - What component library (if any)?
   If an existing frontend codebase is present, read relevant config files (Tailwind config, theme files, CSS variables) to extract the existing system rather than inventing new values.

4. **Define components** — for each identified component:
   - Name and purpose
   - Props API (what data does it accept?)
   - Variants (size, style, state variants)
   - Interaction states (loading, empty, error, success)
   - Visual notes (specific styling requirements)

5. **Define layouts** — for each page/route:
   - Desktop layout (1280px+) — describe or ASCII-diagram the structure
   - Tablet layout (768–1279px) — how it adapts
   - Mobile layout (<768px) — how it adapts

6. **Define interaction states** — page-level and form-level states, validation behavior, success/error feedback.

7. **Define accessibility requirements** — ARIA roles, keyboard navigation, contrast targets, focus management.

8. **Present each section to the user** — ask "does this look right?" after each major section. Be ready to revise.

9. **Save the contract** using [ui-contract-template.md](ui-contract-template.md) as the structure:
   ```
   docs/plans/YYYY-MM-DD-<phase-name>-ui-contract.md
   ```

10. **Commit:**
    ```bash
    git add docs/plans/YYYY-MM-DD-<phase>-ui-contract.md
    git commit -m "docs(ui): add ui contract for phase N.M — <name>"
    ```

11. **Transition to writing-plans** — the ui-contract is now input to the implementation plan. Invoke `writing-plans` skill.

---

## ui-review

### When to Use

Invoke after implementing a frontend phase to audit the result against the ui-contract. Specifically:

- When a frontend phase is marked complete and needs visual verification
- Before `pre-push-review` for branches containing frontend work
- When the user says "review the UI" or "check if it matches the design"
- As part of `audit-milestone` when the milestone includes frontend phases

Do NOT invoke when:
- No ui-contract exists for the phase (no spec to audit against)
- The phase has no frontend output

### Announce Line

> "Starting ui-review. I'll compare the implemented UI against the design contract using browser screenshots, then evaluate each contract criterion."

### Checklist

- [ ] **Find the ui-contract** — locate the relevant `docs/plans/*-ui-contract.md`
- [ ] **Invoke regression-test** — get screenshots at desktop, tablet, mobile for all pages
- [ ] **Evaluate against contract** — check each contract criterion against screenshots + code
- [ ] **Design system adherence** — colors, typography, spacing match the contract tokens
- [ ] **Component coverage** — all contracted components are implemented
- [ ] **Layout accuracy** — layouts match the contracted structure at each breakpoint
- [ ] **Interaction states** — all states (loading, empty, error, success) are implemented
- [ ] **Accessibility** — ARIA roles, keyboard nav, contrast present as contracted
- [ ] **Produce audit report** — saved to `docs/plans/YYYY-MM-DD-ui-review-<phase>.md`

### Process

1. **Find the ui-contract** — glob for `docs/plans/*-ui-contract.md`, match to the current phase by date or name. If multiple exist, present the list and ask the user which applies.

2. **Read the ui-contract** — extract: components list, layout spec, design system tokens, interaction states, accessibility requirements.

3. **Invoke regression-test** — use the `regression-test` skill to capture screenshots at all three viewports (desktop: 1920×1080, tablet: 768×1024, mobile: 375×812) for all pages in the phase scope. Let regression-test handle authentication and browser automation.

4. **Evaluate against contract** — for each contracted criterion:

   | Criterion | How to Evaluate |
   |---|---|
   | Design system colors | Compare screenshot dominant colors against contract tokens; grep codebase for hardcoded hex values that aren't tokens |
   | Typography | Inspect headings, body, captions in screenshots against font/size/weight spec |
   | Component coverage | Verify each contracted component is present in the relevant pages |
   | Layout (desktop) | Compare screenshot structure against contracted desktop layout |
   | Layout (tablet) | Compare tablet screenshot against contracted tablet layout |
   | Layout (mobile) | Compare mobile screenshot against contracted mobile layout |
   | Loading states | Grep codebase for loading/skeleton implementations; verify visually if possible |
   | Empty states | Grep codebase for empty state implementations |
   | Error states | Grep codebase for error handling in UI layer |
   | ARIA roles | Grep codebase for `aria-` attributes, `role=` — check against contract requirements |
   | Keyboard navigation | Check for `tabIndex`, `onKeyDown`, focus management in interactive components |
   | Color contrast | Flag any text on background color combinations that look low-contrast in screenshots |

5. **Rate each criterion:**
   - ✅ **Pass** — implemented as contracted
   - ⚠️ **Partial** — implemented but deviates from contract
   - ❌ **Missing** — contracted but not implemented

6. **Produce audit report:**

   ```
   docs/plans/YYYY-MM-DD-ui-review-<phase>.md
   ```

   Report structure:
   ```markdown
   # UI Review: Phase N.M — <Name>

   **Date:** YYYY-MM-DD
   **Contract:** `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md`
   **Verdict:** PASS | PARTIAL | FAIL

   ## Screenshots
   (Embedded regression-test screenshots at each viewport)

   ## Contract Adherence
   | Criterion | Status | Notes |
   |---|---|---|
   | Design system colors | ✅ Pass | — |
   | Typography | ⚠️ Partial | H2 uses 20px, contract specifies 24px |
   | Component coverage | ✅ Pass | All 4 contracted components present |
   | Layout — desktop | ✅ Pass | Matches contract structure |
   | Layout — tablet | ❌ Missing | Sidebar not collapsing at 768px |
   | Layout — mobile | ✅ Pass | Single column, stacked correctly |
   | Loading states | ✅ Pass | Skeleton implemented |
   | Empty states | ⚠️ Partial | Missing CTA in empty state |
   | Error states | ✅ Pass | Error banner with retry present |
   | ARIA roles | ❌ Missing | nav and main roles not applied |
   | Keyboard navigation | ✅ Pass | Tab order correct |

   ## Issues (prioritized)
   1. ❌ Tablet sidebar not collapsing — Major
   2. ❌ ARIA roles missing on nav/main — Major
   3. ⚠️ H2 font size 20px vs contracted 24px — Minor
   4. ⚠️ Empty state missing CTA — Minor

   ## Verdict Rationale
   FAIL — 2 missing criteria, both Major severity.
   ```

7. **Verdict logic:**
   - **PASS** — no ❌ Missing criteria
   - **PARTIAL** — only ⚠️ Partial deviations, no ❌ Missing
   - **FAIL** — one or more ❌ Missing criteria

8. **Announce verdict** in conversation with issue count and top issues.

---

## Red Flags

1. **Skipping ui-phase "because it's simple"** — Even simple UIs benefit from a contract. The contract is what makes ui-review possible.

2. **Writing the ui-contract after implementation** — The contract is a design input, not a documentation artifact. It must exist before implementation.

3. **ui-review without screenshots** — Screenshots are the primary evidence. Do not produce a review report without invoking regression-test first.

4. **Grading against intent rather than contract** — ui-review grades against the written contract. If the implementation looks good but deviates from the contract, that is a deviation — update the contract or fix the implementation.

5. **Calling ui-review PASS when criteria are Missing** — Missing is always a failing criterion. Partial deviations may be acceptable. Missing implementations never are.

## Common Rationalizations

| Rationalization | Why It's Wrong | Correct Action |
|---|---|---|
| "The design is clear in my head, no contract needed" | What's clear in the designer's head is not clear to the implementer | Write the contract |
| "Screenshots at one viewport are enough" | Responsive breakpoints are the most common source of layout bugs | Screenshot at all three viewports |
| "The implementation looks good enough" | "Good enough" is not the contract | Grade against the written contract |
| "I'll update the contract to match what was built" | The contract is a design input. If it needs changing, change it before implementation, not after | Fix the implementation or formally revise the contract with user approval |

## Quick Reference

| Sub-skill | Trigger | Output |
|---|---|---|
| `ui-phase` | Before implementing a frontend phase | `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md` |
| `ui-review` | After implementing a frontend phase | `docs/plans/YYYY-MM-DD-ui-review-<phase>.md` + regression-test screenshots |

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | `ui-phase` runs after brainstorming approves a frontend design — it translates the approved design into a concrete visual spec. | Brainstorming establishes what to build; ui-phase establishes how it should look. |
| `superpowers:writing-plans` | The ui-contract is referenced in the implementation plan as the visual specification. Tasks reference contract components by name. | Invoke writing-plans after ui-phase completes. |
| `regression-test` | `ui-review` delegates all browser automation and screenshot capture to the regression-test skill. | regression-test handles authentication, Playwright MCP, and screenshot storage. ui-review handles contract comparison. |
| `pre-push-review` | `ui-review` can be invoked by pre-push-review Phase 5 for branches containing frontend work. | pre-push-review optionally invokes ui-review when a ui-contract is detected for the current branch. |
| `superpowers:verification-before-completion` | A ui-review report with PASS verdict is strong evidence for verification-before-completion on frontend phases. | The ui-review report satisfies the visual evidence requirement. |
| `project-orchestration` | `audit-milestone` invokes ui-review for milestones that include frontend phases. | Integrated as part of definition-of-done verification. |
```

**Step 2: Verify frontmatter**

Run: `head -5 plugins/ui-workflow/skills/ui-workflow/SKILL.md`
Expected: frontmatter with `name: ui-workflow`

**Step 3: Commit**

```bash
git add plugins/ui-workflow/skills/ui-workflow/SKILL.md
git commit -m "feat(ui-workflow): add SKILL.md with ui-phase and ui-review"
```

---

### Task 7: Update marketplace.json

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: Read current marketplace.json**

Read `.claude-plugin/marketplace.json` to get the current structure.

**Step 2: Add two new plugin entries and bump version**

Add the following two entries to the `plugins` array, and bump `"version"` at the top level from `"1.5.0"` to `"1.6.0"`:

```json
{
  "name": "project-orchestration",
  "description": "GSD-inspired project lifecycle management for larger multi-session projects. Brownfield codebase mapping, milestone tracking, phase management (add/insert/remove), session pause/resume, progress overview, milestone audit, and release cycle management.",
  "version": "1.6.0",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "source": "./plugins/project-orchestration",
  "category": "workflow"
},
{
  "name": "ui-workflow",
  "description": "Frontend design contracts and visual auditing. Generates structured UI design contracts before implementing frontend phases (ui-phase) and performs retroactive visual audits against those contracts using regression-test (ui-review).",
  "version": "1.6.0",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "source": "./plugins/ui-workflow",
  "category": "testing"
}
```

**Step 3: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8')); console.log('valid')"`
Expected: `valid`

**Step 4: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(marketplace): add project-orchestration and ui-workflow plugins v1.6.0"
```
