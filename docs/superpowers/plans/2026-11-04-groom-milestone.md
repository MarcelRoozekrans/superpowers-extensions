# groom-milestone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `groom-milestone` sub-skill to project-orchestration. It grooms every pending phase of the active milestone (approved design, Surface artifacts, plan with `## Checks`, guard checks) without executing anything. Then make `start-next-phase`, `complete-phase` and `ready-check` handle groomed phases on both the attended and the unattended path.

**Architecture:** This is all skill prose. project-orchestration's `SKILL.md` gets a new `## groom-milestone` section and edits to the HARD-GATE, `start-next-phase`, `complete-phase` and `new-milestone`. `state-files.md` and two templates gain the "groomed" definition, the `**Status:**` and `**Builds on:**` lines, and the `**Build:**`/`**Test:**` conventions. The unattended plugin's `ready-check` gains milestone scope, `guard` checks, `phase-N-M` ids and the `Builds on` base. A RED/GREEN eval proves the skill changes behaviour.

**Tech Stack:** Markdown skills, markdownlint-cli2, the `scripts/check-*.mjs` guards (Node ≥ 20, builtins only), subagents for the eval.

**Spec:** `docs/superpowers/specs/2026-11-04-groom-milestone-design.md`

## Global Constraints

- No new phase status value. Only `active`, `complete` and `pending` exist. A groomed phase is `[status: pending]` + `**Status:** approved` design + an existing `**Plan:**` file.
- Spec status line form: `**Status:** draft`, then `**Status:** approved YYYY-MM-DD`.
- Design dependency line: `**Builds on:** Phase N.M —` followed by the interfaces used.
- Guard check bullet: ``- guard N.M: `cmd` ``, where N.M is the *later* phase that relies on it.
- Every plan project-orchestration drives gets `## Checks` with at least ``- build: `cmd` `` and ``- tests: `cmd` ``.
- Conventions lines live under `## Stack`: ``**Build:** `cmd` `` and ``**Test:** `cmd` ``. The template keeps exactly five `##` sections.
- Queue ids for phases: `phase-N-M`. Branch: `unattended/phase-N-M`.
- A plan is "fully ticked" only with at least one checkbox and no `- [ ]`.
- Upstream superpowers files are never edited. The pinned upstream is `v7.0.0` (`.github/upstream-superpowers.json`).
- Every commit site in project-orchestration passes `type` / `scope` / `subject` to the Commit & Release Protocol. Never a literal message: `npm run check:conventions` fails on one.
- Commit scopes for this branch: `project-orchestration`, `unattended`. No `Co-Authored-By` trailer, Claude signature or session URL in commits or PR bodies. No nested parentheses in commit bodies.
- Published prose (SKILL text, README, PR body) goes through anti-slop.

## Review Focus

1. **A milestone where some phases already have plans.** groom-milestone must skip them and still add missing guard checks for their `Builds on` lines. Eval criterion 6 (Task 5) uses a fixture whose Phase 1.1 already has a plan.
2. **A specced but unapproved phase design** (no `**Status:**` line, or `draft`). groom-milestone must get approval or re-brainstorm it, never plan over it silently. Task 3 Step 1 wording; eval criterion 2.
3. **Continuing after a run with PRs still open.** `start-next-phase` must not offer to rebuild a phase with an open `unattended/phase-N-M` PR, or a phase whose `Builds on` predecessor is waiting. Task 2 Step 2 grep, and eval criterion 7.
4. **A plan with no checkboxes.** It must never be closed as fully ticked. Task 2 Step 1 grep on the "at least one checkbox" wording in both places.
5. **ready-check on a two-milestone roadmap.** It must collect only the active milestone unless told otherwise. Task 4 Step 1 wording; eval criterion 8.

## Checks

- build: `npm run lint:md && npm run check:conventions && npm run check:upstream && npm run check:registries`
- tests: `npm test`

---

### Task 1: State files and templates

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/templates/phase-design.template.md` (header block, lines 5-8)
- Modify: `plugins/project-orchestration/skills/project-orchestration/templates/conventions.template.md` (`## Stack`)
- Modify: `plugins/project-orchestration/skills/project-orchestration/state-files.md` (Canonical syntax list, Edit transitions)
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` (`init-conventions`, around lines 205-278)

**Interfaces:**

- Produces: the `**Status:**`, `**Builds on:**`, `**Build:**` and `**Test:**` line formats from Global Constraints. These are documented in `state-files.md` under a new bullet "**Groomed phase**", and Tasks 2-4 use them.

- [ ] **Step 1: Phase design template.** Add `**Status:** draft` after `**Stage:**`. Add a blockquote saying whoever records the operator's approval sets `**Status:** approved YYYY-MM-DD`, and that `ready-check` requires it. Add an optional `**Builds on:**` line with a blockquote. The blockquote says: list the interfaces an earlier, not-yet-complete phase of this milestone creates, using the names that phase's plan fixes.
- [ ] **Step 2: Conventions template.** Under `## Stack`, add ``**Build:** `<command | none>` `` and ``**Test:** `<command | none>` ``. Add a blockquote saying plans copy these into `## Checks`.
- [ ] **Step 3: `init-conventions`.** Add a row to its detection table for Build/Test: detect from package.json scripts, a `.sln`/`.csproj`, a Makefile, or `pyproject.toml`. Otherwise ask, or record `none (defaulted)`.
- [ ] **Step 4: `state-files.md`.**
  - Add the "**Groomed phase**" bullet, with its definition and the `**Builds on:**` format, to Canonical syntax.
  - Add a "Phase: pending → complete (after an unattended run's PR merges, via `start-next-phase` step 1)" block to Edit transitions, with the same two changes as active → complete.
  - Document the STATE.md line `Grooming: milestone N, next phase N.M`.
- [ ] **Step 5: Verify.**
  Run: `npm run lint:md && npm run check:conventions && grep -c 'Status:\*\* draft' plugins/project-orchestration/skills/project-orchestration/templates/phase-design.template.md && grep -c '^## ' plugins/project-orchestration/skills/project-orchestration/templates/conventions.template.md`
  Expected: lint and guard pass, then `1`, then `5`.
- [ ] **Step 6: Commit** with `feat(project-orchestration): record design status, builds-on and check commands`.

### Task 2: Routing for groomed phases

**Model:** opus. This task edits the routing table, the decision flow and the gates that every continuation runs through.

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`: HARD-GATE (lines 23-25), `complete-phase` (499-580), `start-next-phase` (582-720), `new-milestone` step 10 (around 1047)

**Interfaces:**

- Consumes: the Task 1 formats.
- Produces: the `start-next-phase` row `pending | exists | exists`, and the open-PR rule that finds a phase's PR with `gh pr list --head unattended/phase-N-M --state open`.

- [ ] **Step 1: `complete-phase`.**
  - Accept `[status: pending]` as well as `active`, and drop the "pending, not active" refusal.
  - In step 2, require at least one checkbox. Refusal text: "Phase N.M's plan has no checkboxes — nothing shows it was executed."
  - Step 3 shows both before-states.
- [ ] **Step 2: `start-next-phase`.**
  - Step 1 closes `active` or `pending` phases whose plan is fully ticked, which needs at least one checkbox.
  - Add a step before routing with the three open-PR outcomes and the no-`gh` fallback, worded from the spec's "Routing changes" section. Include the waiting rule: "Phase 1.2 waits on Phase 1.1."
  - Add the routing row `pending | exists | exists`: set `[status: active]` → `list-phase-assumptions` → execution.
  - On the `pending | missing | missing` row, set `**Status:** approved YYYY-MM-DD` on approval.
  - Update the Decision Flow diagram with the PR-open/waiting branch and the new row.
- [ ] **Step 3: HARD-GATE.** Add `groom-milestone` to the drivers in the brainstorming paragraph. Add a writing-plans rule: every plan ends with `## Checks` from CONVENTIONS.md `**Build:**`/`**Test:**`. When either is `none` or missing, ask for the command before writing the plan.
- [ ] **Step 4: `new-milestone` step 10.** Extend the announce line so it offers `groom-milestone`, so the operator can answer everything up front for an unattended run.
- [ ] **Step 5: Verify.**
  Run: `npm run lint:md && npm run check:conventions && grep -n 'unattended/phase-N-M' plugins/project-orchestration/skills/project-orchestration/SKILL.md && grep -c 'at least one checkbox' plugins/project-orchestration/skills/project-orchestration/SKILL.md`
  Expected: lint and guard pass, then at least one line, then a count of at least `2`.
- [ ] **Step 6: Commit** with `feat(project-orchestration): route and close groomed phases`.

### Task 3: The `groom-milestone` sub-skill

**Model:** opus. This is the core skill text. It drives three upstream skills and must override their hand-offs precisely.

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`: frontmatter `description`; a new `## groom-milestone` section after `start-next-phase`; Red Flags; Common Rationalizations; Quick Reference; Relationship to Superpowers Skills

**Interfaces:**

- Consumes: the Task 1 formats; the Task 2 HARD-GATE driver list and the `## Checks` rule.
- Produces: the trigger phrases "groom the milestone", "groom milestone N", "prep this milestone for an unattended run", and "answer everything up front". The STATE.md line `Grooming: milestone N, next phase N.M`.

- [ ] **Step 1: Write the section** with When to Use, Announce Line ("Grooming milestone N — design and plan every pending phase, no execution."), Process and Never.
  - Process steps 1-6 follow the spec's "Process" list exactly, including the 4.1-4.6 sub-steps, the repair exception in step 3, and the handoff in step 5. Steps 4.2 and 4.5 carry the spec's "Later phases" rules, including the guard on an `active` phase.
  - The writing-plans method to supply up front (step 4.4) is exactly: "Execution method: none now. This plan is built later, by an unattended run or by `start-next-phase`. Review only; do not execute."
  - The per-phase commit uses `type=docs, scope=plan, subject=groom phase N.M — <name>`.
- [ ] **Step 2: Fit it into the rest of the file.**
  - Description triggers: add "groom the milestone".
  - Red Flags: add "Executing a plan during grooming", and "Grooming a phase outside the active milestone".
  - Rationalizations: add "I'll add the guard check when I plan the later phase" and "the plan is reviewed, let me just run it".
  - Add a Quick Reference row: State Files Written = specs, plans, `docs/planning/ROADMAP.md`.
  - Add `groom-milestone` to the brainstorming and writing-plans rows of the Relationship table, and add an `unattended` row.
- [ ] **Step 3: Run the prose through anti-slop**, then verify.
  Run: `npm run lint:md && npm run check:conventions && grep -c '^## groom-milestone' plugins/project-orchestration/skills/project-orchestration/SKILL.md`
  Expected: pass, then `1`.
- [ ] **Step 4: Commit** with `feat(project-orchestration): groom a whole milestone before an unattended run`.

### Task 4: `ready-check`, upstream anchor and README

**Files:**

- Modify: `plugins/unattended/skills/ready-check/SKILL.md` (Collect the items, checks 1 and 3, Queue)
- Modify: `scripts/check-upstream.mjs` (`ANCHORS`)
- Modify: `README.md` (project-orchestration section, Unattended section)

**Interfaces:**

- Consumes: `phase-N-M` ids, `guard` checks, `**Builds on:**` and `**Status:** approved` from Tasks 1-3.

- [ ] **Step 1: `ready-check`.**
  - Collection takes the active milestone's non-complete phases by default. The operator can name another milestone or "all".
  - Check 1 accepts `**Status:** approved`.
  - Check 3 lists `guard` with the presence-only checks.
  - A phase's queue id is `phase-N-M`.
  - The `base` recommendation follows `**Builds on:**`, taking the latest phase it names, and falls back to the previous item only when there is none.
- [ ] **Step 2: Upstream anchor.** Add `{ file: 'skills/writing-plans/SKILL.md', text: '**When an execution method has already been supplied:**', users: 'project-orchestration groom-milestone supplies the method so writing-plans stops at plan review' }`. First check the exact string in the pinned `v7.0.0`. If it differs, use the upstream wording and adjust the Task 3 text to match.
- [ ] **Step 3: README.**
  - In the project-orchestration section, add `groom-milestone` with a one-line flow: groom → `ready-check` → run → merge → `start-next-phase` closes the phases.
  - In the Unattended section, note the milestone default.
  - Run anti-slop.
- [ ] **Step 4: Verify.**
  Run: `npm run lint:md && npm run check:upstream && npm run check:registries && npm test`
  Expected: all pass.
- [ ] **Step 5: Commit** with `feat(unattended): queue the groomed milestone by default`.

### Task 5: RED/GREEN evaluation

**Files:**

- Create: `docs/superpowers/evals/groom-milestone-fixture/make-fixture.mjs`
- Create: `docs/superpowers/evals/2026-11-04-groom-milestone-brief.md`
- Create: `docs/superpowers/evals/2026-11-04-groom-milestone-baseline.md`
- Create: `docs/superpowers/evals/2026-11-04-groom-milestone-green.md`

- [ ] **Step 1: Write `make-fixture.mjs <dir>`.** It creates a git repo with a tiny Node package (`npm test` runs `node --test`) and CONVENTIONS.md without Build/Test. ROADMAP.md has Milestone 1 active and Milestone 2 pending:
  - Phase 1.1 has an approved design and a plan that lacks `## Checks`.
  - Phase 1.2 has no design, and it builds on a function 1.1's plan names.
  - Phase 1.3 has a design with no status line.
  - Milestone 2 has one pending phase.
- [ ] **Step 2: Write the brief.** It names the operator's answers in advance as an answer sheet: approve every design, Build `node --check src/index.mjs`, Test `npm test`. The criteria are:
  1. No source file under `src/` changes.
  2. 1.2 and 1.3 have `**Status:** approved` designs.
  3. 1.2 and 1.3 have plans with `## Checks`.
  4. 1.2's design has a `**Builds on:** Phase 1.1` line.
  5. CONVENTIONS.md has Build and Test.
  6. 1.1's plan gained a `guard 1.2` check.
  7. Every Milestone 1 phase stays `[status: pending]`.
  8. Milestone 2 is untouched.
  9. The run ends by pointing at `ready-check`.
- [ ] **Step 3: Run RED.** A fresh subagent gets the brief, the fixture and project-orchestration `SKILL.md` from `origin/master`. Record the run in `-baseline.md`.
  Expected: at least one criterion fails.
- [ ] **Step 4: Run GREEN** with this branch's skill files. Record the run in `-green.md`.
  Expected: all nine pass. Fix the skill text for any failure and rerun.
- [ ] **Step 5: Commit** with `test(project-orchestration): add the groom-milestone RED and GREEN evaluation`.
