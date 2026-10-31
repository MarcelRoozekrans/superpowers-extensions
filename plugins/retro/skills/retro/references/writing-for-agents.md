# Writing for agents

Adapted from Matt Pocock's [writing-for-agents](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents) (MIT); see [NOTICE.md](../NOTICE.md).

Read this before any retro fix that edits a `CLAUDE.md` or `AGENTS.md`, a skill, or a doc reached by a pointer. It covers any document an agent consumes. The packaging differs; the writing does not. The same levers make each one predictable, so the agent takes the same *process* every run.

## Context pointers

A **context pointer** is a reference held in the agent's context that names some out-of-context material and encodes the condition for reaching it. A skill's description is one; a line in `CLAUDE.md` naming a doc is the same object. The pointer's *wording*, not its target, decides when the agent reaches the material and how reliably. A must-have target behind a weakly worded pointer is a variance bug: sharpen the wording first, and inline the material only if sharpening fails.

A pointer states what the material is and lists the **branches** that should trigger reaching it (a branch is a distinct case the document handles). Every word of an always-loaded pointer costs on every turn:

- **Front-load the leading word.** The pointer is where it does its triggering work.
- **One trigger per branch.** Synonyms that rename one branch are one branch written twice; collapse them.
- **Cut identity the body already carries.**

## The two loads

- **Context load** is the cost of always-loaded material on the agent's window: a `CLAUDE.md` line, a skill description, anything in context every turn.
- **Cognitive load** is the cost on the human: which documents exist and when to reach for each. It is the price of human agency; spend it where human judgement matters.

Material reached only through a pointer escapes context load at the price of the pointer's own line.

## Information hierarchy

A document holds **steps** (ordered actions) and **reference** (definitions, rules, facts consulted on demand). Each piece sits on a ladder ranked by how immediately the agent needs it:

1. **In-file step:** what the agent does, in order.
2. **In-file reference:** consulted on demand. A flat set of rules on one rung is fine.
3. **Disclosed reference:** a separate file reached by a pointer, loaded only when the pointer fires.

**Progressive disclosure** moves material down the ladder so the top stays legible. Inline what every branch needs; push behind a pointer what only some branches reach. **Co-location** keeps a concept's definition, rules and caveats under one heading. **Sprawl** (a document simply too long, even when every line is live) thins attention; the cure is the ladder.

## Steps and completion criteria

Every step ends on a **completion criterion**, the condition that tells the agent the work is done.

- **Clarity:** can the agent tell done from not-done? A vague bound invites **premature completion**, attention slipping to the steps still ahead. Sharpen the bound first; only if it stays fuzzy and you see the rush, hide the later steps across a real context boundary (a handoff or a subagent dispatch).
- **Demand:** "every modified model accounted for" forces thorough work where "produce a change list" does not. Demand drives legwork, and it binds flat reference as well as steps.

The strongest criteria are checkable and exhaustive.

## When to split

Splitting spends one of the two loads, so split only when the cut earns it:

- **By sequence:** split a run of steps where the later steps tempt the agent to rush the current one.
- **By invocation (skills):** a **model-invoked** skill keeps a description so the agent or another skill can reach it, and pays permanent context load for that. A **user-invoked** skill (`disable-model-invocation: true`) pays no context load but relies on the human remembering it. Pick model-invocation only when the agent or another skill must reach it on its own. Split off a model-invoked skill only for a distinct trigger word you actually use, or when another skill must reach it.

## Leading words

A **leading word** is a compact concept already in the model's pretraining that the agent thinks with while running the document (*lesson*, *fog of war*, *tracer bullets*). Repeated as a token, it anchors a region of behaviour in the fewest tokens. Reach for an existing word before coining one. Hunt for passages that collapse into one: "fast, deterministic, low-overhead" becomes *tight*; "a loop you believe in" becomes *red*.

**Negation** steers badly: naming the forbidden behaviour makes it more available. State the target behaviour ("write one-line comments"). Keep a prohibition only as a hard guardrail with no positive phrasing, and pair it with the positive target.

## Pruning

- **Single source of truth.** Each meaning lives in one place, so changing the behaviour is a one-place edit.
- **The environment is a source of truth.** `package.json` scripts, config files, the directory layout and `--help` output are lookups. A document restating them is a **cache** that earns its load only when the lookup is expensive. Cache the unwritten convention, the reason behind a choice, the gotcha no config confesses.
- **Relevance.** A line loses it by never bearing on the task or by going stale. Without pruning, stale layers settle as **sediment**.
- **No-ops.** An instruction the model already obeys by default pays load to say nothing. The test is model-relative: does it change behaviour versus the default? Delete the whole sentence. A leading word too weak to beat the default (*be thorough*) is a no-op too; the fix is a stronger word (*relentless*).
