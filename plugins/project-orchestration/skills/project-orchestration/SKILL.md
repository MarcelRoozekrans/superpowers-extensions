---
name: project-orchestration
description: Use for multi-session project lifecycle management. Triggers on kickoff phrases ("plan the roadmap", "new project", "start a project from scratch", "greenfield", "what milestones do we need"); session lifecycle ("resume", "continue", "where are we", "pause", "I'm done for today"); phase/milestone ops ("add a phase", "new milestone", "audit the milestone", "complete the milestone"); session start on a project with a docs/planning/ directory; or an empty/greenfield repo where the user signals multi-milestone work. Covers greenfield kickoff via plan-roadmap (whole-project brainstorm covering 3-7 milestones, NOT one phase or one milestone), brownfield codebase mapping, phase management, session pause/resume via STATE.md, milestone audit/completion, and routing via start-next-phase. Skip for one-off features that fit a single brainstorming → writing-plans → executing-plans cycle without milestones.
---

# Project Orchestration Skill

<HARD-GATE>
When this skill chains to a sub-skill (`brainstorming`, `writing-plans`, `executing-plans`, etc.), you MUST:

1. **Read the actual skill file** — do not act from memory of what the skill name implies. Loose "invocation" routinely drifts into ad-hoc behavior.
2. **Follow the skill end-to-end** — including its own checklists, gates, and required outputs. Brainstorming can be brief, but it must happen.
3. **Verify the required output artifact exists** before continuing the chain:

   | Sub-skill | Required output artifact |
   |---|---|
   | `superpowers:brainstorming` | `docs/superpowers/specs/YYYY-MM-DD-*-design.md` (or equivalent design spec) |
   | `superpowers:writing-plans` | `docs/superpowers/plans/YYYY-MM-DD-*.md` (or equivalent plan file) |
   | `superpowers:executing-plans` | All plan tasks checked off, tests passing |

If the artifact is missing, the previous step did not complete — return to it. Do not proceed with the next link in the chain on faith.

**State file writes (separate gate, applies to every sub-skill below that touches `docs/planning/`):**

When a sub-skill says it creates, appends to, or updates `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md`, or `docs/planning/STATE.md`, you MUST:

1. **Use the `Write` or `Edit` tool** for every change. Narrating the change in conversation ("I've added Milestone 3 to the roadmap") does NOT create or modify the file — only a tool call does. The conversation evaporates between sessions; the file does not.
2. **VERIFY each write by re-reading the file** with the `Read` tool and confirming the expected content is on disk. If the expected content is missing, the write did not happen — retry with the tool.
3. **Then** stage and commit. A `git commit` issued before the verify step will either fail (no diff) or commit the wrong state. Run `git status` after the commit and confirm a clean tree.

If you find yourself thinking "I'll write the file in a moment" or "the description captured it" — STOP. Make the tool call now. Files do not appear by intention.

**Post-compaction discipline (separate gate, fires when the conversation has been auto-compacted):**

A "compaction-style entry" is when the session begins with — or recently received — a summary of prior work. Concrete tells:

- The conversation contains a "Continuation Plan", "Next Steps", or "Resume Plan" section near the top, written by an automated summarizer.
- The earliest assistant message paraphrases prior tool calls and decisions rather than executing the user's first message.
- The user's most recent message reads as a follow-up ("continue", "next step", "fix that") with no fresh context, after a long gap.
- The conversation is significantly shorter than the volume of work it describes — e.g. a single-page summary that references "Phase 2.3 task 4" without the conversation that produced 2.1 / 2.2 / 2.3.

When any of these signals fires AND `docs/planning/` exists in the project, you MUST:

1. **Treat the compaction summary's "Continuation Plan" as advisory, not authoritative.** The summary was written by a summarizer that did not have access to STATE.md, ROADMAP.md, or the current plan file. Its code-level instructions ("fix this method", "add this field") are best-effort recall, not the source of truth.
2. **Run `resume-work` first.** Read `docs/planning/STATE.md`, `ROADMAP.md`, and `MILESTONE.md`. Then run `start-next-phase`, which will route to `complete-phase` if the prior session left a phase ready to close, or to the correct downstream skill (brainstorming / writing-plans / executing-plans) for the actual current state.
3. **Reconcile the compaction summary against the state files.** If the summary's "next step" matches what `start-next-phase` would route to, proceed. If they disagree, trust the state files — they outlive any single conversation.
4. **Only then act on code.** A compaction-induced jump straight to "fix the auth bug" without running steps 1-3 is exactly the failure mode this gate prevents.

If you find yourself thinking "the Continuation Plan tells me to fix X, no need to read STATE.md" — STOP. The summarizer is a different model with no persistent state access; the planning files are the source of truth.
</HARD-GATE>

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

1. **Check for `docs/planning/ROADMAP.md`** — if not found, announce: "No docs/planning/ directory found. This project hasn't been initialized with project-orchestration yet. Start with `plan-roadmap` to brainstorm the whole-project layout (multiple milestones with rough phase outlines). For brownfield codebases, `plan-roadmap` will run `map-codebase` first; for greenfield/empty repos it brainstorms from a blank sheet."

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

1. **Read** `docs/planning/ROADMAP.md` and `docs/planning/MILESTONE.md` (use the `Read` tool) to find the current milestone and its last phase number.
2. Ask the user: "Phase name, goal, surface, and help-wanted? (Surface is one of `UI` | `Backend` | `Refactor` | `Data` | `Infra` | `Docs` | `Mixed`. HelpWanted is `yes` or `no` — defaults to `no`. `yes` flags the phase for external contributors when github-sync is enabled.)"
3. **Use the `Edit` tool** to append the new phase block to `docs/planning/ROADMAP.md` under the current milestone with status `pending` and the user's stated `**Surface:**` and `**HelpWanted:**`. Format per [state-files.md](state-files.md).
4. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm the new phase block is present with the correct number, name, `status: pending`, `Surface:`, and `HelpWanted:` values. If any is missing, the Edit did not apply — retry.
5. **Use the `Edit` tool** to add the new phase to the `## Phases` list in `docs/planning/MILESTONE.md`.
6. **VERIFY:** re-read `docs/planning/MILESTONE.md` and confirm the phase appears in the list.
7. Stage and commit: `git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md && git commit -m "chore(roadmap): add phase N.M — <name>"`. Run `git status` and confirm a clean tree.
8. Announce the new phase number, name, surface, and help-wanted only after the commit succeeds.

---

## insert-phase

### When to Use

When urgent work needs to be inserted between two existing phases.

### Process

1. **Read** `docs/planning/ROADMAP.md` (use the `Read` tool), present the current phase list to the user.
2. Ask: "Insert after which phase?", "New phase name and goal?", "Surface? (`UI` | `Backend` | `Refactor` | `Data` | `Infra` | `Docs` | `Mixed`)", and "HelpWanted? (`yes` or `no` — defaults to `no`. `yes` flags the phase for external contributors when github-sync is enabled.)"
3. **Use the `Edit` tool** to insert the new phase block into `docs/planning/ROADMAP.md` (with the user's stated `**Surface:**` and `**HelpWanted:**` lines) and renumber every subsequent phase (N.M+1 → N.M+2, etc.). Both inserts and renumbers are tool calls — narrating "I've shifted the numbers" does not change the file.
4. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm: (a) the new phase block is present with correct number/name/status/Surface/HelpWanted, (b) every later phase is renumbered consecutively with no gaps or duplicates.
5. **Use the `Edit` tool** to update the `## Phases` list in `docs/planning/MILESTONE.md` to reflect the inserted phase and renumbered siblings.
6. **VERIFY:** re-read `docs/planning/MILESTONE.md` and confirm the list matches ROADMAP.md.
7. Stage and commit: `git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md && git commit -m "chore(roadmap): insert phase N.M — <name>"`. Run `git status` and confirm a clean tree.
8. Announce: "Inserted Phase N.M — {name} between N.M-1 and old N.M (now N.M+1)." only after the commit succeeds.

---

## remove-phase

### When to Use

When a future (pending) phase should be removed from the roadmap.

### Constraints

- Only future (pending) phases may be removed. Active or complete phases cannot be removed.
- Always confirm with the user before removing.

### Process

1. **Read** `docs/planning/ROADMAP.md` (use the `Read` tool), present pending phases to the user.
2. Ask: "Which phase to remove?"
3. Confirm: "Remove Phase N.M — {name}? This cannot be undone."
4. **Use the `Edit` tool** to remove the phase block from `docs/planning/ROADMAP.md` and renumber all subsequent phases (N.M+1 → N.M, etc.).
5. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm: (a) the removed phase block is absent, (b) every later phase is renumbered consecutively with no gaps or duplicates.
6. **Use the `Edit` tool** to remove the phase from the `## Phases` list in `docs/planning/MILESTONE.md`.
7. **VERIFY:** re-read `docs/planning/MILESTONE.md`.
8. Stage and commit: `git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md && git commit -m "chore(roadmap): remove phase N.M — <name>"`. Run `git status` and confirm a clean tree.

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
4. **Use the `Write` tool** to create or overwrite `docs/planning/STATE.md` with the handoff note (see [state-files.md](state-files.md) for format). Do not narrate the content — write the file.
5. **VERIFY:** re-read `docs/planning/STATE.md` and confirm the handoff note is present with all required sections (Current Position, Open Decisions, Blockers, Recommended Next Step). If any section is missing, the write did not capture it — re-write.
6. Stage and commit: `git add docs/planning/STATE.md && git commit -m "chore(state): pause-work — phase N.M, last task: <description>"`. Run `git status` and confirm a clean tree.
7. **Squad sync (if installed)** — if a `.squad/` directory exists in the project, run `squad-sync` after the STATE.md commit. Squad's per-agent `history.md` files capture session learning that complements STATE.md (which captures position). Without this step, agent histories drift behind project state. If `squad` is not installed, skip silently — this step is best-effort.
8. **Decision-tracker sync (if installed)** — if `decision-tracker` is active and any decisions were captured during this session, ensure they have been persisted to long-term memory before exiting. Pause is the natural fence for memory writes; deferring them risks losing the decision when the conversation ends. If `decision-tracker` is not active, skip silently.
9. Announce only after the commit succeeds:

   > "Session state saved to `docs/planning/STATE.md`. Next session, start with `resume-work` or say 'resume' and I'll restore context."

---

## resume-work

### When to Use

At the start of a session on a project with existing `docs/planning/` state. Triggers on:

- Direct user phrases: "resume", "where were we?", "continue from last time".
- **Post-compaction signals** (per the Post-compaction discipline gate): a "Continuation Plan" / "Next Steps" / "Resume Plan" section appears in the conversation; the earliest assistant message paraphrases prior work; the user's first message reads as a continuation ("continue", "next step", "fix that") with no fresh context. When any of these fires AND `docs/planning/` exists, run `resume-work` BEFORE acting on any code-level instruction in the compaction summary.

The post-compaction trigger exists because conversation summarizers do not have access to `STATE.md`, `ROADMAP.md`, or the current plan file. Their "Continuation Plan" sections are best-effort recall and routinely diverge from the actual project state on disk. `resume-work` reads the source of truth and reconciles.

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
5. On confirmation, invoke `start-next-phase` to determine and execute the next action.

> **CRITICAL:** Do NOT ask the user "what would you like to do?" after presenting the resume summary. The `start-next-phase` sub-skill determines the correct next action automatically. The user said "resume" — that means "continue working", not "present me a menu".

---

## complete-phase

### When to Use

When a phase's plan is finished — all tasks in `docs/plans/YYYY-MM-DD-<phase>.md` are checked off (`- [x]`), tests pass, and `executing-plans` returned a clean state. Promotes the phase from `active` to `complete` in the planning files.

This sub-skill closes the loop that was missing: without it, `executing-plans` finishes a phase but ROADMAP.md still shows the phase as `active`, so the next session sees stale state and `start-next-phase` routes back to the same already-finished phase.

`start-next-phase` invokes `complete-phase` automatically when it detects an `active` phase whose plan is fully checked off (see `start-next-phase` step 1 below). Manual invocation is also supported when the user says "mark phase N.M complete" or "wrap up this phase".

**Pre-condition:** the phase's plan file exists, all task checkboxes in it are `- [x]`, and the phase is currently `[status: active]` in ROADMAP.md. If the phase is already `[status: complete]`, this sub-skill is a no-op.

### Announce Line

> "Marking Phase N.M — {name} complete."

### Process

1. **Read** `docs/planning/ROADMAP.md` and confirm the target phase is `[status: active]`. If it's already `[status: complete]`, exit silently — this is a no-op. If it's `[status: pending]`, refuse: "Phase N.M is pending, not active. Run `start-next-phase` to begin work first." and exit.

2. **Read** the plan file referenced by the phase's `Plan:` line. Confirm all task checkboxes are `- [x]`. If any `- [ ]` remain, refuse: "Phase N.M has unchecked tasks — execution is not complete. Resume `executing-plans` first." and exit.

3. **Use the `Edit` tool** on `docs/planning/ROADMAP.md` to make TWO precise edits to the phase's block. The exact transitions are:

   **Before:**

   ```markdown
   ### Phase 1.2: <Name> [status: active]
   **Goal:** <one sentence>
   **Plan:** `docs/plans/<plan-file>.md`
   ```

   **After:**

   ```markdown
   ### Phase 1.2: <Name> [status: complete]
   **Goal:** <one sentence>
   **Plan:** `docs/plans/<plan-file>.md`
   **Completed:** YYYY-MM-DD
   ```

   Two changes: (a) `[status: active]` → `[status: complete]` in the heading, (b) add `**Completed:** YYYY-MM-DD` line below `**Plan:**` with today's actual date.

4. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm both edits landed — the heading shows `[status: complete]`, the `**Completed:** ...` line is present, and no other phase was accidentally modified.

5. **Use the `Edit` tool** on `docs/planning/MILESTONE.md` to update the `## Phases` list. The exact transition is:

   **Before:**

   ```markdown
   2. Phase 1.2 — <name> [active]
   ```

   **After:**

   ```markdown
   2. Phase 1.2 — <name> [complete]
   ```

6. **VERIFY:** re-read `docs/planning/MILESTONE.md` and confirm the phase entry now reads `[complete]`.

7. Stage and commit:

   ```bash
   git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md
   git commit -m "chore(roadmap): complete phase N.M — <name>"
   ```

   Run `git status` and confirm a clean tree.

8. Announce only after the commit succeeds:

   > "Phase N.M — {name} marked complete in ROADMAP.md and MILESTONE.md. Committed."

### Why this exists separately from complete-milestone

`complete-milestone` is end-of-milestone: marks the WHOLE milestone complete, tags a release, and only runs after `audit-milestone` passes. It is a one-time event per milestone.

`complete-phase` is per-iteration: marks ONE phase complete inside an active milestone, runs after every phase wraps up. A milestone with 8 phases will see `complete-phase` run 8 times, then `audit-milestone` once, then `complete-milestone` once.

Without `complete-phase`, working through a multi-phase milestone leaves ROADMAP.md frozen with every phase showing `[status: active]` until the very end — exactly the bug this sub-skill fixes.

---

## start-next-phase

### When to Use

After `resume-work` confirmation, or any time the user says "continue", "next", "let's go", or otherwise signals "move the project forward". Acts as the **routing hub** between project state and the correct downstream skill — replaces the agent's ad-hoc judgment about which skill to enter next.

### Announce Line

> "Determining the next action from project state."

### Process

1. Read `docs/planning/ROADMAP.md` and `docs/planning/MILESTONE.md`. **Before identifying the next phase**, check whether any phase in the current milestone is `[status: active]` AND its plan file has all tasks checked off (`- [x]`). If yes, **run `complete-phase` first** to promote it from `active` to `complete`. This closes the loop after the previous session — without it, every continuation routes back to the already-finished phase.

2. After any pending `complete-phase` runs, identify the **next non-complete phase** (first phase with status `active`, falling back to first `pending` phase).

3. Check artifacts for that phase:
   - **Surface** — read the phase block's `**Surface:**` line in ROADMAP.md. Drives the pre-plan hook in step 5. Missing or `Mixed` falls through to default routing.
   - **Design spec** — does `docs/superpowers/specs/*-<phase>-*.md` (or the phase's referenced design doc) exist?
   - **Plan file** — does the phase's `Plan:` link in ROADMAP.md (`docs/superpowers/plans/*-<phase>-*.md` or similar) exist on disk?
   - **Surface artifacts** (only checked when Surface implies them):
     - For `Surface: UI` — does `docs/design/MASTER.md` exist? Does a UI contract `docs/plans/*-<phase>-*-ui-contract.md` exist?
     - For `Surface: Refactor` — does an impact analysis `docs/plans/*-<phase>-*-impact-analysis.md` exist?

4. **Base routing** — route based on design spec / plan file presence. **Read** the target skill file and follow it end-to-end — do not loosely "invoke" it.

   | Phase status | Design spec | Plan file | Action |
   |---|---|---|---|
   | `active` | — | exists | **Read** `list-phase-assumptions` (this skill) → on user confirmation, **read** the `superpowers:executing-plans` skill and follow it end-to-end |
   | `active` | exists | missing | Run **Surface pre-plan hook** (step 5) → **read** the `superpowers:writing-plans` skill and follow it end-to-end. **VERIFY:** plan file exists. Then run `list-phase-assumptions` → `superpowers:executing-plans` |
   | `pending` | exists | missing | Run **Surface pre-plan hook** (step 5) → **read** the `superpowers:writing-plans` skill and follow it end-to-end. **VERIFY:** plan file exists. Then run `list-phase-assumptions` → `superpowers:executing-plans` |
   | `pending` | missing | missing | **Read** the `superpowers:brainstorming` skill and follow it end-to-end. The brainstorm fills in [templates/phase-design.template.md](templates/phase-design.template.md) and saves it at `docs/superpowers/specs/YYYY-MM-DD-<phase>-design.md`. **VERIFY:** design spec exists AND its `**Surface:**` line matches the phase's Surface in ROADMAP.md. If Surface is missing or mismatched, the brainstorm did not complete — re-run it. Then run **Surface pre-plan hook** (step 5) → chain to `superpowers:writing-plans` (verify plan file) → `list-phase-assumptions` → `superpowers:executing-plans` |

5. **Surface pre-plan hook** — fires once a design spec exists for the phase and BEFORE chaining to `superpowers:writing-plans`. Reads the phase's `**Surface:**` value from ROADMAP.md and applies:

   | Surface | Pre-plan chain | Required artifact after the hook runs |
   |---|---|---|
   | `UI` | (a) If `decision-tracker` is active for this project, run a recall for `tags=[ui, design]` so prior UI conventions surface before a new contract is written. (b) If `docs/design/MASTER.md` is missing, **read** the `ui-design-system` skill end-to-end and follow it. **VERIFY:** `docs/design/MASTER.md` exists. (c) **Read** the `ui-workflow` skill (sub-skill `ui-phase`) end-to-end and follow it. **VERIFY:** the phase's UI contract exists. | `docs/plans/*-<phase>-*-ui-contract.md` |
   | `Refactor` | (a) If `decision-tracker` is active, run a recall for `tags=[architecture, naming]` and any project-specific tags so prior structural decisions inform the impact analysis. (b) **Read** the `refactor-analysis` skill end-to-end and follow it (Phases 1–7) until it produces the impact analysis document. **VERIFY:** the impact analysis file exists. | `docs/plans/*-<phase>-*-impact-analysis.md` |
   | `Backend` / `Data` / `Infra` / `Docs` / `Mixed` / unset | No pre-plan hook. Proceed directly to `superpowers:writing-plans`. | (none) |

   The hook produces inputs that `writing-plans` consumes — UI contracts give the plan concrete component / layout / state targets; impact analyses give the plan a safe execution order grounded in transitive dependencies. Skipping the hook for an applicable surface means `writing-plans` runs blind to those inputs and produces a less informed plan. **`Mixed` deliberately skips the hook** — the author signals that two surfaces are in play and they will sequence them manually; force-firing both `ui-phase` and `refactor-analysis` for `Mixed` produces noisy artifacts.

   Decision recall is best-effort — if `decision-tracker` / `longterm-memory` MCP is not available, skip the recall step silently and proceed to the surface specialist. Recall failures are not chain failures.

6. **When `executing-plans` returns** (the leaf of every routing path): if all tasks in the plan file are now `- [x]`, run the **Surface post-implementation hook** below FIRST, then **run `complete-phase`** to promote the phase from `active` → `complete` in ROADMAP.md and MILESTONE.md. Skipping `complete-phase` is the most common reason ROADMAP.md gets stale during multi-phase milestones.

7. **Surface post-implementation hook** — fires after `executing-plans` returns clean and BEFORE `complete-phase`. Mirrors the pre-plan hook on the audit side:

   | Surface | Post-implementation chain |
   |---|---|
   | `UI` | **Read** the `ui-workflow` skill (sub-skill `ui-review`) end-to-end and follow it to audit the implementation against the UI contract produced in step 5. `ui-review` requires the Playwright MCP (via `regression-test`); if Playwright MCP is unavailable, log a note in the phase's audit history and proceed without the review (do not block `complete-phase`). |
   | `Refactor` / `Backend` / `Data` / `Infra` / `Docs` / `Mixed` / unset | No post-implementation hook. Proceed directly to `complete-phase`. |

   The post-impl hook closes the design-implementation loop for UI phases — `ui-phase` writes the contract before implementation; `ui-review` audits the result against the same contract. Without it, the contract becomes write-only and the audit value is lost.

8. After each step, **VERIFY the required artifact exists** (see HARD-GATE table at the top of this skill) before chaining to the next link. If a required artifact is missing, return to the prior step — do not proceed.

9. Do not stop and ask "what next?" between links. The chain is mechanical. Only stop for:
   - `list-phase-assumptions` user confirmation (this is an explicit gate, not a menu)
   - Failures (missing artifact, failing tests, blockers surfaced by a sub-skill)
   - The user interrupting

### Decision Flow

```text
resume-work / "continue" / "next"
        │
        ▼
  ┌──────────────────────┐
  │ Active phase with    │  Yes   ┌─────────────────┐
  │ all tasks checked?   ├───────►│ complete-phase  │
  │ (cleanup last run)   │        │ (active → done) │
  └────────┬─────────────┘        └────────┬────────┘
           │ No                            │
           ◄───────────────────────────────┘
           │
           ▼
  ┌──────────────────┐
  │ Find next phase   │
  │ (first non-       │
  │  complete phase)  │
  └────────┬──────────┘
           │
     ┌─────▼──────┐    No     ┌──────────────────┐
     │ Design spec├──────────►│ brainstorming    │──┐
     │ exists?    │           │ (verify spec)    │  │
     └─────┬──────┘           └──────────────────┘  │
           │ Yes                       (chains to)  │
     ┌─────▼──────┐    No     ┌──────────────────────────────┐  │
     │ Plan file  ├──────────►│ Surface pre-plan hook        │  │
     │ exists?    │           │ ┌──────────────────────────┐ │  │
     └─────┬──────┘           │ │ Surface == UI?           │ │  │
           │ Yes              │ │  → ui-design-system      │ │  │
           │                  │ │    (if no MASTER.md)     │ │  │
           │                  │ │  → ui-workflow ui-phase  │ │  │
           │                  │ │    (verify ui-contract)  │ │  │
           │                  │ │ Surface == Refactor?     │ │  │
           │                  │ │  → refactor-analysis     │ │  │
           │                  │ │    (verify impact-       │ │  │
           │                  │ │     analysis)            │ │  │
           │                  │ │ Else: skip hook          │ │  │
           │                  │ └────────┬─────────────────┘ │  │
           │                  │          ▼                   │  │
           │                  │ ┌──────────────────────────┐ │  │
           │                  │ │ writing-plans            │◄┼──┘
           │                  │ │ (verify plan)            │ │
           │                  │ └────────┬─────────────────┘ │
           │                  └──────────┼───────────────────┘
           │                             │
     ┌─────▼──────────────┐              │
     │ list-phase-         │◄────────────┘
     │ assumptions         │
     └─────┬──────────────┘
           │ User confirms
           ▼
  ┌────────────────────┐
  │ executing-plans    │
  └────────┬───────────┘
           │
     ┌─────▼──────────────────┐  Yes   ┌─────────────────────────────┐
     │ All tasks now checked? ├───────►│ Surface post-impl hook      │
     │ (close the loop)       │        │ ┌─────────────────────────┐ │
     └─────┬──────────────────┘        │ │ Surface == UI?          │ │
           │ No (mid-phase pause)      │ │  → ui-workflow ui-review│ │
           ▼                           │ │    (degrade if no       │ │
       (return — phase stays           │ │     Playwright MCP)     │ │
        active for the next            │ │ Else: skip hook         │ │
        continuation)                  │ └────────┬────────────────┘ │
                                       │          ▼                  │
                                       │ ┌─────────────────────────┐ │
                                       │ │ complete-phase          │ │
                                       │ │ (active → done)         │ │
                                       │ └─────────────────────────┘ │
                                       └─────────────────────────────┘
```

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
   - **Pre-push reviews on file** — `audit-milestone` does NOT re-run code-quality review (security, YAGNI, dead code, naming) — that is `pre-push-review`'s remit, run per phase before push. Check that at least one `docs/pre-push-review-*.md` report exists with a PASS verdict, dated within the milestone's lifespan. Record one of three outcomes: (a) PASS report on file → record verdict in audit; (b) FAIL or stale (older than the milestone's earliest phase commit) → record gap, recommend re-running `pre-push-review` on each feature branch; (c) no reports found → record gap as "code quality not independently reviewed in this milestone" with same recommendation. This is a **warning, not a hard fail** — milestones can pre-date the pre-push-review skill or have used a different review process. Surface the gap so the user decides.
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
2. **Use the `Edit` tool** on `docs/planning/ROADMAP.md`: set milestone status to `complete` and add `**Completed:** YYYY-MM-DD` line.
3. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm the milestone block now shows `[status: complete]` and a Completed date.
4. **Use the `Edit` tool** on `docs/planning/MILESTONE.md`: set `**Status:** complete` and add `**Completed:** YYYY-MM-DD`.
5. **VERIFY:** re-read `docs/planning/MILESTONE.md` and confirm the status and completion date.
6. Stage and commit: `git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md && git commit -m "chore(milestone): complete milestone N — <name>"`. Run `git status` and confirm a clean tree.
7. Tag the release: `git tag -a vN.0 -m "Milestone N: <name> complete"`. Verify with `git tag -l vN.0`.
8. Announce only after tag verification: "Milestone N complete. Tagged as vN.0. Ready to start Milestone N+1 with `new-milestone`."

---

## init-github-sync

### When to Use

One-time setup. Triggered manually by `/sync-to-github` or by an explicit invocation when the user signals: "set up GitHub sync", "publish the roadmap to GitHub", "make the backlog visible to external devs". Refuses to run if sync is already initialized (any `**Issue:**` or `**Milestone:**` field present in ROADMAP.md) — incremental updates are `sync-github`'s job.

### Pre-conditions

- `gh auth status` succeeds. If not → refuse with: "Sync requires the GitHub CLI authenticated. Run `gh auth login`, then re-invoke `/sync-to-github`."
- `git remote get-url origin` returns a `github.com` URL. If not → refuse with: "Project does not appear to be hosted on GitHub. Sync is GitHub-specific; skip for non-GitHub remotes."
- `docs/planning/ROADMAP.md` exists with at least one milestone.

### Announce Line

> "Initializing GitHub sync. I'll create native Milestones and Issues for every roadmap entry, then write the GitHub numbers back into ROADMAP.md so future syncs are idempotent."

### Process

1. **Verify pre-conditions** (above). Refuse loudly if any fails.
2. **Create labels** if missing — `surface:ui`, `surface:backend`, `surface:refactor`, `surface:data`, `surface:infra`, `surface:docs`, `surface:mixed`, `status:pending`, `status:active`, `status:complete`, `help wanted`. Use `gh label create --force <name>` for each.
3. **For each milestone in ROADMAP.md (top-down order):**
   a. `gh api -X POST repos/{owner}/{repo}/milestones -f title="Milestone N: <Name>" -f description="<goal + DoD>"` — capture the returned `number`.
   b. `Edit` ROADMAP.md to add `**Milestone:** N` immediately after the milestone's `**Started:**` line.
   c. VERIFY by re-reading ROADMAP.md.
4. **For each phase under each milestone (in order):**
   a. Build the issue body: phase goal + Surface tag + permalink to design spec at the current commit SHA (`https://github.com/{owner}/{repo}/blob/<sha>/docs/plans/<spec>.md` if a spec exists; otherwise note "no design spec yet").
   b. Build the label list: `surface:<value>`, `status:<value>`, plus `help wanted` if `**HelpWanted:** yes`.
   c. `gh issue create --title "Phase N.M: <Name>" --body "<body>" --milestone <milestone-number> --label "<labels>"` — capture the returned issue number.
   d. `Edit` ROADMAP.md to add `**Issue:** #N` after the phase's `**Surface:**`/`**HelpWanted:**` lines.
   e. VERIFY by re-reading ROADMAP.md.
5. **Final VERIFY** — re-read ROADMAP.md end-to-end, confirm every milestone has `**Milestone:** N` and every phase has `**Issue:** #N`. If any is missing, the corresponding `gh` call did not return cleanly — re-attempt that one before commit.
6. **Stage and commit:** `git add docs/planning/ROADMAP.md && git commit -m "chore(sync): init github sync — N issues, M milestones"`. Run `git status` and confirm a clean tree.
7. **Announce** only after the commit succeeds:

   > "GitHub sync initialized. N issues created across M milestones. Future `pause-work` and `complete-phase` runs will reconcile state automatically."

### Dry-run

Pass `--dry-run` (or trigger phrase "dry run", "preview the sync") to:

- Print every `gh` call that would be made, with arguments
- Skip all writes to ROADMAP.md
- Skip the commit

Use this on first run to verify the labels, milestones, and issues look right before any real GitHub state is created.

### Error handling

| Condition | Response |
|---|---|
| Already initialized (Issue/Milestone fields present) | Refuse: "Sync already initialized. Use `sync-github` for incremental updates." |
| `gh auth status` fails | Refuse with `gh auth login` instruction |
| No GitHub remote | Refuse with explanation |
| Rate limit hit mid-loop | Stop with partial state. Report which milestones/issues were created. Re-running picks up where it left off (any phase already mapped is skipped because of the "already initialized" check — so the user fixes by running `sync-github` instead, which is incremental-aware). |
| `gh` API error on a single call | Stop the loop. Report the failing call. Do NOT continue with other phases — partial state is confusing. |

---

## plan-roadmap

### When to Use

At the start of a multi-milestone project, or when the existing `docs/planning/ROADMAP.md` needs reshaping at the milestone level (not just phase additions). Triggers on phrases like: "plan the roadmap", "what milestones do we need", "high-level project plan", "design the roadmap", or first-time use of project-orchestration on a project that has no `docs/planning/ROADMAP.md` yet.

This is the **roadmap-level brainstorming entry point** — it brainstorms the project as a whole (3-7 milestones with rough scope), not a single milestone.

### Announce Line

> "Planning the project roadmap. I'll brainstorm milestone-level scope before writing any state files."

### Process

1. **Optional: invoke `map-codebase` first** if the project is brownfield and the codebase has not been analyzed yet. Codebase context grounds milestone proposals. **Skip on greenfield** — empty repo means brainstorm from a blank sheet, no codebase to map.

2. **Read** the `superpowers:brainstorming` skill file and follow it end-to-end at **roadmap scope** — the *generic layout of the entire project across multiple milestones and phases*, NOT a single milestone and NOT a single phase. The brainstorm answers "what is the shape of this project from start to finish?", and must produce a filled-in copy of [templates/roadmap-design.template.md](templates/roadmap-design.template.md), saved at `docs/superpowers/specs/YYYY-MM-DD-roadmap-design.md`. The template's required sections are:
   - Project goal (one paragraph)
   - Target users / stakeholders
   - Top-level success criteria for the project as a whole
   - A proposed sequence of 3-7 milestones, each with a one-line goal and a rough phase outline (3-8 phase titles per milestone, no per-phase implementation detail)
   - For each phase title: a `Surface` tag — exactly one of `UI` | `Backend` | `Refactor` | `Data` | `Infra` | `Docs` | `Mixed`. This drives `start-next-phase`'s pre-plan routing (UI phases chain through `ui-design-system` + `ui-workflow ui-phase`; refactor phases chain through `refactor-analysis`; others skip the pre-plan hook). At roadmap scope a one-word tag is enough — no surface detail required yet.
   - Dependencies and ordering rationale between milestones

   Use the template structure verbatim (headings, ordering, Surface tag formatting). The VERIFY step in step 3 grep-checks the filled-in copy against the template's required sections — drifting from the template makes the spec unreadable to downstream skills.

   **Scope guard — keep the abstraction level high:** if the brainstorm starts converging on the implementation details of a single milestone or phase (specific files to create, API endpoints, schemas, library choices), STOP and zoom out. That detail is `new-milestone`'s job (per-milestone scope) and `start-next-phase` → `superpowers:brainstorming` (per-phase scope), each fired separately when their turn comes. The roadmap brainstorm intentionally stays lossy at the milestone level so it covers the whole project in one pass without rat-holing on milestone 1.

   **Greenfield vs brownfield:** the brainstorm is the same shape either way. Brownfield grounds milestone proposals in existing code (via `map-codebase`); greenfield grounds them in the user's stated product vision. Neither case skips the whole-project sweep — both produce the same 3-7 milestone roadmap.

3. **VERIFY:** the brainstorming design spec exists at `docs/superpowers/specs/YYYY-MM-DD-roadmap-design.md` AND covers all 3-7 milestones (not just the first one). If the spec only details milestone 1 with the rest as TBD, the brainstorm did NOT complete at roadmap scope — return to step 2 and finish the sweep. Do NOT skip to writing files because "I have the milestones in my head" or "we can detail the later milestones when we get to them" — the whole point is the global view.

4. **Use the `Write` tool** to create `docs/planning/ROADMAP.md` from the design spec — first milestone with `status: active`, all others with `status: pending`. Format per [state-files.md](state-files.md).

5. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm: (a) every brainstormed milestone is present, (b) exactly one is `active`, (c) milestone numbering is consecutive starting at 1.

6. **Use the `Write` tool** to create `docs/planning/MILESTONE.md` for milestone 1 only (subsequent milestones get their own MILESTONE.md when activated via `new-milestone`). Include goal, definition of done, and the proposed phase outline from the design.

7. **VERIFY:** re-read `docs/planning/MILESTONE.md` and confirm goal, DoD, and phase list are present.

8. Stage and commit: `git add docs/planning/ROADMAP.md docs/planning/MILESTONE.md && git commit -m "chore(roadmap): plan project roadmap (M1-M<N>)"`. Run `git status` and confirm a clean tree.

9. Announce only after the commit succeeds: "Roadmap drafted with N milestones. Milestone 1 is active. Use `add-phase` to define phase 1.1, or invoke `brainstorming` to refine milestone 1's scope further."

### Skip Brainstorming?

No. This sub-skill exists specifically to force a brainstorm at the **roadmap level**, covering the whole project across multiple milestones. If the user pushes back ("just write the file, I know what I want"), capture their stated milestones in a brief brainstorm anyway — the brainstorming skill itself is short by default. The output spec is what `audit-milestone` and downstream skills will reference; skipping it leaves no shared source of truth.

### Narrow Scope to One Milestone?

Also no. If the user says "I only care about the first milestone right now, let's just plan that" — that is `new-milestone` territory, not `plan-roadmap`. Run `plan-roadmap` once for the whole-project sweep (even if later milestones are sketchy), then run `new-milestone` for the first milestone's detail. The two operate at different levels of abstraction by design; collapsing them loses the global view that prevents milestone-2-onwards drift.

---

## new-milestone

### When to Use

After `complete-milestone`, or when the user wants to start a new version cycle on top of an existing roadmap.

**Pre-condition:** the previous milestone (N) must have status `complete` in `docs/planning/ROADMAP.md`. If it does not, refuse and recommend `audit-milestone` → `complete-milestone` first.

### Announce Line

> "Starting milestone N+1. I'll brainstorm the milestone scope before writing any state files."

### Process

1. **Read** `docs/planning/ROADMAP.md` and confirm the previous milestone has status `complete`. If not, STOP. Announce: "Milestone N is not complete. Run `audit-milestone` then `complete-milestone` before starting milestone N+1." and exit this sub-skill.

2. **Read** the `superpowers:brainstorming` skill file and follow it end-to-end at **milestone scope**. The brainstorm produces a filled-in copy of [templates/milestone-design.template.md](templates/milestone-design.template.md), saved at `docs/superpowers/specs/YYYY-MM-DD-milestone-N-design.md`. The template's required sections are:
   - Milestone goal (one paragraph)
   - Definition of done (concrete, verifiable criteria — not aspirational)
   - Proposed phase outline (rough — 3-8 phases, one-line goals)
   - For each phase: a `Surface` tag — exactly one of `UI` | `Backend` | `Refactor` | `Data` | `Infra` | `Docs` | `Mixed`. If `plan-roadmap` already assigned a Surface for this phase, reuse it unless the milestone-scope brainstorm reveals it was wrong. The Surface drives `start-next-phase`'s pre-plan routing — get it right at milestone scope so the routing is deterministic when each phase activates.
   - Dependencies on prior milestones and any external constraints
   - Risk areas worth flagging up front

   Use the template structure verbatim. The design from `plan-roadmap` (if it exists) covers this milestone at low fidelity — use it as input, but do NOT skip the brainstorm because "the roadmap already says what this milestone is". Roadmap-level scope is intentionally lossy; per-milestone brainstorming is where the detail lives.

3. **VERIFY:** the brainstorming design spec exists at `docs/superpowers/specs/YYYY-MM-DD-milestone-N-design.md` (or equivalent). If missing, the brainstorm did not complete — return to step 2.

4. Determine milestone number (current + 1).

5. **Use the `Write` tool** to create or overwrite `docs/planning/MILESTONE.md` with the new milestone definition from the design spec. Format per [state-files.md](state-files.md).

6. **VERIFY:** re-read `docs/planning/MILESTONE.md` and confirm: (a) milestone number is N+1, (b) goal paragraph is present, (c) DoD list has at least 2 criteria, (d) Phases section is present (may be a stub if phases haven't been added yet).

7. **Use the `Edit` tool** to add the new milestone block to `docs/planning/ROADMAP.md` with status `active` and `**Started:** YYYY-MM-DD`. Use today's actual date.

8. **VERIFY:** re-read `docs/planning/ROADMAP.md` and confirm the new milestone block is present with the correct number, name, status, and started date.

9. Stage and commit: `git add docs/planning/MILESTONE.md docs/planning/ROADMAP.md && git commit -m "chore(milestone): start milestone N+1 — <name>"`. Run `git status` and confirm a clean tree.

10. Announce only after the commit succeeds: "Milestone N+1 — {name} started. Use `add-phase` to add the first phase, or `start-next-phase` to chain into brainstorming/writing-plans/executing-plans for phase 1."

---

## Red Flags

1. **Removing an active or complete phase** — Only pending phases may be removed. Active phases must be completed or paused first.

2. **Completing a milestone without auditing** — Always run `audit-milestone` before `complete-milestone`. Never mark complete without evidence.

3. **Creating STATE.md manually** — Always use `pause-work` to write STATE.md. Manual edits may miss required fields.

4. **Skipping `list-phase-assumptions`** — Assumptions wrong at the start cause rework. Surface them before executing.

5. **Running `new-milestone` before `complete-milestone`** — Milestones must be formally closed before opening new ones. Overlapping milestones create ambiguous state.

6. **Skipping `start-next-phase` after `resume-work`** — `resume-work` does not decide what comes next; it restores context. The routing decision (brainstorming / writing-plans / executing-plans) belongs to `start-next-phase`. Skipping it leads to the agent presenting a menu or jumping straight to coding without a plan.

7. **Narrating state changes instead of writing files** — Saying "I've added Milestone 3" without a `Write` or `Edit` tool call leaves `docs/planning/` untouched. Every state-mutating sub-skill MUST end with the file changed on disk and verified by re-reading. The conversation does not persist; the file does.

8. **Skipping the brainstorm in `new-milestone` / `plan-roadmap`** — Asking two questions ("goal?", "DoD?") and writing the file is not a brainstorm. The design spec at `docs/superpowers/specs/` is what `audit-milestone` and downstream skills reference. Skipping it leaves the milestone with no shared source of truth.

9. **Skipping `complete-phase` after `executing-plans` returns** — The plan file's checkboxes go to `- [x]` but ROADMAP.md still shows `[status: active]`. The next continuation routes back to the same phase forever. `start-next-phase` is supposed to invoke `complete-phase` automatically when this state is detected; if the agent skips it, the multi-phase milestone never makes visible progress in the planning files.

10. **Treating a compaction summary's "Continuation Plan" as authoritative** — Auto-generated conversation summaries describe past work and propose next steps based on conversation alone, with no access to `docs/planning/`. Acting on those next steps directly bypasses every workflow gate in this suite. Always run `resume-work` first when a compaction signal fires (see Post-compaction discipline in HARD-GATE).

11. **Letting `plan-roadmap`'s brainstorm narrow to a single milestone or phase** — The roadmap brainstorm covers the *entire project* (3-7 milestones, rough phase outline each). If it converges on the implementation details of milestone 1 ("what files do we need", "which API"), the level of abstraction has been lost — that is `new-milestone`'s scope, not `plan-roadmap`'s. Zoom back out. The roadmap brainstorm is a one-time global sweep; missing it means later milestones get planned in isolation with no shared context.

## Common Rationalizations

| Rationalization | Why It's Wrong | Correct Action |
|---|---|---|
| "I know where we are, no need to resume" | Memory doesn't persist across sessions; STATE.md does | Always read STATE.md at session start on an active project |
| "Skip the audit, I know all tests pass" | DoD has multiple criteria, not just tests | Run audit-milestone mechanically |
| "The phase is basically done, mark it complete" | "Basically done" is not done | Complete all tasks, then mark complete |
| "I'll add phases later, start executing now" | Unplanned phases cause scope creep | Define roadmap before executing |
| "I'll just start coding, the plan is obvious" | No plan file means no execution. Period. | Run `start-next-phase` — it will route to brainstorming/writing-plans first |
| "The user said continue, let me ask what they want" | "Continue" means continue the workflow, not present a menu | Run `start-next-phase` to auto-determine the next action |
| "This is just a quick fix / continuation" | The sub-skill chain applies to EVERY phase, including small ones. Brainstorming can be short, but it must happen. | Run `start-next-phase` — it enforces the chain mechanically |
| "I described the milestone, the file is implicitly created" | Files are NOT created by description. Only `Write`/`Edit` tool calls create or modify files. | Use the `Write` tool, then re-read the file with `Read` to verify, then commit |
| "I'll write the file in a moment, let me announce first" | Announcements before writes leave the user thinking the state changed when it didn't | Write → verify → commit → announce. In that order. No exceptions. |
| "The conversation captured the new milestone, no need to write the file" | The conversation evaporates between sessions. STATE.md / ROADMAP.md / MILESTONE.md are the persistent record. | Always Write to disk before claiming the milestone exists |
| "Just write the milestone file, I know what I want" (user push-back during new-milestone) | Skipping the brainstorm leaves the design spec absent — `audit-milestone` later has nothing to reference | Run a short brainstorm anyway. The brainstorming skill scales to small scope. |
| "I'll mark the phase complete next session" / "the phase is done in spirit, no need to update ROADMAP yet" | Without `complete-phase`, ROADMAP.md keeps showing the phase as `[status: active]` and `start-next-phase` will route back to it indefinitely | Run `complete-phase` immediately after `executing-plans` returns clean. The state file is the source of truth, not the conversation. |
| "complete-phase is the same as complete-milestone, skip one" | They are different scopes — `complete-phase` runs N times per milestone (one per phase); `complete-milestone` runs once after `audit-milestone` passes | Use both. `complete-phase` per iteration; `complete-milestone` at the end. |
| "The Continuation Plan in the conversation summary tells me to fix X — I'll just do it" | The summarizer is a different model with no access to `STATE.md` / `ROADMAP.md` / the plan file. Its instructions are best-effort recall, not source of truth | Run `resume-work` first. Reconcile against state files. Trust the files over the summary when they disagree. |
| "The summary already paraphrases the plan, so reading STATE.md is redundant" | The summary captures CONVERSATION; STATE.md captures PROJECT STATE. They drift the moment the summarizer paraphrases imprecisely | Read STATE.md. The check costs one tool call; the cost of compounding drift across compactions is much higher |
| "I know the first milestone in detail, let me capture that now" (during plan-roadmap brainstorm) | The roadmap brainstorm is a whole-project sweep at low fidelity. Detailing milestone 1 here means milestones 2-N never get the shared-context treatment | Keep the brainstorm at roadmap scope. List 3-7 milestones with one-line goals and a rough phase outline each; do NOT detail any single one. Per-milestone detail is `new-milestone`'s job, fired separately when each milestone activates. |
| "There's no codebase yet, so we can't brainstorm a roadmap" | Greenfield projects brainstorm from product vision, not from code. `map-codebase` is optional and skipped on greenfield; the roadmap brainstorm itself works from a blank sheet | Run `plan-roadmap` directly. The brainstorm grounds milestone proposals in the user's stated goals and users, not in existing files. |
| "We'll figure out the later milestones when we get there" | That's how projects end up with milestone 1 carefully designed and milestones 2-N improvised in isolation. The roadmap is the shared context that prevents this | Finish the whole-project sweep in `plan-roadmap`. Later milestones are intentionally lossy (one-line goals, rough phase outlines) — they get refined by `new-milestone` when activated, but the global shape is set up front. |

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
| `resume-work` | "resume" / session start — chains to `start-next-phase` | None (read-only) |
| `start-next-phase` | After `resume-work`, or on "continue" / "next" | None (read-only — routes to brainstorming/writing-plans/executing-plans) |
| `complete-phase` | After `executing-plans` finishes a phase, or "mark phase N.M complete" | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md` (single phase: active → complete) |
| `audit-milestone` | "verify milestone is done" | `docs/plans/YYYY-MM-DD-milestone-N-audit.md` |
| `complete-milestone` | After audit PASS | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md`, git tag |
| `plan-roadmap` | "plan the roadmap" / first project setup, no ROADMAP.md yet | `docs/superpowers/specs/YYYY-MM-DD-roadmap-design.md`, `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md` |
| `new-milestone` | After `complete-milestone` — chains through `superpowers:brainstorming` | `docs/superpowers/specs/YYYY-MM-DD-milestone-N-design.md`, `docs/planning/MILESTONE.md`, `docs/planning/ROADMAP.md` |

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | Three entry points: (1) `plan-roadmap` invokes brainstorming at **roadmap scope** (3-7 milestones) at project start. (2) `new-milestone` invokes brainstorming at **milestone scope** before writing MILESTONE.md. (3) `start-next-phase` invokes brainstorming at **phase scope** when a phase has no design spec. `map-codebase` runs before brainstorming on existing projects. | Provides codebase context that makes brainstorming questions more grounded. The skill is reused at three levels of abstraction; the brainstorming process is the same, only the scope changes. |
| `superpowers:writing-plans` | `start-next-phase` routes to writing-plans when a design spec exists but no plan file does. `add-phase` / `insert-phase` maintain the ROADMAP.md that writing-plans references for context. `list-phase-assumptions` reviews the plan before executing-plans begins. | Phase management and plan writing are complementary — ROADMAP.md is the source of truth for what gets planned. |
| `superpowers:executing-plans` | `start-next-phase` routes to executing-plans (via `list-phase-assumptions`) when a plan file exists for an active phase. `pause-work` can interrupt executing-plans cleanly. | list-phase-assumptions is a pre-execution gate; pause-work is a clean exit. |
| `superpowers:subagent-driven-development` | `list-phase-assumptions` applies equally before subagent dispatch. `pause-work` captures state when stopping mid-subagent execution. | Both sub-skills work regardless of whether execution uses executing-plans or subagent-driven-development. |
| `superpowers:finishing-a-development-branch` | `audit-milestone` + `complete-milestone` extend the finishing workflow to full milestone release management. | finishing-a-development-branch handles branch integration; complete-milestone handles milestone closure and release tagging. |
| `regression-test` | `audit-milestone` optionally invokes regression-test as part of definition-of-done verification for projects with a web UI. | Regression-test provides the visual and functional evidence for milestone audit. |
| `decision-tracker` | Independent but complementary. Three integration points: (1) `resume-work` triggers decision-tracker recall at session start. (2) `Surface: UI` pre-plan hook runs a recall for `tags=[ui, design]` so prior UI conventions inform the contract. (3) `Surface: Refactor` pre-plan hook runs a recall for `tags=[architecture, naming]` so prior structural decisions inform the impact analysis. All three are best-effort — recall failures (MCP unavailable, no matching tags) are not chain failures. | decision-tracker handles cross-cutting decisions; project-orchestration handles project state and lifecycle. |
| `pre-push-review` | `audit-milestone` checks tests and regression, but does NOT cover code quality review (security, YAGNI, dead code, naming). Run `pre-push-review` on each feature branch before `audit-milestone` for complete coverage. | No direct invocation — they operate at different scopes (branch vs milestone). |
| `ui-design-system` | `start-next-phase`'s **Surface pre-plan hook** invokes `ui-design-system` for `Surface: UI` phases when `docs/design/MASTER.md` is missing. Runs once per project (the design system is global), then `ui-phase` consumes it for every subsequent UI phase. | Surface-driven dispatch — the phase declares `**Surface:** UI` in ROADMAP.md and the hook handles the rest. No manual invocation needed. |
| `ui-workflow` (`ui-phase` and `ui-review`) | Two hook points for `Surface: UI` phases. **Pre-plan:** `start-next-phase` runs `ui-phase` after `ui-design-system` (if needed) to produce `docs/plans/*-<phase>-*-ui-contract.md` BEFORE chaining to `superpowers:writing-plans`. **Post-implementation:** when `executing-plans` returns clean, `start-next-phase` runs `ui-review` to audit the implementation against that same contract before `complete-phase` runs. Without the post-impl hook, the contract becomes write-only and the audit value is lost. | The contract is the bridge between design spec and implementation plan for UI work — and the audit target after implementation. `ui-review` requires the Playwright MCP (via `regression-test`); the chain degrades gracefully (logs and skips) when MCP is unavailable. |
| `refactor-analysis` | For `Surface: Refactor` phases, the **Surface pre-plan hook** runs `refactor-analysis` (Phases 1–7) to produce `docs/plans/*-<phase>-*-impact-analysis.md` BEFORE chaining to `superpowers:writing-plans`. The analysis feeds writing-plans the safe execution order, transitive dependency map, and risk register. | Surface-driven dispatch — phases that involve restructuring existing code declare `**Surface:** Refactor` and get impact analysis automatically rather than relying on the agent to remember. |
