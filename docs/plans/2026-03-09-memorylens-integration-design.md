# MemoryLens Integration Plugin — Design Document

**Date:** 2026-03-09
**Status:** Approved

## Problem Statement

When debugging .NET applications, memory issues (leaks, fragmentation, excessive allocations) are among the hardest to diagnose. The superpowers `systematic-debugging` skill provides a solid 4-phase methodology but has no awareness of memory profiling tools. Developers must manually attach profilers, interpret snapshots, and correlate findings — breaking the flow of structured debugging.

## Solution

A new `memorylens-integration` plugin that enhances the superpowers `systematic-debugging` skill with automatic .NET memory profiling. When MemoryLens MCP tools are detected, the plugin augments Phase 1 (Root Cause Investigation) with memory snapshot analysis and Phase 3 (Hypothesis Testing) with before/after snapshot comparison to validate fixes.

## Plugin Structure

```
plugins/memorylens-integration/
├── .claude-plugin/
│   └── plugin.json              # Metadata + MCP server auto-config
├── .mcp.json                    # Auto-configures MemoryLens MCP server
└── skills/
    └── memorylens-integration/
        ├── SKILL.md             # Main skill
        └── rule-reference.md    # ML001-ML010 quick reference
```

## Activation Model

- **Trigger:** `systematic-debugging` skill is active on a .NET project
- **Detection:** Check if `ensure_dotmemory` MCP tool is available
- **Behavior when absent:** Completely inert — no warnings, no interference

## Phase Integration

### Phase 1 — Root Cause Investigation (augmented)

Memory profiling is injected as an evidence-gathering step alongside existing investigation techniques:

1. Call `ensure_dotmemory` to verify/download the JetBrains dotMemory CLI
2. Call `list_processes` to find the target .NET process by name or PID
3. Call `snapshot` to capture current memory state
4. Call `analyze` to run the 10-rule engine against the snapshot
5. Present findings ordered by severity as evidence for root cause analysis

Findings feed directly into Phase 2 (Pattern Analysis) — the debugging skill naturally uses them to compare against known patterns and identify differences.

### Phase 3 — Hypothesis Testing (augmented)

After a fix is proposed and applied, memory profiling validates whether it actually works:

1. Call `compare_snapshots` with a configurable delay (default: 10s) to capture before/after state
2. Evaluate the diff: object count changes, retained bytes, new/surviving objects
3. If the memory issue persists or worsens, the hypothesis is rejected — return to Phase 2
4. If improvement is confirmed, proceed to Phase 4 (Implementation)

## MemoryLens MCP Tools Reference

| Tool | Phase | Purpose |
|------|-------|---------|
| `ensure_dotmemory` | 1 | Verify/download dotMemory CLI |
| `list_processes` | 1 | Find target .NET process |
| `snapshot` | 1 | Capture memory state |
| `analyze` | 1 | Run rule engine (ML001-ML010) |
| `compare_snapshots` | 3 | Before/after validation |
| `get_rules` | Reference | List available rules and metadata |

## Built-in Analysis Rules

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| ML001 | Critical | Leak | Event handler leak detected |
| ML002 | Critical | Leak | Static collection growing unbounded |
| ML003 | High | Leak | Disposable object not disposed |
| ML004 | High | Fragmentation | Large Object Heap fragmentation |
| ML005 | Medium | Retention | Object retained longer than expected |
| ML006 | Medium | Allocation | Excessive allocations in hot path |
| ML007 | Medium | Retention | Closure retaining unexpected references |
| ML008 | Low | Allocation | Array/list resizing without capacity hint |
| ML009 | Low | Pattern | Finalizer without Dispose pattern |
| ML010 | Low | Pattern | String interning opportunity |

Rules are customizable per-project via `.memorylens.json` in the project root.

## MCP Auto-Configuration

**`.mcp.json`:**
```json
{
  "memorylens": {
    "command": "dotnet",
    "args": ["run", "--project", "<memorylens-mcp-path>"]
  }
}
```

The exact server entrypoint args will be confirmed against the MemoryLens MCP repo's published installation method.

## Hub Updates

- Add `gh:MarcelRoozekrans/memorylens-mcp` to `marketplace.json` dependencies
- Add `memorylens-integration` plugin entry to marketplace plugins array
- Add `memorylens-integration` to commitlint scopes

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| systematic-debugging | Always-on when available | Augments Phase 1 (evidence) + Phase 3 (validation) |
| brainstorming | Read-only context | Surfaces memory constraints as architectural input |
| verification-before-completion | Final snapshot comparison | Proves fix resolved the memory issue |
| test-driven-development | Complementary | Memory assertions can be added to tests |

## Graceful Degradation

| Condition | Behavior |
|---|---|
| MemoryLens MCP unavailable | Skill is completely inert |
| dotMemory CLI not installed | `ensure_dotmemory` auto-downloads it |
| Target process not .NET | Skill stays dormant |
| No memory-related findings | Reports clean bill of health, debugging continues normally |
| `.memorylens.json` absent | Uses default rule configuration |
