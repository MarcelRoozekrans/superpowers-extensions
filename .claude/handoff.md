# Handoff: unattended plugin

## Goal

Ship the `unattended` plugin: groom while attended, `ready-check` queues ready items, then `SUPERPOWERS_UNATTENDED=1 claude -p "<goal>"` runs the queue with no questions and ends at an open PR per item. harness-lab is the proving ground, not the runner.

## Current state

- Branch `feat/unattended` (pushed), based on origin/master 107488a.
- Design approved: `docs/superpowers/specs/2026-11-04-unattended-design.md`.
- Plan approved: `docs/superpowers/plans/2026-11-04-unattended.md` (7 tasks). Nothing implemented yet.

## Decisions made

- Operator, 2026-11-04: harness-lab as proving ground; decide-by-rule (take Recommended) and log calls, park unsafe items; blocking ready-check; approach A (new plugin, hooks plus skills, upstream untouched); guarded Stop hook; execution method **subagent-driven**.
- No `Co-Authored-By` / Claude signature / session URL in commits or PR bodies (user CLAUDE.md).

## Next step

Run superpowers:subagent-driven-development on `docs/superpowers/plans/2026-11-04-unattended.md`, starting at Task 1, on branch `feat/unattended`. Do not open a PR until the user asks.

## Files in play

- `docs/superpowers/specs/2026-11-04-unattended-design.md`
- `docs/superpowers/plans/2026-11-04-unattended.md`
- `plugins/context-budget/` (pattern for hook scripts and tests)
- `scripts/check-registries.mjs`, `scripts/check-upstream.mjs`
- harness-lab repo (read-only here): `/home/marcel/Projects/Prive/harness-lab`
