# Sync Integration Skills with Dependent Repos — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update four files to reflect upstream changes in roslyn-codelens-mcp, memorylens-mcp, and LongtermMemory-MCP.

**Architecture:** Section-complete edits to three skill SKILL.md files and one marketplace.json. No code logic — all changes are documentation/skill content. No test framework applies; each task self-verifies by reading the final state of the file before committing.

**Tech Stack:** Markdown skill files, JSON marketplace descriptor, git.

---

### Task 1: roslyn-codelens-integration SKILL.md — prerequisites + solution management section

**Files:**
- Modify: `plugins/roslyn-codelens-integration/skills/roslyn-codelens-integration/SKILL.md:10`

**Context:** The upstream roslyn-codelens-mcp added `list_solutions`, `set_active_solution`, and promoted `rebuild_solution` to a first-class named tool. Our integration skill still says "21 tools" and has no Solution Management section.

**Step 1: Update the prerequisites line**

In `SKILL.md` line 10, change:

```
This skill requires the roslyn-codelens MCP server (21 tools). Install via:
```

to:

```
This skill requires the roslyn-codelens MCP server (24 tools). Install via:
```

**Step 2: Add Solution Management sub-section**

After the Phase 6 section (the last line of the Refactor Analysis Integration block, currently ending with "Use `get_project_dependencies` and `find_circular_dependencies` to inform the topological sort..."), add a new section before the Tool Quick Reference:

```markdown
---

## Solution Management

These tools apply across all skill integrations whenever multiple solutions are involved:

### At Session Start

Call **`list_solutions`** at the start of any session to see all loaded solutions, which one is active, how many projects each has, and their status. If more than one solution is loaded and the user's request targets a specific one, call **`set_active_solution`** with a partial name (e.g., `set_active_solution("ProjectB")`).

### After Structural Changes

Call **`rebuild_solution`** after any of these events:

- Adding or removing NuGet packages
- Modifying `Directory.Build.props` or global analyzer configuration
- Adding or removing projects from the solution
- When `get_diagnostics` returns stale or unexpected results

This forces a full reload — re-opens the `.sln`, recompiles all projects, and rebuilds all indexes. Do not call it speculatively; only call it when there is a reason to believe the analysis is out of date.
```

**Step 3: Update Tool Quick Reference table**

The existing table ends with a row:
```
| `rebuild_solution` | (after structural changes) | (after structural changes) |
```

Replace that last row and add two new rows so the bottom of the table reads:

```markdown
| `list_solutions` | Session start (multi-solution) | Session start (multi-solution) |
| `set_active_solution` | When user targets specific project | When user targets specific project |
| `rebuild_solution` | After structural changes | After structural changes |
```

**Step 4: Verify**

Read lines 1-20 to confirm "24 tools" is present.
Read the file around the new section to confirm it appears between refactor analysis and the Tool Quick Reference header.
Read the bottom of the Quick Reference table to confirm all three solution management rows are present.

**Step 5: Commit**

```bash
git add plugins/roslyn-codelens-integration/skills/roslyn-codelens-integration/SKILL.md
git commit -m "feat(roslyn-codelens-integration): add list_solutions, set_active_solution, promote rebuild_solution"
```

---

### Task 2: memorylens-integration SKILL.md — brainstorming integration section + relationship table

**Files:**
- Modify: `plugins/memorylens-integration/skills/memorylens-integration/SKILL.md`

**Context:** The upstream memorylens-mcp SKILL.md added a brainstorming integration section — applying ML rule knowledge (not actual profiling) during design discussions. Our integration skill only covers systematic-debugging. The Relationship table also lacks a `superpowers:brainstorming` row.

**Step 1: Add Brainstorming Integration section**

After the Phase 3 section (ending with the "Report" step and the comparison results example block), and before the Tool Quick Reference, add:

```markdown
---

## Brainstorming Integration

When brainstorming is active on a .NET project and `ensure_dotmemory` is available, apply ML rule knowledge to inform design questions and approach proposals. **No profiling happens during brainstorming** — no `snapshot` or `compare_snapshots` calls. This is knowledge application only.

### Trigger

Check if `ensure_dotmemory` is available as an MCP tool. If it is and brainstorming is active on a .NET codebase, apply the guidance below.

### What to Do

When the design involves any of the following patterns, proactively raise the corresponding memory risk as part of the design discussion:

| Design Pattern | ML Rule | Risk |
|---|---|---|
| Event subscriptions (event handlers, delegates, callbacks) | ML001 | Event handler leak — subscribers keep publishers alive. Ask: how are subscriptions cleaned up when the subscriber is disposed? |
| Static or long-lived collections (caches, registries, pools) | ML002, ML005 | Static collection growth / gen2 retention. Ask: is there a bounded eviction policy? |
| `IDisposable` implementations or resource ownership | ML003, ML009 | Undisposed disposables / finalizer without Dispose. Ask: who owns disposal and what is the lifetime? |
| Large buffers, arrays, or streaming data (> 85 KB) | ML004, ML008 | LOH fragmentation / collection resizing. Ask: is the buffer reused or allocated per request? Can `ArrayPool<T>` help? |

Raise these as design questions, not as blocking warnings. The goal is to surface memory constraints early — before the design is locked in — so they can inform the proposed approaches.

### Announce Line

> "MemoryLens rule knowledge active. I'll flag memory risk patterns as they appear in the design."
```

**Step 2: Update Relationship table**

The current Relationship table has these rows:
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`
- `superpowers:test-driven-development`
- `superpowers:brainstorming` (read-only context row)
- `roslyn-codelens-integration`
- `decision-tracker`

The `superpowers:brainstorming` row currently says "Read-only context. Memory constraints (known leaks, fragmentation thresholds) inform architectural decisions. No direct tool usage during brainstorming."

Replace that row with:

```markdown
| `superpowers:brainstorming` | **Active when detected.** Applies ML rule knowledge to flag memory risks during design (event leaks, static growth, LOH fragmentation, IDisposable ownership). No profiling — knowledge only. | Falls back to standard brainstorming when MemoryLens tools are not available. |
```

**Step 3: Verify**

Read the file around the new section to confirm it appears between Phase 3 and the Tool Quick Reference.
Read the Relationship table to confirm the brainstorming row is updated.

**Step 4: Commit**

```bash
git add plugins/memorylens-integration/skills/memorylens-integration/SKILL.md
git commit -m "feat(memorylens-integration): add brainstorming integration section and update relationship table"
```

---

### Task 3: decision-tracker SKILL.md — search_by_date_range stale validation

**Files:**
- Modify: `plugins/decision-tracker/skills/decision-tracker/SKILL.md`

**Context:** LongtermMemory-MCP 1.3.0 added `search_by_date_range`. The current stale-decision validation step (Decision Recall, step 5) is manual — it relies on the AI noticing the age of recalled memories. We want to make it automatic: call `search_by_date_range` to find decisions older than 90 days, then ask about each one.

**Step 1: Update Prerequisites**

The prerequisites block currently ends with:
```
This skill requires LongtermMemory-MCP tools (`save_memory`, `search_memory`, `search_by_tags`, `update_memory`, `delete_memory`) for full functionality.
```

Change to:
```
This skill requires LongtermMemory-MCP tools (`save_memory`, `search_memory`, `search_by_tags`, `search_by_date_range`, `update_memory`, `delete_memory`) for full functionality.
```

**Step 2: Rewrite stale validation step (Decision Recall, step 5)**

The current step 5 reads:

```markdown
5. **Validate stale decisions** — for decisions older than 90 days, ask:

   > "This decision was made N months ago: [decision]. Still valid?"

   If the user says the decision is no longer valid, call `delete_memory` to remove it. If the decision has been replaced by a newer one, call `update_memory` to record what superseded it.
```

Replace with:

```markdown
5. **Validate stale decisions** — after the main recall, call `search_by_date_range` with:
   - `start`: any date in the past (e.g., `2000-01-01`)
   - `end`: today's date minus 90 days

   Then filter the results to only those that have both `decision` and `project:<name>` in their tags.

   - If no stale decisions are found, skip this step entirely — do not prompt the user.
   - If stale decisions are found, present them grouped under a **"Decisions to validate (90+ days old)"** heading and for each ask:

     > "This decision is N months old: [decision]. Still valid?"

     - User confirms → no action
     - User says no longer valid → call `delete_memory`
     - User says superseded → call `update_memory` to record what replaced it
```

**Step 3: Update Quick Reference table**

The current "Stale validation" row reads:
```
| Stale validation | Check age > 90 days → ask user → delete or update | `delete_memory`, `update_memory` |
```

Replace with:
```
| Stale validation | `search_by_date_range` (end = today − 90d) → filter by tags → ask user → delete or update | `search_by_date_range`, `delete_memory`, `update_memory` |
```

**Step 4: Verify**

Read the prerequisites block to confirm `search_by_date_range` is present.
Read Decision Recall step 5 to confirm the new `search_by_date_range` call is described correctly.
Read the Quick Reference table to confirm the stale validation row is updated.

**Step 5: Commit**

```bash
git add plugins/decision-tracker/skills/decision-tracker/SKILL.md
git commit -m "feat(decision-tracker): automate stale validation with search_by_date_range"
```

---

### Task 4: marketplace.json — update roslyn tool count

**Files:**
- Modify: `.claude-plugin/marketplace.json:58`

**Context:** The roslyn-codelens-integration plugin description says "21 semantic .NET code analysis tools" — stale after adding list_solutions, set_active_solution, and promoting rebuild_solution.

**Step 1: Update the description**

In `.claude-plugin/marketplace.json`, find the `roslyn-codelens-integration` plugin entry. Its current description is:

```
"Maps 21 semantic .NET code analysis tools into brainstorming and refactor-analysis phases for architectural context, dependency mapping, risk detection, and code quality analysis."
```

Change `21` to `24`:

```
"Maps 24 semantic .NET code analysis tools into brainstorming and refactor-analysis phases for architectural context, dependency mapping, risk detection, and code quality analysis."
```

**Step 2: Verify**

Read `.claude-plugin/marketplace.json` lines 56-66 to confirm "24 tools" is present and the rest of the JSON is unchanged.

**Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "chore(deps): update roslyn tool count to 24 in marketplace.json"
```
