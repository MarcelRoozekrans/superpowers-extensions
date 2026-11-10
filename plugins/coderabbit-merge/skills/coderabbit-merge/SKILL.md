---
name: coderabbit-merge
description: Use when asked to "merge when CodeRabbit approves", "wait for CodeRabbit" or "fix the CodeRabbit findings", and for a PR that CodeRabbit reviews. Waits for CodeRabbit, validates each finding and fixes the genuine ones, then hands an approved, CI-green PR to ci-watch to merge. Skip for release PRs, which are always the operator's call.
---

# CodeRabbit Merge

CodeRabbit reviews the PR. This skill waits for that review, treats its findings as review feedback to check and fix, and merges through `ci-watch` once CodeRabbit has approved the current head commit and CI is green. Attended sessions only.

`ci-watch` alone would merge with `--admin` while CodeRabbit is still reviewing or has findings open. In a repo CodeRabbit reviews, this skill runs first, and `ci-watch`'s Merge stage does the merge.

## Gather

Fetch the PR's head SHA, the state of the check run named `CodeRabbit`, its reviews and its review threads. Build this JSON and pipe it to the script:

```json
{ "headSha": "...", "checkState": "pending|success|failure|null",
  "reviews": [{ "author": "...", "state": "...", "commitOid": "...", "submittedAt": "..." }],
  "threads": [{ "isResolved": false, "path": "...", "line": 1, "comments": [{ "author": "...", "body": "..." }] }] }
```

```bash
node <skill dir>/scripts/coderabbit.mjs status < input.json
```

Locally, use one `gh api graphql` query on the pull request: `headRefOid`, `reviews` with `author.login`, `state`, `commit.oid` and `submittedAt`, `reviewThreads` with `isResolved`, `path`, `line` and `comments.nodes` with `author.login` and `body`, and the `CodeRabbit` context in `commits(last: 1).nodes.commit.statusCheckRollup`. In cloud sessions `pull_request_read` returns the same fields. Probe `gh` first, as `ci-watch` does.

The script prints `{ "state": ..., "findings": [...] }`. Each finding has `path`, `line`, `severity`, `body` and `agentPrompt`.

## Act on the state

| State | Meaning | Do |
|-------|---------|----|
| `reviewing` | The CodeRabbit check is pending | Keep waiting with `ci-watch`'s Wait mechanism, then gather again. |
| `no-review` | CodeRabbit has not reviewed | Report it and wait once for the review. If none comes, say so. |
| `not-approved` | CodeRabbit only commented and nothing is open | Report that CodeRabbit never approves unless `.coderabbit.yaml` sets `reviews.request_changes_workflow: true`. Do not merge. |
| `stale` | The last review is for an older commit | Wait for the review of the new head. |
| `changes-requested` | Findings are open | Run the Fix loop. |
| `approved` | CodeRabbit approved the current head | Check CI is green, then hand over to Merge. |

"No findings" is never approval. Only `approved` on the current head leads to a merge.

## Fix loop

For each finding:

1. Read the code it points at and verify the claim, following `superpowers:receiving-code-review`. Never apply a finding because a bot said so.
2. Genuine: fix it, using `agentPrompt` as the starting point. Not genuine, or not worth fixing: reply on the thread with the reason, then resolve it.
3. Genuine but in code this PR does not touch: group such findings into one issue, after checking for an existing one.
4. Needs a design choice: stop and put the choice to the operator.

Then run the repo's own checks, commit following the repo's commit rules, push, and go back to Gather through the Wait mechanism. Three rounds on one PR end the loop: report the findings still open.

## Merge

When the state is `approved` and CI is green, run `ci-watch`'s Merge stage for this PR. It reads the rules and uses `--admin` only for the review rule. This skill never runs `gh pr merge` itself.

## Never

- Resolve a thread without a fix or a reply.
- Merge on a stale or missing approval, or because there are no findings.
- Dismiss findings unread.
- Bypass any rule here, or merge a release PR.
- Re-run checks or push empty commits to prompt a new review.
