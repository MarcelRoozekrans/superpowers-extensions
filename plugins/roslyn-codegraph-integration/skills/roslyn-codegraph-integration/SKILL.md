---
name: roslyn-codegraph-integration
description: Use when brainstorming or refactor-analysis is active on a .NET codebase and roslyn-codegraph MCP tools are available (find_implementations, find_callers, etc.)
---

# Roslyn Code Graph — Superpowers Integration

## Prerequisites

This skill requires the roslyn-codegraph MCP server tools (`find_implementations`, `find_callers`, `get_type_hierarchy`, `get_di_registrations`, `get_project_dependencies`, `get_symbol_context`, `find_reflection_usage`).

**Auto-configured:** When installed via `claude plugin install roslyn-codegraph-integration`, the `.mcp.json` configures the `roslyn-codegraph` MCP server with a bootstrap script that auto-installs the `roslyn-codegraph-mcp` dotnet global tool on first run. No manual setup needed.

**Manual install (if not using the plugin):**

```bash
dotnet tool install -g roslyn-codegraph-mcp
claude mcp add roslyn-codegraph -- roslyn-codegraph-mcp
```

## Detection

Check if `find_implementations` is available as an MCP tool. If not, this skill is inert — do nothing. No errors, no degradation.

## Overview

This skill enhances two superpowers skills with semantic .NET code intelligence. When roslyn-codegraph tools are detected, use them **instead of Grep/Glob** for structural code queries — they provide semantic accuracy that text search cannot match.

**Core principle:** Grep finds text. Roslyn understands code. Use Roslyn for structure, Grep for content.

## Announce Line

When this skill activates alongside brainstorming or refactor-analysis:

> "Roslyn code graph tools detected. I'll use semantic code intelligence for architectural context."

## Brainstorming Integration

When brainstorming is active on a .NET codebase and roslyn tools are available, enhance each phase:

### Phase 1: Explore Project Context

**Before asking clarifying questions**, build architectural context:

1. **Call `get_project_dependencies`** on the main project to understand solution architecture and how projects relate.
2. **Call `get_symbol_context`** on any types mentioned in the user's initial request for a full context dump (namespace, base class, interfaces, DI dependencies, public members).
3. Present architecture summary alongside your first clarifying question.

### Phase 2: Clarifying Questions

Ground your questions in actual architecture:

- Use `find_implementations` to know what implements an interface before asking "should we extend this?"
- Use `get_type_hierarchy` to understand inheritance chains before asking about extension points.
- Use `find_callers` to know the blast radius before asking "should we change this API?"

### Phase 3: Proposing Approaches

Back each approach with concrete evidence:

- `get_di_registrations` — how is the current wiring set up?
- `find_reflection_usage` — are there hidden couplings that constrain options?
- `get_type_hierarchy` — what extension points already exist?

### Phase 4: Design Presentation

Reference concrete types, interfaces, and call sites. Not "the services that implement the interface" but:

> "These 4 classes implement IUserService: UserService, CachedUserService, MockUserService, AdminUserService."

## Refactor Analysis Integration

When refactor-analysis is active on a .NET codebase and roslyn tools are available, replace text-based search in key phases:

### Phase 2: Direct Dependency Mapping

**Replace Grep with semantic tools:**

| Text Search | Roslyn Replacement | Why |
|---|---|---|
| Grep for type name in imports | `find_callers` on the type's constructor or methods | Finds actual usage, not just string matches |
| Grep for method name | `find_callers` on the specific method | Excludes unrelated methods with the same name |
| Grep for interface name | `find_implementations` | Finds all implementors, including indirect ones |

### Phase 3: Transitive Closure

**Replace iterative text search with semantic traversal:**

- `get_type_hierarchy` — walk up and down inheritance chains to find all affected types.
- `get_project_dependencies` — understand which projects are affected and in what order.
- `get_symbol_context` — for each newly discovered affected type, check its full context to find additional transitive impacts.

### Phase 5: Risk Identification

**Add reflection-aware risk detection:**

- `find_reflection_usage` — detect dynamic instantiation (`Activator.CreateInstance`), method invocation (`MethodInfo.Invoke`), assembly scanning, and attribute-based discovery that text search would miss.
- Flag any reflection-based reference as **high risk** — these are invisible to refactoring tools and IDEs.

## Tool Quick Reference

| Tool | Brainstorming Use | Refactor Analysis Use |
|---|---|---|
| `find_implementations` | Know all implementors before proposing changes | Phase 2: semantic dependency mapping |
| `find_callers` | Understand blast radius of API changes | Phase 2: find all call sites accurately |
| `get_type_hierarchy` | Map inheritance chains and extension points | Phase 3: transitive closure via inheritance |
| `get_di_registrations` | Understand current wiring and lifetimes | Phase 2: find DI-based dependencies |
| `get_project_dependencies` | Solution architecture overview | Phase 3: project-level impact ordering |
| `get_symbol_context` | One-shot type context dump | Phase 2: full context for each target |
| `find_reflection_usage` | Detect hidden couplings | Phase 5: reflection-based risk detection |

## Red Flags

1. **Using Grep for structural queries when Roslyn is available** — Grep finds text, not semantics. `find_callers` is always more accurate than grepping for a method name.

2. **Skipping `find_reflection_usage` during risk identification** — Reflection-based references are the most dangerous because they're invisible to normal refactoring. Always check.

3. **Not calling `get_project_dependencies` at brainstorming start** — Without the project graph, you're guessing at architecture. One call gives you the full picture.

4. **Reporting "no dependencies found" without checking Roslyn** — If Grep found nothing but Roslyn is available, check with `find_callers` before concluding there are no dependencies.

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | **Always-on when detected.** Enhances all 4 phases with semantic code intelligence. Grounds clarifying questions and approach proposals in actual architecture. | Falls back to Grep/Glob when roslyn tools are not available. |
| `refactor-analysis` | **Always-on when detected.** Replaces text search in Phase 2 (dependency mapping), Phase 3 (transitive closure), and Phase 5 (risk identification). | Falls back to the standard text-based approach when roslyn tools are not available. |
| `superpowers:writing-plans` | **Indirect benefit.** Plans produced after roslyn-enhanced brainstorming or refactor-analysis contain more accurate dependency information. | No direct tool usage during plan writing. |
| `superpowers:subagent-driven-development` | **Indirect benefit.** Subagents implementing plans get better context when plans were informed by semantic analysis. | Subagents can use roslyn tools directly if available in their session. |
| `decision-tracker` | **No interaction.** Decision tracking operates on cross-cutting decisions, not code structure. | Independent — both can be active simultaneously. |
