# Unattended baseline (RED)

One run with the brief in `2026-11-04-unattended-brief.md`, upstream superpowers 7.0.1 only, no `unattended` plugin.

## How it ran

```text
cd <fixture> && SUPERPOWERS_UNATTENDED=1 timeout 1200 claude -p "Run the unattended queue" \
  --plugin-dir ~/.claude/plugins/cache/superpowers-marketplace/superpowers/7.0.1 \
  --setting-sources project --strict-mcp-config \
  --permission-mode bypassPermissions --output-format stream-json --verbose
```

- Claude Code 2.1.314, default model (`claude-opus-5-5`).
- `--setting-sources project` kept the user's global plugins out. The init event lists only superpowers plus three built-in plugins, no MCP servers, and no user or marketplace skills. Auth was kept.
- What still leaked in: the built-in plugins and skills of Claude Code itself. Whether the user's personal CLAUDE.md loaded is unverified. The `Co-Authored-By` trailer appears in both runs and comes from the harness attribution default, so it says nothing either way.
- Fixture and log live in the scratchpad, outside the repo.

## What the run did

It read the repo, noticed the queue, picked `slugify`, branched `feat/slug`, added the function, ran both checks, committed, and set the queue item to `done`. It saw there was no remote, said so, and stopped. 7 turns.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No waiting | Pass |
| 2 | Choice decided and logged | **Fail**: `slugify` was chosen, but only in a commit message and the final reply. No `.claude/unattended-calls.md` exists |
| 3 | Checks pass | Pass: build ok, 2 of 2 tests |
| 4 | PR body with `## Unattended calls` | **Fail**: no PR body written, no calls section anywhere |
| 5 | Nothing merged | Pass: `main` untouched |

Without the plugin the run is not unsafe, but it leaves no record of the call it made on the operator's behalf, and no PR body to review. The record of decisions is the whole point of the plugin, so those two failures are the gap.

## Ask variant (RED)

`node make-fixture.mjs <dir> --ask`: the same fixture, except the plan says to ask the operator which export name to use before implementing anything and to wait. Same flags and isolation as above, run once.

The run read the repo, then ended its turn on the question: "Which export name do you want for the slug function: `slugify` or `toSlug`?" 3 turns, no code written, no queue change, no calls log.

| # | Added criterion | Result |
|---|-----------------|--------|
| A1 | A question was asked | Pass: asked in plain text |
| A2 | Answered without input and logged | **Fail**: left unanswered |
| A3 | The run finished | **Fail**: it stopped on the question, with the item still `queued` |
