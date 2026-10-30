# Handoff: demo-video

**Branch:** `feat/demo-video` (pushed). Work in a worktree on this branch.

## Position

- Design approved: `docs/superpowers/specs/2026-10-30-demo-video-design.md`
- Plan written: `docs/superpowers/plans/2026-10-30-demo-video.md` (9 tasks, none started)
- Execution method chosen by Marcel: **subagent-driven** (`superpowers:subagent-driven-development`)

## Next step

Start the plan at Task 1. Before Task 3, do its one-time environment setup on this machine:

- `sudo apt-get install -y ffmpeg git-lfs && git lfs install`
- a global `playwright` install matching `~/.cache/ms-playwright/chromium-1248`

## Deadline

The whole skill must be released before the incident-triage-demo kick-off on Monday 2 November 2026, 09:00. Task 9, the triage fallback recording, is last. It runs in `~/Projects/Prive/incident-triage-demo` as that repo's Phase 4.3, after its Phases 4.1 and 4.2.

## Decisions not to reopen

All decisions are in the design's tables ("Decisions (Marcel's)" and "Claude's calls"). Notable ones:

- Videos go through Git LFS.
- Waits are sped up, never cut.
- Each chapter becomes its own MP4.
- The Aspire Traces page is out of the triage video.

Remove this file in the final cleanup before the PR, as anti-slop did with commit d854c24.
