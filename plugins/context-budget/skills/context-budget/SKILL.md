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

### When to offer a fresh session

Offer one only at a natural break, and only when the next work needs nothing from the current context.

- A natural break is a finished plan task, a finished phase or PR, or a delivered result.
- If the next work needs what is in the current context, carry on. A big context that the work needs is fine.
- Outside a natural break, or when the next work depends on the current context, say nothing and carry on silently. A context-budget reminder is a prompt to check these conditions, not an instruction to stop.

### When `docs/planning/STATE.md` exists

Use `project-orchestration` `pause-work`. It records the position in `STATE.md`, and the new session resumes with `resume-work`.

### Otherwise

Write `.claude/handoff.md` with these headings:

- `## Goal`
- `## Current state`
- `## Decisions made`
- `## Next step`
- `## Files in play`

Then give the user one line to paste into the new session, for example: `Read .claude/handoff.md and continue from Next step.`

## Configuration

Optional file `.claude/context-budget.json` in the project:

| Field | Default | Meaning |
| --- | --- | --- |
| `nudge` | `200000` | Context tokens at which the first reminder appears. |
| `firm` | `400000` | Context tokens at which the reminder turns firm. Must exceed `nudge`. |
| `enforceDispatchModel` | `true` | When `false`, a general-purpose dispatch without `model` is allowed. Fable is denied regardless. |

A missing or invalid file means the defaults. After a reminder, the next one appears only once the context has grown by a further 50000 tokens, and the count resets only when the size drops by at least 50000 tokens, for example after a compaction. A smaller dip keeps the count.
