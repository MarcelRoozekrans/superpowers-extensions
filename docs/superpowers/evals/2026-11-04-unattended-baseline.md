# Unattended baseline (RED)

One run with the brief in `2026-11-04-unattended-brief.md`, upstream superpowers 7.0.1 only, no `unattended` plugin.

## How it ran

```
cd <fixture> && SUPERPOWERS_UNATTENDED=1 timeout 1200 claude -p "Run the unattended queue" \
  --plugin-dir ~/.claude/plugins/cache/superpowers-marketplace/superpowers/7.0.1 \
  --setting-sources project --strict-mcp-config \
  --permission-mode bypassPermissions --output-format stream-json --verbose
```

- Claude Code 2.1.314, default model (`claude-opus-5-5`).
- `--setting-sources project` kept the user's global plugins out. The init event lists only superpowers plus three built-in plugins, no MCP servers, and no user or marketplace skills. Auth was kept.
- What still leaked in: the built-in plugins and skills of Claude Code itself. The user's personal CLAUDE.md did not show an effect: the run added a `Co-Authored-By` trailer that the personal file forbids. That is an inference from behaviour, not a check of what was loaded.
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

Without the plugin the run is not unsafe, but it leaves no record of the call it made on the operator's behalf, and no PR body to review. It also skipped the plan's subagent-driven execution. The record of decisions is the whole point of the plugin, so those two failures are the gap.
