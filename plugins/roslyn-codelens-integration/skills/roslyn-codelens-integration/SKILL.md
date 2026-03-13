---
name: roslyn-codelens-integration
description: Use when brainstorming or refactor-analysis is active on a .NET codebase and roslyn-codelens MCP tools are available (find_implementations, find_callers, get_diagnostics, etc.)
---

# Roslyn CodeLens — Superpowers Integration

## Prerequisites

This skill requires the roslyn-codelens MCP server (24 tools). Install via:

```bash
claude install gh:MarcelRoozekrans/roslyn-codelens-mcp
```

## Detection

Check if `find_implementations` is available as an MCP tool. If not, this skill is inert — do nothing. No errors, no degradation.

## Overview

This skill enhances superpowers skills with semantic .NET code intelligence. When roslyn-codelens tools are detected, use them **instead of Grep/Glob** for structural code queries and **instead of `dotnet build`** for diagnostics.

**Core principle:** Grep finds text. Roslyn understands code. Use Roslyn for structure, Grep for content.

## Announce Line

When this skill activates alongside brainstorming or refactor-analysis:

> "Roslyn CodeLens tools detected. I'll use semantic code intelligence for architectural context."

---

## Brainstorming Integration

When brainstorming is active on a .NET codebase and roslyn tools are available, enhance each phase:

### Phase 1: Explore Project Context

**Before asking clarifying questions**, build architectural context:

1. **`get_project_dependencies`** — understand solution architecture and how projects relate.
2. **`get_symbol_context`** on types mentioned in the user's request — full context dump (namespace, base class, interfaces, DI dependencies, public members).
3. **`get_nuget_dependencies`** — know what external packages are in play (frameworks, libraries, analyzers).
4. **`get_source_generators`** — check if source generators produce code relevant to the area under discussion.
5. Present architecture summary alongside your first clarifying question.

### Phase 2: Clarifying Questions

Ground your questions in actual architecture:

- **`find_implementations`** — know all implementors before asking "should we extend this?"
- **`get_type_hierarchy`** — understand inheritance chains before asking about extension points.
- **`find_callers`** — know the blast radius before asking "should we change this API?"
- **`find_references`** — comprehensive reference count to gauge coupling.
- **`find_attribute_usages`** — discover attribute-driven behaviors (authorization, serialization, validation) that constrain options.
- **`search_symbols`** — fuzzy-find related types when the user mentions a concept by partial name.

### Phase 3: Proposing Approaches

Back each approach with concrete evidence:

- **`get_di_registrations`** — how is the current wiring set up? What lifetimes are in use?
- **`find_reflection_usage`** — are there hidden couplings that constrain options?
- **`get_type_hierarchy`** — what extension points already exist?
- **`get_diagnostics`** — are there existing warnings or analyzer findings in the area?
- **`get_code_fixes`** — can any existing issues be addressed as part of the proposed change?
- **`get_complexity_metrics`** — is the area already complex enough to warrant simplification?
- **`find_circular_dependencies`** — will any approach introduce or break a dependency cycle?

### Phase 4: Design Presentation

Reference concrete types, interfaces, and call sites. Not "the services that implement the interface" but:

> "These 4 classes implement IUserService: UserService, CachedUserService, MockUserService, AdminUserService."

Use **`go_to_definition`** to link to exact source locations when referencing types in the design.

---

## Refactor Analysis Integration

When refactor-analysis is active on a .NET codebase and roslyn tools are available, replace text-based search in key phases:

### Phase 2: Direct Dependency Mapping

**Replace Grep with semantic tools:**

| Text Search | Roslyn Replacement | Why |
|---|---|---|
| Grep for type name in imports | **`find_references`** on the type | Finds every reference, not just string matches |
| Grep for method name | **`find_callers`** on the specific method | Excludes unrelated methods with the same name |
| Grep for interface name | **`find_implementations`** | Finds all implementors, including indirect ones |
| Grep for file path | **`go_to_definition`** to verify, then **`find_references`** | Semantic, not string-based |
| Grep for attribute usage | **`find_attribute_usages`** | Finds all decorated types/members accurately |
| Glob for related files | **`search_symbols`** for related types | Discovers by symbol name, not file name |

Also call **`get_symbol_context`** for each target — one call gives namespace, base class, interfaces, DI dependencies, and public members.

### Phase 3: Transitive Closure

**Replace iterative text search with semantic traversal:**

- **`get_type_hierarchy`** — walk up and down inheritance chains to find all affected types.
- **`get_project_dependencies`** — understand which projects are affected and in what order.
- **`get_symbol_context`** — for each newly discovered affected type, check full context for additional transitive impacts.
- **`get_nuget_dependencies`** — identify external package boundaries where the ripple stops.
- **`find_circular_dependencies`** — detect cycles in the dependency graph that complicate execution order.

### Phase 5: Risk Identification

**Replace text-based risk detection with semantic analysis:**

| Risk Category | Text Search | Roslyn Replacement |
|---|---|---|
| Dynamic references | Grep for string literals | **`find_reflection_usage`** — detects `Activator.CreateInstance`, `MethodInfo.Invoke`, assembly scanning |
| Attribute-driven behavior | Grep for `[AttributeName]` | **`find_attribute_usages`** — finds all decorated members accurately |
| Dead code | Manual inspection | **`find_unused_symbols`** — reference-based dead code detection |
| Complexity hotspots | Manual review | **`get_complexity_metrics`** — cyclomatic complexity per method |
| Naming inconsistencies | Manual review | **`find_naming_violations`** — convention compliance check |
| Oversized types | Manual review | **`find_large_classes`** — types that may need splitting |
| Compiler/analyzer warnings | `dotnet build` output | **`get_diagnostics`** — structured errors, warnings, and analyzer results |
| Auto-fixable issues | Manual interpretation | **`get_code_fixes`** — structured text edits for diagnostics |
| Generated code coupling | File search for `*.g.cs` | **`get_source_generators`** + **`get_generated_code`** — inspect generator output for coupling |

Flag any reflection-based reference as **high risk** — these are invisible to refactoring tools and IDEs.

### Phase 6: Safe Execution Order

Use **`get_project_dependencies`** and **`find_circular_dependencies`** to inform the topological sort. Project-level dependency ordering ensures cross-project changes compile at each checkpoint.

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

---

## Tool Quick Reference

| Tool | Brainstorming Phase | Refactor Analysis Phase |
|---|---|---|
| `find_implementations` | P2: know implementors | P2: semantic dependency mapping |
| `find_callers` | P2: blast radius | P2: find all call sites |
| `find_references` | P2: coupling gauge | P2: comprehensive reference search |
| `go_to_definition` | P4: link to sources | P2: verify locations |
| `search_symbols` | P2: fuzzy discovery | P2: find related types |
| `get_type_hierarchy` | P2: inheritance chains | P3: transitive closure |
| `get_symbol_context` | P1: type context dump | P2/P3: full context per target |
| `get_di_registrations` | P3: wiring and lifetimes | P2: DI-based dependencies |
| `get_project_dependencies` | P1: architecture overview | P3/P6: project-level ordering |
| `get_nuget_dependencies` | P1: external packages | P3: package boundaries |
| `find_reflection_usage` | P3: hidden couplings | P5: reflection risk detection |
| `find_attribute_usages` | P2: attribute behaviors | P2/P5: decorated members |
| `get_diagnostics` | P3: existing warnings | P5: compiler/analyzer findings |
| `get_code_fixes` | P3: auto-fixable issues | P5: structured fix suggestions |
| `find_unused_symbols` | — | P5: dead code detection |
| `get_complexity_metrics` | P3: complexity gauge | P5: complexity hotspots |
| `find_naming_violations` | — | P5: naming compliance |
| `find_large_classes` | — | P5: oversized types |
| `find_circular_dependencies` | P3: cycle detection | P3/P5/P6: dependency cycles |
| `get_source_generators` | P1: generator awareness | P5: generated code coupling |
| `get_generated_code` | — | P5: inspect generator output |
| `list_solutions` | Session start (multi-solution) | Session start (multi-solution) |
| `set_active_solution` | When user targets specific project | When user targets specific project |
| `rebuild_solution` | After structural changes | After structural changes |

---

## Red Flags

1. **Using Grep for structural queries when Roslyn is available** — Grep finds text, not semantics. `find_callers` is always more accurate than grepping for a method name.

2. **Running `dotnet build` for diagnostics when Roslyn is available** — `get_diagnostics` returns the same errors plus analyzer results, structured as data. Never shell out to MSBuild when the MCP tool exists.

3. **Skipping `find_reflection_usage` during risk identification** — Reflection-based references are the most dangerous because they're invisible to normal refactoring. Always check.

4. **Not calling `get_project_dependencies` at brainstorming start** — Without the project graph, you're guessing at architecture. One call gives you the full picture.

5. **Reporting "no dependencies found" without checking Roslyn** — If Grep found nothing but Roslyn is available, verify with `find_callers` / `find_references` before concluding there are no dependencies.

6. **Ignoring `find_unused_symbols` during refactor analysis** — Dead code detection is free and prevents wasting effort on code that should be deleted rather than refactored.

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | **Always-on when detected.** Enhances all 4 phases with semantic code intelligence. Grounds clarifying questions and approach proposals in actual architecture. | Falls back to Grep/Glob when roslyn tools are not available. |
| `refactor-analysis` | **Always-on when detected.** Replaces text search in Phase 2 (dependency mapping), Phase 3 (transitive closure), Phase 5 (risk identification), and informs Phase 6 (execution order). | Falls back to the standard text-based approach when roslyn tools are not available. |
| `superpowers:writing-plans` | **Indirect benefit.** Plans produced after roslyn-enhanced brainstorming or refactor-analysis contain more accurate dependency information. | No direct tool usage during plan writing. |
| `superpowers:subagent-driven-development` | **Indirect benefit.** Subagents implementing plans get better context when plans were informed by semantic analysis. | Subagents can use roslyn tools directly if available in their session. |
| `decision-tracker` | **No interaction.** Decision tracking operates on cross-cutting decisions, not code structure. | Independent — both can be active simultaneously. |
