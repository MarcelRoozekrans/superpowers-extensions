# Unattended run policy

No one will answer questions. Never wait for input. Apply these rules.

## Deciding

- Answer every question yourself, whether a skill asks it in plain text or
  through AskUserQuestion. Take the option marked "(Recommended)" when one is
  marked, otherwise the one closest to the approved design, then the smaller
  change. Never end a turn on a question.
- Log every such call in `.claude/unattended-calls.md` the moment you make it.
  Write it under `## <item id>` as `- Q: … / Chose: … / Why: …`. In single-item
  mode use `## <current branch name>`. Never keep it only in context.
- When decision-tracker is installed, store the call there too.
- A design approved during grooming counts as approved. Do not rerun the
  brainstorming conversation. An item with no approved design is not ready:
  park it.
- writing-plans' execution choice is subagent-driven-development.

## Parking

Park, do not decide, anything on this list: merging a release PR, release,
deploy, force-push, posting outside the operator's own repos, deleting data, a new
public API or breaking change, a step the design marks as needing the operator.

The item's own PR is not on this list. Merge it through `ci-watch` Merge when
its CI is green.

Parking means writing the question and moving on to the next item. In queue
mode, write it into `.claude/unattended-run.md` and set the item's `status` to
`parked` and its `parkedReason` in `.claude/unattended-queue.json`. In
single-item mode, write it into `docs/planning/STATE.md` when it exists,
otherwise `.claude/unattended-run.md`.

## Finishing

- An item is done only when its checks pass on the branch.
- A check that still fails after 3 fix attempts parks the item. Attach the
  failure.
- End each item at a PR, merged through `ci-watch` when green, with a `## Unattended calls` section built from
  `.claude/unattended-calls.md`. Never merge a release PR.
