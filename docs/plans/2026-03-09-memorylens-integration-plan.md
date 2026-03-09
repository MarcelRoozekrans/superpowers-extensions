# MemoryLens Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `memorylens-integration` plugin that enhances superpowers `systematic-debugging` with .NET memory profiling via MemoryLens MCP.

**Architecture:** Standalone plugin following the `roslyn-codelens-integration` pattern. Auto-configures MemoryLens MCP server, detects tool availability at runtime, augments debugging Phase 1 (evidence) and Phase 3 (validation). Gracefully inert when tools are absent.

**Tech Stack:** SKILL.md (markdown skill definition), JSON (plugin.json, .mcp.json, marketplace.json), JavaScript (commitlint config)

---

### Task 1: Create Plugin Directory Structure

**Files:**
- Create: `plugins/memorylens-integration/.claude-plugin/plugin.json`
- Create: `plugins/memorylens-integration/.mcp.json`

**Step 1: Create plugin.json**

```json
{
  "name": "memorylens-integration",
  "description": "Superpowers integration for MemoryLens memory profiling. Enhances systematic-debugging with .NET memory snapshot analysis and leak detection when MemoryLens MCP tools are available.",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "mcpServers": {
    "memorylens": {
      "command": "memorylens-mcp",
      "args": [],
      "transport": "stdio"
    }
  }
}
```

**Step 2: Create .mcp.json**

```json
{
  "memorylens": {
    "command": "memorylens-mcp",
    "args": [],
    "transport": "stdio"
  }
}
```

**Step 3: Commit**

```bash
git add plugins/memorylens-integration/.claude-plugin/plugin.json plugins/memorylens-integration/.mcp.json
git commit -m "feat(memorylens-integration): add plugin manifest and MCP auto-config"
```

---

### Task 2: Write the Main SKILL.md

**Files:**
- Create: `plugins/memorylens-integration/skills/memorylens-integration/SKILL.md`

**Step 1: Write SKILL.md**

```markdown
---
name: memorylens-integration
description: Use when systematic-debugging is active on a .NET codebase and MemoryLens MCP tools are available (ensure_dotmemory, snapshot, analyze, compare_snapshots)
---

# MemoryLens — Superpowers Debugging Integration

## Prerequisites

This skill requires the MemoryLens MCP server (6 tools). Install via:

```bash
claude install gh:MarcelRoozekrans/memorylens-mcp
```

## Detection

Check if `ensure_dotmemory` is available as an MCP tool. If not, this skill is inert — do nothing. No errors, no degradation.

## Overview

This skill enhances the superpowers `systematic-debugging` skill with .NET memory profiling. When MemoryLens tools are detected during debugging of a .NET application, memory snapshot analysis is automatically injected into Phase 1 (Root Cause Investigation) and Phase 3 (Hypothesis Testing).

**Core principle:** Memory issues need data, not guesses. Capture snapshots, run rules, compare before/after.

## Announce Line

When this skill activates alongside systematic-debugging:

> "MemoryLens tools detected. I'll use memory profiling for evidence gathering and fix validation."

---

## Phase 1: Root Cause Investigation (augmented)

When systematic-debugging Phase 1 is active on a .NET process, inject memory profiling as an evidence-gathering step:

### Step 1: Ensure Tooling

Call **`ensure_dotmemory`** to verify the JetBrains dotMemory CLI is available. This downloads it automatically if missing.

### Step 2: Identify Target Process

Call **`list_processes`** to find running .NET processes. Present the list and confirm the target with the user if ambiguous. If the user has already identified a PID, skip to Step 3.

### Step 3: Capture Memory Snapshot

Call **`snapshot`** with the target process PID. This captures the full memory state without stopping the process.

### Step 4: Analyze Snapshot

Call **`analyze`** to run the 10-rule engine (ML001-ML010) against the snapshot. The rules cover:

| Severity | Rules |
|----------|-------|
| Critical | ML001 (event handler leaks), ML002 (static collection growth) |
| High | ML003 (undisposed disposables), ML004 (LOH fragmentation) |
| Medium | ML005 (unexpected retention), ML006 (hot path allocations), ML007 (closure retention) |
| Low | ML008 (collection resizing), ML009 (finalizer without Dispose), ML010 (string interning) |

### Step 5: Present Findings

Present findings **ordered by severity** alongside other Phase 1 evidence. Format:

> **Memory Analysis Findings:**
> - **CRITICAL** ML001: Event handler leak — `UserService.OnDataChanged` (47 retained instances)
> - **HIGH** ML003: Disposable not disposed — `DbConnection` in `OrderRepository.GetOrders`
> - *(clean)* No fragmentation, retention, or allocation issues detected.

These findings feed directly into Phase 2 (Pattern Analysis) — the debugging skill uses them to compare against known patterns.

---

## Phase 3: Hypothesis Testing (augmented)

After a fix is proposed and applied, memory profiling validates whether it actually resolves the issue:

### Step 1: Apply the Fix

Ensure the proposed fix is compiled and the target process is running with the fix applied.

### Step 2: Compare Snapshots

Call **`compare_snapshots`** with:
- The target process PID
- A configurable delay (default: 10 seconds) between the two snapshots

This captures two snapshots and diffs them, showing:
- Objects that grew between snapshots
- New object types that appeared
- Retained bytes changes

### Step 3: Evaluate Results

| Result | Action |
|--------|--------|
| Issue resolved (object count stable, no growth) | Hypothesis confirmed — proceed to Phase 4 |
| Improvement but issue persists (reduced growth) | Partial fix — refine hypothesis, consider additional causes |
| No improvement or regression | Hypothesis rejected — return to Phase 2 |

### Step 4: Report

Present the comparison results alongside the hypothesis verdict:

> **Memory Comparison (10s interval):**
> - `UserService` retained instances: 47 → 2 (95% reduction) ✓
> - `DbConnection` surviving objects: 12 → 0 (resolved) ✓
> - **Verdict:** Fix validated. Proceeding to implementation.

---

## Tool Quick Reference

| Tool | Phase | Purpose |
|------|-------|---------|
| `ensure_dotmemory` | P1 | Verify/download dotMemory CLI |
| `list_processes` | P1 | Find target .NET process |
| `snapshot` | P1 | Capture memory state |
| `analyze` | P1 | Run rule engine (ML001-ML010) |
| `compare_snapshots` | P3 | Before/after fix validation |
| `get_rules` | Reference | List available rules and metadata |

---

## Red Flags

1. **Guessing at memory issues without a snapshot** — Always capture and analyze before proposing memory-related fixes. Data, not intuition.

2. **Skipping Phase 3 comparison after a memory fix** — A fix that "looks right" may not actually reduce retention. Always validate with `compare_snapshots`.

3. **Ignoring low-severity findings** — ML008-ML010 findings may not cause crashes but indicate code quality issues worth fixing alongside the main issue.

4. **Profiling the wrong process** — When multiple .NET processes are running, confirm the target with the user. `list_processes` returns all of them.

5. **Not re-running analysis after a fix** — If Phase 3 shows improvement but not full resolution, re-run full `analyze` to check if the fix introduced new issues.

## Per-Project Configuration

Rules can be customized per-project via `.memorylens.json` in the project root. Each rule can be enabled/disabled and its severity overridden. Call **`get_rules`** to see all available rules and their current configuration.

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:systematic-debugging` | **Always-on when detected.** Augments Phase 1 (snapshot + analyze for evidence) and Phase 3 (compare_snapshots for fix validation). | Falls back to standard debugging when MemoryLens tools are not available. |
| `superpowers:verification-before-completion` | **Complementary.** Final snapshot comparison proves the fix resolved the memory issue before claiming completion. | Use `compare_snapshots` as verification evidence. |
| `superpowers:test-driven-development` | **Complementary.** Memory findings can inform test assertions (e.g., assert no retained instances after disposal). | No direct tool usage — findings inform test design. |
| `superpowers:brainstorming` | **Read-only context.** Memory constraints (known leaks, fragmentation thresholds) inform architectural decisions. | No direct tool usage during brainstorming. |
| `roslyn-codelens-integration` | **Complementary.** Roslyn tools can locate the code causing memory issues found by MemoryLens (e.g., `find_callers` on a leaking event handler). | Both can be active simultaneously — Roslyn for structure, MemoryLens for runtime memory. |
| `decision-tracker` | **No interaction.** Decision tracking operates on cross-cutting decisions, not memory profiling. | Independent — both can be active simultaneously. |
```

**Step 2: Commit**

```bash
git add plugins/memorylens-integration/skills/memorylens-integration/SKILL.md
git commit -m "feat(memorylens-integration): add main skill for debugging phase integration"
```

---

### Task 3: Write Rule Reference Document

**Files:**
- Create: `plugins/memorylens-integration/skills/memorylens-integration/rule-reference.md`

**Step 1: Write rule-reference.md**

```markdown
# MemoryLens Rule Reference

Quick reference for the 10 built-in analysis rules. Use **`get_rules`** for live metadata including per-project overrides.

## Critical

### ML001 — Event Handler Leak

**Category:** Leak
**Trigger:** Event handler subscriptions without corresponding unsubscriptions.
**Impact:** Objects retained indefinitely via event delegate chains.
**Fix pattern:** Unsubscribe in `Dispose()` or use weak event pattern.

### ML002 — Static Collection Growing Unbounded

**Category:** Leak
**Trigger:** Static `List<T>`, `Dictionary<K,V>`, or `ConcurrentDictionary<K,V>` that only grows.
**Impact:** Unbounded memory growth over application lifetime.
**Fix pattern:** Add eviction policy, use `ConditionalWeakTable`, or scope the collection lifetime.

## High

### ML003 — Disposable Object Not Disposed

**Category:** Leak
**Trigger:** `IDisposable` instances that are not disposed or wrapped in `using`.
**Impact:** Unmanaged resources (connections, handles, streams) not released.
**Fix pattern:** Add `using` statement or `Dispose()` call. Consider `IAsyncDisposable` for async resources.

### ML004 — Large Object Heap Fragmentation

**Category:** Fragmentation
**Trigger:** Frequent allocation and deallocation of objects > 85KB on the LOH.
**Impact:** Memory fragmentation leading to `OutOfMemoryException` despite available memory.
**Fix pattern:** Use `ArrayPool<T>`, pre-allocate buffers, or enable LOH compaction via `GCSettings.LargeObjectHeapCompactionMode`.

## Medium

### ML005 — Object Retained Longer Than Expected

**Category:** Retention
**Trigger:** Objects surviving more GC generations than expected for their usage pattern.
**Impact:** Increased memory pressure, longer GC pauses.
**Fix pattern:** Review object lifetime scope. Consider `ObjectPool<T>` for frequently created/destroyed objects.

### ML006 — Excessive Allocations in Hot Path

**Category:** Allocation
**Trigger:** High allocation rate in frequently executed code paths.
**Impact:** GC pressure, potential GC pauses affecting latency.
**Fix pattern:** Use `Span<T>`, `stackalloc`, `ArrayPool<T>`, or cache computed values.

### ML007 — Closure Retaining Unexpected References

**Category:** Retention
**Trigger:** Lambda/delegate closures capturing variables with longer lifetimes than intended.
**Impact:** Objects retained by closure scope even after logical use ends.
**Fix pattern:** Extract captured variables to local scope, use static lambdas where possible.

## Low

### ML008 — Array/List Resizing Without Capacity Hint

**Category:** Allocation
**Trigger:** `List<T>` or `StringBuilder` growing through repeated resizing without initial capacity.
**Impact:** Unnecessary allocations and copies during growth.
**Fix pattern:** Provide initial capacity when the approximate size is known.

### ML009 — Finalizer Without Dispose Pattern

**Category:** Pattern
**Trigger:** Class has a finalizer (`~ClassName`) but does not implement `IDisposable`.
**Impact:** Objects promoted to Gen2 for finalization, delayed cleanup.
**Fix pattern:** Implement the full Dispose pattern (`IDisposable` + `Dispose(bool)` + `GC.SuppressFinalize`).

### ML010 — String Interning Opportunity

**Category:** Pattern
**Trigger:** Many duplicate string instances with identical content.
**Impact:** Unnecessary memory usage for repeated strings.
**Fix pattern:** Use `string.Intern()` for known repeated values, or use `StringPool` from CommunityToolkit.

## Per-Project Configuration

Create `.memorylens.json` in your project root to customize rules:

```json
{
  "rules": {
    "ML001": { "enabled": true, "severity": "critical" },
    "ML006": { "enabled": false },
    "ML010": { "severity": "medium" }
  }
}
```
```

**Step 2: Commit**

```bash
git add plugins/memorylens-integration/skills/memorylens-integration/rule-reference.md
git commit -m "docs(memorylens-integration): add rule reference for ML001-ML010"
```

---

### Task 4: Update Hub Configuration

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Modify: `commitlint.config.js`

**Step 1: Add dependency to marketplace.json**

Add `"gh:MarcelRoozekrans/memorylens-mcp"` to the `dependencies` array.

**Step 2: Add plugin entry to marketplace.json**

Add to the `plugins` array:

```json
{
  "name": "memorylens-integration",
  "description": "Superpowers integration for MemoryLens memory profiling. Enhances systematic-debugging with .NET memory snapshot analysis, leak detection, and before/after fix validation when MemoryLens MCP tools are available.",
  "version": "1.3.2",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "source": "./plugins/memorylens-integration",
  "category": "debugging"
}
```

**Step 3: Update marketplace.json description**

Update the top-level `description` to include "MemoryLens debugging":

```
"Extension skills for the superpowers suite: regression testing, pre-push review, refactor analysis, decision tracking, Roslyn CodeLens integration, MemoryLens debugging, and companion ecosystem plugins"
```

**Step 4: Add commitlint scope**

Add `'memorylens-integration'` to the `scope-enum` array in `commitlint.config.js`.

**Step 5: Commit**

```bash
git add .claude-plugin/marketplace.json commitlint.config.js
git commit -m "feat(memorylens-integration): register plugin in hub marketplace and commitlint"
```

---

### Task 5: Update Project Memory

**Files:**
- Modify: auto-memory `MEMORY.md`

**Step 1: Update MEMORY.md**

Add `memorylens-integration` to the plugins list (now 4 shipped + 1 designed → 5 shipped + 1 designed). Add `memorylens-mcp` to companion repos. Add `memorylens-integration` to commitlint scopes.

**Step 2: Commit** (not applicable — memory files are outside the repo)

---

### Task 6: Final Verification

**Step 1: Validate JSON files**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8')); console.log('marketplace.json: valid')"
node -e "JSON.parse(require('fs').readFileSync('plugins/memorylens-integration/.claude-plugin/plugin.json', 'utf8')); console.log('plugin.json: valid')"
node -e "JSON.parse(require('fs').readFileSync('plugins/memorylens-integration/.mcp.json', 'utf8')); console.log('.mcp.json: valid')"
```

Expected: All three print "valid".

**Step 2: Run markdown lint**

```bash
npm run lint:md
```

Expected: No errors on new files.

**Step 3: Verify commitlint**

```bash
echo "feat(memorylens-integration): test" | npx commitlint
```

Expected: Passes validation.
