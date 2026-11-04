# Handoff: groom-milestone

## Goal

Add a grooming step to project-orchestration so the operator answers every design and plan question for a milestone up front, after which an unattended run (the `unattended` plugin, merged in #175) builds every phase of it.

## Current state

- Branch `feat/groom-milestone`, based on origin/master with #175 merged. Nothing designed yet.
- The `unattended` plugin is merged. `ready-check` queues only items that have an approved design, a plan with `## Checks`, passing build checks, no open questions and no unsafe steps. Queue items take an optional `base` field for stacked PRs.

## Decisions made

- Operator, 2026-11-04: scope is **per milestone**, not the whole roadmap. Plans written against unbuilt code are guesses, so the operator grooms one milestone, runs it, then grooms the next.
- Shape proposed and accepted in principle: a new step in project-orchestration, for example `groom-milestone`. For each pending phase of the current milestone, in roadmap order:
  1. brainstorming produces the phase design;
  2. the Surface pre-plan hook runs;
  3. writing-plans produces the plan, with a `## Checks` section;
  4. no execution happens.
  The step ends by handing to `ready-check`.
- No `Co-Authored-By`, Claude signature or session URL in commits or PR bodies.

## Next step

Run superpowers:brainstorming on the `groom-milestone` design.

Read `plugins/project-orchestration/skills/project-orchestration/SKILL.md`, in particular `start-next-phase` and its routing table, Surface pre-plan hook and phase status rules, and `plugins/unattended/skills/ready-check/SKILL.md`.

Open points to settle with the operator:

- **Overriding brainstorming's hand-off:** upstream brainstorming ends with "invoke writing-plans and no other skill", and writing-plans offers an execution choice. How does groom-milestone override that, and stop before execution?
- **Phase status:** what status does a groomed phase get in ROADMAP.md, for example `pending` with a plan?
- **Later phases:** how should their designs reference earlier phases that are planned but not built? The `base` field covers the branch side.
- **Checks:** how does writing-plans get the `## Checks` section, since it is upstream and can't be edited?
- **ready-check:** should it gain a "this milestone" collection mode?

Do not open a PR until the operator asks.

## Files in play

- `plugins/project-orchestration/skills/project-orchestration/SKILL.md`, `state-files.md`, `templates/`
- `plugins/unattended/skills/ready-check/SKILL.md`
- `docs/superpowers/specs/2026-11-04-unattended-design.md` (context)
