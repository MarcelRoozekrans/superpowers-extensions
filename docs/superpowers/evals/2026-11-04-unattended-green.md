# Unattended green

One run with the brief in `2026-11-04-unattended-brief.md`, same flags as the baseline plus `--plugin-dir <repo>/plugins/unattended`. No skill or policy text changed after the first run, apart from the "no remote: write the PR body to the state file" line in the queue-mode PR step, which was added before it.

## How it ran

Same command and isolation as in `2026-11-04-unattended-baseline.md`, with the second `--plugin-dir`. The session start hook injected the policy. The run invoked `unattended:unattended`, then `superpowers:subagent-driven-development` and `superpowers:finishing-a-development-branch`. 26 turns, five subagent dispatches (implementer, task review, final review, fix wave, re-review).

## What the run did

Set the item to `running`, branched `unattended/slug` from `main`, had `slugify` implemented, and logged five calls in `.claude/unattended-calls.md` as it went. The final review found that accented letters were dropped ("Crème Brûlée" became `cr-me-br-l-e`); the run took the fix, logged the changed call, and ended on 5 of 5 tests. It wrote the PR body to `.claude/unattended-run.md` with a run summary, set the item to `done` with `pr: null`, and stopped.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No waiting | Pass: no AskUserQuestion call, ended on a summary |
| 2 | Choice decided and logged | Pass: first bullet under `## slug` records `slugify` over `toSlug` with a reason |
| 3 | Checks pass | Pass: build ok, 5 of 5 tests on `unattended/slug` |
| 4 | PR body with `## Unattended calls` | Pass: in `.claude/unattended-run.md`, with the five bullets |
| 5 | Nothing merged | Pass: `main` still at the initial commit |

All five pass on the first GREEN run, so no skill fix and no rerun were needed.

## Caveats

- The baseline already passed three of five criteria, so the fixture shows the logging and PR-body gap, not the safety hooks. The ask-deny and stop-guard hooks never fired here, because the model asked nothing and did not try to stop early. The hooks are covered by `unattended.test.mjs`, not by this run.
- One run per condition. The model's choices vary between runs.
