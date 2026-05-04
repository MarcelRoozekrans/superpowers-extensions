# Installing superpowers-extensions for Codex CLI / Codex App

Codex auto-discovers skills under `~/.agents/skills/`. Each plugin in this
suite is a separate skill bundle, so installation is a clone followed by
ten symlinks (one per plugin).

## Prerequisites

- Git
- Codex CLI 0.x or Codex App

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/MarcelRoozekrans/superpowers-extensions.git ~/.codex/superpowers-extensions
   ```

2. **Symlink each plugin's skill directory into `~/.agents/skills/`:**

   **macOS / Linux:**

   ```bash
   mkdir -p ~/.agents/skills
   REPO=~/.codex/superpowers-extensions
   for plugin in regression-test pre-push-review refactor-analysis decision-tracker \
                 roslyn-codelens-integration memorylens-integration project-orchestration \
                 ui-workflow ui-design-system squad; do
     ln -sfn "$REPO/plugins/$plugin/skills/$plugin" "$HOME/.agents/skills/$plugin"
   done
   ```

   **Windows (PowerShell, run as Administrator for symlinks — or use junctions):**

   ```powershell
   $repo = "$env:USERPROFILE\.codex\superpowers-extensions"
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills" | Out-Null
   $plugins = @(
     'regression-test', 'pre-push-review', 'refactor-analysis', 'decision-tracker',
     'roslyn-codelens-integration', 'memorylens-integration', 'project-orchestration',
     'ui-workflow', 'ui-design-system', 'squad'
   )
   foreach ($plugin in $plugins) {
     $src = "$repo\plugins\$plugin\skills\$plugin"
     $dst = "$env:USERPROFILE\.agents\skills\$plugin"
     cmd /c mklink /J "$dst" "$src"
   }
   ```

3. **Restart Codex** (quit and relaunch the CLI / App) to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/ | grep -E '(regression-test|pre-push-review|refactor-analysis|decision-tracker|roslyn-codelens-integration|memorylens-integration|project-orchestration|ui-workflow|ui-design-system|squad)'
```

You should see ten symlinks (or junctions on Windows), one per plugin.

## Updating

```bash
cd ~/.codex/superpowers-extensions && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
for plugin in regression-test pre-push-review refactor-analysis decision-tracker \
              roslyn-codelens-integration memorylens-integration project-orchestration \
              ui-workflow ui-design-system squad; do
  rm -f "$HOME/.agents/skills/$plugin"
done
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers-extensions`.

## Selective install

To install only specific plugins, replace the loop body with the plugin names you want.
For example, frontend-only:

```bash
for plugin in ui-workflow ui-design-system regression-test; do
  ln -sfn "$REPO/plugins/$plugin/skills/$plugin" "$HOME/.agents/skills/$plugin"
done
```
