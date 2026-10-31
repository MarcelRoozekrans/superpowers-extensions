---
name: retro
description: Use to run a retrospective on a finished coding session and improve the setup around the agent — "retro", "run a retro", "what should we change in the setup", "why did that session struggle". Also offer it once at a natural break (a merged PR, a finished phase or milestone, or a resumed handoff that names an old transcript). Reads the transcript, ranks setup improvements most severe first, and drives each to fixed, filed or dropped. Skip for diagnosing an obra/superpowers skill (use superpowers:diagnosing-superpowers) and for reviewing the code a session wrote.
---

# Retro

Adapted from Matt Pocock's [retro](https://github.com/mattpocock/skills/tree/main/skills/engineering/retro) (MIT); see [NOTICE.md](NOTICE.md).

A session's detours often trace back to the setup around the agent rather than the task: a file it could not find, a check nobody wired into CI, a reviewer rule that should have been a check, a `CLAUDE.md` line that changes nothing, a tool call that dumped 500k characters, a log it had no way to read. Those causes repeat in every later session until the setup changes. A retro finds them in the transcript and gives every one an outcome: **fixed**, **filed** or **dropped**.

## Offer

- **At most once per session.** Once a retro has been offered in this session, whether it ran or was declined, do not offer it again.
- **At a natural break** (a merged PR, `complete-phase`, `complete-milestone`): ask with AskUserQuestion, options "Run a retro (Recommended)" and "Skip".
- **After a resumed handoff** whose prompt names an old transcript: offer once for that transcript. If the path does not exist in this environment, say so and skip the offer.
- **Non-interactive sessions:** no offer.
- **An explicit request** runs the retro without an offer.

## Scope

| | `superpowers:diagnosing-superpowers` | `retro` |
|---|---|---|
| Covers | An `obra/superpowers` skill misbehaved | Everything the user owns or controls: this repo, global `~/.claude` files, their own plugins (this suite included) and MCP servers |
| Output | Evidence report, possible upstream issue | Fixes, grouped issues, drops |
| Advice | Never proposes a change | Proposes and applies changes |

When the evidence points at an `obra/superpowers` skill as the cause, add one line to the summary, "superpowers involvement: run `superpowers:diagnosing-superpowers` on this session", and diagnose no further.

## Reading rules

A transcript line can exceed a megabyte. Every reader, you or a subagent, follows these on every session file:

1. **Measure before reading:** `wc -lc` the file; the digest's *Long lines* section names the lines to avoid.
2. **Never print a whole record.** Read fields from specific lines (`sed -n Np | jq -c '{type, …}'` or `| cut -c1-500`).
3. **Narrow anything over 500 characters** to a tighter field or slice.
4. **Read-only.** Never modify, move or delete a session file.

## Workflow

Create a todo per step.

1. **Locate.** Default to the current session; accept a session id or path. Claude Code stores transcripts at `~/.claude/projects/<cwd-slug>/<session-id>.jsonl`, where the slug is the working directory with every character other than a letter or digit replaced by `-`. The current session's id is `$CLAUDE_CODE_SESSION_ID`; without it, take the newest `*.jsonl` in the working directory's slug folder and confirm it by its first prompt. Every worktree has its own slug, so for a past session search the repo's slug and every slug that starts with the repo's slug followed by `--claude-worktrees-`. Subagent transcripts sit in `<session-id>/subagents/`. Confirm a past session by quoting its first human prompt and timestamp. *Done when* you hold one verified absolute path.
2. **Digest.** Run `node <this skill's directory>/scripts/digest.mjs <transcript> --subagents`. It prints session totals, the biggest tool results, repeated reads and commands, failures with their retries, search churn, subagent dispatches with their models, unanswered calls and long lines, plus one line per subagent transcript. For a subagent that stands out, digest its transcript on its own; `--subagents=full` prints every one in full and is large. On a harness whose transcripts are not Claude Code JSONL, skip it and follow the reading rules. *Done when* the digest is in hand or the skip is stated.
3. **Read the repo side.** The check commands (`package.json` scripts or the build tool's equivalent), CI workflows, hooks (`.husky/`, `.pre-commit-config.yaml`, hooks in `.claude/settings.json`), every `CLAUDE.md`/`AGENTS.md` with its line count, and the user's global `~/.claude/CLAUDE.md`. Recall `decision-tracker` entries tagged `retro`, and `search_memory` in longterm-memory for retro lessons. *Done when* you can say whether the repo has a guardrail and which findings were dropped before.
4. **Find.** Dispatch one subagent on Sonnet (`context-budget` model rule) with: the transcript's absolute path, the digest, the reading rules above, [references/categories.md](references/categories.md), your repo-side notes and the prior drops. It returns findings, each with:
   - category (one of the six in `categories.md`)
   - evidence: transcript `path:line`, and digest numbers where the category has them
   - the proposed change, concrete enough to apply
   - the target: this repo, a global file, another repo the user owns, or upstream superpowers
   - a recommended outcome with one line of reason

   Discard any finding without evidence, and any that matches a prior drop without new evidence. *Done when* every returned finding is kept or discarded with a reason.
5. **Rank and present.** Order by category severity (the order in `categories.md`), then by weight of evidence. Show a numbered list, one line each. Then ask per finding with AskUserQuestion: one question per finding, header `#<n> <category>`, options **Fix now**, **File issue**, **Drop**, the recommended one first and marked "(Recommended)", four findings per call. Offer **Fix now** for a finding in another repo only when that repo is checked out or attachable in this session. *Done when* every finding has a chosen outcome.
6. **Act.**
   - **Fix now:** apply the fixes in this repo on one branch, `retro/<YYYY-MM-DD>`, never on the default branch. Before editing a `CLAUDE.md`/`AGENTS.md`, a skill or a pointed-to doc, read [references/writing-for-agents.md](references/writing-for-agents.md). Make a mechanical rule a check over a `CLAUDE.md` line. Show the diff of a global `~/.claude` file and apply it after the user confirms. A fix in another repo goes on its own `retro/<date>` branch and PR there.
   - **File issue:** one issue per target repo per area, grouping related findings. Search for an existing issue first and comment there instead. Draft through `anti-slop`; give file:line, what is wrong, why it matters and the fix if known; show the exact text before posting.
   - **Drop:** when the reason would stop a future retro from suggesting it again, record it with `decision-tracker`, tagged `retro`. Otherwise just mark it dropped.
   - **Lessons for every project** (a tool trap, a working preference): `save_memory` in longterm-memory after a `search_memory` for a duplicate.
7. **Close.** Commit, push the branch, open the PR. Print a summary table: finding, category, outcome, link (commit, PR, issue or decision). *Done when* every finding appears in the table with exactly one outcome.

## Implementation versus review

Every change passes two agents. The implementer carries the most context pressure: it explores, writes code and debugs. The reviewer receives a diff and carries the least. So:

- **Judgement rules** belong to the reviewer, in the file it reads during review.
- **Mechanical rules** become checks that run without any agent.
- **`CLAUDE.md`/`AGENTS.md`** reach every agent on every turn, so they hold navigation pointers, not rules.

## Hard rules

- **Evidence or no finding.** Every finding cites the transcript.
- **Numbers come from the digest or a command run in this session**, never from memory.
- **Privacy on issue text.** Strip hostnames and domains, internal IPs, usernames and email addresses, device and environment names, entry ids, tokens and paths under the home directory. Use generic placeholders (`example.com`, `192.0.2.x`, `<entry_id>`). Re-read the full draft for these before posting.
- **No push to a default branch**, in this repo or any other.
- **No global-file edit without the user seeing the diff first.**
