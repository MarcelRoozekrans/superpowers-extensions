---
name: unattended
description: Use in an unattended session, when SUPERPOWERS_UNATTENDED=1 is set or the session start text names the unattended policy, and when asked to "run the queue unattended". Works a queue of groomed items, or a single groomed prompt, without asking anyone anything. Skip for attended work. To groom items first, use ready-check.
---

# Unattended

Run groomed work with no one to answer questions.

If `SUPERPOWERS_UNATTENDED` is not `1`, say so and stop. This skill is for unattended sessions only.

The rules live in [policy.md](policy.md), which the session start hook has already injected. Follow them. This file only sets the order of work.

## Pick the mode

- **Queue mode:** `.claude/unattended-queue.json` exists, parses as JSON and has an `items` array. Work the queue.
- **Single-item mode:** anything else, including a queue file that cannot be read as JSON or has no `items` array. The session prompt is the item.

## Queue mode

The queue is `{ "items": [...] }`. Each item has an `id`, a `plan`, a `pr` (null until the PR is open) and a `status` of `queued`, `running`, `done` or `parked`. The next item is the first one with status `running`, otherwise the first `queued` one. For each item:

1. Set its `status` to `running` in the queue file.
2. Branch from the default branch as `unattended/<id>`. If that branch already exists, as for an item still `running` after a resume, check it out instead.
3. Execute the plan with `superpowers:subagent-driven-development`.
4. Run each command under the plan's `## Checks`. A failing check gets three fix attempts. If it still fails, park the item as described under Parking, with the failure as its `parkedReason`.
5. Open a PR. Add a `## Unattended calls` section to the body, copied from this item's `## <id>` section in `.claude/unattended-calls.md`. Apply `anti-slop` to the prose when it is installed.
6. Set the item to `done` and set `pr` to the PR URL, then take the next item.

A parked item does not stop the run. Continue with the next one.

### Parking

Set `status: parked` and `parkedReason` on the item. Write the question into `docs/planning/STATE.md` when that file exists, otherwise `.claude/unattended-run.md`. Then continue with the next item.

### Handoff

Hand off to a fresh session only at an item boundary, never in the middle of an item. Follow the handoff recipe in `context-budget`. The new session's prompt runs with the same environment and says `continue the unattended queue`.

### End of the run

When no item is `queued` or `running`, write a summary to the state file named above: the PRs opened, the parked items with their questions, and the number of calls made, which is the count of bullets in `.claude/unattended-calls.md`. Then stop. The stop guard allows it because no item is open.

## Single-item mode

1. Work on the current branch.
2. Use the checks the prompt names. If it names none, use the repo's build and test commands.
3. Log every call as the policy says.
4. End at a commit. Open no PR and write no queue.

## Never

- Merge, release or force-push.
- Run `ready-check`. It asks questions and is for attended sessions.
