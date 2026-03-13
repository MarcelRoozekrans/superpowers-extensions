# Design: Sync Integration Skills with Dependent Repos

**Date:** 2026-03-13
**Branch:** rename/roslyn-codelens-integration
**Approach:** Section-complete updates (Option B)

## Context

Three dependent repos shipped changes since the last sync:

| Repo | Updated | Change |
|---|---|---|
| `roslyn-codelens-mcp` | 2026-03-13 | Added `list_solutions`, `set_active_solution`; promoted `rebuild_solution` to first-class tool |
| `memorylens-mcp` | 2026-03-10 | Added brainstorming integration section |
| `LongtermMemory-MCP` | 2026-03-11 | Added `search_by_date_range` tool |

## Changes

### 1. roslyn-codelens-integration SKILL.md

**Prerequisites:** Update tool count from "21 tools" → "24 tools".

**New "Solution Management" sub-section** (between execution order content and Tool Quick Reference):

- `list_solutions` — call at session start when multiple solutions may be loaded
- `set_active_solution` — call when user's request targets a specific project in a multi-solution workspace
- `rebuild_solution` — call after structural changes (NuGet packages, `Directory.Build.props`, stale diagnostics)

**Tool Quick Reference table:** Promote `rebuild_solution` from footnote to full row; add `list_solutions` and `set_active_solution` rows.

### 2. memorylens-integration SKILL.md

**New "Brainstorming Integration" section** (after Phase 3, before Tool Quick Reference):

- Trigger: brainstorming active on .NET project + `ensure_dotmemory` available
- Apply rule knowledge (no actual profiling/snapshots during brainstorming):
  - Event systems → ML001 (event handler leaks)
  - Caching / static collections → ML002, ML005 (static growth, gen2 retention)
  - `IDisposable` designs → ML003, ML009 (undisposed, finalizer without Dispose)
  - Large data / buffers → ML004, ML008 (LOH fragmentation, collection resizing)
- No `snapshot` or `compare_snapshots` calls during brainstorming — knowledge only

**Relationship table:** Add `superpowers:brainstorming` row (currently missing).

### 3. decision-tracker SKILL.md

**Prerequisites:** Add `search_by_date_range` to tool list.

**Stale decision validation (Decision Recall, step 5):** Rewrite to use `search_by_date_range` automatically:

1. After main `search_by_tags` recall, call `search_by_date_range` with end date = today − 90 days, filtered to `["decision", "project:<name>"]` tags
2. Present stale candidates grouped under "Decisions to validate" heading
3. For each: ask "Still valid?" → `delete_memory` or `update_memory`
4. If no stale results, skip the step — no prompt to user

**Quick Reference table:** Add `search_by_date_range` to the "Stale validation" row.

### 4. marketplace.json

Update `roslyn-codelens-integration` plugin description: "21 semantic .NET code analysis tools" → "24 tools".

## Files Touched

- `plugins/roslyn-codelens-integration/skills/roslyn-codelens-integration/SKILL.md`
- `plugins/memorylens-integration/skills/memorylens-integration/SKILL.md`
- `plugins/decision-tracker/skills/decision-tracker/SKILL.md`
- `.claude-plugin/marketplace.json`
