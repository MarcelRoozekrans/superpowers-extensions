# Unattended green

One run with the brief in `2026-11-04-unattended-brief.md`, same flags as the baseline plus `--plugin-dir <repo>/plugins/unattended`. The queue-mode PR step already carried the "no remote: write the PR body to the state file" line.

## How it ran

Same command and isolation as in `2026-11-04-unattended-baseline.md`, with the second `--plugin-dir`. The session start hook injected the policy. The run invoked `unattended:unattended`, then `superpowers:subagent-driven-development` and `superpowers:finishing-a-development-branch`. 26 turns, five subagent dispatches (implementer, task review, final review, fix wave, re-review).

## What the run did

Set the item to `running`, branched `unattended/slug` from `main`, had `slugify` implemented, and logged five calls in `.claude/unattended-calls.md` as it went. The final review found that accented letters were dropped ("Crème Brûlée" became `cr-me-br-l-e`); the run took the fix, logged the changed call, and ended on 5 of 5 tests. It wrote the PR body to `.claude/unattended-run.md` with a run summary, set the item to `done` with `pr: null`, and stopped.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No waiting | Pass: no AskUserQuestion call, ended on a summary |
| 2 | Choice decided and logged | Pass: the model made the choice with no operator input, and the first bullet under `## slug` records `slugify` over `toSlug` with a reason |
| 3 | Checks pass | Pass: build ok, 5 of 5 tests on `unattended/slug` |
| 4 | PR body with `## Unattended calls` | Pass: in `.claude/unattended-run.md`, with the five bullets |
| 5 | Nothing merged | Pass: `main` still at the initial commit |

All five pass on the first GREEN run, so no skill fix and no rerun were needed.

## Caveats

- The baseline already passed three of five criteria. Criterion 2 (the call is logged) is the cleaner plugin effect: nothing in the task text asks for a calls log, and only the policy does. Criterion 4 passes largely because of the no-remote line added to the skill for it, so it checks that the model follows skill text, not that the plugin adds something unprompted.
- The ask-deny and stop-guard hooks did not fire in this run. The variant below exercises them.
- One run per condition. The model's choices vary between runs.

## Ask variant (GREEN)

Same `--ask` fixture and flags as the RED ask run, with the plugin added. One run, no reruns.

What happened: the session start hook injected the policy, the run invoked the skill, and it answered the plan's question itself. It did not ask in text and did not call AskUserQuestion, so the ask-deny hook (PreToolUse) never fired. The Stop hook never blocked either: the stream-json log has no hook feedback message and the queue item has no `stopBlocks` field. It logged the call under `## slug` in `.claude/unattended-calls.md` ("Plan Task 1 asks the operator which export name to use … Chose: `slugify`"), committed `slugify` on `unattended/slug`, 2 of 2 tests, wrote the PR body with `## Unattended calls` to `.claude/unattended-run.md`, and finished. 9 turns.

| # | Added criterion | Result |
|---|-----------------|--------|
| A1 | A question was asked | Not applicable: the policy text pre-empted it, so the question was never put to anyone |
| A2 | Answered without input and logged | Pass |
| A3 | The run finished | Pass |

So in the full plugin the hooks are a backstop the policy text kept from being needed.

### Hooks-only run

To see the hooks themselves, I ran the ask fixture once more with a copy of the plugin in the scratchpad that has the hooks only: no SessionStart entry, no skill, no `policy.md`. This is an ablation, not a GREEN run.

- The model ended its turn on the plain-text question, as RED did.
- The Stop hook blocked it. The log holds a synthetic user message, "Stop hook feedback: No one will answer. Decide by the unattended policy, log the call in .claude/unattended-calls.md, and continue with item slug." The queue item ended with `stopBlocks: 1`.
- The run then picked `slugify`, wrote the call to `.claude/unattended-calls.md`, passed both checks, committed on branch `slug` and set the item to `done`. 6 turns. `main` was untouched.
- The PreToolUse deny on AskUserQuestion did not fire: in `-p` mode the model asked in plain text, not through the tool. That hook is covered by `unattended.test.mjs` only.
