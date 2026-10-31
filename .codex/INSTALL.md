# Installing superpowers-extensions for Codex CLI / Codex App

Codex auto-discovers skills under `~/.agents/skills/`. Each plugin in this
suite is a separate skill bundle, so installation is a clone followed by
twenty symlinks (one per skill).

## Prerequisites

- Git
- Codex CLI 0.x or Codex App

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/MarcelRoozekrans/superpowers-extensions.git ~/.codex/superpowers-extensions
   ```

2. **Symlink each plugin's skill directories into `~/.agents/skills/`:**

   **macOS / Linux:**

   ```bash
   mkdir -p ~/.agents/skills
   REPO=~/.codex/superpowers-extensions
   for plugin in regression-test pre-push-review refactor-analysis decision-tracker \
                 roslyn-codelens-integration memorylens-integration project-orchestration \
                 ui-workflow ui-design-system squad compress-memory logo-design context-budget anti-slop demo-video retro wizard upstream-issue architecture-scan; do
     for skill in "$REPO/plugins/$plugin/skills/"*/; do
       ln -sfn "${skill%/}" "$HOME/.agents/skills/$(basename "$skill")"
     done
   done
   ```

   **Windows (PowerShell, run as Administrator for symlinks — or use junctions):**

   ```powershell
   $repo = "$env:USERPROFILE\.codex\superpowers-extensions"
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills" | Out-Null
   $plugins = @(
     'regression-test', 'pre-push-review', 'refactor-analysis', 'decision-tracker',
     'roslyn-codelens-integration', 'memorylens-integration', 'project-orchestration',
     'ui-workflow', 'ui-design-system', 'squad', 'compress-memory', 'logo-design', 'context-budget', 'anti-slop', 'demo-video', 'retro', 'wizard', 'upstream-issue', 'architecture-scan'
   )
   foreach ($plugin in $plugins) {
     foreach ($skill in Get-ChildItem -Directory "$repo\plugins\$plugin\skills") {
       $dst = "$env:USERPROFILE\.agents\skills\$($skill.Name)"
       cmd /c mklink /J "$dst" "$($skill.FullName)"
     }
   }
   ```

3. **Restart Codex** (quit and relaunch the CLI / App) to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/ | grep -E '(regression-test|pre-push-review|refactor-analysis|decision-tracker|roslyn-codelens-integration|memorylens-integration|project-orchestration|ui-workflow|ui-design-system|squad|compress-memory|logo-design|context-budget|anti-slop|demo-video|retro|wizard|upstream-issue|architecture-scan|codebase-design)'
```

You should see twenty symlinks (or junctions on Windows), one per skill.

## Updating

```bash
cd ~/.codex/superpowers-extensions && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

Remove every link in `~/.agents/skills/` that points into the clone. This does
not need the clone to exist, so it also works after you delete it:

```bash
for link in "$HOME/.agents/skills/"*; do
  [ -L "$link" ] || continue
  case "$(readlink "$link")" in
    */superpowers-extensions/plugins/*) rm -f "$link" ;;
  esac
done
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers-extensions`.

## Selective install

To install only specific plugins, replace the loop body with the plugin names you want.
For example, frontend-only:

```bash
REPO=~/.codex/superpowers-extensions
for plugin in ui-workflow ui-design-system regression-test; do
  for skill in "$REPO/plugins/$plugin/skills/"*/; do
    ln -sfn "${skill%/}" "$HOME/.agents/skills/$(basename "$skill")"
  done
done
```
