# Installing superpowers-extensions for GitHub Copilot CLI

Copilot CLI (v1.0.11+) consumes Claude-Code-style plugin marketplaces. This
suite's existing `.claude-plugin/marketplace.json` works directly — no
separate manifest needed.

## Prerequisites

- GitHub Copilot CLI v1.0.11 or later (`copilot --version`)
- Authenticated GitHub Copilot subscription

## Installation

```bash
copilot plugin marketplace add MarcelRoozekrans/superpowers-extensions
```

Then install individual plugins from the marketplace:

```bash
copilot plugin install regression-test
copilot plugin install pre-push-review
copilot plugin install refactor-analysis
copilot plugin install decision-tracker
copilot plugin install roslyn-codelens-integration
copilot plugin install memorylens-integration
copilot plugin install project-orchestration
copilot plugin install ui-workflow
copilot plugin install ui-design-system
copilot plugin install squad
```

## Tool name mapping

Skills in this suite reference Claude Code tool names (`Read`, `Write`,
`Edit`, `Glob`, `Grep`, `Bash`). Copilot CLI uses different names for
roughly equivalent tools. The polymorphic session-start hook
(`hooks/session-start`) detects `COPILOT_CLI=1` in the environment and
emits the SDK-standard `additionalContext` JSON shape so the bootstrap
loads correctly.

If Copilot CLI does not auto-translate tool names, refer skills to Copilot
CLI equivalents at the host's discretion. The skills' instructions are
expressed in capability terms ("read the file", "use the Write tool") that
should map cleanly to Copilot CLI's native `view` / `bash` / `task` tools.

## Verify

In a Copilot CLI session, ask:

> What skills do you have loaded?

The agent should list the ten skills from this suite (regression-test,
pre-push-review, refactor-analysis, decision-tracker,
roslyn-codelens-integration, memorylens-integration, project-orchestration,
ui-workflow, ui-design-system, squad).

## Updating

The marketplace caches plugin metadata. To update:

```bash
copilot plugin marketplace update
copilot plugin upgrade --all
```

## Caveats

This integration is currently best-effort — verify in your environment
before relying on it for production work. The Copilot CLI plugin
marketplace API is still evolving; if `copilot plugin marketplace add` does
not yet accept Claude-Code-style marketplaces in your version, fall back
to the symlink approach used for Codex (see `.codex/INSTALL.md`) by
setting `~/.agents/skills/` instead of `~/.codex/`.
