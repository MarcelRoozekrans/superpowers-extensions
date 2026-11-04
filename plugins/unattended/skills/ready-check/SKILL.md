---
name: ready-check
description: Use when the operator says "ready to run unattended", "queue this for an unattended run", "I'm about to leave it running" or "is this ready to run unattended", and at the end of grooming when the operator signals an unattended run. Checks each item, asks about every gap, and writes the queue file and the start command. Skip during an unattended session. To run the queue, use unattended.
---

# Ready-check

Check that groomed work can run with no one to answer questions, then queue it. This skill asks the operator, so it is attended only.

If `SUPERPOWERS_UNATTENDED` is `1`, say that `ready-check` is for attended sessions and stop. Do nothing else.

## Collect the items

- When `docs/planning/` exists, take the phases of the active milestone in `ROADMAP.md` that are not `[status: complete]`, in roadmap order. The operator can name another milestone, or say "all" to take every non-complete phase in the roadmap. Each phase names its plan on its `**Plan:**` line. A phase's queue `id` is `phase-N-M`, such as `phase-1-2`.
- Otherwise take the plans in `docs/superpowers/plans/` that the operator names, in the order named. Ask for the names when there are none.

A phase with no `**Plan:**` line, or an empty one, has no plan. It fails check 2.

## The five checks

Run all five for every item.

1. **Approved design.** A spec in `docs/superpowers/specs/` for this item whose status line says approved, such as `Status: approved` or the bold form `**Status:** approved`. For a phase, the design that project-orchestration approved before the phase got its plan counts. Find it by the phase name or the plan's `**Spec:**` line. This is a heuristic: a spec with no status line, or one that says draft, fails.
2. **`## Checks`.** The plan has a `## Checks` section with at least one command.
3. **`build` checks pass at the base.** A build check is a bullet under `## Checks` in the form ``- build: `cmd` ``, labelled `build` before the colon. Run each one from the repo root, on the default branch or the branch the run will start from, with a 15-minute timeout. A build that fails or times out fails the item. Other checks, such as `test` and ``- guard N.M: `cmd` ``, are only checked for being present and non-empty. A test check may fail at the base because the feature is missing. A guard check exercises the interfaces of a later phase, so it may fail at the base too. Running only builds avoids test side effects while grooming.
4. **No open questions.** Search the design and the plan, headings and body, for the word `TBD` (case-sensitive), for any heading line that ends in `?`, and for the phrase `left to the operator`. A `**Builds on:**` line in the design that still holds a template placeholder, a literal `Phase N.M` or a `<...>`, counts as an open question too. Any hit fails the item.
5. **No unsafe step.** None of these appears in a plan step that is not marked `park`: merge, release, deploy, force-push, posting outside the operator's own repos, deleting data, a new public API or breaking change, a step the design marks as needing the operator. A step marked `park` is fine. The run parks it and moves on.

## Gaps

For each failed check, ask the operator with `AskUserQuestion`. Give labelled options and mark one `(Recommended)`. A good recommendation is the smallest edit that fixes the gap: mark the step `park`, drop the open question by stating the answer, or add the missing check.

Write each answer back into the design or the plan, then re-run the check it failed. Commit the edits as a `docs` change with the `plan` scope, following the repo's commit rules. Apply `anti-slop` to any prose you add.

An item that still fails after the operator has answered is not queued. Tell the operator which items were left out and why.

## Queue

Queue only the items that pass, in phase or plan order. For each item after the first, ask the operator with `AskUserQuestion` whether it builds on an earlier queued item. For a phase, read the `**Builds on:**` line of its design and recommend the latest queued phase it names. A phase that names none falls back to the previous queued item when it is a later roadmap phase. Ignore named phases that are `[status: complete]`, since their code is merged; when every named phase is complete, recommend `null`. A named phase that is neither complete nor queued cannot be built on: ask the operator with `AskUserQuestion` and recommend leaving this item out. For a plan, or when nothing applies, recommend none. Record the answer as `base`. Write `.claude/unattended-queue.json`:

```json
{
  "items": [
    {
      "id": "auth",
      "plan": "docs/superpowers/plans/2026-11-04-auth.md",
      "base": null,
      "status": "queued",
      "stopBlocks": 0,
      "pr": null,
      "parkedReason": null
    }
  ]
}
```

- `id` is short and unique. It becomes the branch `unattended/<id>`. For a phase it is `phase-N-M`, so `start-next-phase` finds the branch `unattended/phase-N-M`.
- `plan` is the repo-relative path of the plan.
- `base` is the `id` of an earlier item this one builds on, or `null`. The run branches from `unattended/<base>` and opens the PR against that branch. When the base item is parked, this item is parked too.
- Every item starts `queued` with `stopBlocks: 0`, `pr: null` and `parkedReason: null`.

If no item passes, write no queue file and say so. If `.claude/unattended-queue.json` already exists, ask the operator before replacing it.

Then print the start command, with the goal filled in:

```bash
SUPERPOWERS_UNATTENDED=1 claude -p "Run the unattended queue: <goal>"
```

The run needs file edits, git, gh and the plan's check commands allowed without a prompt, because `claude -p` cannot answer one. Put them in a `permissions.allow` list in the project's `.claude/settings.json`. Use `--permission-mode bypassPermissions` only inside a throwaway container or VM.

## Never

- Start the run. Print the command and stop.
- Queue an item that failed a check.
- Decide a gap for the operator without asking.
