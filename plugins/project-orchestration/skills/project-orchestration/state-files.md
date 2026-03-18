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
