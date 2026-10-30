# Handoff: anti-slop plugin

## Goal

Build the 14th plugin, `anti-slop`: a prose skill that silently rewrites AI tics out of text Claude is about to publish (commits, PRs, issues, comments, READMEs, docs, specs), English and Dutch.

## Current state

Design approved and committed: `docs/superpowers/specs/2026-10-30-anti-slop-design.md`.
Plan committed: `docs/superpowers/plans/2026-10-30-anti-slop.md` (5 tasks, none started).
Branch: `feat/anti-slop`, pushed to origin.

## Decisions made

- Prose only; auto-trigger on publishable text plus on demand; no hook.
- Silent rewrite on a hit; on-demand file runs edit in place and leave a diff.
- English + Dutch catalogues; standalone plugin (approach A).
- Execution method chosen by the user: **subagent-driven** (superpowers:subagent-driven-development). Implementers and reviewers on Sonnet, final whole-branch review on Opus, never Fable; pass `model` explicitly.

## Next step

Check out `feat/anti-slop`, read the spec and the plan, then run superpowers:subagent-driven-development from Task 1. Delete this `.claude/handoff.md` in the last commit before opening a PR. No Claude signatures or session links in commits or the PR.

## Files in play

- docs/superpowers/specs/2026-10-30-anti-slop-design.md
- docs/superpowers/plans/2026-10-30-anti-slop.md
- plugins/anti-slop/ (to be created)
- Registries listed in plan Task 4
