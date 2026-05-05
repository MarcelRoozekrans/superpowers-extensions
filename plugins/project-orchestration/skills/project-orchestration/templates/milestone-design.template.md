# Milestone N Design — `<Milestone Name>`

> Template consumed by `new-milestone`. The brainstorm fills in every section; `new-milestone`'s VERIFY step grep-checks the headings, DoD criteria count, and per-phase Surface tags before writing `docs/planning/MILESTONE.md` and adding the milestone block to ROADMAP.md. Save the filled-in copy at `docs/superpowers/specs/YYYY-MM-DD-milestone-N-design.md`.

**Date:** YYYY-MM-DD
**Milestone:** `<N>`
**Stage:** milestone (one milestone, multiple phases)

## Goal

One paragraph. What this milestone delivers, not the whole project. Anchor in user-visible outcomes when possible.

## Definition of Done

Concrete, verifiable criteria — not aspirational. `audit-milestone` will check each one mechanically.

- [ ] All planned phases complete
- [ ] All tests passing
- [ ] Domain criterion 1, e.g. "API contract published"
- [ ] Domain criterion 2, e.g. "Migration applied to staging"
- [ ] Release tagged in git

## Phases

3-8 phases. Each gets a name, one-line goal, and a `Surface` tag. The Surface tag drives `start-next-phase`'s pre-plan routing — get it right here so routing is deterministic when each phase activates. Reuse the Surface from `plan-roadmap`'s roadmap design unless the milestone-scope brainstorm reveals it was wrong.

1. **Phase `<N>`.1: `<Name>`** — `Surface: <UI | Backend | Refactor | Data | Infra | Docs | Mixed>`
   - **Goal:** One sentence.
2. **Phase `<N>`.2: `<Name>`** — `Surface: <…>`
   - **Goal:** One sentence.
3. **Phase `<N>`.3: `<Name>`** — `Surface: <…>`
   - **Goal:** One sentence.

> Repeat for every phase. Do NOT skip Surface for any phase — `start-next-phase` falls back to default routing for missing/`Mixed` values, so every UI / Refactor phase that lacks a tag silently bypasses its specialist skill.

## Dependencies on Prior Milestones

What from earlier milestones must be in place before this one starts? What would block this milestone if it were missing?

- Depends on: previous-milestone deliverable
- External: vendor / infra / deadline

## External Constraints

Deadlines, vendor SLAs, regulatory windows, hardware availability, anything outside the team's control that shapes phase ordering.

- Constraint 1
- Constraint 2

## Risk Areas

Milestone-scope risks. Per-phase risks belong in `phase-design.template.md` later.

| Risk | Impact | Mitigation |
|---|---|---|
| `<risk>` | `<impact>` | `<mitigation>` |

## Open Questions

Things the brainstorm couldn't resolve and that need user input before `new-milestone` writes MILESTONE.md.

- Question 1
- Question 2
