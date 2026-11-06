# ci-watch design

Date: 2026-11-06. Status: approved 2026-11-06. Builder check done.

## Intent

Once a PR is open, the suite currently stops. Nothing watches CI, nothing fixes
a red check, nothing merges a green PR, and nothing checks that a release
actually shipped. The operator ends up watching GitHub and reporting back
("CI is green", "it failed on lint") so the agent can carry on.

`ci-watch` lets CI results drive the work. The agent waits for the CI result as
an event, fixes red CI itself, merges a green PR when it has been asked to, and
follows a merged `feat:`/`fix:` through to the release. It is also the missing
piece of the milestone autopilot (`groom-milestone` → `ready-check` →
`unattended`): today an unattended run ends with a stack of PRs whose CI it has
never seen, and the operator works through them one by one.

The merge flow is adapted from `merge-when-green` in
[Devleaps/tempa-config-template](https://github.com/Devleaps/tempa-config-template)
(MIT), without its Tempa MCP calls.

## Goals

- One way to wait for CI that every skill uses, picked by session type, never a
  `sleep` loop.
- Red CI is fixed by the agent: reproduce, fix, push, wait again.
- "Merge when green" for a named PR, with the operator's squash-merge rules.
- Release follow-through after a merged `feat:`/`fix:`: the commit is counted in
  the release-please PR, the release PR is green, and after it merges, the tag
  and publish workflows succeed.
- Every opened PR starts the watch, including PRs opened by upstream
  `finishing-a-development-branch`, without editing upstream.
- An unattended milestone run merges each green phase PR and finishes the
  milestone, instead of leaving stacked PRs.

## Non-goals

- Merging release PRs, deploying, or anything that publishes. Release PRs are
  always the operator's call, in attended and unattended sessions alike.
- Renaming `unattended` to autopilot. Decided against for now (2026-11-06): it
  shipped in 1.29.0 two days ago with an env var and file names.
- Forking upstream superpowers. Upstream ships about monthly (v7.0.0 to 7.0.2 in
  four weeks); this suite keeps wrapping it with skills and hooks.
- CI systems other than GitHub Actions checks on GitHub PRs.

## Anti-goals

- Getting CI green by any means other than fixing the code: skipping or
  disabling a test, re-running a failed check until it passes, empty commits,
  `workflow_dispatch` runs, `gh pr merge --auto`, or a bypass of any rule other
  than the review requirement (see Merge stage).
- A squash merge that carries a `Co-Authored-By: Claude` trailer, a
  `claude.ai/code/session_*` link or a nested parenthesis into the merge
  commit. The first two break the operator's attribution rule; the third makes
  release-please silently drop the commit.
- A merge the operator did not ask for: another PR "on the way", or a request
  for one PR read as approval for a later one.
- A run that hangs forever on CI that never reports.

## Constraints

- Upstream skills (`finishing-a-development-branch`, brainstorming, ...) cannot
  be edited. Integration goes through hooks and this suite's own skills.
- Two session types with different waiting tools:
  - **Local CLI** has an authenticated `gh` (`gh pr checks --watch`).
    In an interactive session a `run_in_background` Bash command re-invokes the
    agent when it exits. In `claude -p` (how `unattended` runs) the process
    ends when the turn ends, so nothing can wake it later.
  - **Cloud sessions** have no `gh` for PRs and forbid `sleep` polling. They
    have `subscribe_pr_activity`, which delivers CI results and reviews as
    events that wake the session, and the GitHub MCP tools
    (`pull_request_read`, `merge_pull_request`). The `subscription.created`
    event carries the harness's own rules for handling PR events; `ci-watch`
    follows them and does not restate them.
- Rulesets only count checks from `pull_request` events, so a bot PR blocked by
  missing checks is reported, never "fixed" by triggering checks another way.
- The operator's repos are public and carry a default-branch ruleset that
  requires 1 approving review plus named status checks on an up-to-date branch
  (strict). Repository admins bypass it always. As the sole maintainer the
  operator cannot approve their own PRs, so every merge is an admin bypass of
  the review rule. `gh pr merge --admin` bypasses the checks as well, so the
  skill has to verify the checks itself before using it.
- Hooks are Node `.mjs` scripts that fail open, live under a skill's `scripts/`
  and are referenced by a path there (the harness-lab constraint from the
  `unattended` design).
- Plugin conventions: one plugin directory, an entry in
  `.claude-plugin/marketplace.json`, a README section, release-please.

## Approaches

1. **New `ci-watch` plugin: one skill plus a PR-creation hook (chosen).** The
   skill holds the waiting mechanism, the red-CI loop, the merge and the
   release follow-through. A `PostToolUse` hook fires when a PR is created and
   tells the agent to start watching. The hook is what catches PRs opened by
   upstream skills; the single skill keeps the cloud/local split in one place.
2. **The same skill, no hook.** Skills link to it and its description triggers
   on "PR opened". Simpler, but it depends on the agent remembering after an
   upstream skill finishes, which is the "sits there waiting" failure this
   removes.
3. **Each skill waits on its own.** Rejected: three copies of the session-type
   split that drift apart, and upstream skills stay uncovered.

The operator chose approach 1 (2026-11-06), with these calls:

- Attended: a "merge when green" request merges that one PR; release PRs
  always ask first.
- Unattended: merge each phase PR when green; release PRs stay parked. This
  reverses the 2026-11-04 `unattended` non-goal "never merge" for phase PRs.
- `--admin` only to pass the review rule, after the skill has verified every
  other rule itself, in both modes.
- Keep upstream superpowers; keep the name `unattended`.

## Decided

### Plugin layout

```text
plugins/ci-watch/
  hooks/hooks.json
  skills/ci-watch/
    SKILL.md
    scripts/pr-opened.mjs        PostToolUse hook
    scripts/ci-watch.mjs         pure functions the hook uses
    scripts/ci-watch.test.mjs
```

One skill, `ci-watch`, with three stages: **Wait**, **Merge**, **Release**.
Its description triggers on "merge when green", "merge this once CI passes",
"watch CI", "babysit this PR", a PR having just been opened, and the hook's
message. *(My call: one skill name, because the stages share the waiting
mechanism and the hook needs one target.)*

### The PR-creation hook

`PostToolUse`, matcher `Bash|mcp__.*__create_pull_request`. The script reads
the tool input and response:

- Bash: fires only when the command runs `gh pr create` and the output holds a
  PR URL.
- MCP: fires when the tool name ends in `create_pull_request` and the response
  holds a PR URL or number.

It returns `additionalContext`: "PR `<url>` was opened. Invoke `ci-watch` and run
its Wait stage for this PR." It never merges anything and never blocks; on any
error it does nothing. *(My call: matching on the tool response, not only the
command, avoids firing on a failed `gh pr create`.)*

The hook stays silent when `SUPERPOWERS_UNATTENDED=1`: the `unattended` skill
calls Wait itself, and a second trigger would run it twice. *(My call.)*

The hook only starts watching. Whether a merge was asked for comes from the
conversation ("open a PR and merge it when green"); nothing is persisted.
*(My call.)*

### Wait stage

Pick the mechanism once per PR:

| Session | Mechanism |
|---------|-----------|
| `SUPERPOWERS_UNATTENDED=1` (`claude -p`) with `gh` | Foreground `gh pr checks <n> --watch --interval 30` with the Bash timeout at its maximum (10 minutes), repeated until every check has finished. |
| Unattended without `gh` | No wait. The item ends at an open PR, as before this design, with "CI not watched: no gh" in the run file. |
| Interactive, `gh` available | The same command with `run_in_background`; the agent ends its turn and is re-invoked when the command exits. Without `run_in_background` (for example `claude -p` without the unattended variable), the foreground loop. |
| No `gh` for PRs (cloud) | `subscribe_pr_activity` for the PR, then end the turn; the CI event wakes the session. |

*(My call: unattended runs are `claude -p` sessions, which cannot be woken, so
they only ever use the foreground wait. That keeps the stop guard unchanged.)*

*(My call: `gh` is checked with `gh auth status` and a `gh pr view` of the PR,
since cloud sessions may have a `gh` binary that is limited to search.)*

Limits: the default wait is 60 minutes from the first watch. A repo can set its
own in `docs/planning/CONVENTIONS.md` as `**CI timeout:** <minutes>`, an
optional field that project-orchestration's CONVENTIONS template and
`scripts/check-conventions.mjs` learn (a positive integer; absent means 60).
When the
limit passes, the agent stops waiting and reports which checks are still
pending (attended) or parks the item (unattended). For the subscription
mechanism, the agent also schedules a single fallback wakeup at the limit
(`ScheduleWakeup` or `send_later`, whichever the session has), so a check that
never reports cannot hang the session. *(My call: 60 minutes covers this
suite's CI with margin; the fallback is the one non-event wake and it fires
once.)*

Outcomes:

- **All green:** go to Merge when a merge was asked for or the run may merge;
  otherwise report green and stop.
- **Pending is not green.** Keep waiting.
- **No checks at all:** report it and ask (attended) or park (unattended). No CI
  is not the same as green.
- **Red:** the red-CI loop below.
- **Blocked by missing required checks on a bot PR:** report it, with the
  reason that only `pull_request`-event checks count. Never trigger checks
  another way.

### Red-CI loop

1. Read the failing check and the first relevant lines of its log
   (`gh run view <run-id> --log-failed`, or the check-run output via MCP).
2. Reproduce it locally with the repo's own command for that check, and show
   it failing.
3. Fix the cause (`superpowers:systematic-debugging` applies), show the same
   command passing, commit and push.
4. Wait again.

Three failed fix rounds on the same PR end the loop: report with the failure
attached (attended) or park the item (unattended). *(My call: three matches the
unattended policy and systematic-debugging's "question the approach" point.)*
A failure that is clearly not caused by the branch (an outage, a flaky
external service) is reported, never re-run until green.

### Merge stage

Runs only on an explicit request for this PR (attended), or for a phase PR in
an unattended run. Never for any other PR.

1. Stop and say why when the PR is closed, merged, a draft, or conflicting.
   Conflicts are resolved on the branch, then Wait runs again.
2. Release PRs are never merged here. A PR is a release PR when its head branch
   starts with `release-please--` or the repo's `Released by` (CONVENTIONS.md)
   tool opened it. Attended: ask. Unattended: park.
3. Reviews and the admin bypass:
   - `APPROVED`, or empty because no review is required: plain merge.
   - `REVIEW_REQUIRED` with the review rule as the only unmet rule: merge with
     `--admin`, in attended sessions on the operator's explicit request for this
     PR and in unattended runs for phase PRs (operator's call, 2026-11-06). Before
     using it, verify from the ruleset or branch protection and the PR itself
     that every required status check has passed on the current head, the branch
     is up to date with the base when the rule is strict, there are no conflicts,
     and the operator's account is a bypass actor. `--admin` is never used to get
     past anything else.
   - `CHANGES_REQUESTED`, or any other unmet rule: stop and say what is missing
     (attended) or park (unattended).
   - A merge refused by GitHub: stop or park with GitHub's message. Never retry
     with another bypass.
4. Squash-merge with an explicit commit message: the PR title as subject,
   unchanged, and a body built from the branch's commit bodies by a pure,
   tested `sanitizeBody` function in `ci-watch.mjs`. It removes every
   `Co-Authored-By: Claude` trailer and `claude.ai/code/session_` link, and turns
   a parenthesis nested inside another parenthesised group into square brackets
   (`(As = typeof(IDetector))` becomes `(As = typeof[IDetector])`).
   *(My call: the title is a Conventional Commit whose scope parens are valid; the
   drop only happens in bodies. Brackets keep the meaning, and every nested
   group can be rewritten that way, so there is no "cannot sanitise" case.)* Use
   the repo's allowed method when squash is disabled. Delete the branch.
5. Confirm the PR shows as merged and note the merge commit.
6. Report: the PR, the checks that passed, the merge commit, and what the merge
   sets in motion.

### Release stage

After a merged commit whose type release-please counts (`feat`, `fix`, or a
breaking change) in a repo whose `Released by` is release-please:

1. Wait for the release PR to be created or updated (Wait stage on the release
   PR's checks).
2. Confirm the merged commit appears in the release PR's changelog. When it
   does not, report it as a likely parse drop and show the commit message.
3. Release PR green: ask the operator whether to merge it (attended), or record
   it in the run summary as waiting for the operator (unattended).
4. After the release PR merges, by the operator or on their explicit request,
   watch the workflow runs for the new tag and release. Report each one's
   conclusion. A failed publish is reported with its log lines; it is not
   re-run.

In an unattended run, steps 1 and 2 run once, after the last item: wait for the
release PR and confirm every commit the run merged is in its changelog. The
result goes into the run summary. *(My call: one wait per run instead of one per
item.)*

*(My call: checking the package registry itself is left out; the publish
workflow's conclusion is the signal. A registry check can follow once a repo
needs it.)*

### Changes to `unattended`

- `policy.md`: "merge" leaves the park list for the item's own PR once its CI
  is green and the Merge stage allows it, the review-only admin bypass
  included; release, deploy and force-push stay. "Never merge" becomes "never
  merge a release PR".
- `SKILL.md` queue mode, after step 7 (open the PR): run `ci-watch` Wait. Green
  and mergeable: run Merge and record the merge commit on the item. Red after
  three fix rounds, timeout, no checks, or a rule the Merge stage may not pass:
  the item ends as today, at an open PR, with the reason in
  `.claude/unattended-run.md`.
- The run's end summary lists each merge commit and the Release-stage result.
- The PR-body `## Unattended calls` section is still written before the merge,
  so it lands in the squash commit's PR link for the operator to review later.
- Branch point: when the `base` item was merged, the next item branches from the
  updated default branch and its PR targets the default branch. When the base
  item is `done` but not merged, it stacks on `unattended/<base>` as today.
- Queue item: a new `merged` field (merge commit SHA or `null`). `status` keeps
  its values. *(My call: a field, not a new status, so `openItem` and the
  stop guard keep working unchanged.)*
- Stop guard: unchanged, since unattended runs only use the foreground wait.
- `FALLBACK_POLICY` in `unattended.mjs` follows the new policy text.
- `## Never`: "Merge, release or force-push" becomes "Merge a release PR,
  release, deploy or force-push".

### Other skills

- `pre-push-review`: its integration table adds `ci-watch` after
  `finishing-a-development-branch`.
- `project-orchestration`: `complete-milestone` and the Commit & Release
  Protocol point to the Release stage when `Released by` is release-please.
  `start-next-phase` closes a phase whose `unattended/phase-N-M` branch was
  merged, using the ticked plan on the default branch.

### Credit

The skill's front matter comment and the README section credit
Devleaps/tempa-config-template (MIT) for the merge flow.

## Left to the builder

- The exact wording of the hook message and skill text, within the rules above.
- How `ci-watch.mjs` extracts PR URLs from tool responses, with tests for `gh pr
  create` output and both MCP response shapes.
- Test cases for `sanitizeBody`, including the AI.Sentinel line from the
  operator's CLAUDE.md.
- How the Merge stage reads the ruleset (`gh api repos/<o>/<r>/rulesets` and
  `gh pr view --json`), and the matching MCP calls in cloud sessions.
- Splitting the work into plan tasks and their order.
