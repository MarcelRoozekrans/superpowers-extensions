# Design It Twice

When the user wants to explore alternative interfaces for a chosen deepening candidate, use this parallel subagent pattern. Based on "Design It Twice" (Ousterhout): your first idea is unlikely to be the best.

Uses the vocabulary in [SKILL.md](../SKILL.md): **module**, **interface**, **seam**, **adapter**, **leverage**.

## Process

### 1. Frame the problem space

Before spawning subagents, write a user-facing explanation of the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy
- The dependencies it would rely on, and which category they fall into (see [deepening.md](deepening.md))
- A rough illustrative code sketch to ground the constraints, not a proposal, just a way to make the constraints concrete

Show this to the user, then immediately proceed to Step 2. The user reads and thinks while the subagents work in parallel.

### 2. Spawn subagents

Spawn 3+ subagents in parallel, each with a fresh context window. Each must produce a **radically different** interface for the deepened module.

Prompt each subagent with a separate technical brief (file paths, coupling details, dependency category from [deepening.md](deepening.md), what sits behind the seam). The brief is independent of the user-facing problem-space explanation in Step 1. Give each agent a different design constraint:

- Agent 1: "Minimize the interface: aim for 1–3 entry points max. Maximise leverage per entry point."
- Agent 2: "Maximise flexibility: support many use cases and extension."
- Agent 3: "Optimise for the most common caller: make the default case trivial."
- Agent 4 (if applicable): "Design around ports & adapters for cross-seam dependencies."

Include the [SKILL.md](../SKILL.md) vocabulary in the brief so each subagent names things consistently with the architecture language. If the project has a glossary, include its vocabulary too, so names also match the project's domain language. If it has none, leave that out.

Dispatch every subagent with `model: sonnet` passed explicitly, never inheriting the session's model and never Fable (see `context-budget`).

Each subagent outputs:

1. Interface (types, methods, params, plus invariants, ordering, error modes)
2. Usage example showing how callers use it
3. What the implementation hides behind the seam
4. Dependency strategy and adapters (see [deepening.md](deepening.md))
5. Trade-offs: where leverage is high, where it's thin

### 3. Present and compare

Present designs sequentially so the user can absorb each one, then compare them in prose. Contrast by **depth** (leverage at the interface), **locality** (where change concentrates), and **seam placement**.

After comparing, give your own recommendation: which design you think is strongest and why. If elements from different designs would combine well, propose a hybrid. Be opinionated: the user wants a strong read, not a menu.
