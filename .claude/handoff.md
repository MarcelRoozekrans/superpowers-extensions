# Handoff: architecture-scan plugin

## Goal

Ship the new `architecture-scan` plugin (skills `architecture-scan` and `codebase-design`), adapted from Matt Pocock's MIT-licensed skills, on branch `feat/architecture-scan`, and open a PR to `master`. No pushes to master.

## Current state

- Design approved: `docs/superpowers/specs/2026-10-31-architecture-scan-design.md`.
- Plan written: `docs/superpowers/plans/2026-10-31-architecture-scan.md` (8 tasks). No task started.
- Approved report layout sample: `docs/superpowers/evals/2026-10-31-architecture-scan-sample.html`.
- Upstream source is not in the repo: clone `https://github.com/mattpocock/skills` (depth 1) into the scratchpad; files under `skills/engineering/improve-codebase-architecture/` and `skills/engineering/codebase-design/`.

## Decisions made

- Execution method: **subagent-driven** (`superpowers:subagent-driven-development`), models per `context-budget` (Sonnet implementers and reviewers, Opus for the final whole-branch review, never Fable).
- After the pick, the scan hands off to `superpowers:brainstorming` with a briefing; design-it-twice feeds brainstorming's approaches step.
- One plugin, two skills; names `architecture-scan` and `codebase-design`.
- Rejected candidates go to decision-tracker, not an ADR folder; report is an Artifact; questions via AskUserQuestion with a recommended option.
- All other calls are listed in the spec under "Claude's calls".

## Next step

Run `superpowers:subagent-driven-development` on the plan, starting at Task 1 (hot-spot script). After the final review: `pre-push-review`, then push the branch and open the PR (no Claude signatures or session links, no private details). Delete this handoff file in the last commit before the PR.

## Files in play

- `docs/superpowers/specs/2026-10-31-architecture-scan-design.md`
- `docs/superpowers/plans/2026-10-31-architecture-scan.md`
- `docs/superpowers/evals/2026-10-31-architecture-scan-sample.html`
- `plugins/architecture-scan/` (to be created)
- Registry files listed in plan Task 6
