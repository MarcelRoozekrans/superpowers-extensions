---
name: ci-watch
description: Use when asked to "merge when green", "merge this once CI passes", "watch CI" or "babysit this PR", when a PR was just opened, and when the ci-watch hook says a PR was opened. Waits for CI as an event, fixes red CI, merges a green PR that was asked for, and follows a merged feat or fix to its release. Skip for merging release PRs, which is always the operator's call.
---

<!-- The Merge stage is adapted from merge-when-green in Devleaps/tempa-config-template (MIT). See NOTICE.md. -->

# CI Watch

Let CI results drive the work. Three stages: **Wait**, **Merge**, **Release**. The hook starts Wait when a PR is opened. It never merges; a merge happens only when the operator asked for it for this PR, or for the run's own item PR in an unattended run.

In an unattended run `ci-watch` never parks anything and never sets an item status. It returns an outcome (merged, red after three fix rounds, timed out, no checks, rules not met, release PR, rules unreadable) and a reason to the `unattended` skill, whose queue step 8 decides what happens to the item.

Credit: the merge flow is adapted from `merge-when-green` in [Devleaps/tempa-config-template](https://github.com/Devleaps/tempa-config-template) (MIT), without its Tempa MCP calls. See [NOTICE.md](NOTICE.md).

## Wait

Pick the mechanism once per PR. Probe `gh` with `gh auth status` and `gh pr view <n>`: a cloud session can have a `gh` binary that only searches.

| Session | Mechanism |
|---------|-----------|
| `SUPERPOWERS_UNATTENDED=1` with `gh` | Foreground `gh pr checks <n> --watch --interval 30` with the Bash timeout at its maximum of 10 minutes, repeated until every check has finished. |
| Unattended without `gh` | No wait. The item ends at an open PR, with "CI not watched: no gh" in the run file. |
| Interactive with `gh` | The same command with `run_in_background`, then end the turn; you are re-invoked when it exits. Without `run_in_background`, use the foreground loop. |
| No `gh` for PRs, as in cloud sessions | `subscribe_pr_activity` for the PR, then end the turn; the CI event wakes the session. |

In a repo that CodeRabbit reviews, run the `coderabbit-merge` skill before the Merge stage.

Never use a `sleep` loop. In a cloud session follow the rules in the `subscription.created` event for handling PR events; do not restate or override them here.

Limit: wait at most 60 minutes from the first watch. A repo can set its own in `docs/planning/CONVENTIONS.md` as `**CI timeout:** <minutes>`. The value is a positive integer; a bare number and `60 (defaulted)`, as `init-conventions` records it, both mean 60. When the limit passes, stop waiting and report which checks are still pending. When unattended, return "timed out" with those checks as the reason. For the subscription mechanism, also schedule one fallback wakeup at the limit, with `ScheduleWakeup` or `send_later`, whichever the session has, so a check that never reports cannot hang the session. It fires once.

Outcomes:

- **All green:** go to Merge when a merge was asked for or the run may merge. Otherwise report green and stop.
- **Pending is not green.** Keep waiting.
- **No checks at all:** report it and ask when attended; return "no checks" when unattended. No CI is not green.
- **Red:** run the Red CI loop.
- **Blocked by missing required checks on a bot PR:** report it, with the reason that only `pull_request` event checks count. Never trigger checks another way.

## Red CI

1. Read the failing check and the first relevant log lines: `gh run view <run-id> --log-failed`, or the check-run output through MCP.
2. Reproduce it locally with the repo's own command for that check, and show it failing.
3. Fix the cause, with `superpowers:systematic-debugging`. Show the same command passing, then commit and push.
4. Wait again.

Three failed fix rounds on the same PR end the loop: report with the failure attached. When unattended, return "red after three fix rounds" with the failure; the `unattended` skill parks the item. A failure clearly not caused by the branch, such as an outage or a flaky external service, is reported. Never re-run a check until it turns green.

## Merge

Runs only on an explicit request for this PR, or for the run's own item PR in an unattended run. Never for any other PR.

1. Stop and say why when the PR is closed, merged, a draft or conflicting. Resolve conflicts on the branch, then Wait again. A PR that is only behind the base with no conflicts (`mergeStateStatus` `BEHIND`) is brought up to date with `gh pr update-branch <n>`, or `update_pull_request_branch` through MCP, then Wait again.
2. Never merge a release PR. It is one when its head branch starts with `release-please--` or the tool named in `Released by` in `docs/planning/CONVENTIONS.md` opened it. Ask when attended; return "release PR" when unattended.
3. Read the reviews and rules. Every merge runs this whole step first, including when `reviewDecision` is `APPROVED`. Never merge on a rule set that was not read.
   - PR state: `gh pr view <n> --json reviewDecision,mergeable,mergeStateStatus,statusCheckRollup,headRefName`. In cloud sessions `pull_request_read` returns the PR, its reviews, its mergeable state and its check runs or statuses.
   - Rules: `gh api repos/<owner>/<repo>/rules/branches/<base>` lists the active rules for the base branch, including the review rule and the required status checks. `gh api repos/<owner>/<repo>/rulesets/<id>` returns one ruleset, with its bypass actors and whether the current user can bypass it. `pull_request_read` returns neither rulesets nor bypass actors. When no `gh` can read them, the rule set is unreadable.
   - If the rules or their required checks cannot be read, stop. Attended: report what could not be read and hand back. Unattended: return "rules unreadable"; the item ends at its open PR.
   - `APPROVED`, or empty because no review is required: plain merge, once every other rule is met.
   - `REVIEW_REQUIRED` with the review rule as the only unmet rule: merge with `--admin`. First verify from the rules and the PR that every required status check passed on the current head, the branch is up to date with the base when the rule is strict, there are no conflicts, and the current user can bypass the ruleset. `--admin` also skips the checks, so this verification is the gate. It is never used to get past anything else.
   - `CHANGES_REQUESTED`, or any other unmet rule: stop and say what is missing. Unattended: return "rules not met" with what is missing.
   - A merge refused by GitHub: stop with GitHub's message, or return it as the reason when unattended. Never retry with another bypass.
4. Squash-merge with an explicit message. The subject is the PR title, unchanged. The body is the branch's commit bodies passed through the sanitizer, which removes every `Co-Authored-By: Claude` trailer and `claude.ai/code/session_` link and turns a parenthesis nested in a parenthesised group into square brackets:

   ```bash
   git log --format=%b origin/<base>..HEAD | node <skill dir>/scripts/ci-watch.mjs sanitize > body.txt
   gh pr merge <n> --squash --delete-branch --subject "<PR title>" --body-file body.txt
   ```

   Run `git fetch origin <base>` first so `origin/<base>` is fresh. In cloud sessions there is no local clone to diff: build the body from the commit messages that `pull_request_read` returns for the PR, pipe it through the same `sanitize` command, and pass it as `commit_message`.

   Add `--admin` only in the case of step 3 that allows it. Cloud sessions can merge only after step 3 read the rules. Pass the same subject and body as `commit_title` and `commit_message` to `merge_pull_request`. Use the repo's allowed method when squash is disabled. Delete the branch.
5. Confirm the PR shows as merged and note the merge commit.
6. Report the PR, the checks that passed, the merge commit and what the merge sets in motion.

## Release

After a merged commit that release-please counts, meaning `feat`, `fix` or a breaking change, in a repo whose `Released by` is release-please:

1. Find the release PR and wait for it to be created or updated, using the Wait stage on its checks. Locally: `gh pr list --state open --search "head:release-please--"`. Through MCP: `search_pull_requests` with the query `head:release-please-- is:open` for the repo.
2. Confirm the merged commit appears in the release PR's changelog. When it does not, report a likely parse drop and show the commit message.
3. Release PR green: ask the operator whether to merge it when attended, or record it in the run summary as waiting for the operator when unattended.
4. After the release PR merges, by the operator or on their explicit request, watch the workflow runs for the new tag and release. Report each conclusion. Report a failed publish with its log lines; do not re-run it.

In an unattended run, steps 1 and 2 run once, after the last item: wait for the release PR and confirm every commit the run merged is in its changelog. Put the result in the run summary.

## Never

- Use `--auto`.
- Bypass any rule but the review rule.
- Merge a release PR.
- Merge a PR nobody asked for, or read a request for one PR as approval for a later one.
- Re-run checks, dispatch workflows or push empty commits to get green.
- Skip or disable a test to get green.
