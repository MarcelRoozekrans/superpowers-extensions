# Roadmap Design — `<Project Name>`

> Template consumed by `plan-roadmap`. The brainstorm fills in every section; `plan-roadmap`'s VERIFY step grep-checks the headings, milestone count, and Surface tags before writing `docs/planning/ROADMAP.md`. Save the filled-in copy at `docs/superpowers/specs/YYYY-MM-DD-roadmap-design.md`.

**Date:** YYYY-MM-DD
**Author:** `<agent / user>`
**Stage:** roadmap (whole project)

## Goal

One paragraph. What is this project, what problem does it solve, what does success look like at the project level (not at any single milestone).

## Target Users / Stakeholders

- Primary user / persona — what they need from this
- Secondary users / stakeholders — what they care about
- Non-users explicitly out of scope

## Top-Level Success Criteria

Project-wide, not milestone-wide. 3-5 bullets. Each one should be something an outside observer could verify when the whole project is done.

- Criterion 1
- Criterion 2
- Criterion 3

## Milestones

3-7 milestones. Each gets a one-line goal and a rough phase outline (3-8 phase titles, no per-phase implementation detail). Every phase title carries a `Surface` tag.

### Milestone 1: `<Name>`

**Goal:** One sentence — what this milestone delivers.

**Phases:**

1. `<Phase 1.1 title>` — `Surface: <UI | Backend | Refactor | Data | Infra | Docs | Mixed>`
2. `<Phase 1.2 title>` — `Surface: <…>`
3. `<Phase 1.3 title>` — `Surface: <…>`

### Milestone 2: `<Name>`

**Goal:** One sentence.

**Phases:**

1. `<Phase 2.1 title>` — `Surface: <…>`
2. `<Phase 2.2 title>` — `Surface: <…>`

### Milestone 3: `<Name>`

**Goal:** One sentence.

**Phases:**

1. `<Phase 3.1 title>` — `Surface: <…>`
2. `<Phase 3.2 title>` — `Surface: <…>`

> Repeat the `### Milestone N:` block for every milestone (up to 7). Do NOT collapse later milestones into "TBD" — the whole-project sweep is the point of `plan-roadmap`.

## Dependencies and Ordering Rationale

Why is milestone 1 before milestone 2? What would break if milestones were reordered? Capture the reasoning so later sessions don't re-litigate it.

- M1 → M2: `<reason>`
- M2 → M3: `<reason>`
- External dependencies: vendors, infra, deadlines

## Risk Register (optional)

Whole-project risks worth flagging now. Per-milestone risk detail belongs in `milestone-design.template.md` later.

| Risk | Impact | Mitigation |
|---|---|---|
| `<risk>` | `<impact>` | `<mitigation>` |

## Open Questions

Things the brainstorm couldn't resolve and that need user input before `plan-roadmap` writes ROADMAP.md.

- Question 1
- Question 2
