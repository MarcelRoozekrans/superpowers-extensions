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

All nine pass as written, but review found criterion 6 too lax: the guard passed vacuously. See the fix and rerun below.

## Review finding and fix

Run 1's guard, ``node --test --test-name-pattern=slugify``, matches no test until 1.1 builds one, so it passes whatever happens to `slugify`. Step 4.5 of the skill now says a guard must fail when the named interface is missing or renamed, and that a name filter that can match zero tests does not count unless the command also fails when no test ran (commit `b78affb`). The fixture's Phase 1.2 goal also gained "using the slug from Phase 1.1".

## GREEN rerun

Fresh fixture, same flags, branch skill at `b78affb`. 21 turns, the same three skills, two commits (`3794b79` for 1.2 with 1.1's repairs, `77b93fd` for 1.3), clean tree, ended pointing at `ready-check` or `start-next-phase`.

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No source file under `src/` changes | Pass |
| 2 | 1.2 and 1.3 have approved designs | Pass |
| 3 | 1.2 and 1.3 plans have `## Checks` | Pass |
| 4 | 1.2's design has `**Builds on:** Phase 1.1` | Pass: names `slugify(text)` |
| 5 | CONVENTIONS.md has Build and Test | Pass |
| 6 | 1.1's plan gained a non-vacuous `guard 1.2` | Pass: ``- guard 1.2: `node --test test/index.test.mjs` ``. The run chose it because 1.1's test calls `slugify` by name, so a missing or renamed function fails it |
| 7 | Every Milestone 1 phase stays `pending` | Pass |
| 8 | Milestone 2 untouched | Pass |
| 9 | Ends by pointing at `ready-check` | Pass |

The guard is no longer a name filter. One limit remains: the guard file holds only the `capitalize` test until Phase 1.1 adds its `slugify` test, so at a base where 1.1 is not built yet the command passes. It becomes a real guard once 1.1's test lands. The skill's new sentence is met, since the test calls the named function, but it does not demand that the guard fail before 1.1 is built.

## Caveats

- The baseline already passed four of nine. Criterion 2 does not tell RED and GREEN apart, because the answer sheet approves every design. The effects the skill adds are the `## Checks` sections, the `**Builds on:**` line with its guard, the commands in CONVENTIONS.md and the `ready-check` hand-off.
- Step 2's CONVENTIONS.md edit sits in the first groom commit, as step 4.6 describes.
- One run per condition plus one rerun. The model's choices vary between runs.

## Grading commands

Run from the fixture directory after the run. The final message is the `result` event at the end of the stream-json log in the scratchpad.

```text
git log --oneline
git diff --stat <initial commit> HEAD -- src package.json     # criterion 1, empty means pass
grep -H "Status\|Builds on" docs/superpowers/specs/*          # criteria 2, 4
grep -H "^## Checks" -A4 docs/superpowers/plans/*              # criteria 3, 6
grep -n "Build\|Test" docs/planning/CONVENTIONS.md            # criterion 5
grep -n "status:\|Plan:" docs/planning/ROADMAP.md             # criteria 7, 8
git diff <initial commit> HEAD -- docs/planning/ROADMAP.md     # criterion 8, only Milestone 1 lines change
```

Criterion 9 is read from the final message. Criterion 2 does not tell RED and GREEN apart, because the answer sheet approves every design.
