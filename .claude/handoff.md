# Handoff: upstream-issue

**Branch:** `feat/upstream-issue` (pushed). Work in a worktree on this branch.

## Position

- Design approved: `docs/superpowers/specs/2026-10-31-upstream-issue-design.md`
- Plan written: `docs/superpowers/plans/2026-10-31-upstream-issue.md` (5 tasks, none started)
- Execution method chosen by Marcel: **subagent-driven** (`superpowers:subagent-driven-development`)

## Next step

Start the plan at Task 1 (privacy scanner).

## Decisions not to reopen

All decisions are in the design's "Decisions (user's)" table and the lines marked "(Claude's call)". Notable ones:

- Generic for any upstream; the skill works out the repro shape itself.
- Approach B: independent skeptic and clean-runner subagents gate drafting; their verdicts are final.
- Existing issue: comment only when it adds a repro or versions, through the full gates.
- GitHub posts via `gh`; other trackers get a hand-off draft.
- Repro inline when small, else a public repo created only after approval.
- Fixtures and evals use invented values only, never Marcel's real domain, username or devices.

Remove this file in the final cleanup before the PR, as anti-slop did with commit d854c24.
