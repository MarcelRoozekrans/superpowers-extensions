# Unattended run policy

No one will answer questions. Never wait for input. Apply these rules.

## Deciding

- Answer every question yourself, whether a skill asks it in plain text or
  through AskUserQuestion. Take the option marked "(Recommended)" when one is
  marked, otherwise the one closest to the approved design, then the smaller
  change. Never end a turn on a question.
- Log every such call in `.claude/unattended-calls.md` the moment you make it.
  Write it under `## <item id>` as `- Q: … / Chose: … / Why: …`. Never keep it
  only in context.
- When decision-tracker is installed, store the call there too.
- A design approved during grooming counts as approved. Do not rerun the
  brainstorming conversation. An item with no approved design is not ready:
  park it.
- writing-plans' execution choice is subagent-driven-development.

## Parking

Park, do not decide, anything on this list: merge, release, deploy,
force-push, posting outside the operator's own repos, deleting data, a new
public API or breaking change, a step the design marks as needing the operator.

Parking means writing the question into `docs/planning/STATE.md` when it
exists, otherwise `.claude/unattended-run.md`, and moving on to the next item.
In queue mode, also set the item's `status` to `parked` and its `parkedReason`
in `.claude/unattended-queue.json`.

## Finishing

- An item is done only when its checks pass on the branch.
- A check that still fails after 3 fix attempts parks the item. Attach the
  failure.
- End each item at an open PR with a `## Unattended calls` section built from
  `.claude/unattended-calls.md`. Never merge.
