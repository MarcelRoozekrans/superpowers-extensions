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
>
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
>
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

## Context

This is the main skill file for the memorylens-integration plugin. It follows the exact same structure as `plugins/roslyn-codelens-integration/skills/roslyn-codelens-integration/SKILL.md` — frontmatter, prerequisites, detection, overview, phase integration, tool reference, red flags, relationships table.
