---
name: context-budget
description: Use when dispatching implementer or reviewer subagents, when choosing a model for a subagent, when a context-budget reminder appears in the conversation, or when handing off to a fresh session at a natural break. Holds the suite-wide model rule (Haiku, Sonnet or Opus, never Fable) and the fresh-session handoff recipe. Skip for work that needs no subagent and no handoff.
---

# Context Budget Skill

## Purpose

Long sessions and heavyweight models are the two biggest cost drivers in a subagent-driven run. This plugin addresses both:

- A `UserPromptSubmit` hook measures the session's context size and adds a reminder when it grows large.
- A `PreToolUse` hook on the `Agent` and `Task` tools checks every dispatch for an explicit, allowed `model`.
- This skill holds the rules those hooks enforce and the handoff recipe the reminder points to.

Hooks never fail a turn or stop work. On any error they exit silently.

## Model Choice

Only Haiku, Sonnet and Opus are used for subagents. Never Fable.

- Implementers and reviewers default to Sonnet.
- Opus is for a plan task marked `**Model:** opus`, a stuck-implementer retry (fix round 4 or later), and the final whole-branch review.
- Haiku is only for lookups and searches.

This holds in every run, including plain `subagent-driven-development` and `executing-plans` runs, with or without a plan that names models. Where the upstream Model Selection guidance allows a cheap model for mechanical implementers, this rule wins: implementers never go below Sonnet.

Always pass `model` explicitly on a dispatch. The dispatch hook denies any Fable `model` for every agent type. It denies a missing `model` only when `subagent_type` is absent, empty or `general-purpose`, and only while `enforceDispatchModel` is not `false`. `fork` and every other agent type pass.

## Fresh-Session Handoff

### When to hand off

Hand off only at a natural break, and only when the next work needs nothing from the current context.

- A natural break is a finished phase or PR, or a delivered result.
- A finished plan task is not a natural break. A `subagent-driven-development` or `executing-plans` run goes on to the last task and its final review in this session; implementer subagents already keep this context small.
- If the next work needs what is in the current context, carry on. A big context that the work needs is fine.
- Outside a natural break, or when the next work depends on the current context, say nothing and carry on silently. A context-budget reminder is a prompt to check these conditions, not an instruction to stop.

### Record the handoff

- **When `docs/planning/STATE.md` exists:** use `project-orchestration` `pause-work`. It records the position in `STATE.md`, and the new session resumes with `resume-work`.
- **Otherwise:** write `.claude/handoff.md` with these headings: `## Goal`, `## Current state`, `## Decisions made`, `## Next step`, `## Files in play`.

### Start the new session yourself

If the `create_session` tool is available in a cloud session (Claude Code Remote), start the new session and close this one without asking. The user does not open sessions by hand.

First call `get_session` without a `session_id`. If `environment_kind` is `bridge`, this is a Remote Control session on the user's own machine. There `create_session` is refused with `MCP tool call requires approval`, even in bypass permissions mode and with the tool on the allow list, because the remote-session service asks for an approval this session cannot give. Skip the steps below and follow [Without `create_session`](#without-create_session).

1. **Leave nothing behind.** Commit and push work in progress, including the handoff record, or say what is uncommitted. Archiving this session can remove its worktree.
2. **Make the first message self-contained.** A new session may get its own worktree, where this one's uncommitted files do not exist. With `STATE.md`, the message says to run `resume-work` and names the branch and the first step. Otherwise it holds the full handoff with the five headings above, with absolute paths, and ends with `Continue from Next step.` When `retro` is installed and has not been offered in this session, it also names this session's transcript as an absolute path (`~/.claude/projects/<slug>/$CLAUDE_CODE_SESSION_ID.jsonl`, expanded) and adds `Offer retro on that transcript once, after resuming.` Ask nothing about the retro here; the handoff stays silent.
3. **Start it.** Call `create_session` with `prompt` set to that message and a short `title` naming the next step. Leave `environment_id` and `permission_mode` unset, so it runs where this session runs, with the same permissions.
4. **Check it is running.** Call `get_session` on the new id until `status_bucket` is `working`, and read its latest events with `list_events` (`kinds: ["assistant"]`) to see it picked up the handoff. If it is `failed`, or shows no assistant turn after a few checks, keep this session open and tell the user.
5. **Close this one.** Tell the user the new session's title and id, then call `archive_session` with this session's own id, from `get_session` without a `session_id`. The final message names the new session; nothing runs after the archive.

### Without `create_session`

If the tool is missing, this is a `bridge` session, or `create_session` is refused (for example at a session lineage limit, or with `requires approval`), give the user one line to paste into a new session, for example `Read .claude/handoff.md and continue from Next step.` or `Run resume-work on branch <branch>.`, followed by the same retro line under the same condition, and leave this session open. Do not retry a refused `create_session`: the same call gets the same refusal.

## Configuration

Optional file `.claude/context-budget.json` in the project:

| Field | Default | Meaning |
| --- | --- | --- |
| `nudge` | `200000` | Context tokens at which the first reminder appears. |
| `firm` | `400000` | Context tokens at which the reminder turns firm. Must exceed `nudge`. |
| `enforceDispatchModel` | `true` | When `false`, a general-purpose dispatch without `model` is allowed. Fable is denied regardless. |

A missing or invalid file means the defaults. After a reminder, the next one appears only once the context has grown by a further 50000 tokens, and the count resets only when the size drops by at least 50000 tokens, for example after a compaction. A smaller dip keeps the count.
