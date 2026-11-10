---
name: coderabbit-merge
description: Use when asked to "merge when CodeRabbit approves", "wait for CodeRabbit" or "fix the CodeRabbit findings", and for a PR that CodeRabbit reviews. Waits for CodeRabbit, validates each finding and fixes the genuine ones, then hands an approved, CI-green PR to ci-watch to merge when a merge was asked for. Skip for release PRs, which are always the operator's call.
---

# CodeRabbit Merge

CodeRabbit reviews the PR. This skill waits for that review, treats its findings as review feedback to check and fix, and, when a merge was asked for, merges through `ci-watch` once CodeRabbit has approved the current head commit and CI is green. Attended sessions only: in an unattended run `ci-watch` does not merge in a repo CodeRabbit reviews and returns "rules not met: CodeRabbit".

`ci-watch` alone would merge with `--admin` while CodeRabbit is still reviewing or has findings open. In a repo CodeRabbit reviews, this skill runs first, and `ci-watch`'s Merge stage does the merge.

## Gather

Fetch the PR's head SHA, the state of the `CodeRabbit` status, its reviews and its review threads. Build this JSON and pipe it to the script:

```json
{ "headSha": "...", "checkState": "PENDING|SUCCESS|...|null",
  "reviews": [{ "author": "...", "state": "...", "body": "...", "commitOid": "...", "submittedAt": "..." }],
  "threads": [{ "id": "...", "isResolved": false, "path": "...", "line": 1,
                "comments": [{ "databaseId": 1, "author": "...", "body": "..." }] }] }
```

```bash
node <skill dir>/scripts/coderabbit.mjs status < input.json
```

Locally, use one `gh api graphql` query on the pull request, and follow `pageInfo` if a list has more pages:

```graphql
pullRequest(number: $n) {
  headRefOid
  reviews(last: 100) { nodes { author { login } state body submittedAt commit { oid } } }
  reviewThreads(first: 100) { nodes { id isResolved path line
    comments(first: 1) { nodes { databaseId author { login } body } } } }
  commits(last: 1) { nodes { commit { statusCheckRollup { contexts(first: 100) { nodes {
    ... on StatusContext { context state }
    ... on CheckRun { name status conclusion } } } } } } }
}
```

CodeRabbit reports its progress as a commit status named `CodeRabbit` (a `StatusContext`), set by `reviews.commit_status`; use its `state` as `checkState`. If the repo shows a check run named `CodeRabbit` instead, use its `status` while it is not `COMPLETED`, otherwise its `conclusion`. No such context: `null`. In cloud sessions `pull_request_read` returns the reviews, threads and statuses; its field names differ, so map them to the shape above.

The script prints `{ "state", "findings", "reviewBody" }`. Each finding has `threadId`, `commentId`, `path`, `line`, `severity`, `body` and `agentPrompt`. `reviewBody` is the latest CodeRabbit review's text.

## Act on the state

| State | Meaning | Do |
|-------|---------|----|
| `reviewing` | The CodeRabbit status is pending | Wait, then gather again. |
| `no-review` | CodeRabbit has not reviewed | Wait for the review. After the limit, report it and check that CodeRabbit is installed on the repo and the PR is not a draft or paused. |
| `not-approved` | CodeRabbit only commented and nothing is open | Report that CodeRabbit never approves unless `.coderabbit.yaml` sets `reviews.request_changes_workflow: true`. Do not merge. |
| `stale` | The last review is for an older commit | Wait for the review of the new head. |
| `changes-requested` | Findings are open | Run the Fix loop. |
| `approved` | CodeRabbit approved the current head | With CI green and a merge asked for this PR, go to Merge. Otherwise report "approved and green" and stop. |

"No findings" is never approval. Only `approved` on the current head leads to a merge.

## Waiting

Use `ci-watch`'s limit: 60 minutes from the first wait, or `**CI timeout:** <minutes>` from `docs/planning/CONVENTIONS.md`. When it passes, stop and report "CodeRabbit has not reviewed `<sha>`" with the state.

`gh pr checks --watch` ends when CI ends, which can be before CodeRabbit reviews, so it is not enough here. In cloud sessions `subscribe_pr_activity` delivers CodeRabbit's review as an event. Locally, watch with `Monitor` on an `until` loop over the review list that ends when a CodeRabbit review for the head commit exists, or when the limit passes. A review CodeRabbit never posts (paused auto-review, draft PR, skipped files) ends at the limit, not in a loop.

## Fix loop

A `changes-requested` review may have no thread findings: CodeRabbit puts "Outside diff range", "Duplicate" and nitpick comments in the review body. Read `reviewBody` and treat each item there as a finding. When it holds nothing actionable, report that and stop; never push an empty commit.

For each finding:

1. Read the code it points at and verify the claim, following `superpowers:receiving-code-review`. Never apply a finding because a bot said so.
2. Genuine: fix it, using `agentPrompt` as the starting point. Not genuine, or not worth fixing: reply on the thread with the reason, then resolve it. Use the GraphQL mutations `addPullRequestReviewThreadReply` with the `threadId`, then `resolveReviewThread`. If the session cannot reply or resolve, report the findings left open and stop.
3. Genuine but in code this PR does not touch: group such findings into one issue, after checking for an existing one.
4. Needs a design choice: stop and put the choice to the operator.

Then run the repo's own checks, commit following the repo's commit rules, push, and gather again after waiting. Three rounds on one PR end the loop: report the findings still open.

## Merge

Only when a merge was asked for this PR, the state is `approved` and CI is green: run `ci-watch`'s Merge stage for this PR. It reads the rules and uses `--admin` only for the review rule. A request to wait for CodeRabbit or to fix its findings is not a request to merge. This skill never runs `gh pr merge` itself.

## Never

- Resolve a thread without a fix or a reply.
- Merge on a stale or missing approval, or because there are no findings.
- Merge a PR nobody asked to merge.
- Dismiss findings unread.
- Bypass any rule here, or merge a release PR.
- Re-run checks or push empty commits to prompt a new review.
