# Design: GSD Integration — project-orchestration & ui-workflow Plugins

## Summary

Integrate selected skills from [get-shit-done (GSD)](https://github.com/gsd-build/get-shit-done/) into this repo as two new native superpowers-style plugins. GSD's project lifecycle management and UI design workflow capabilities complement the existing superpowers-extensions without overlapping any existing plugin.

## Context

This repo (`superpowers-extensions`) extends `obra/superpowers` with 6 plugins:

| Plugin | Role |
|---|---|
| `regression-test` | Visual + functional browser testing via Playwright |
| `pre-push-review` | Structured branch review before push/PR |
| `refactor-analysis` | Transitive impact analysis for refactors |
| `decision-tracker` | Persistent cross-session decision tracking via LongtermMemory-MCP |
| `roslyn-codelens-integration` | Semantic .NET code intelligence for brainstorming + refactor-analysis |
| `memorylens-integration` | .NET memory profiling for systematic-debugging + brainstorming |

All 6 existing plugins fit cleanly into the expanded workflow without modification.

## Problem

Superpowers provides excellent per-task and per-session workflow skills (brainstorming, planning, TDD, debugging, code review) but lacks:

- **Project lifecycle management** — no concept of milestones, phases, or release cycles
- **Session continuity** — no pause/resume or progress overview across multi-session work
- **Brownfield onboarding** — no structured codebase mapping before starting work on existing projects
- **UI design contracts** — no structured frontend design specification step before implementation
- **Retroactive visual auditing** — no way to audit already-implemented UI against design intent

GSD solves these. The goal is to extract GSD's project-level capabilities as superpowers-native skills.

## Design Decisions

- **Two plugins, not one.** UI workflow is frontend-specific and optional; project lifecycle is universal. Clean install story.
- **Native superpowers SKILL.md format.** Skills are markdown files with frontmatter, trigger conditions, checklists, and "Relationship to Superpowers Skills" tables — matching the conventions of all existing plugins.
- **GSD-inspired, not GSD-ported.** Skills are adapted to the superpowers workflow model (brainstorming → writing-plans → executing-plans chain) rather than copied verbatim from GSD's shell-based implementation.
- **State files in `.planning/`.** Following GSD convention, milestone/phase state is tracked in `.planning/` directory files (ROADMAP.md, STATE.md, MILESTONE.md). This is a new convention for this repo.
- **`ui-review` delegates to `regression-test`.** The ui-review skill invokes the existing regression-test skill for browser-based visual evaluation rather than duplicating that logic.

## Full Ecosystem Workflow

```
NEW PROJECT / BROWNFIELD
  project-orchestration: map-codebase
          ↓
DESIGN & DECISIONS
  brainstorming ← decision-tracker (recall prior decisions)
  brainstorming ← roslyn-codelens-integration (.NET: semantic context)
  brainstorming ← memorylens-integration (.NET: memory risk flags)
  brainstorming → ui-workflow: ui-phase (frontend phases only)
          ↓
IMPACT ANALYSIS (refactors only)
  refactor-analysis ← roslyn-codelens-integration (.NET: semantic search)
          ↓
PLANNING
  writing-plans ← decision-tracker (embed cross-cutting decisions)
  project-orchestration: add-phase / insert-phase / remove-phase
  project-orchestration: list-phase-assumptions
          ↓
EXECUTION
  subagent-driven-development ← decision-tracker (inject per-agent)
          ↓
QUALITY GATES
  regression-test (visual + functional browser testing)
  pre-push-review (plan adherence + code quality + commit hygiene)
  ui-workflow: ui-review (visual audit, delegates to regression-test)
          ↓
MILESTONE MANAGEMENT
  project-orchestration: audit-milestone (verify definition of done)
  project-orchestration: complete-milestone (archive + tag release)
  project-orchestration: new-milestone (start next cycle)
          ↓
SESSION STATE (anytime)
  project-orchestration: progress (where am I?)
  project-orchestration: pause-work / resume-work
```

## Plugin 1: `project-orchestration`

### Purpose

Lifecycle management for bigger, multi-session projects. Covers brownfield onboarding, roadmap/phase management, session state, milestone tracking, and release cycles.

### Skills

| Skill | Trigger | What it does |
|---|---|---|
| `map-codebase` | Before `brainstorming` on an existing project | Analyzes existing codebase: structure, entry points, dependencies, tech stack, key patterns. Produces `docs/plans/YYYY-MM-DD-codebase-map.md`. |
| `progress` | `/progress` or "where are we?" | Reads `.planning/STATE.md` and `.planning/ROADMAP.md`, presents current milestone, current phase, completed/pending tasks, and recommended next step. |
| `add-phase` | "add a phase" to the roadmap | Appends a new phase to `.planning/ROADMAP.md` with name, goal, and tasks. |
| `insert-phase` | "insert urgent work" between phases | Inserts a phase between two existing phases, renumbers subsequent phases. |
| `remove-phase` | "remove a future phase" | Removes a future phase and renumbers, with user confirmation. |
| `list-phase-assumptions` | Before starting a phase | Reads the phase plan and surfaces Claude's intended implementation approach for user review before execution begins. |
| `plan-milestone-gaps` | After `audit-milestone` finds gaps | Creates new phases to close gaps identified in the milestone audit. |
| `pause-work` | "stopping for now" / end of session | Writes a handoff note to `.planning/STATE.md`: current phase, last completed task, open decisions, recommended next step. |
| `resume-work` | Start of session on in-progress project | Reads `.planning/STATE.md`, restores context, announces where work left off and what comes next. |
| `audit-milestone` | "verify milestone N is done" | Compares milestone definition of done against git history, test results, and docs. Produces pass/fail verdict with gap list. |
| `complete-milestone` | After `audit-milestone` passes | Archives milestone doc, tags the release in git, updates ROADMAP.md to mark milestone complete. |
| `new-milestone` | After `complete-milestone` | Starts next milestone: prompts for goal + definition of done, creates `.planning/MILESTONE.md`, updates ROADMAP.md. |

### State Files

All state is persisted in `.planning/` (gitignored by default, or committed — user's choice):

| File | Contents |
|---|---|
| `.planning/ROADMAP.md` | All milestones with phases and status |
| `.planning/STATE.md` | Current session handoff: last task, open decisions, next step |
| `.planning/MILESTONE.md` | Current milestone: goal, definition of done, phase list |

### Relationship to Superpowers Skills

| Superpowers Skill | Relationship |
|---|---|
| `brainstorming` | `map-codebase` runs before brainstorming on existing projects. `resume-work` recalls context at session start. |
| `writing-plans` | Phase management skills (`add-phase`, `insert-phase`) feed ROADMAP.md which writing-plans references. |
| `executing-plans` / `subagent-driven-development` | `list-phase-assumptions` runs before execution to surface and confirm Claude's intended approach. |
| `finishing-a-development-branch` | `audit-milestone` + `complete-milestone` extend the finishing workflow into multi-milestone release management. |
| `regression-test` | `audit-milestone` invokes regression-test as part of its definition-of-done verification. |
| `decision-tracker` | Independent but complementary — both can be active simultaneously. |

---

## Plugin 2: `ui-workflow`

### Purpose

Frontend design contracts and visual auditing. Ensures UI phases have a clear design specification before implementation and a retroactive audit after.

### Skills

| Skill | Trigger | What it does |
|---|---|---|
| `ui-phase` | Before implementing a frontend phase | Produces a UI design contract: design system tokens, component API, layout specification, interaction states, accessibility requirements. Saved to `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md`. |
| `ui-review` | After implementing a frontend phase | Retroactive visual audit: compares implemented UI against the ui-contract using `regression-test` for screenshots, then evaluates against the contract spec. Produces audit report. |

### ui-phase Contract Structure

```markdown
# UI Design Contract: <Phase Name>

## Design System
- Colors, typography, spacing tokens in use
- Component library (if any)

## Components
- Component name, props API, variants, states

## Layout Specification
- Page structure, grid, breakpoints
- Desktop / tablet / mobile layout descriptions

## Interaction States
- Loading, empty, error, success states per component

## Accessibility Requirements
- ARIA roles, keyboard navigation, contrast requirements
```

### Relationship to Superpowers Skills

| Superpowers Skill | Relationship |
|---|---|
| `brainstorming` | `ui-phase` runs after brainstorming approves a frontend design — it produces the detailed visual spec. |
| `writing-plans` | The ui-contract produced by `ui-phase` is referenced in the implementation plan as the visual specification. |
| `regression-test` | `ui-review` delegates browser-based screenshot capture and visual evaluation to regression-test. |
| `pre-push-review` | `ui-review` can be invoked by pre-push-review Phase 5 when a frontend phase is being reviewed. |
| `verification-before-completion` | `ui-review` report with screenshots satisfies the visual evidence requirement for frontend phases. |

---

## File Structure

```
plugins/
  project-orchestration/
    .claude-plugin/
      plugin.json
    skills/
      project-orchestration/
        SKILL.md          ← main skill file (all sub-skills)
        state-files.md    ← .planning/ file format reference
  ui-workflow/
    .claude-plugin/
      plugin.json
    skills/
      ui-workflow/
        SKILL.md          ← main skill file
        ui-contract-template.md  ← reference template
```

## marketplace.json Changes

Add two new plugin entries to `.claude-plugin/marketplace.json`:

```json
{
  "name": "project-orchestration",
  "description": "GSD-inspired project lifecycle management for larger projects. Brownfield codebase mapping, milestone tracking, phase management, session pause/resume, progress overview, and release cycle management.",
  "version": "1.6.0",
  "source": "./plugins/project-orchestration",
  "category": "workflow"
},
{
  "name": "ui-workflow",
  "description": "Frontend design contracts and visual auditing. Generates UI design contracts before implementing frontend phases and performs retroactive visual audits against those contracts using regression-test.",
  "version": "1.6.0",
  "source": "./plugins/ui-workflow",
  "category": "testing"
}
```

Version bumped to 1.6.0 for both new plugins and the overall package.
