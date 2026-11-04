---
name: ready-check
description: Use when the operator says "ready to run unattended", "queue this for an unattended run", "I'm about to leave it running" or "is this ready to run unattended", and at the end of grooming when the operator signals an unattended run. Checks each item, asks about every gap, and writes the queue file and the start command. Skip during an unattended session. To run the queue, use unattended.
---

# Ready-check

Check that groomed work can run with no one to answer questions, then queue it. This skill asks the operator, so it is attended only.

If `SUPERPOWERS_UNATTENDED` is `1`, say that `ready-check` is for attended sessions and stop. Do nothing else.

## Collect the items

- When `docs/planning/` exists, take every phase in `ROADMAP.md` that is not `[status: complete]`, in roadmap order. Each phase names its plan on its `Plan:` line.
- Otherwise take the plans in `docs/superpowers/plans/` that the operator names, in the order named. Ask for the names when there are none.

An item whose `Plan:` line still says `_to be written_` has no plan. It fails check 2.

## The five checks

Run all five for every item.

1. **Approved design.** A spec in `docs/superpowers/specs/` for this item whose status line says approved, such as `Status: approved`. For a phase, the design that project-orchestration approved before the phase got its plan counts. Find it by the phase name or the plan's `**Spec:**` line. This is a heuristic: a spec with no status line, or one that says draft, fails.
2. **`## Checks`.** The plan has a `## Checks` section with at least one command.
3. **`build` checks pass at the base.** Run each check named `build` from the repo root, on the default branch or the branch the run will start from, with a 15-minute timeout. A build that fails or times out fails the item. Other checks are only checked for being present and non-empty. A test check may fail at the base because the feature is missing, and running only builds avoids test side effects while grooming.
4. **No open questions.** In the design and the plan, none of: `TBD`, a heading that ends in `?`, the words `left to the operator`. Also check them in prose.
5. **No unsafe step.** None of these appears in a plan step that is not marked `park`: merge, release, deploy, force-push, posting outside the operator's own repos, deleting data, a new public API or breaking change, a step the design marks as needing the operator. A step marked `park` is fine. The run parks it and moves on.

## Gaps

For each failed check, ask the operator with `AskUserQuestion`. Give labelled options and mark one `(Recommended)`. A good recommendation is the smallest edit that fixes the gap: mark the step `park`, drop the open question by stating the answer, or add the missing check.

Write each answer back into the design or the plan, then re-run the check it failed. Commit the edits as a `docs` change with the `plan` scope, following the repo's commit rules. Apply `anti-slop` to any prose you add.

An item that still fails after the operator has answered is not queued. Tell the operator which items were left out and why.

## Queue

Queue only the items that pass, in phase or plan order. Write `.claude/unattended-queue.json`:

```json
{
  "items": [
    {
      "id": "auth",
      "plan": "docs/superpowers/plans/2026-11-04-auth.md",
      "status": "queued",
      "stopBlocks": 0,
      "pr": null,
      "parkedReason": null
    }
  ]
}
```

- `id` is short and unique. It becomes the branch `unattended/<id>`.
- `plan` is the repo-relative path of the plan.
- Every item starts `queued` with `stopBlocks: 0`, `pr: null` and `parkedReason: null`.

If no item passes, write no queue file and say so. Remove no existing queue file without asking.

Then print the start command, with the goal filled in:

```bash
SUPERPOWERS_UNATTENDED=1 claude -p "Run the unattended queue: <goal>"
```

## Never

- Start the run. Print the command and stop.
- Queue an item that failed a check.
- Decide a gap for the operator without asking.
