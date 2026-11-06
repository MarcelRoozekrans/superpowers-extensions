---
name: unattended
description: Use in an unattended session, when SUPERPOWERS_UNATTENDED=1 is set or the session start text names the unattended policy, and when asked to "run the queue unattended". Works a queue of groomed items, or a single groomed prompt, without asking anyone anything. Skip for attended work. To groom items first, use ready-check.
---

# Unattended

Run groomed work with no one to answer questions.

If `SUPERPOWERS_UNATTENDED` is not `1`, say so and stop. This skill is for unattended sessions only.

The rules live in [policy.md](policy.md), which the session start hook has already injected. Follow them. This file only sets the order of work.

## Pick the mode

- **Queue mode:** `.claude/unattended-queue.json` parses as JSON, has an `items` array and has an open item, one with status `running` or `queued`. Work the queue.
- **Single-item mode:** anything else, including a queue file that cannot be read, has no `items` array or has no open item. The session prompt is the item.

## Queue mode

The queue is `{ "items": [...] }`. Each item has an `id`, a `plan`, an optional `base` (the `id` of an earlier item), a `pr` (null until the PR is open), a `merged` (null until the PR is merged, then the merge commit SHA) and a `status` of `queued`, `running`, `done` or `parked`. The next item is the first one with status `running`, otherwise the first `queued` one.

Before the first item, add `.claude/unattended-*` to `.git/info/exclude` unless it is already there. The queue, the calls log and the run file are then never committed and survive branch switches.

For each item:

1. Set its `status` to `running` in the queue file.
2. Pick the branch point. No `base`: run `git fetch origin` and branch from `origin/<default>`. A `base` item that is `done` with `merged` set: run `git fetch origin`, branch from `origin/<default>`, and the PR targets the default branch. A `base` item that is `done` without `merged`: the branch `unattended/<base>`, and the PR targets that branch. A `base` item that is `parked`: park this item with the `parkedReason` `base item <id> parked`, and take the next item.
3. Branch as `unattended/<id>`. If that branch already exists, as for an item still `running` after a resume, check it out instead.
4. Execute the plan with `superpowers:subagent-driven-development`.
5. Run each command under the plan's `## Checks`. A failing check gets three fix attempts. If it still fails, park the item as described under Parking, with the failure as its `parkedReason`.
6. Tick the plan. `subagent-driven-development` tracks progress outside the plan file, so its task checkboxes are still `- [ ]`. Set every one to `- [x]`, re-read the plan to confirm none is left open, and commit it on the item's branch, following the repo's commit rules. When the PR is merged, by the run through ci-watch or by the operator, the ticked plan reaches the default branch, and `start-next-phase` closes the phase from it.
7. Open a PR. Add a `## Unattended calls` section to the body, copied from this item's `## <id>` section in `.claude/unattended-calls.md`. Apply `anti-slop` to the prose when it is installed. Set the item's `pr` to the PR URL as soon as the PR is open.
   No remote: write the PR body to `.claude/unattended-run.md` and leave `pr` null.
8. No PR (step 7 had no remote and `pr` is null): skip this step. Otherwise run `ci-watch` Wait on the PR, using its foreground mechanism. Without `gh`, write "CI not watched: no gh" to `.claude/unattended-run.md` and go on. When CI is green and the Merge stage allows it, run Merge and set the item's `merged` to the merge commit SHA. Red CI follows the `ci-watch` Red CI loop. After its three failed fix rounds, park the item with the failure as its `parkedReason` and the details in `.claude/unattended-run.md`. This step is the only authority for the item's status: `ci-watch` returns an outcome and a reason and never parks. A timeout, no checks, Merge rules not met, a release PR or rules that cannot be read all leave the PR unmerged, and the item ends `done` at its open PR with no `merged`, the reason in `.claude/unattended-run.md`. Dependents then stack on `unattended/<base>`.
9. Set the item to `done`, keeping `pr` and `merged` as recorded, then take the next item. A parked item stays `parked`.

A parked item does not stop the run. Continue with the next one.

### Parking

Set `status: parked` and `parkedReason` on the item. Write the question into `.claude/unattended-run.md`. Then continue with the next item.

### Long runs

Never hand off to a fresh session during an unattended run. Auto-compaction carries a long run. The session start hook fires again on compaction and re-injects the policy and the current item.

### End of the run

When no item is `queued` or `running`, write a summary to `.claude/unattended-run.md`. Read the queue first. List the PRs opened and every parked item with its `parkedReason`, including items the stop guard parked, which have a reason but no question. Run `ci-watch` Release steps 1 and 2 once for the commits the run merged, and list the merge commits and the Release result. Add the number of calls made, which is the count of bullets in `.claude/unattended-calls.md`. Then stop. The stop guard allows it because no item is open.

## Single-item mode

1. Add `.claude/unattended-*` to `.git/info/exclude` unless it is already there, so the calls log and run file are never committed. Work on the current branch.
2. Use the checks the prompt names. If it names none, use the repo's build and test commands.
3. Log every call as the policy says.
4. A parked question goes to `docs/planning/STATE.md` when it exists, otherwise `.claude/unattended-run.md`.
5. When the item is a plan and its checks pass, tick the plan as queue mode step 6 does, before the final commit.
6. End at a commit. Open no PR and write no queue.

## Never

- Merge any PR but the item's own, merge a release PR, release, deploy or force-push.
- Run `ready-check`. It asks questions and is for attended sessions.
