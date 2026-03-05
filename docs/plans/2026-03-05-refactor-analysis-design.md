# Refactor Analysis Skill — Design Document

**Date:** 2026-03-05
**Status:** Approved

## Problem

The brainstorming skill is designed for greenfield work — it explores what to build and why. But for complex refactorings, the critical question isn't "what to build" but "what will break." The brainstorming skill doesn't perform impact analysis: it doesn't map all the places affected by a change, trace transitive dependencies, or identify risks in the existing codebase.

This leads to refactoring plans that miss affected files, produce broken intermediate states, and underestimate the true scope of work.

## Solution

A **refactor-analysis** skill that sits between brainstorming and writing-plans in the workflow. After brainstorming establishes *what* to refactor and *why*, this skill performs a full transitive impact analysis to determine *what's affected* and *in what order* changes should be made safely.

## Workflow Position

```
brainstorming → (design approved) → refactor-analysis → writing-plans
```

- Brainstorming handles intent and approach
- Refactor-analysis handles impact and ordering
- Writing-plans handles implementation steps

The skill can also be invoked standalone when the user already knows what they want to refactor.

## Skill Location

Lives in the superpowers-extensions marketplace (`plugins/refactor-analysis/`), alongside regression-test and pre-push-review. Discoverable from the superpowers suite via description triggers.

## Trigger Conditions

- After a brainstorming session concludes that the task is a refactor
- When a user explicitly asks for impact analysis or refactor analysis
- When writing-plans is about to start on a refactoring task and no impact analysis exists
- Keywords: "refactor", "restructure", "move", "rename", "extract", "migrate", "modernize"

## The 7 Phases

### Phase 1: Refactor Scope Definition

- Read the design doc from brainstorming (if one exists)
- Extract the concrete list of **refactor targets** — the specific things being changed (classes, functions, interfaces, modules, files, directories)
- Confirm with the user: "These are the targets I identified. Anything missing?"
- Classify the refactor type: rename, move, extract, inline, change interface, change architecture

### Phase 2: Direct Dependency Mapping

For each target, search the codebase for all direct references:

- Import/require statements
- Type references and generic usage
- Function calls and method invocations
- Class inheritance and interface implementations
- Configuration files (DI containers, route configs, build configs)
- String-based references (dynamic imports, reflection, template strings)
- Test files (test subjects, mocks, fixtures, snapshots)

Record each reference with: file path, line number, reference type, and how it uses the target.

### Phase 3: Transitive Closure

- Take the set of directly affected files from Phase 2
- For each affected file, determine if its **public interface** changes as a result of the refactor
- If yes, treat that file's exports as new targets and repeat Phase 2 for them
- Continue until no new files are discovered or no public interfaces change
- Build the full dependency graph (nodes = files, edges = dependency relationships)

### Phase 4: Impact Classification

For each affected file in the graph, classify the impact:

| Classification | Meaning | Example |
|---|---|---|
| **Breaking** | Will fail to compile/run without changes | Import path changed, type signature changed |
| **Update Required** | Works but is incorrect/inconsistent without changes | Naming conventions, documentation references |
| **Test Impact** | Tests that need updating | Test imports, mocks, snapshots, fixtures |
| **Cosmetic** | Optional cleanup for consistency | Related naming, comments referencing old names |

### Phase 5: Risk Identification

Flag things most likely to cause problems:

- Dynamic references (string interpolation, reflection, `eval`)
- Cross-boundary impacts (API contracts, database schemas, external configs)
- Circular dependencies involving targets
- Files with high fan-in (many things depend on them)
- Implicit coupling (convention-based discovery, barrel exports)
- Things the static analysis can't catch (runtime registration, plugin systems)

### Phase 6: Safe Execution Order

Produce an ordered sequence of changes using topological sort on the dependency graph:

- Leaf nodes (no dependents) change first
- Work inward toward the core targets
- Group changes that must happen atomically (can't be split across commits)
- Identify safe checkpoint boundaries where the codebase is in a working state

### Phase 7: Output

Generate a markdown document saved to `docs/plans/YYYY-MM-DD-<topic>-impact-analysis.md`:

1. **Summary** — Refactor type, target count, affected file count, risk level (low/medium/high)
2. **Dependency graph** — Graphviz dot diagram showing the full transitive closure
3. **Annotated file list** — Table with: file path, impact classification, what changes, which target causes it
4. **Risk register** — Each identified risk with mitigation strategy
5. **Execution order** — Numbered sequence of change groups with checkpoint boundaries

After generating the document, invoke writing-plans to create the implementation plan from this analysis.

## Output Format

The impact analysis document uses this structure:

```markdown
# Impact Analysis: <topic>

## Summary
| Metric | Value |
|---|---|
| Refactor Type | (rename / move / extract / interface change / architectural) |
| Targets | (count) |
| Affected Files | (count) |
| Breaking Changes | (count) |
| Risk Level | (Low / Medium / High) |

## Dependency Graph
(Graphviz dot diagram)

## Affected Files
| File | Classification | Change Required | Caused By |
|---|---|---|---|
| src/foo.ts | Breaking | Update import path | target-1 |
| ... | ... | ... | ... |

## Risk Register
| Risk | Severity | Mitigation |
|---|---|---|
| Dynamic import in plugin loader | High | Manual verification required |
| ... | ... | ... |

## Execution Order
1. **Group 1 (leaf changes):** file-a.ts, file-b.ts — Checkpoint: tests pass
2. **Group 2 (intermediate):** file-c.ts — Checkpoint: tests pass
3. **Group 3 (core target):** target.ts — Checkpoint: full test suite
```

## Plugin Structure

```
plugins/
  refactor-analysis/
    .claude-plugin/
      plugin.json
    skills/
      refactor-analysis/
        SKILL.md              # Main skill — 7-phase workflow
        reference-types.md    # Catalog of reference types to search for
```

## Marketplace Registration

Add to `.claude-plugin/marketplace.json` as a third plugin entry with category "code-quality".

## No MCP Server Required

This skill uses only built-in tools (Grep, Glob, Read, Bash for git commands). No external MCP servers needed.
