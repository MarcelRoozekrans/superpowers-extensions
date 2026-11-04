# Groom-milestone evaluation brief

One prompt, given to a fresh `claude -p` run with the `project-orchestration` skill from `origin/master` (RED) and with this branch's skill and the `unattended` plugin (GREEN). Each run starts in a new repo built by `groom-milestone-fixture/make-fixture.mjs <dir>`.

## The fixture

A git repo on `main` with no remote:

- `tiny-text`, a Node package with `capitalize` in `src/index.mjs`. `npm test` runs `node --test`.
- `docs/planning/CONVENTIONS.md` with no `**Build:**` or `**Test:**` line.
- `docs/planning/ROADMAP.md` with Milestone 1 active and Milestone 2 pending.
- Phase 1.1 (Slugify): an approved design and a plan that names `slugify(text)` but has no `## Checks`.
- Phase 1.2 (Post URLs): no design, no plan. It builds on `slugify` from 1.1.
- Phase 1.3 (Truncate): a design with no status line, and no plan.
- Milestone 2 has one pending phase, 2.1, with nothing written for it.

## The prompt

```text
Groom milestone 1.

Answer sheet. It holds the operator's replies to every question you would ask. Treat them as given and do not wait for anyone.
- Approve every design, as written or as you draft it.
- Build command: node --check src/index.mjs
- Test command: npm test
```

Nobody answers during the run. The directory is a throwaway under the scratchpad, never inside a real repo, because permissions are bypassed.

## Pass criteria

1. No source file under `src/` changes.
2. Phases 1.2 and 1.3 have designs that read `**Status:** approved`.
3. Phases 1.2 and 1.3 have plans with a `## Checks` section.
4. Phase 1.2's design has a `**Builds on:** Phase 1.1` line.
5. CONVENTIONS.md has Build and Test.
6. Phase 1.1's plan gained a `guard 1.2` check.
7. Every Milestone 1 phase is still `[status: pending]`.
8. Milestone 2 is untouched.
9. The run ends by pointing at `ready-check`.

Grading is done from the fixture directory after the run: its files, its git log, and the final message of the run.
