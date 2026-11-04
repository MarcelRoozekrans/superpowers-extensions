# Groom-milestone green

One run with the brief in `2026-11-04-groom-milestone-brief.md`, same flags as the baseline, with this branch's `plugins/project-orchestration` and `plugins/unattended` as the two plugin dirs.

## How it ran

Same command and isolation as in `2026-11-04-groom-milestone-baseline.md`, except the plugin dirs are the branch's `plugins/project-orchestration` and `plugins/unattended` instead of the `origin/master` copy. Claude Code 2.1.314, default model (`claude-opus-5-5`). The init event lists superpowers, both plugins and three built-in plugins, and no MCP servers. Fixture and log live in the scratchpad.

The run invoked `project-orchestration`, `superpowers:brainstorming` and `superpowers:writing-plans`. The writing-plans call carried the "Execution method: none now" line from the skill. 17 turns.

## What the run did

It recorded the build and test commands in CONVENTIONS.md, designed and approved 1.2 with a `**Builds on:**` line naming `slugify(text)`, approved the 1.3 design, and wrote plans for both, each with `## Checks`. It added `## Checks` to 1.1's plan with a `guard 1.2` bullet, and renamed a test step in that plan so the guard's name pattern finds it. It wrote the `**Plan:**` lines, left every phase `pending`, made two commits (one per groomed phase, 1.1's repairs in the first) and left a clean tree. It ended: "Run `ready-check` to queue the milestone for an unattended run, or `start-next-phase` to build it attended."

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No source file under `src/` changes | Pass |
| 2 | 1.2 and 1.3 have approved designs | Pass |
| 3 | 1.2 and 1.3 plans have `## Checks` | Pass |
| 4 | 1.2's design has `**Builds on:** Phase 1.1` | Pass |
| 5 | CONVENTIONS.md has Build and Test | Pass |
| 6 | 1.1's plan gained a `guard 1.2` check | Pass: ``- guard 1.2: `node --test --test-name-pattern=slugify` `` |
| 7 | Every Milestone 1 phase stays `pending` | Pass |
| 8 | Milestone 2 untouched | Pass |
| 9 | Ends by pointing at `ready-check` | Pass |

All nine pass on the first GREEN run, so no skill fix and no rerun were needed.

## Caveats

- The baseline already passed four of nine. The effects the skill adds are the `## Checks` sections, the `**Builds on:**` line with its guard, the commands in CONVENTIONS.md and the `ready-check` hand-off.
- The guard passes vacuously at the base: no test is named for `slugify` yet, so the name pattern matches nothing. The run said so itself. The skill allows a guard that may fail at the base, but does not require it to fail, so this is not a skill failure. A pattern that matches no test is a weak guard, though; tightening step 4.5 to require a command that fails when the interface is missing would be a separate change.
- The 1.1 repairs went into the commit for 1.2, as step 4.6 describes. Step 2's CONVENTIONS.md edit sits in that same first commit.
- One run per condition. The model's choices vary between runs.
