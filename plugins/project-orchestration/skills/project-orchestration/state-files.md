# docs/planning/ State Files Reference

This document defines the format for the `docs/planning/` directory files used by
the `project-orchestration` skill to persist project lifecycle state across sessions.

## Directory

`docs/planning/` in the project root. Add to `.gitignore` or commit — user's choice.
Recommended: commit so state survives machine changes.

## ROADMAP.md

Tracks all milestones, their phases, and completion status.

```markdown
# Project Roadmap

## Milestone 1: <Name> [status: active|complete|pending]
**Goal:** One sentence
**Started:** YYYY-MM-DD (when status: active or complete)
**Completed:** YYYY-MM-DD (when status: complete)
**Definition of Done:**
- [ ] Criterion 1
- [ ] Criterion 2

### Phase 1.1: <Name> [status: complete|active|pending]
**Goal:** One sentence
**Surface:** UI | Backend | Refactor | Data | Infra | Docs | Mixed
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`
**Completed:** YYYY-MM-DD (when status: complete)

### Phase 1.2: <Name> [status: pending]
...

## Milestone 2: <Name> [status: pending]
...
```

### Canonical syntax — exact bracket and heading rules

These details are easy to drift on; agents must follow them precisely so
state files stay machine-readable across sessions.

- **Heading levels** — milestones use `##`, phases use `###`. Never the other way around.
- **Status bracket** — exactly `[status: active]`, `[status: complete]`, or `[status: pending]`. Lowercase status, single space after the colon, square brackets. Do **not** use parentheses, do **not** drop the `status:` prefix, do **not** capitalize.
- **Status values are exhaustive** — only `active`, `complete`, `pending`. Never `wip`, `done`, `tbd`, `blocked`, or other free-form values. If a phase is blocked, leave its status as `active` and capture the blocker in `STATE.md` instead.
- **Completed date** — always `**Completed:** YYYY-MM-DD` on its own line, ISO 8601 dashes, no time component. Add this line only when status transitions to `complete`. Never add it pre-emptively.
- **Surface field** — `**Surface:**` on its own line below `**Goal:**`. Drives `start-next-phase`'s pre-plan routing (UI phases chain through `ui-design-system` + `ui-workflow ui-phase`; refactor phases chain through `refactor-analysis`; others go directly to `writing-plans`). Allowed values, exhaustive: `UI`, `Backend`, `Refactor`, `Data`, `Infra`, `Docs`, `Mixed`. Capitalized exactly as shown, no quotes, single space after the colon. If a phase blends two surfaces equally (e.g. a feature touching both API and UI), use `Mixed` and document the breakdown in the design spec; `start-next-phase` falls back to the default routing for `Mixed` so authors can drive the order manually. Phases authored before this convention existed may omit the field — `start-next-phase` treats missing `Surface` the same as `Mixed`.

### Edit transitions

Agent-driven mutations to ROADMAP.md follow these exact patterns. Use `Edit` tool with the before/after blocks below as templates.

**Phase: pending → active** (start of phase, via `start-next-phase`):

```markdown
Before: ### Phase 1.2: Auth [status: pending]
After:  ### Phase 1.2: Auth [status: active]
```

(no other changes; `**Started:**` is tracked at milestone level, not per-phase)

**Phase: active → complete** (end of phase, via `complete-phase`):

```markdown
Before: ### Phase 1.2: Auth [status: active]
        **Goal:** Add JWT auth with refresh tokens
        **Plan:** `docs/plans/2026-04-12-auth.md`

After:  ### Phase 1.2: Auth [status: complete]
        **Goal:** Add JWT auth with refresh tokens
        **Plan:** `docs/plans/2026-04-12-auth.md`
        **Completed:** 2026-05-04
```

(two changes: status bracket and new `**Completed:**` line below `**Plan:**`)

**Milestone: active → complete** (end of milestone, via `complete-milestone`):

```markdown
Before: ## Milestone 1: Foundation [status: active]
        **Goal:** Lay the foundation
        **Started:** 2026-04-01

After:  ## Milestone 1: Foundation [status: complete]
        **Goal:** Lay the foundation
        **Started:** 2026-04-01
        **Completed:** 2026-05-04
```

**Inserting a new pending phase** (via `add-phase` / `insert-phase`):

```markdown
### Phase 1.3: <New Name> [status: pending]
**Goal:** <one sentence>
**Surface:** <UI | Backend | Refactor | Data | Infra | Docs | Mixed>
**Plan:** _to be written_
```

(`Plan:` placeholder is replaced when `writing-plans` actually runs. `Surface:` is required at insertion time so `start-next-phase` can route correctly when the phase later activates.)

## STATE.md

Session handoff document. Written by `pause-work`, read by `resume-work`.

```markdown
# Session State — <Date>

**Date:** YYYY-MM-DD

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

**Status:** active|complete
**Started:** YYYY-MM-DD
**Target:** YYYY-MM-DD (optional)
**Completed:** YYYY-MM-DD (when status: complete)

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
