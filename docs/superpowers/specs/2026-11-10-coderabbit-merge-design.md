# coderabbit-merge design

Date: 2026-11-10. Status: draft, awaiting approval.

## Intent

CodeRabbit now reviews the operator's PRs. `ci-watch` can merge a green PR with
`--admin`, but it knows nothing about CodeRabbit: it would bypass the review
rule while CodeRabbit is still reviewing or has open findings. The operator
wants the agent to wait for CodeRabbit, treat its findings as review feedback
to validate and fix, and merge once CodeRabbit approves and CI is green.

CodeRabbit also writes a ready-made "Prompt for AI Agents" block under each
finding. The skill uses those as the starting point for fixes.

## Goals

- Wait until CodeRabbit has finished reviewing the current head commit.
- Read its findings: file, line, severity, body and agent prompt.
- Validate each finding before touching code. A genuine finding is fixed. A
  finding that is wrong, or not worth fixing, gets a reply with the reason.
- Push the fixes, wait for CI and CodeRabbit again, and repeat.
- Merge through `ci-watch`'s Merge stage once CodeRabbit approves the head
  commit and CI is green.

## Non-goals

- Merging release PRs. That stays the operator's call, as in `ci-watch`.
- Changing `ci-watch`. It keeps working in repos without CodeRabbit.
- Unattended runs. The first version is attended only. *(My call: an
  unattended outcome contract would need a change to the `unattended` skill,
  which is a separate piece of work.)*
- Configuring CodeRabbit itself. The skill reports a missing setting; it does
  not write `.coderabbit.yaml`.

## Anti-goals

- Applying a finding blindly because a bot said so. Every fix is verified
  against the code first (`superpowers:receiving-code-review`).
- Getting an approval by dismissing findings unread or resolving threads
  without a fix or a reply.
- Merging while CodeRabbit is still reviewing, or on a stale approval from an
  earlier commit.
- Bypassing any rule other than the review rule. `ci-watch` keeps that gate.

## Constraints

- "Approved" means a CodeRabbit review in state `APPROVED` on the current head
  commit. CodeRabbit posts a real approval only with
  `reviews.request_changes_workflow: true` in `.coderabbit.yaml`. This repo has
  no such file today. When no approval can appear, the skill says so and names
  the setting; it does not treat "no findings" as approved. *(My call.)*
- Reviews and threads come from `gh api graphql` locally, and from
  `pull_request_read` in cloud sessions, which has no `gh` for PRs.
- The same `gh` probe and cloud split as `ci-watch` applies to waiting.
- Commit bodies and PR text follow the operator's rules: no Claude trailers, no
  session links, no nested parentheses, no private details.
- Plugin conventions: plugin directory, marketplace entry, README section,
  release-please, scope in `commitlint.config.js`.

## Approaches

1. **Skill text only.** Smallest, but the agent parses CodeRabbit's markdown
   from memory each time and nothing tests it.
2. **Skill plus a small tested script (chosen).** `coderabbit.mjs` parses
   reviews and threads into a status and a findings list; the skill holds the
   judgment and the loop.
3. **Skill, script and a PR-open hook.** Rejected: `ci-watch`'s hook already
   fires on PR creation, and a second one would race it.

The operator chose approach 2 on 2026-11-10 and chose a new plugin over
extending `ci-watch`.

## Decided

### Layout

```text
plugins/coderabbit-merge/
  .claude-plugin/plugin.json
  skills/coderabbit-merge/
    SKILL.md
    scripts/coderabbit.mjs
    scripts/coderabbit.test.mjs
```

### The script

Pure functions plus a CLI entry, in the style of `ci-watch.mjs`. Input is JSON
from stdin: the PR head SHA, the reviews and the review threads. Output:

- `state`: `reviewing`, `approved`, `changes-requested`, `no-review` or
  `stale` (the last CodeRabbit review is for an older commit).
- `findings`: unresolved CodeRabbit threads, each with path, line, severity,
  the finding text and the extracted agent prompt (empty when absent).

CodeRabbit is recognised by author login `coderabbitai[bot]`. *(My call.)*

### The skill

1. Run `ci-watch`'s Wait stage for CI.
2. Fetch reviews and threads, pipe them to the script.
3. `reviewing`: keep waiting. `no-review`: report it and name the setting.
4. `changes-requested` or open findings: validate each finding, fix the
   genuine ones, reply and resolve the rest with a reason, run the repo checks,
   commit, push, go to 1. A finding needing a design choice stops the loop and
   goes to the operator. A genuine finding outside this PR's area is grouped
   into one issue, per the operator's review-loop rule.
5. Three fix rounds on one PR end the loop with a report.
6. `approved` on the current head, CI green: hand off to `ci-watch`'s Merge
   stage, which reads the rules and uses `--admin` only for the review rule.

### Registration

New scope `coderabbit-merge` in `commitlint.config.js`; marketplace and
manifest entries as `npm run check:registries` lists; README section; a
pointer from `ci-watch`'s Wait stage.

## Left to the builder

- Exact GraphQL query and the thread-parsing details, after looking at a real
  CodeRabbit review.
- Test fixtures, taken from a real review with private details removed.
- Wording of the replies posted on dismissed findings.
