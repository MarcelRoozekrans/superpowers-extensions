# Retro Skill — Design

Date: 2026-10-31
Status: draft

## Intent

After a session, the agent's mistakes and detours often trace back to the setup around it rather than to the task: a file it could not find, a lint rule nobody wired into CI, a reviewer rule that should have been a check, a `CLAUDE.md` line that changes nothing, a tool call that dumped 80k tokens, a log it had no way to read. Those causes repeat in every later session until someone changes the setup.

`retro` is a new plugin with one skill. It reads a session transcript, finds setup improvements, ranks them most severe first, and drives each one to an outcome: fixed now, filed as a grouped GitHub issue, or explicitly dropped.

It is a faithful, trimmed adaptation of Matt Pocock's MIT-licensed [`skills/engineering/retro`](https://github.com/mattpocock/skills/tree/main/skills/engineering/retro) and [`skills/productivity/writing-for-agents`](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents) (`SKILL.md`, `SKILL-MECHANICS.md`), read at commit `a496f55`. The builder clones that commit into a scratch directory and keeps the upstream categories, the "implementation vs review" reasoning, and the writing-for-agents levers (context pointers, the two loads, information hierarchy, completion criteria, leading words, pruning, no-ops), reworded only where this suite's conventions differ (decision-tracker instead of ADRs, AskUserQuestion). From `SKILL-MECHANICS.md` only the invocation section is kept; router skills are dropped as irrelevant to retro's fixes.

## Goals

- Find setup improvements in the upstream categories: navigation, automated checks, coding standards (reviewer rule vs automated check), steering-file size, tool economy, no-ops, information access.
- Treat a repo with no guardrail (no pre-commit hook and no CI job running its lint/typecheck/test command) as a finding in itself.
- Back every finding with transcript evidence (`path:line`) and, for tool economy, real numbers from the digest script.
- Drive every finding to fixed, filed or dropped, with a recommended outcome per finding.
- Save lessons that hold in every project to the longterm-memory MCP.

## Non-goals

- Diagnosing superpowers itself. A finding whose cause is an upstream `obra/superpowers` skill is routed to `superpowers:diagnosing-superpowers` (see "Split with diagnosing-superpowers").
- Reviewing the code the session wrote. That is `pre-push-review` and code review.
- Harnesses other than Claude Code for the digest script. Elsewhere the skill falls back to reading the transcript directly.
- Building an ADR folder. Rejections that a future retro must not re-suggest go to `decision-tracker`.

## Anti-goals (failure even if it "works")

- **A report nobody acts on.** A list of findings without outcomes is the failure mode the user's "fix, file or drop" rule exists for.
- **Steering bloat.** Answering every finding with another `CLAUDE.md` line. Mechanical rules become checks; `CLAUDE.md` gets pointers, not rules.
- **Invented numbers.** A token count or call count not computed by the digest script or a command run in the session.
- **Leaking private details.** Issue text in a public repo with hostnames, entity names, paths under the home directory, tokens (user `CLAUDE.md`, "No private information").
- **Megabyte lines in context.** Printing a raw transcript record into the main context.

## Constraints

- Plugin layout and the nine registries enforced by `npm run check:registries`.
- `npm run lint:md`, `npm test` (`node --test plugins/*/skills/*/scripts/**/*.test.mjs`) and `check:upstream` stay green.
- Node builtins only for the script, as in `demo-video`.
- Questions go through AskUserQuestion with one option marked "(Recommended)".
- No pushes to `master`; fixes land on a branch and a PR.
- MIT credit to Matt Pocock: copyright line and licence text kept with the adapted material.

## Approaches

| | Approach | Trade-off |
|---|---|---|
| A | Markdown-only skill; one subagent reads the transcript | Cheapest to build; tool-cost numbers depend on careful reading |
| B | One analyst subagent per category, in parallel (like `diagnosing-superpowers`) | Most thorough; roughly 6–7× the tokens per run, too heavy for something offered at every break |
| **C (chosen)** | **A plus a tested Node digest script that pre-digests the JSONL** | Real numbers and no megabyte lines in context; tied to the Claude Code JSONL format, falling back to A elsewhere |

The user chose C.

## Decisions

### Invocation (user's choice)

Model-invoked. The description triggers on explicit requests ("retro", "run a retro", "what should we change in the setup", "why did that session struggle"), and the skill is **offered once** at a natural break: a merged PR or a finished phase. Offered means one AskUserQuestion with "Run a retro (Recommended)" / "Skip"; it never runs unasked. Once declined, it is not offered again in the same session (my call; the conversation itself is the marker, no state file needed). In a non-interactive session there is no offer.

**At a handoff to a fresh session (user's choice):** no question, because the user's handoff rule says hand off without asking. The new session's prompt names the old transcript's absolute path and says to offer a retro of it once, after resuming. If that path does not exist in the new session's environment, the new session says so and skips the offer.

### Fix flow (user's choice)

Per finding, AskUserQuestion with **Fix now / File issue / Drop**, one marked recommended, batched four findings per question call. Accepted fixes in the current repo go on one new branch `retro/<YYYY-MM-DD>` and one PR. Edits to global files (`~/.claude/CLAUDE.md`, user settings) are applied after showing the diff. Issues are grouped: one issue per target repo per area, not one per finding.

Targets outside the current repo (my call): a finding in another repo the user owns (an owned plugin or MCP server) gets "Fix now" only when that repo is already checked out or attachable in the session; the fix then goes on its own `retro/<date>` branch and PR there. Otherwise only "File issue" and "Drop" are offered for it. The target repo's own branch rules apply; never push to its default branch.

### `writing-for-agents` is a reference file, not a skill (my call)

It becomes `references/writing-for-agents.md` inside `retro`, merging upstream `SKILL.md` and the relevant part of `SKILL-MECHANICS.md`. Reason: only retro needs it in this suite, and a second model-invoked skill would add an always-loaded description for no independent trigger. `superpowers:writing-skills` already covers authoring skills.

### Split with diagnosing-superpowers

| | `diagnosing-superpowers` | `retro` |
|---|---|---|
| Scope | An `obra/superpowers` skill misbehaved | Everything the user owns or controls: the repo, global `~/.claude` files, their own plugins and MCP servers |
| Output | Evidence report, possible upstream issue | Fixes, grouped issues, drops |
| Advice | Never proposes a change | Proposes and applies changes |

When retro's evidence points at an upstream superpowers skill as the cause, it records one line in the summary, "superpowers involvement: run `superpowers:diagnosing-superpowers` on this session", and does not diagnose it. Skills from this suite (`superpowers-extensions`) are the user's own and are in retro's scope.

### Reading rules owned locally (my call)

Retro keeps its own short context-safety and discovery rules instead of pointing at `diagnosing-superpowers/references/`. A runtime pointer into another plugin's cache path is fragile, and the digest script does most of the reading anyway. The rules are three: measure before reading, never print a whole record, narrow any output over 500 characters.

### Severity order (my call)

1. **Information access**: a crucial fact was unavailable (logs, a service, docs). Causes guessing.
2. **Automated checks**: a mistake a check would have caught, or no guardrail at all.
3. **Coding standards**: a reviewer rule that should be a check, or a rule that is missing or unclear.
4. **Navigation**: time spent finding files; a missing navigation pointer.
5. **Tool economy**: expensive tool calls or token-inefficient tooling.
6. **Steering size and no-ops**: `CLAUDE.md` lines that are too long, belong elsewhere, or change nothing.

Within a category, findings with more evidence (repeated across turns or sessions) rank higher.

## Plugin structure

```text
plugins/retro/
  .claude-plugin/plugin.json
  skills/retro/
    SKILL.md
    LICENSE-mattpocock-skills       (upstream MIT licence text)
    references/
      categories.md                 (the six categories: signal, evidence, typical fixes)
      writing-for-agents.md         (adapted; used when a fix edits a steering file or skill)
    scripts/
      digest.mjs                    (CLI)
      digest.test.mjs
      fixtures/*.jsonl              (small synthetic transcripts)
```

## Workflow (SKILL.md steps)

1. **Locate.** Default to the current session. Accept a session id or path. Claude Code stores transcripts in `~/.claude/projects/<cwd-slug>/<session-id>.jsonl`, and every worktree has its own slug, so a past session in this repo is searched across all slugs that start with the repo's slug. Subagent transcripts sit in `<session-id>/subagents/`. Confirm a past session by quoting its first human prompt and timestamp.
2. **Digest.** Run `node <skill-dir>/scripts/digest.mjs <transcript> [--subagents]`. On a harness without this format, skip and follow the reading rules.
3. **Read the repo side.** The repo's check commands (`package.json` scripts or the build tool's equivalent), CI workflows, hooks (`.husky`, `.pre-commit-config.yaml`, `.claude/settings.json` hooks), `CLAUDE.md`/`AGENTS.md` files and their sizes, the user's global `CLAUDE.md`. Recall `decision-tracker` entries tagged `retro` so rejected findings are not re-suggested.
4. **Find.** Dispatch one subagent (Sonnet, per `context-budget`) with the digest, the transcript path, the reading rules, `references/categories.md` and the repo-side notes. It returns findings, each with category, evidence `path:line`, numbers from the digest, the proposed change, the target (repo, global file, owned plugin repo, upstream superpowers) and a recommended outcome. Discard any finding without evidence. For .NET repos with roslyn-codelens tools available, the subagent may use them to confirm navigation findings.
5. **Rank and present.** Order by severity, show a numbered list with one line each, then run the per-finding decision questions.
6. **Act.**
   - *Fix now*: apply on `retro/<date>`; edits to steering files or skills follow `references/writing-for-agents.md`. Mechanical rules become a check (lint rule, hook, CI job) over a `CLAUDE.md` line.
   - *File issue*: one grouped issue per target repo per area, drafted through `anti-slop`, privacy-checked, shown before posting, checking for an existing issue first.
   - *Drop*: if the reason would stop a future retro re-suggesting it, record it in `decision-tracker` with tag `retro`.
   - Lessons that hold in every project: `save_memory` in longterm-memory, after `search_memory` for a duplicate.
7. **Close.** Commit, push the branch, open the PR. Print a summary: each finding with its outcome and link. Every finding has exactly one outcome.

## Digest script

`digest.mjs <transcript.jsonl> [--subagents] [--json]` streams the file line by line (readline; never loads it whole) and prints a compact report, under ~4k tokens by default:

- **Session**: id, first human prompt (truncated), start/end timestamps, model(s), turn count, total tokens from `usage`, and `totalCostUSD` when a `cost-state` record exists.
- **Biggest tool results**: top N by size with tool name, input summary (command, path, pattern; truncated) and `path:line`.
- **Repeated reads**: the same file read more than once, and the same command run more than once.
- **Failures**: tool results flagged as errors or non-zero exits, and the retries that followed (same tool, similar input, within a few turns).
- **Search churn**: runs of Grep/Glob/find calls before the first read of the file that was then used.
- **Subagents**: dispatches with description, `model` and result size; with `--subagents`, each subagent transcript digested the same way.
- **Long lines**: line numbers over 100k characters, so readers avoid them.

Record types it relies on, observed in real transcripts: `assistant` (`message.content[].type === "tool_use"`, `message.usage`), `user` (`message.content[].type === "tool_result"`, `toolUseResult`), `cost-state`. Unknown record types are counted and ignored. A missing field is reported as unknown, never as zero.

Tests use synthetic fixtures covering each section, a malformed line, an unknown record type, and a line over the long-line threshold.

## Integrations

- `context-budget`: the handoff recipe's new-session prompt gains one line: offer a retro of `<old transcript path>` once after resuming. The model rule applies to the finder subagent.
- `project-orchestration`: phase and milestone completion offer a retro once, subject to the once-per-session rule. (Builder: confirm where the completion steps live and add a single pointer line there, without duplicating retro's text.)
- `check:upstream`: the existence check for `superpowers:diagnosing-superpowers` is enough; no new anchor (my call). The skill exists at the pinned `v7.0.0`.
- `decision-tracker`: stores drops; recalled in step 3.
- `anti-slop`: issue and PR text.
- `roslyn-codelens-integration`: optional evidence on .NET repos.

## Registration and credit

- Register in all nine places `check:registries` checks, the README plugin list and plugin section, and `commitlint` scopes.
- `release-please-config.json` gets the next `$.plugins[N].version` entry.
- README credit line: "Adapted from Matt Pocock's [skills](https://github.com/mattpocock/skills) (MIT)". The licence file keeps the upstream copyright line, and `SKILL.md` and `references/writing-for-agents.md` each start with a one-line attribution.

## Left to the builder

- Exact top-N sizes and the output budget of the digest.
- The retry-similarity heuristic.
- Wording of the trigger description, within the branches above.
