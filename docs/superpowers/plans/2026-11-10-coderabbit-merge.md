# coderabbit-merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `coderabbit-merge` plugin whose skill waits for CodeRabbit, validates and fixes its findings, and hands a CodeRabbit-approved, CI-green PR to `ci-watch`'s Merge stage.

**Architecture:** One skill holds the loop and the judgment. A pure Node module, `coderabbit.mjs`, turns a PR's reviews, review threads and CodeRabbit check state into a status plus a findings list, so the brittle parsing is tested. The merge itself stays in `ci-watch`.

**Tech Stack:** Markdown skill, Node `.mjs` built-ins only, `node:test`, `gh api graphql`.

**Spec:** `docs/superpowers/specs/2026-11-10-coderabbit-merge-design.md`

## Global Constraints

- Node built-ins only; no new dependencies.
- The script lives at `plugins/coderabbit-merge/skills/coderabbit-merge/scripts/coderabbit.mjs`, with its test beside it. `npm test` finds `plugins/*/skills/*/scripts/**/*.test.mjs`.
- No literal `git commit -m` or `git tag -a` in any SKILL.md (enforced by `npm run check:conventions`).
- The commit scope `coderabbit-merge` goes into `commitlint.config.js` in the same commit as the first commit that uses it (Task 1).
- No `Co-Authored-By: Claude` trailer, no `claude.ai/code/session_` link and no nested parenthesis in any commit message.
- CodeRabbit is recognised by author login `coderabbitai` or `coderabbitai[bot]`.
- "Approved" is a CodeRabbit review in state `APPROVED` on the current head commit. No approval, no merge.
- Three fix rounds on one PR end the loop. Release PRs are never merged.
- Attended sessions only. The merge goes through `ci-watch`'s Merge stage; this skill never runs `gh pr merge`.

## Review Focus

- An `APPROVED` review on an older commit is `stale`, not `approved`.
- A pending CodeRabbit check wins over an earlier approval on the same head: `reviewing`.
- The latest CodeRabbit review is chosen by `submittedAt`, not by array order.
- Resolved threads, and threads started by humans or other bots, never become findings.
- A finding with no "Prompt for AI Agents" block has an empty `agentPrompt`, not a crash.

## Checks

- build: `npm run lint:md && npm run check:registries && npm run check:conventions`
- tests: `npm test`

---

### Task 1: The status script

**Files:**

- Create: `plugins/coderabbit-merge/skills/coderabbit-merge/scripts/coderabbit.mjs`
- Test: `plugins/coderabbit-merge/skills/coderabbit-merge/scripts/coderabbit.test.mjs`
- Modify: `commitlint.config.js` (add `'coderabbit-merge'` to the scope-enum, after `'ci-watch'`)

**Interfaces:**

- Produces, input shape (JSON, also read from stdin by the CLI):
  `{ headSha: string, checkState: 'pending' | 'success' | 'failure' | null, reviews: [{ author: string, state: string, commitOid: string, submittedAt: string }], threads: [{ isResolved: boolean, path: string, line: number | null, comments: [{ author: string, body: string }] }] }`.
  `checkState` is the state of the check run named `CodeRabbit` on the head commit, `null` when there is none.
- Produces: `export function isCodeRabbit(login: string): boolean`.
- Produces: `export function parseFinding(thread): { path, line, severity, body, agentPrompt }`. `severity` is one of `critical`, `major`, `minor`, `nitpick`, `unknown`, read from the label in the first comment. `body` is that comment's text before any `<details>` block. `agentPrompt` is the text inside the code fence that follows a `Prompt for AI Agents` summary, or `''`.
- Produces: `export function coderabbitStatus(input): { state, findings }`. `state` is `reviewing`, `approved`, `changes-requested`, `not-approved` (latest review is a comment with no open findings), `no-review` or `stale`. `findings` lists `parseFinding` of every unresolved thread whose first comment is by CodeRabbit.
- Produces: CLI `node coderabbit.mjs status < input.json` prints the result as JSON; any other usage prints a usage line to stderr and exits 2.

Precedence for `state`: `checkState` `pending` gives `reviewing`; then no CodeRabbit review gives `no-review`; then a latest review whose `commitOid` differs from `headSha` gives `stale`; then `APPROVED` gives `approved`; then `CHANGES_REQUESTED`, or any other review with open findings, gives `changes-requested`; the rest is `not-approved`.

- [ ] **Step 1: Write the failing tests.** One `node:test` case per line of Review Focus, plus: `isCodeRabbit` accepts both login spellings and rejects `renovate[bot]`; `parseFinding` returns severity `major` for a body starting `_⚠️ Potential issue_ | _🟠 Major_`, and `nitpick` for `_🧹 Nitpick_`; `coderabbitStatus` returns `changes-requested` for a `COMMENTED` latest review with one open finding and `not-approved` with none; the CLI exits 2 on an unknown argument.
- [ ] **Step 2: Run `node --test plugins/coderabbit-merge/skills/coderabbit-merge/scripts/coderabbit.test.mjs`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement the module** with the signatures above, in the style of `plugins/ci-watch/skills/ci-watch/scripts/ci-watch.mjs`: pure functions, `isMain()` guard for the CLI. Test fixtures are written by hand from the label and fence format described above; Task 2 replaces them with a real review's shape if it differs.
- [ ] **Step 4: Run the same command.** Expected: PASS.
- [ ] **Step 5: Add the scope to `commitlint.config.js`, then commit** `feat(coderabbit-merge): add the CodeRabbit status script`.

### Task 2: The skill and plugin

**Files:**

- Create: `plugins/coderabbit-merge/.claude-plugin/plugin.json`, `plugins/coderabbit-merge/skills/coderabbit-merge/SKILL.md`
- Modify: `plugins/ci-watch/skills/ci-watch/SKILL.md` (Wait stage, one sentence)

**Interfaces:**

- Consumes: `coderabbit.mjs status` from Task 1.
- Produces: skill `coderabbit-merge`. Its frontmatter `description` starts with "Use when" and triggers on "merge when CodeRabbit approves", "wait for CodeRabbit", "fix the CodeRabbit findings" and a PR that CodeRabbit reviews. It says to skip release PRs.

- [ ] **Step 1: Write `plugin.json`** like `plugins/ci-watch/.claude-plugin/plugin.json`: name `coderabbit-merge`, license MIT, author Marcel Roozekrans, keywords `coderabbit`, `review`, `merge`, `github`.
- [ ] **Step 2: Write `SKILL.md`** with these sections, following the spec's Decided part:
  - **Gather:** fetch the PR head SHA, the CodeRabbit check state, reviews and review threads, build the Task 1 input, pipe it to `node <skill dir>/scripts/coderabbit.mjs status`. Locally use one `gh api graphql` query (`pullRequest` with `headRefOid`, `reviews` with `author.login`, `state`, `commit.oid`, `submittedAt`, `reviewThreads` with `isResolved`, `path`, `line`, `comments.nodes` with `author.login` and `body`, and `statusCheckRollup` contexts for the `CodeRabbit` check). In cloud sessions use `pull_request_read` for the same fields.
  - **Act on the state:** a table for the six states. `reviewing`: keep waiting through `ci-watch`'s Wait mechanism. `no-review` and `not-approved`: report, and name `reviews.request_changes_workflow: true` in `.coderabbit.yaml` as the setting that makes CodeRabbit approve; never merge. `stale`: wait for the review of the new head. `changes-requested`: the Fix loop. `approved` with CI green: hand over to `ci-watch`'s Merge stage.
  - **Fix loop:** for each finding, verify it against the code with `superpowers:receiving-code-review`; fix genuine ones, using `agentPrompt` as the starting point; for the others reply on the thread with the reason and resolve it. A genuine finding in code this PR does not touch is grouped into one issue. A finding that needs a design choice stops the loop and goes to the operator. Run the repo's checks, commit following the repo's commit rules, push, wait again. Three rounds end the loop with a report.
  - **Never:** resolve a thread without a fix or a reply, merge on a stale or missing approval, dismiss findings unread, bypass any rule here, merge a release PR, run `gh pr merge` itself.
- [ ] **Step 3: Add one sentence to `ci-watch`'s Wait stage** saying that in a repo CodeRabbit reviews, the `coderabbit-merge` skill runs before the Merge stage.
- [ ] **Step 4: Run `npm run lint:md && npm run check:conventions`.** Expected: no issues. `check:registries` still fails until Task 3.
- [ ] **Step 5: Commit** `feat(coderabbit-merge): add the coderabbit-merge skill`.

### Task 3: Registration and docs

**Files:**

- Modify: `.claude-plugin/marketplace.json` (new last entry, version `1.30.0`, category `workflow`), `release-please-config.json` (next `extra-files` entry for the new `$.plugins[N].version`, N being the new entry's index), `package.json` (`install-plugins`), `GEMINI.md`, `hooks/session-start`, `.opencode/plugins/superpowers-extensions.js`, `.cursor-plugin/plugin.json` and `.codex-plugin/plugin.json` (keywords; also the plugin count and the list in the Codex `longDescription`), `.codex/INSTALL.md`, `.copilot-cli/INSTALL.md`, `README.md`.

**Interfaces:**

- Consumes: the plugin and skill from Task 2.

- [ ] **Step 1: Run `npm run check:registries`.** Expected: FAIL, naming every registry still missing the plugin.
- [ ] **Step 2: Add the plugin to each file the check names**, following how `ci-watch` appears in it. The marketplace description is "Waits for CodeRabbit, validates and fixes its findings, and hands an approved, green PR to ci-watch to merge."
- [ ] **Step 3: Add the README section** next to `ci-watch`'s: the loop, the `.coderabbit.yaml` setting, the attended-only limit, install and manual-copy lines, the tree entry (22nd plugin, one skill), and the plugin count wherever README states it.
- [ ] **Step 4: Run `npm run lint:md && npm run check:registries && npm run check:conventions && npm test`.** Expected: all pass.
- [ ] **Step 5: Commit** `feat(coderabbit-merge): register the plugin and document it`.
