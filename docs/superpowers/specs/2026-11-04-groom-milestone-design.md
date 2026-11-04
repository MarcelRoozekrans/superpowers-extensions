# groom-milestone design

Date: 2026-11-04. Status: approved 2026-11-04. Builder check done.

## Intent

The `unattended` plugin (#175) runs groomed work with no one at the keyboard,
but it only queues items that already have an approved design, a plan with
`## Checks`, and no open questions. On a project-orchestration project nothing
produces that for a whole milestone: `start-next-phase` brainstorms, plans and
then executes one phase at a time, so every phase still needs the operator
present.

`groom-milestone` is a new project-orchestration sub-skill that front-loads every
question for one milestone. For each pending phase, in roadmap order, it runs the
phase brainstorm, the Surface pre-plan hook and writing-plans, and stops before
execution. It ends by handing to `ready-check`. The operator answers everything
in one sitting, walks away, and an unattended run builds the milestone.

Scope is **one milestone**, not the roadmap (operator, 2026-11-04). Plans written
against unbuilt code are guesses; grooming one milestone, running it, then
grooming the next keeps the guessing to one milestone deep.

## Goals

- Groom every pending phase of the active milestone: approved design, Surface
  artifacts, plan with `## Checks`, no execution.
- Groomed phases are buildable both ways (operator, 2026-11-04): queued for an
  unattended run, or built attended through `start-next-phase`.
- A later phase that builds on an earlier, unbuilt phase is designed against that
  phase's plan, and the earlier phase carries a guard check that fails if its
  interfaces drift (operator, 2026-11-04).
- ROADMAP.md stays truthful across a run: built phases are marked complete when
  their PR merges (operator, 2026-11-04), and are never offered for a rebuild
  while their PR is open.
- `ready-check` queues the active milestone by default and passes groomed phases.

## Non-goals

- Grooming more than one milestone at a time.
- Executing anything during grooming.
- Changing upstream superpowers skills. Overrides live in project-orchestration,
  as the existing brainstorming override does.
- Having the unattended run write ROADMAP.md. Phase state changes only on the
  default branch, after merge.

## Anti-goals

- A groomed phase that `ready-check` still rejects for a reason grooming could
  have fixed (missing status line, missing checks, open question).
- A run that builds Phase 1.2 on top of a Phase 1.1 whose interfaces moved,
  without anything failing.
- Grooming that can only finish in one session. A milestone of five phases is
  five full brainstorms.
- A new phase status value. The three existing ones are exhaustive in
  `state-files.md` and mapped to labels by `sync-github`.

## Constraints

- Upstream brainstorming ends with "invoke writing-plans and no other skill"; the
  existing HARD-GATE paragraph already returns control to project-orchestration
  when it drives brainstorming. `groom-milestone` is added to the list of drivers
  there.
- Upstream writing-plans asks for an execution method, unless one was supplied
  up front, in which case it only asks the operator to review the plan and waits.
  `groom-milestone` supplies the method up front ("built later, by an unattended
  run or start-next-phase"), so the operator reviews each plan and nothing runs.
- `ready-check` check 1 needs a status line that says approved. The phase design
  template has none today.
- `ready-check` check 3 runs only `build` checks at the base. Guard and test
  checks are only checked for presence, so they may fail at the base.
- Commits follow the Commit & Release Protocol (CONVENTIONS.md), with no Claude
  signature or session URL.

## Approaches

- **A. Own sub-skill in project-orchestration (picked).** A `## groom-milestone`
  section in `SKILL.md` beside `start-next-phase` and `new-milestone`, plus small
  edits to the routing, `complete-phase`, the plan rules, the phase template,
  `state-files.md` and `ready-check`. Keeps the phase lifecycle in one skill;
  `unattended` stays a thin consumer of ROADMAP.md. Costs about 80 more lines in
  an 1,147-line file.
- **B. A `groom` skill in the unattended plugin.** Couples the plugins backwards:
  unattended would drive project-orchestration's brainstorm, hooks and plan rules,
  and attended grooming would live in a plugin called unattended.
- **C. A groom mode of `start-next-phase`.** Least new surface, but it bends that
  sub-skill's "do not stop between links" rule and makes the busiest routing table
  in the suite harder to read.

Operator picked A on 2026-11-04.

## Design

### `groom-milestone` sub-skill

**Triggers:** "groom the milestone", "groom milestone N", "prep this milestone
for an unattended run", "answer everything up front". `new-milestone`'s closing
announce line also offers it. *(My call.)*

**Pre-condition:** a milestone is `[status: active]` in ROADMAP.md. Otherwise
refuse and point at `new-milestone`.

**Process:**

1. Read ROADMAP.md, MILESTONE.md and CONVENTIONS.md. Run `complete-phase` for any
   phase it would close (same rule as `start-next-phase` step 1).
2. Make sure CONVENTIONS.md has the check commands (see Checks below). If not, ask
   once and write them.
3. List the active milestone's phases that are not `complete` and have no plan
   on disk. These are the phases to groom. A phase that already has a plan is
   not groomed again, but it gets the repairs `ready-check` would otherwise
   reject it for: a missing `**Plan:**` line is written, a spec without
   `**Status:** approved` gets the operator's approval and the line, a plan
   without `## Checks` gets one per the plan rules below, and a `**Builds on:**`
   entry whose earlier plan has no matching `guard` check gets step 4.5. These
   repair a groom that was interrupted between writing a plan and committing,
   and plans written before grooming existed. *(My call.)* If the list is
   empty, skip to step 6.
4. For each phase in roadmap order:
   1. **Design.** No design spec: read `superpowers:brainstorming` and follow it at
      phase scope with `templates/phase-design.template.md`, as `start-next-phase`
      does. Verify the spec and its `**Surface:**` line. On the operator's approval,
      set `**Status:** approved YYYY-MM-DD` in the spec. A spec that exists but is
      not approved gets the operator's approval now, or a re-run of the brainstorm.
   2. **Builds on.** If the phase uses anything an earlier, not-yet-complete phase
      of this milestone creates, the design names it on a `**Builds on:**` line
      (see Later phases) and uses the names and signatures that phase's plan fixed.
   3. **Surface pre-plan hook.** Exactly as `start-next-phase` step 5.
   4. **Plan.** Read `superpowers:writing-plans` and follow it, supplying the
      execution method up front: "built later by an unattended run or by
      start-next-phase; do not execute". The plan follows the plan rules below
      (including `## Checks`). Verify the plan file, then write the phase's
      `**Plan:**` line in ROADMAP.md. The phase stays `[status: pending]`.
   5. **Guard checks.** For each `**Builds on:**` entry, append a guard check to the
      earlier phase's plan (see Later phases), creating its `## Checks` section
      per the plan rules if it is absent.
   6. **Commit** the spec, plan, ROADMAP.md edit and any guard-check edits as one
      `docs` commit per phase, scope `plan`, per the Commit & Release Protocol.
      Verify a clean tree.
5. Between phases, apply the session handoff rule (`context-budget`
   `## Fresh-Session Handoff`). A finished phase groom is a natural break. On
   handoff, `pause-work` records `Grooming: milestone N, next phase N.M` in
   STATE.md, and the new session re-enters `groom-milestone`, which resumes at
   step 3 because groomed phases have plans. *(My call.)*
6. Hand off to `ready-check`, if the unattended plugin is installed: "Milestone N
   is groomed. Run `ready-check` to queue it, or `start-next-phase` to build it
   attended." Do not invoke it unasked; the operator may want to build attended.
   *(My call.)*

**Never:** execute a plan, set a groomed phase `active`, groom a phase outside the
active milestone, or start an unattended run.

### Groomed phase

A phase is **groomed** when it is `[status: pending]`, its design spec says
`**Status:** approved`, and its `**Plan:**` file exists. No new status value.
`state-files.md` documents this definition and the `**Builds on:**` line.

### Phase design template

`templates/phase-design.template.md` gains `**Status:** draft` in its header
block. Whoever records the operator's approval (`groom-milestone`, or
`start-next-phase` on the attended path) sets it to `**Status:** approved
YYYY-MM-DD`. Specs written before this change have no status line; on the
attended path that is not an error. `ready-check` fails them, and its gap
question offers to add the line.

### Plan rules

The HARD-GATE paragraph "Writing-plans when this skill drives it" gets one rule:
every plan ends with a `## Checks` section in the format `unattended` defines,
with at least one ``- build: `cmd` `` bullet and one ``- tests: `cmd` `` bullet,
taken from CONVENTIONS.md. Every plan gets this, not just groomed ones. The
section costs one bullet list, and an attended plan can later be queued without
editing. *(My call.)*

### Checks in CONVENTIONS.md

CONVENTIONS.md gains two optional lines, ``**Build:** `cmd` `` and
``**Test:** `cmd` ``, documented in `templates/conventions.template.md` and filled
by `init-conventions`. `groom-milestone` asks for them once, proposing commands
found in the repo (package.json scripts, a `.sln`, a Makefile), when they are
missing. *(My call: the commands are a project convention, they must survive the
handoff between phases, and the next milestone reuses them.)*

### Later phases

Phase 1.2's design is written against Phase 1.1's plan, not its code:

- 1.2's design spec gets a line `**Builds on:** Phase 1.1 —` followed by the
  interfaces it uses, such as the type, function, endpoint or table names 1.1's plan
  fixes. 1.2's plan uses exactly those names.
- `groom-milestone` appends one guard check per `Builds on` entry to 1.1's
  `## Checks`: ``- guard 1.2: `cmd` ``. It is a build or test command that exercises
  those interfaces, normally a test 1.1's plan already adds. If none exists, the
  guard adds a step to 1.1's plan that writes one. The label `guard` shows
  `ready-check` the check may fail at the base.
- A `Builds on` phase that is already `active` still gets the guard check. If a
  new test step is needed, it goes into the plan as an unticked task, and the
  execution in flight picks it up. *(My call.)*
- `insert-phase` and `remove-phase` renumber phases, so they rewrite the
  `**Builds on:** Phase N.M` lines and `guard N.M` labels in the active
  milestone's specs and plans to the new numbers. A renumbered phase with an
  `unattended/phase-N-M` branch or open PR gets a warning, not a rename.
- At run time, if 1.1 drifts from its plan, its guard check fails, three fix
  attempts later 1.1 parks, and 1.2 parks with it through `base`. Nothing builds
  on a moved interface.
- `ready-check` recommends as `base` the phase named on the `Builds on` line. It
  falls back to the previous item only when there is none. A phase with several
  `Builds on` entries takes the latest of them as its base.

### Routing changes in `start-next-phase`

- **Step 1** closes any phase in the current milestone, `active` or `pending`, whose
  plan exists, has at least one checkbox, and is fully ticked. This is the
  merge-time close (operator, 2026-11-04): after the operator merges a run's PR,
  the ticked plan is on the default branch. The "at least one checkbox" rule also
  goes into `complete-phase`, so a plan with no checkboxes is never closed by
  default. *(My call.)*
  The executors do not tick the plan: superpowers `executing-plans` and
  `subagent-driven-development` track progress in a ledger and todo list. So
  the unattended run ticks the plan on its branch before it opens the PR, and
  `start-next-phase` ticks it when attended execution returns clean, then runs
  `complete-phase`.
- **New check before routing:** for a phase that is not complete, look for an
  open PR from `unattended/phase-N-M`, using
  `gh pr list --head unattended/phase-N-M --state open` when `gh` works.
  *(My call: the git side, not the queue file, because the queue may live in
  another container.)*
  - Open PR: report "Phase N.M has an open unattended PR: `<url>`. Review and merge
    it, then continue." and move to the next phase.
  - Merged PR (`gh pr list --head unattended/phase-N-M --state merged`): the run
    built the phase. Once the merge is on the current branch, run
    `complete-phase` for it. Never treat it as unbuilt.
  - The branch exists but has no open PR, because the run parked the phase or
    the PR was closed unmerged: treat the phase as unbuilt and route it normally.
    Name the branch so the operator can look at it first.
  - No `gh`: fall back to checking whether the branch exists on `origin`, and
    say that the PR state is unknown.
- **Builds on while skipping:** a later phase whose `**Builds on:**` names a
  phase that is not complete waits too. "Phase 1.2 waits on Phase 1.1." Phases
  that build on nothing pending still proceed. On the attended path this keeps
  1.2 from being built without 1.1's code. *(My call, following the anti-goal.)*
- **New row:** `pending` | design exists | plan exists → set `[status: active]`
  (existing transition) → `list-phase-assumptions` → execution. This is the
  attended path for a groomed phase.
- The HARD-GATE brainstorming paragraph lists `groom-milestone` among its drivers.

### `complete-phase`

Accepts `pending` as well as `active`, so a phase built by an unattended run can be
closed after merge without a manual `active` step. Pre-condition, refusal text and
the ROADMAP/MILESTONE transitions are updated to match.

### `ready-check` (unattended plugin)

- **Collection:** with `docs/planning/`, take the non-complete phases of the
  active milestone, in roadmap order. The operator can name another milestone,
  or say "all". This replaces "every phase in ROADMAP.md that is not complete".
- **Check 1** accepts the bold form `**Status:** approved` as a status line.
- **Check 3** runs only `build` checks, as now. A `guard` check is presence-only,
  like a test check.
- **Queue ids** for phases are `phase-N-M`, such as `phase-1-2`, so the branch is
  `unattended/phase-1-2` and `start-next-phase` can find it.
- **Base:** recommended from `Builds on`, as above.

## Out of scope

- How stacked PRs are merged and retargeted after a run. That belongs to the
  `unattended` design: it opens 1.2's PR against `unattended/phase-1-1`, and
  merging bottom-up is the operator's job. `groom-milestone` changes nothing
  there.

## Left to the builder

- Exact wording of the new SKILL.md section, the announce line, Quick Reference
  and Relationship-table rows, the Red Flags and rationalizations for grooming.
- The exact text of the execution method supplied to writing-plans.
- How `pause-work` and `resume-work` show the `Grooming:` line in STATE.md.
- The README entries for both plugins, and the evals: a baseline run of grooming
  a two-phase milestone without the skill, then the green run, in
  `docs/superpowers/evals/` as the other skills do.
- The order of the change into commits and PRs.
