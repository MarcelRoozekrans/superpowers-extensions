# unattended design

Date: 2026-11-04. Status: approved 2026-11-04. Builder check done.

## Intent

Groom the work while at the keyboard, then hand Claude Code a goal and walk away.
The run works through the groomed items without asking anything and ends at an
open PR per item, with a list of the calls it made on its own.

Today almost every step in the suite waits for a person: brainstorming's design
approval, writing-plans' execution choice, and `AskUserQuestion` all over. An
unattended `claude -p` session either stalls on these or guesses silently.

harness-lab already runs unattended Claude Code sessions (`claude -p`, permissions
bypassed, in a k3s-dev pod) and judges them by build and tests. It is the proving
ground for this mode: a skill that still stops to ask shows up as a failed or
empty run, and the policy wording can be tuned by Harness² against real tasks.

## Goals

- A **groomed item** format: an approved design, a plan, and runnable checks
  (build and test commands) that prove the item is done.
- A blocking **ready check** at the end of grooming that asks the operator every
  gap while they are still present, and queues only items that pass.
- An **unattended policy** that overrides the suite's ask-the-user gates without
  editing upstream superpowers: decide by rule, log each call, park unsafe items.
- A **run** skill that loops over the queued items, one branch and PR per item,
  that survives long runs through auto-compaction.
- Hooks and skills that harness-lab can install from `harness/base` unchanged.

## Non-goals

- Merging, releasing or deploying. A run ends at an open PR; merging stays with
  the operator, as the user's CLAUDE.md requires.
- Running the operator's real backlog inside harness-lab. harness-lab only grades
  and tunes the mode; real runs happen wherever Claude Code runs today.
- Copying a tuned policy back automatically. A person diffs and copies it.
- A backlog tool or tracker. Items live in the existing planning files.

## Anti-goals

- A run that decides something irreversible or outward-facing on the operator's
  behalf: a merge, a release, a post to a repo the operator does not own, a
  force-push.
- Silent decisions. Every call the run makes without the operator must be listed
  where the operator reviews the PR.
- A forked copy of upstream skills that drifts with every superpowers release.
- A run that "finishes" by shipping an empty or unchecked change. An item is only
  done when its checks pass.

## Constraints

- brainstorming, writing-plans, subagent-driven-development and `AskUserQuestion`
  come from upstream obra/superpowers and Claude Code; this repo cannot edit them.
  Instructions outrank skills, so the policy is delivered as injected
  instructions and enforced by a hook.
- harness-lab installs only `CLAUDE.md`, `.claude/skills/<name>/` (with
  `scripts/`), `.claude/agents/`, `scripts/*.py` and the `hooks` key of
  `.claude/settings.json`. It does not install plugins, and its sessions load no
  upstream superpowers skills. Hook scripts must live under a skill's `scripts/`
  and be referenced by a project-relative path there.
- Hooks in this repo are Node `.mjs` scripts that never fail a turn (see
  context-budget). The same holds here, with one exception: the `AskUserQuestion`
  hook denies on purpose.
- The release-please conventions of this repo apply: one plugin directory, an
  entry in `.claude-plugin/marketplace.json`, a README section.

## Approaches

1. **New `unattended` plugin: policy hook, enforcement hook, two skills (chosen).**
   A `SessionStart` hook injects the policy when the session runs unattended, a
   guarded `Stop` hook keeps a queue run from ending on a plain-text question, and a
   `PreToolUse` hook on `AskUserQuestion` refuses the call and tells the agent to
   take the Recommended option and log it. Skills `ready-check` and `run` cover
   the attended and unattended halves. Upstream stays untouched, the rule is
   enforced rather than only written, and the pieces drop into harness-lab.
2. **Inside project-orchestration.** `ready-check` and `run-unattended` as
   sub-skills, the policy as HARD-GATE text. Fewer plugins, but nothing enforces
   the policy, and it needs `docs/planning/`, which harness-lab tasks lack.
3. **Patch upstream skills with unattended branches.** Rejected: a fork of
   obra/superpowers to carry forward.

The operator chose approach 1, harness-lab as proving ground (not as the runner
for real work), decide-by-rule-and-log for open questions, and a blocking ready
check (2026-11-04).

## Decided

### Unattended switch

A session is unattended when `SUPERPOWERS_UNATTENDED=1` is set in its
environment. Both hooks read only this variable. *(My call: an env var is the one
switch harness-lab's substrate can set per rollout without touching the task
workspace, and a person starts a real run with
`SUPERPOWERS_UNATTENDED=1 claude -p "<goal>"`.)* Without it, both hooks do
nothing and the suite behaves as today.

### The policy (injected by `SessionStart`)

Short, imperative text, kept in one file (`policy.md`) so Harness² can tune it:

- No one will answer questions. Never wait for input.
- Where a skill asks the user to choose, take the option it marks
  "(Recommended)". If none is marked, take the one closest to the approved
  design, then the smaller change.
- Log every such choice as an **unattended call**: what was asked, what was
  chosen, why. Append it at once to the call log (below), never keep it only in
  context. The PR body's `## Unattended calls` section is built from that log;
  when decision-tracker is installed, calls are also stored there.
- A design approved during grooming counts as approved; do not re-run the
  brainstorming conversation. With no approved design, the item was not ready:
  park it.
- writing-plans' execution choice defaults to subagent-driven-development.
- **Park, do not decide,** anything on the unsafe list: merge, release, deploy,
  force-push, posting outside the operator's own repos, deleting data, a new
  public API or breaking change, a step the design marks as needing the operator.
  Parking writes the question into the run's state file and moves to the next
  item. In queue mode the state file is `.claude/unattended-run.md`.
- An item is done only when its checks pass on the branch. A check that still
  fails after three fix attempts parks the item with the failure attached.
  *(My call: three matches systematic-debugging's "three failed fixes, question
  the approach".)*
- End each item at an open PR. Never merge.

The policy also names the entry point: if a queue file exists and has an
open item, invoke the `unattended` skill and work the queue; otherwise treat the
session prompt as a single groomed item and invoke the same skill in single-item
mode.

### Call log

`.claude/unattended-calls.md`, one section per item (`## <item>`), one bullet
per call: question, choice, reason. Written by the agent as each call is made,
read when the PR body is written, kept across compaction because it is a file.
*(My call: a file survives subagents and compaction; context does
not.)* In single-item mode the section heading is the current branch name. In harness-lab the file sits under `.claude/`, which is excluded from the
graded diff.

### Enforcement (`PreToolUse` on `AskUserQuestion`)

When unattended, deny every `AskUserQuestion` call with a reason that restates
the decide-and-log rule and names the call log. Outside unattended mode, allow. On any internal error,
deny when unattended: an `AskUserQuestion` call passing through in an unattended
session stalls the run. This is the one hook in the repo that fails closed.

### Stop guard (`Stop` hook)

In `claude -p`, an agent that ends its turn with a plain-text question ends the
whole run, and the `AskUserQuestion` hook cannot see that. When unattended and in
queue mode with unfinished items in the queue, the `Stop` hook blocks the stop
with "no one will answer: decide by the policy, log the call, continue". It
blocks at most three times per item, counted as `stopBlocks` in the queue file; the fourth stop
parks the item and lets the run go on to the next one, and a stop with no items
left passes. Single-item mode stops normally, so a premature stop shows up in
harness-lab as a failed rollout. (Operator's call, 2026-11-04; the limit of three
is my call.)

### Groomed item

An item is a phase in `docs/planning/` (project-orchestration) or a standalone
plan in `docs/superpowers/plans/`, plus a `## Checks` section in its plan. A queued item may name an earlier item as its `base` (see the run below).

```markdown
## Checks

- build: `dotnet build -c Release`
- tests: `dotnet test -c Release --no-build`
```

Each check is a shell command that exits 0 when the item is done. This mirrors
the `checks` list of a harness-lab task.

### `ready-check` skill (attended)

Refuses to run when `SUPERPOWERS_UNATTENDED=1` is set: it exists to ask the
operator. *(My call.)* Runs at the end of grooming, when the operator says they are about to start a run
or asks "is this ready to run unattended". For each item it checks:

1. An approved design exists.
2. A plan exists and has a `## Checks` section with at least one command.
3. Checks named `build` run and pass at the base, from the repo root, with a
   timeout. Other checks are only checked for being present and non-empty.
   *(My call: a test check may fail at the base because the feature is missing;
   a build check may not. Running only builds avoids test side effects at grooming
   time and needs no "is this a test" heuristic.)*
4. No open questions in the design or plan (`TBD`, `?` headings, "left to the
   operator").
5. No plan step is on the unsafe list without being marked "park".

It asks the operator each gap right there, using AskUserQuestion with a
recommended option, and writes the answers back into the design or plan. Items
that still fail are not queued. For each item after the first it also asks whether the item builds on an
earlier queued item (recommended: the previous item when it is a later roadmap
phase, else none) and records the answer as the item's optional `base`. Output: a
queue file listing the ready items in order, and the exact command to start the
run. The run needs file edits, git, gh and the plan's check commands allowed in
a `permissions.allow` list, because `claude -p` cannot answer prompts;
`bypassPermissions` belongs only in a throwaway container or VM.

### `unattended` skill (the run)

Named `unattended` so the harness-lab copy at `.claude/skills/unattended/` keeps
the name harness-lab requires. *(My call.)* Entered from the policy's entry point
(above), never by trigger wording alone.

**Single-item mode** (no queue file, or a queue with no open item; every
harness-lab rollout): the session prompt is the item. Add `.claude/unattended-*`
to `.git/info/exclude` first, so the call log and run file are never committed.
Work on the current branch, follow the policy, run the repo's build and tests as
the checks if the prompt names none, and stop at a committed change; no PR. A
parked question goes to `docs/planning/STATE.md` when it exists, otherwise to
`.claude/unattended-run.md`.

**Queue mode:** the queue has `items` and at least one open item. At the start,
`.claude/unattended-*` goes into `.git/info/exclude`, so the queue, the call log
and the run file are never committed. For each queued item in order: branch from
the default branch, or from `unattended/<base>` with the PR against that branch
when the item has a `base` that is done; park the item with the reason
`base item <id> parked` when its base is parked. Execute the plan via
subagent-driven-development, run the checks, open a PR whose body lists the
unattended calls, update the run state, continue. Parked items are recorded with
their question and the run moves on. The run ends with a summary in
`.claude/unattended-run.md`: PRs opened, every parked item with its reason
(including items the stop guard parked), calls made.

A long run never hands off to a fresh session. Auto-compaction carries it, and
`SessionStart` re-injects the policy and the current item. *(Reason: a local
`claude -p` has no `create_session`, and the Stop guard and an untracked queue
in a new worktree would break a handoff.)*

In queue mode the run state lives in `.claude/unattended-run.md`. In
single-item mode a parked question goes to `docs/planning/STATE.md` when it
exists, otherwise to `.claude/unattended-run.md`.

### harness-lab fit

- `policy.md`, the hook scripts, and the `unattended` skill copy into
  `harness/base/.claude/skills/unattended/`, the hooks into
  `harness/base/.claude/settings.json`, and a trigger line into
  `harness/base/CLAUDE.md`.
- harness-lab's substrate sets `SUPERPOWERS_UNATTENDED=1` in `session_env`.
- A harness-lab task is a single groomed item, so harness-lab grades the policy
  and the single-item flow. Multi-item runs and `ready-check` (attended) are not
  graded there; they get a dogfood run on a real backlog.

## Left to the builder

- The exact policy wording, within the rules above; Harness² tunes it later.
- Detecting "approved design" and "open question" in files: a heuristic is fine,
  documented in the skill.
- The queue file's format and location.
- How the hooks find `policy.md` both as a plugin (`${CLAUDE_PLUGIN_ROOT}`) and
  as a copied harness-lab skill (project-relative path). The plugin README
  documents the copy; the copy itself is a harness-lab change.
- Tests for the hook scripts, in the style of context-budget's `*.test.mjs`.

## Left to harness-lab (separate repo, separate change)

- Setting `SUPERPOWERS_UNATTENDED=1` in the substrate.
- Which upstream superpowers skills to copy into `harness/base` so the policy
  has gates to override; without them, a rollout tests only the policy text.
