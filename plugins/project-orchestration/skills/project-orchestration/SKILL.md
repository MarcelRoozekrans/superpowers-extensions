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

This skill contains multiple sub-skills, each invoked by a specific trigger phrase or context. They share the `docs/planning/` state directory (see [state-files.md](state-files.md) for file formats).

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

Invoke when the user asks "where are we?", "what's next?", "show me progress", or at the start of a session on a project with `docs/planning/` state files.

### Announce Line

> "Reading project state to show current progress."

### Process

1. **Check for `docs/planning/ROADMAP.md`** — if not found, announce: "No docs/planning/ directory found. This project hasn't been initialized with project-orchestration yet. Start with `map-codebase` or create a milestone with `new-milestone`."

2. **Read `docs/planning/ROADMAP.md`** — parse milestones and phases, identify which are complete, active, and pending.

3. **Read `docs/planning/STATE.md`** — get last session handoff (current phase, last task, next step). If `STATE.md` does not exist (fresh project with no prior pause), skip steps 3 and omit "Last completed" and "Next step" from the output.

4. **Read `docs/planning/MILESTONE.md`** — get current milestone goal and definition of done.

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

1. Read `docs/planning/ROADMAP.md` and `docs/planning/MILESTONE.md` to find the current milestone and its last phase number.
2. Ask the user: "Phase name and goal?"
3. Append the new phase to `docs/planning/ROADMAP.md` under the current milestone with status `pending`.
4. Update `docs/planning/MILESTONE.md` phases list.
5. Announce the new phase number and name.
6. Commit: `git commit -m "chore(roadmap): add phase N.M — <name>"`

---

## insert-phase

### When to Use

When urgent work needs to be inserted between two existing phases.

### Process

1. Read `docs/planning/ROADMAP.md`, present current phase list.
2. Ask: "Insert after which phase?" and "New phase name and goal?"
3. Insert the new phase, renumber all subsequent phases.
4. Update `docs/planning/MILESTONE.md`.
5. Announce: "Inserted Phase N.M — {name} between N.M-1 and old N.M (now N.M+1)."
6. Commit: `git commit -m "chore(roadmap): insert phase N.M — <name>"`

---

## remove-phase

### When to Use

When a future (pending) phase should be removed from the roadmap.

### Constraints

- Only future (pending) phases may be removed. Active or complete phases cannot be removed.
- Always confirm with the user before removing.

### Process

1. Read `docs/planning/ROADMAP.md`, present pending phases.
2. Ask: "Which phase to remove?"
3. Confirm: "Remove Phase N.M — {name}? This cannot be undone."
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

1. Read the audit report (from `docs/plans/YYYY-MM-DD-milestone-N-audit.md`).
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
4. Write `docs/planning/STATE.md` with the handoff note (see [state-files.md](state-files.md) for format).
5. Announce:

   > "Session state saved to `docs/planning/STATE.md`. Next session, start with `resume-work` or say 'resume' and I'll restore context."

6. Commit: `git commit -m "chore(state): pause-work — phase N.M, last task: <description>"`

---

## resume-work

### When to Use

At the start of a session on a project with existing `docs/planning/` state. Triggers on: "resume", "where were we?", "continue from last time".

### Process

1. Read `docs/planning/STATE.md`.
2. Read `docs/planning/ROADMAP.md` and `docs/planning/MILESTONE.md` for full context.
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

4. If `decision-tracker` is active for this project, trigger decision recall now to restore cross-cutting decisions alongside session state.
5. On confirmation, invoke the appropriate next skill (executing-plans, brainstorming, etc.).

---

## audit-milestone

### When to Use

When the user believes a milestone is complete and wants to verify it against its definition of done.

### Announce Line

> "Auditing milestone N — {name}. I'll verify each definition-of-done criterion against git history, test results, and documentation."

### Process

1. Read `docs/planning/MILESTONE.md` to get the definition of done.
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

> "Completing milestone N — {name}. I'll archive the milestone doc, tag the release, and update the roadmap."

### Process

1. Confirm with user: "Mark Milestone N — {name} as complete and tag release?"
2. Update `docs/planning/ROADMAP.md`: set milestone status to `complete`, record completion date.
3. Update `docs/planning/MILESTONE.md`: set status to `complete`.
4. Commit the state file changes: `git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md && git commit -m "chore(milestone): complete milestone N — <name>"`
5. Tag the release: `git tag -a vN.0 -m "Milestone N: <name> complete"`
6. Announce: "Milestone N complete. Tagged as vN.0. Ready to start Milestone N+1 with `new-milestone`."

---

## new-milestone

### When to Use

After `complete-milestone`, or when the user wants to start a new version cycle.

### Process

1. Ask: "What is the goal of the next milestone?" (one sentence)
2. Ask: "What are the criteria for 'done'?" (list, one per line)
3. Determine milestone number (current + 1).
4. Create/overwrite `docs/planning/MILESTONE.md` with the new milestone definition.
5. Add the new milestone to `docs/planning/ROADMAP.md` with status `active`.
6. Announce: "Milestone N+1 — {name} started. Use `add-phase` to add the first phase, or `brainstorming` to design it."
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
| `add-phase` | "add a phase" | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md` |
| `insert-phase` | "insert urgent work" | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md` |
| `remove-phase` | "remove phase N.M" | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md` |
| `list-phase-assumptions` | Before executing a phase | None (read-only) |
| `plan-milestone-gaps` | After failed audit | `docs/planning/ROADMAP.md` (via add-phase) |
| `pause-work` | "done for today" / stopping | `docs/planning/STATE.md` |
| `resume-work` | "resume" / session start | None (read-only) |
| `audit-milestone` | "verify milestone is done" | `docs/plans/YYYY-MM-DD-milestone-N-audit.md` |
| `complete-milestone` | After audit PASS | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md`, git tag |
| `new-milestone` | After complete-milestone | `docs/planning/MILESTONE.md`, `docs/planning/ROADMAP.md` |

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
| `pre-push-review` | `audit-milestone` checks tests and regression, but does NOT cover code quality review (security, YAGNI, dead code, naming). Run `pre-push-review` on each feature branch before `audit-milestone` for complete coverage. | No direct invocation — they operate at different scopes (branch vs milestone). |
