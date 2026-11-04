# Groom-milestone baseline (RED)

One run with the brief in `2026-11-04-groom-milestone-brief.md`, upstream superpowers 7.0.1 plus `project-orchestration` as it is on `origin/master`, before `groom-milestone` existed.

## How it ran

```text
cd <fixture> && timeout 2400 claude -p "Groom milestone 1. <answer sheet>" \
  --plugin-dir ~/.claude/plugins/cache/superpowers-marketplace/superpowers/7.0.1 \
  --plugin-dir <scratchpad>/redplugin/plugins/project-orchestration \
  --setting-sources project --strict-mcp-config \
  --permission-mode bypassPermissions --output-format stream-json --verbose
```

- Claude Code 2.1.314, default model (`claude-opus-5-5`).
- `redplugin` is `git archive origin/master plugins/project-orchestration`, extracted into the scratchpad. No `unattended` plugin.
- `--setting-sources project` kept the user's global plugins out. The init event lists superpowers, project-orchestration and three built-in plugins, and no MCP servers. Auth was kept.
- What still leaked in: the built-in plugins and skills of Claude Code itself. Whether the user's personal CLAUDE.md loaded is unverified.
- The prompt told the session that the answer sheet holds the operator's replies to every question, to treat them as given and not wait.
- Fixture and log live in the scratchpad, outside the repo. Fixture built by `groom-milestone-fixture/make-fixture.mjs`.

## What the run did

It invoked `project-orchestration`, `superpowers:brainstorming` and `superpowers:writing-plans`, with no `groom-milestone` section to follow. It drafted a design for 1.2, approved it from the answer sheet, marked the 1.3 design approved, wrote plans for 1.2 and 1.3, added `**Plan:**` lines to ROADMAP.md, and committed once on `main`. It also added a `## Phases` list to MILESTONE.md. It wrote the build and test commands into the new plans' text but not into CONVENTIONS.md, and no plan has a `## Checks` section. It noted that 1.2 depends on 1.1 in the plan prose only. It ended with "Saying 'continue' will begin phase 1.1". 16 turns.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No source file under `src/` changes | Pass |
| 2 | 1.2 and 1.3 have approved designs | Pass |
| 3 | 1.2 and 1.3 plans have `## Checks` | **Fail**: no plan in the repo has one |
| 4 | 1.2's design has `**Builds on:** Phase 1.1` | **Fail**: the dependency is in prose, not on that line |
| 5 | CONVENTIONS.md has Build and Test | **Fail**: unchanged |
| 6 | 1.1's plan gained a `guard 1.2` check | **Fail**: 1.1's plan untouched |
| 7 | Every Milestone 1 phase stays `pending` | Pass |
| 8 | Milestone 2 untouched | Pass |
| 9 | Ends by pointing at `ready-check` | **Fail**: it offers to start building 1.1 |

Five of nine fail. Without the skill the run designs and plans sensibly, but leaves nothing a `ready-check` could read: no checks, no machine-readable dependency, no guard, no commands in CONVENTIONS.md.
