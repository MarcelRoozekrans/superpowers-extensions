# docs/planning/ State Files Reference

This document defines the format for the `docs/planning/` directory files used by
the `project-orchestration` skill to persist project lifecycle state across sessions.

> **Companion templates** for the design specs that feed these state files
> live in `templates/`:
>
> - [`templates/roadmap-design.template.md`](templates/roadmap-design.template.md) — filled in by `plan-roadmap` at roadmap scope
> - [`templates/milestone-design.template.md`](templates/milestone-design.template.md) — filled in by `new-milestone` at milestone scope
> - [`templates/phase-design.template.md`](templates/phase-design.template.md) — filled in by `start-next-phase` (via brainstorming) at phase scope
>
> Filled-in copies are saved under `docs/superpowers/specs/`. The templates make brainstorm output deterministic so VERIFY steps can grep-check required sections (Surface tag, DoD criteria count, milestone count) instead of pattern-matching free-form prose.

## Directory

`docs/planning/` in the project root. Add to `.gitignore` or commit — user's choice.
Recommended: commit so state survives machine changes.

Four files live here:

| File | Holds | Written by | Lifecycle |
|---|---|---|---|
| [`ROADMAP.md`](#roadmapmd) | Every milestone, its phases, and completion status | `plan-roadmap`, then every phase and milestone sub-skill | Changes constantly |
| [`STATE.md`](#statemd) | Session handoff — where work stopped and what is next | `pause-work` | Rewritten each pause |
| [`MILESTONE.md`](#milestonemd) | The active milestone's definition and DoD | `new-milestone`, `complete-milestone` | Replaced per milestone |
| [`CONVENTIONS.md`](#conventionsmd) | Project-invariant technical decisions — stack, commits, branching, release, deployment | `init-conventions` only | Stable; unchanged for the life of the project unless a convention actually changes |

## ROADMAP.md

Tracks all milestones, their phases, and completion status.

```markdown
# Project Roadmap

## Milestone 1: <Name> [status: active|complete|pending]
**Goal:** One sentence
**Started:** YYYY-MM-DD (when status: active or complete)
**Milestone:** N (when github sync is enabled — GitHub native milestone number)
**Completed:** YYYY-MM-DD (when status: complete)
**Definition of Done:**
- [ ] Criterion 1
- [ ] Criterion 2

### Phase 1.1: <Name> [status: complete|active|pending]
**Goal:** One sentence
**Surface:** UI | Backend | Refactor | Data | Infra | Docs | Mixed
**HelpWanted:** yes | no
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`
**Issue:** #N (when github sync is enabled)
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
- **HelpWanted:** — value is exactly `yes` or `no` (lowercase). Drives the `help wanted` label on `sync-github`. Default `no`. Field is optional; missing is treated as `no`.
- **Issue:** — written by `init-github-sync` on first GitHub-issue creation, read by `sync-github` thereafter. Format is `**Issue:** #N` *with* the leading hash (matches GitHub issue convention). Do not edit manually unless reconciling a deleted issue.
- **Milestone:** — same rules but stores the GitHub native Milestone number *without* a hash. Format is `**Milestone:** N` (just the digit). The two formats differ deliberately so a stray copy-paste between fields is detectable.

### Optional frontmatter — `compress_memory`

`ROADMAP.md` may start with a YAML frontmatter block declaring per-project preferences. The only field currently defined is `compress_memory`, used by the `compress-memory` skill:

```yaml
---
compress_memory: enabled   # or: disabled
---
```

| Value | Behavior |
|---|---|
| `enabled` | `pause-work` invokes `compress-memory` on `STATE.md` after writing it, and on `ROADMAP.md` itself if it has changed since the last commit. Compression failures are logged and do not block `pause-work` (mirrors the `sync-github` graceful-failure pattern). |
| `disabled` | `pause-work` skips compression. Users can still invoke `/compress-memory <file>` manually. |
| (field absent) | Treated as `disabled` — backwards compatible default. |

The field is set during `plan-roadmap` via an opt-in question, but may be edited by hand at any time. Flipping `enabled` → `disabled` stops further auto-compression; existing compressed files stay compressed (`*.original.md` backups remain on disk for recovery).

The `compress_memory` field is the only field; do not invent additional keys here without updating this document and the `compress-memory` skill's safety rules.

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
**HelpWanted:** no
**Plan:** _to be written_
```

(`Plan:` placeholder is replaced when `writing-plans` actually runs. `Surface:` is required at insertion time so `start-next-phase` can route correctly when the phase later activates. `Issue:` is omitted — it gets written by `init-github-sync` on first GitHub-issue creation.)

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
- [ ] Release tagged in git (only when CONVENTIONS.md says "Milestone completion tags a release: yes"; omit otherwise)

## Phases
1. Phase 1.1 — <name> [complete]
2. Phase 1.2 — <name> [active]
3. Phase 1.3 — <name> [pending]

## Audit History
| Date | Verdict | Gaps |
|---|---|---|
| YYYY-MM-DD | PASS | none |
```

## CONVENTIONS.md

The project's invariant technical decisions — stack, commits, branching, versioning/release, deployment. Written by `init-conventions`, read by the Commit & Release Protocol before every commit and tag. Filled in from [`templates/conventions.template.md`](templates/conventions.template.md), which carries the authoring guidance stripped from the written file.

```markdown
# Project Conventions

> Written by `init-conventions`. Do not hand-edit — re-run the sub-skill instead; the Commit & Release Protocol reads these fields.

**Established:** YYYY-MM-DD

## Stack

**Language / runtime:** <value>
**Package manager:** <value>
**Framework:** <value | none>
**Datastore:** <value | n/a>

## Commits

**Format:** conventional | free-form
**Scopes:** enforced | free | none
**Scope source:** <file | n/a>
**Fallback when scope not allowed:** omit scope | map to <scope>

## Branching

**Model:** trunk | feature-branch | gitflow
**PR required:** yes | no | unknown
**Protected branches:** <comma-separated list | none>

## Versioning & Release

**Scheme:** semver | calver | milestone | none
**Released by:** release-please | semantic-release | changesets | manual git tag | CI | none
**Milestone completion tags a release:** yes | no
**Changelog:** auto | manual | none

## Deployment

**Deploy target:** <where it runs | none>
**Environments:** <comma-separated list | none>
**Deployed by:** <mechanism | none>
```

Nineteen fields: `Established` plus eighteen across the five sections. All five `##` headings are required even when a section's fields are all `none` — `init-conventions`' VERIFY checks that all five are present.

### Canonical syntax — exact field and value rules

The Commit & Release Protocol reads these fields mechanically, so a field it cannot parse is a field that does not exist. Follow these precisely.

- **Field lines** — `**Key:** value` on its own line, key spelled and capitalized exactly as shown, single space after the colon. Consecutive field lines sit on adjacent lines with no blank line between them. Do not reflow them into a paragraph, a bullet list, or a table.
- **Choice notation** — the `|` shown above separates the allowed values; it is notation, and **never appears in a written file**. A field holding several values separates them with commas: `**Language / runtime:** node 24, .NET 8`. A `<placeholder>` is likewise notation — `init-conventions`' VERIFY rejects any field line still containing `<` or a space-padded `|`, because either means the field was never decided.
- **Trailing parenthetical** — a value may carry one. The value is everything before the first `(` that follows a space; the parenthetical carries provenance or detail and is ignored by the readers. `**Released by:** none (defaulted)` reads as `none`. Use it to mark a value that was defaulted or supplied by the user rather than detected.
- **`Protected branches`** — a comma-separated list of patterns, or `none`. **`none` means the list is empty**, not a branch literally named `none`. `*` is a wildcard matching within a single path segment: `release/*` matches `release/1.2` but not `release/1/2`. Matching is case-sensitive. The file records the patterns; the Commit & Release Protocol's branch guard is what matches against them and decides what to do.
- **`Established`** — an ISO 8601 date, write-once. It records when conventions were *first* set, not when last checked; a re-run of `init-conventions` preserves it.

**Cross-field constraint:** `Scheme: none` implies `Milestone completion tags a release: no` — there is no scheme to render a tag from, so the pair `none` / `yes` is invalid. `init-conventions` derives the `no` rather than asking, so only a hand-edit can produce the invalid pair.

### Lifecycle

- **Written by `init-conventions` only** — at kickoff via `plan-roadmap`, as a self-heal when the Commit & Release Protocol finds the file missing, or on demand when a convention changes. No other sub-skill writes it. It commits the file by explicit pathspec, so a self-heal never sweeps the caller's staged files into its commit.
- **Read by the Commit & Release Protocol** before every commit and tag, and by `audit-milestone` to decide whether the release-tag criterion applies at all.
- **Stable.** Unlike `ROADMAP.md`, it does not change per phase or per milestone. A re-run that detects no differences asks nothing and writes nothing.
- **Never compressed.** `compress-memory` runs from `pause-work` on `STATE.md` and `ROADMAP.md` only, and its denylist now refuses `CONVENTIONS.md` outright (see [`compress-memory/.../safety-rules.md`](../../../compress-memory/skills/compress-memory/safety-rules.md)). The reason it must be refused: the protocol greps the `**Key:** value` lines, which are prose, so compression could reword them while every one of that skill's validation checks — code blocks, headings, tables preserved — still passes. A field compressed into prose is a field the protocol will not find.
