---
name: squad
description: Use when the user runs squad commands (/squad-init, /squad-status, /squad-add, /squad-sync), uses `@`-mention triggers for a named specialist (`@lead`, `@backend`, `@frontend`, `@tester`, `@scribe`), asks to "activate the team" / "set up agents" / "who is on the squad", or begins brainstorming/planning on a project that already contains a `.squad/` directory. Dispatches Lead/Backend/Frontend/Tester/Scribe specialists as parallel Task subagents — each runs in an isolated context window with its own charter and tier-1 history — and accumulates per-role project knowledge across sessions in `history.md` files. Skip for one-off questions, single-file edits, or projects without an existing squad.
---

# Squad Skill

## Prerequisites

No hard requirements. The skill works standalone.

**Soft dependencies (enhance but are not required):**

- `LongtermMemory-MCP` — enables tier-1 semantic search in the tiered lookup. Without it, squad falls through to grep.
- `decision-tracker` skill — syncs `decisions.md` to long-term memory automatically.
- `project-orchestration` skill — auto-triggers `squad-sync` on `pause-work`.

## Overview

Squad activates persistent AI agent teams within your Claude Code session. Agents are **dispatched as parallel subagents** via Claude Code's `Task` tool — each runs in its own isolated context window with its own charter and a tier-1 slice of its `history.md` pre-loaded into the prompt. Multiple specialists called for the same question fan out concurrently in a single tool-call message; their outputs return to the main conversation which integrates them.

This is a meaningful shift from the original "in-context persona" model: specialists actually run in parallel, can't see each other's reasoning (preventing the second from anchoring on the first), and have their own tool-use budget. The main conversation acts as the dispatcher and integrator — it does not "switch voices" inline.

**Core principle:** Agents grow smarter about your project across sessions. After a few sessions, the Backend Engineer knows your auth pattern, the Tester knows the risky areas, the Scribe knows your naming conventions — without you having to re-explain them. Persistence (`history.md` files) is what squad uniquely provides on top of bare subagent dispatch.

## File Locations

Squad reads from two layers, merging them at runtime:

| Layer | Location | Purpose |
|---|---|---|
| Global team | `~/.claude/squad/` | User-scoped defaults, stable across projects |
| Project override | `.squad/` (repo root) | Project-specific routing, decisions, history |

**Merge rules:**

- `charter.md` always comes from `~/.claude/squad/agents/{name}/` — agent persona is stable
- `history.md`: project entries first, global entries appended below
- `routing.md`: project rules take precedence, global rules fill gaps
- `team.md`: project can add/remove agents from the global roster

## Session Initialization

At session start, squad loads **only** `routing.md` (the smallest possible footprint). No agent files are loaded upfront. This keeps context lean until a question requires a specialist.

If `~/.claude/squad/` does not exist, prompt the user to run `squad-init` before attempting any routing.

## Tiered Context Lookup

When an agent is invoked, use this lookup chain — stop at the first tier that returns sufficient context:

```text
Tier 1 — Semantic search (LongtermMemory-MCP)
  search_memory(query=<question>, tags=[<agent-name>, project:<project-name>])
  → If 2+ results with relevance > 0.7: use these, skip lower tiers

Tier 2 — Grep history
  Grep keywords from the question against .squad/agents/{name}/history.md
  then ~/.claude/squad/agents/{name}/history.md
  → If matching lines found: load only those lines

Tier 3 — Recent history (last 50 lines)
  Read .squad/agents/{name}/history.md with limit=50, from end of file
  → Use when question is general but history exists

Tier 4 — Full history load
  Read entire history.md (both project and global)
  → Last resort, only for complex architectural questions

Tier 5 — Charter only
  Load charter.md alone
  → No history yet, or history clearly irrelevant to question
```

**Always load `charter.md` alongside history** — the charter defines voice and decision authority regardless of tier.

## Routing Algorithm

When a question arises during any superpowers workflow:

1. Read routing rules from `.squad/routing.md` (project), fall back to `~/.claude/squad/routing.md`, fall back to the default rules in [routing-rules.md](routing-rules.md).
2. Match the question against the routing rules. First match wins.
3. Identify the relevant specialist(s). The result is **a list** — possibly of length 1, possibly more. Resist the temptation to consult specialists sequentially "to see what one says before asking the next" — that is what the parallel dispatch in step 5 specifically prevents.
4. For each specialist in the list, run the tiered lookup against their `history.md` to extract the relevant context slice.
5. **Dispatch all relevant specialists in parallel.** Construct one Task-tool subagent call per specialist (see "Parallel Subagent Dispatch" below). When there are 2+ specialists, all calls go in a **single assistant message** so they fan out concurrently rather than serially.
6. Wait for all subagent responses to return. Integrate them into a single answer for the calling workflow:
   - Single specialist → present the subagent's response with the agent's name and emoji prefix.
   - Multiple specialists with non-conflicting answers → present each with its prefix, in a stable order (Lead, Backend, Frontend, Tester, Scribe).
   - Multiple specialists with conflicting answers → either let Lead reconcile (dispatch one more subagent with all prior outputs as input) or surface the conflict to the user with each side's reasoning.
7. Return control to the calling workflow.

## Parallel Subagent Dispatch

Each specialist invocation is a `Task` tool call. The subagent type is `general-purpose` (or `Plan` / `Explore` if appropriate to the task). Construct the prompt as four blocks, in this order:

```text
You are the {Role} on this project. Read your charter and recent history,
then answer the question below using the tone, decision authority, and
domain expertise described in the charter.

## Charter
{contents of agents/<role>/charter.md — full charter, ~150 lines}

## Recent project history (most relevant entries)
{tier-1 search results OR top tier-2 grep matches OR last 50 lines of history.md, per the tiered lookup outcome}

## Your task
{the routed question, including any context the calling workflow already
collected — design doc paragraph, plan excerpt, diff hunk, etc.}

## How to respond
- One concise answer (or a short rationale + recommendation).
- Prefix the response with the role's emoji and name on its own line:
  e.g. "🔧 Backend Engineer:"
- Stay within decision authority. Tester does not block; Scribe does not decide.
- Cite the history entry that supports your answer when applicable
  (format: "[history: <date> — <one-line summary>]"). If you make a new
  decision worth persisting, mark it with "[new-decision]" so squad-sync
  can pick it up.
```

When dispatching multiple specialists for one question, include all `Task` tool calls in the same assistant message — that is what causes them to run in parallel. Do NOT call them sequentially in separate messages.

## Lead synthesis

For questions that span 2+ specialty areas (e.g. an API change that affects backend and frontend), Lead acts as integrator. Two patterns:

- **Light-touch synthesis (default).** Main conversation receives the parallel responses and presents them in stable order with prefixes. The user is the integrator.
- **Lead-as-final-subagent.** When you want a coordinated recommendation rather than a list, dispatch Lead **after** the parallel specialists return. Lead's prompt receives the specialists' outputs as input plus its own charter and history. Lead emits a single synthesized verdict with cited specialist inputs. Use this when the workflow expects one answer (e.g. "should we ship this?").

Lead synthesis is one extra subagent dispatch — wall-clock cost ~= one additional Task call. Use it only when the workflow needs a single answer, not when the user can read multiple opinions.

## Integration with Superpowers Skills

### brainstorming

Squad integrates into the clarifying-questions phase. When brainstorming raises a question that a specialist can answer from project knowledge, squad intercepts it:

1. Route the question using the routing algorithm. Result is a list of specialists.
2. Run tiered lookup for each specialist in parallel.
3. **Dispatch all relevant specialists in parallel** as Task subagents (one assistant message, multiple `Task` tool calls).
4. Brainstorming receives the integrated response and treats it as the resolved answer.
5. User may override — if the user corrects the agent's answer, update routing or history accordingly.

For multi-part questions that span specialty areas, default to light-touch synthesis (present each subagent's prefixed response). Use Lead synthesis only when brainstorming needs a single recommendation.

**Example (single specialist):**

```text
> [Brainstorming] How should authentication work?

[squad dispatches Task subagent: Backend Engineer with charter + auth-related
 history slice + the question]

🔧 Backend Engineer: We're using JWT with 1h expiry and httpOnly refresh
tokens — see AuthService. [history: 2026-04-12 — adopted httpOnly refresh
after CSRF audit]. I'd extend that rather than introduce a new mechanism.

> [Brainstorming] Confirmed. Moving on...
```

**Example (parallel specialists, no Lead synthesis):**

```text
> [Brainstorming] We're adding a "share to Slack" feature. How should it work?

[squad dispatches three subagents in parallel: Backend, Frontend, Tester]

🔧 Backend Engineer: Use the existing webhook abstraction in NotificationService.
   New Slack provider implements INotificationProvider. ~80 lines. [history:
   2026-02-08 — webhook abstraction added for Teams integration]

🎨 Frontend Engineer: Share button in the post action menu. Reuse the
   existing share-modal component, add Slack as a destination option.

🧪 Tester: Slack integration is a flaky-test risk — webhooks time out under
   load. Add a 5s retry with exponential backoff in the integration tests.
   [history: 2026-02-15 — Teams webhook tests flaked at 30%, fixed with retry]

> [Brainstorming] Good — proceeding with that approach.
```

### writing-plans

After the plan is drafted:

1. **Dispatch Tester and Scribe in parallel** as Task subagents in a single assistant message. Each gets the full plan as input plus their own charter + tier-1 history.
   - Tester reviews the plan for missing test coverage.
   - Scribe checks for undocumented decisions or convention drift against `decisions.md`.
2. When both subagents return, append both findings to the plan as a `## Squad Review` section.
3. If Tester or Scribe surfaces a blocker (missing critical coverage, contradiction with a recorded decision), pause for user confirmation before saving the plan.

This is two parallel subagents, not a sequential review chain — wall-clock cost is one Task dispatch, not two.

### subagent-driven-development

This is the original integration: when a task is dispatched to a parallel subagent (e.g. by `superpowers:subagent-driven-development`), squad **enriches the dispatched subagent's prompt** with role-specific history before the subagent runs.

1. Derive the relevant specialist from the task description (e.g. an API task → Backend; a layout task → Frontend).
2. Run **tier 1 only** (semantic search) for that specialist's history.
3. Inject the top 2-3 results into the dispatched subagent's prompt under `## Squad Context`.
4. If tier 1 is unavailable, grep the specialist's history for task keywords and inject matching lines.

This integration is independent of the parallel-dispatch routing in this skill. Subagent-driven-development handles its own parallelism for implementation tasks; squad just contributes the role-specific knowledge slice into each task subagent's prompt.

### pre-push-review

Squad contributes specialist knowledge to two phases of the review. Both can fan out as parallel Task subagents alongside the review's own logic:

- **Phase 2 (Plan Adherence):** dispatch Scribe to check `decisions.md` — flag if any change in the diff contradicts a recorded decision.
- **Phase 3 (Code Quality):** dispatch Tester to contribute project-specific risk knowledge ("we've had regressions in X area before, and the diff touches X").

Both can be dispatched in parallel, in a single Task message at the start of pre-push-review's review-gathering phase, so their outputs are available when the verdict is computed.

### project-orchestration

When `pause-work` fires, squad auto-triggers `squad-sync` as a post-hook. No separate invocation needed.

When `plan-roadmap` fires (project-orchestration's roadmap-level brainstorm at project start), squad **dispatches all five specialists in parallel** to seed initial perspectives — Lead surfaces strategic priorities, Backend/Frontend identify their respective surface areas, Tester flags risk concentrations, Scribe captures naming and convention defaults. Lead-synthesis follows because plan-roadmap needs a single coherent roadmap, not five separate lists.

---

## Sub-Skills

### squad-init

**Trigger:** "initialize my squad", "set up squad", first agent invocation when `~/.claude/squad/` does not exist.

**What it does:**

1. Ask the user: "Initialize squad globally (`~/.claude/squad/`) or for this project only (`.squad/`)?" — default is global.
2. Create the chosen directory structure.
3. Copy the five default charter files from the `default-team/` folder located in the same directory as this SKILL.md file. Resolve the path relative to the skill file, not the project root — after `claude plugin install`, the plugin is installed under `~/.claude/plugins/` and the `default-team/` folder is a sibling of `SKILL.md`.
4. Create empty `history.md` files for each agent.
5. Create `team.md` listing all five agents as active.
6. Create `routing.md` as a copy of the default routing rules (from `routing-rules.md` in the same directory as this SKILL.md).
7. If project init: also create `.squad/decisions.md` (empty) and `.squad/routing.md` as a copy of the default routing rules — users who want project-specific routing overrides edit this file.
8. Announce completion:

   > "Squad initialized with 5 agents: Lead, Backend Engineer, Frontend Engineer, Tester, Scribe. Charters in `~/.claude/squad/agents/`. Run `@squad status` to verify."

**Charter source:** The `default-team/` folder is in the same directory as this SKILL.md. Always resolve it as a sibling path, never as a repo-relative path.

### squad-status

**Trigger:** "who's on my team?", "squad status", `@squad status`

**What it does:**

1. Read `team.md` (project first, then global).
2. For each active agent, check if `history.md` exists and count its entries (lines starting with `-`).
3. Report:

   ```text
   Squad Status
   ────────────
   🎯 Lead          — 12 entries  (last: 2026-03-20)
   🔧 Backend       — 8 entries   (last: 2026-03-18)
   🎨 Frontend      — 3 entries   (last: 2026-03-15)
   🧪 Tester        — 5 entries   (last: 2026-03-20)
   📝 Scribe        — 6 entries   (last: 2026-03-18)

   Project layer: .squad/ ✓
   Global layer:  ~/.claude/squad/ ✓
   decisions.md:  14 entries
   ```

4. If no squad initialized: prompt to run `squad-init`.

### squad-sync

**Trigger:** "squad sync", session end, `pause-work` hook, `/squad sync`

**What it does:**

Launches a background agent (`run_in_background: true`) with the following task:

> "Review the conversation history from this session. For each squad agent (Lead, Backend Engineer, Frontend Engineer, Tester, Scribe), identify any new conventions, patterns, architectural decisions, or project-specific knowledge that was established or confirmed. Write new entries to each agent's history.md using the format in history-format.md. Append only — do not overwrite existing entries. Skip entries that duplicate what's already in the file. Also update .squad/decisions.md with any decisions that qualify as cross-cutting."

The background agent:

1. Reads all relevant `history.md` files (to avoid duplicates).
2. Distills session learnings per agent.
3. Appends dated entries to each `history.md`.
4. Updates `decisions.md`.
5. Exits.

The main session does not wait for this agent — it continues immediately. The user is notified when write-back completes.

**Manual sync:** The user can run `squad-sync` mid-session to checkpoint learnings without ending the session.

### squad-ask

**Trigger:** `@lead ...`, `@backend ...`, `@frontend ...`, `@tester ...`, `@scribe ...`

**What it does:**

Routes a direct question to a named agent, bypassing the automatic routing algorithm.

1. Identify the target agent from the `@name` prefix.
2. Run the tiered lookup for that agent.
3. **Dispatch the agent as a Task subagent** with charter + history slice + the question. Wait for return. Present the response with the agent's prefix.

The user can also `@-mention` multiple agents in one message (e.g. `@backend @frontend should we colocate the auth helper?`). When more than one is mentioned, all are dispatched in parallel — same single-assistant-message pattern as the routing algorithm uses.

**Example:**

```text
User: @tester what areas of this codebase are most likely to regress?

[squad dispatches Tester as a Task subagent with full charter + tier-1
 history matching "regression" / "risk" / "flaky"]

🧪 Tester: Based on history — the payment flow and the auth token refresh
logic have had regressions before. I'd prioritize integration tests there
before any refactor touches those paths. [history: 2026-03-04 — payment
flow regressed during DI refactor; 2026-04-12 — auth refresh flaked under
load].
```

---

## Graceful Degradation

| Missing dependency | Behavior |
|---|---|
| `~/.claude/squad/` not initialized | Prompt user to run `squad-init` on first agent invocation |
| No `.squad/` project folder | Use global team only, no project-specific routing |
| No LongtermMemory-MCP | Skip tier 1; fall through to tier 2 (grep) |
| No `history.md` yet | Answer from charter only (tier 5); history builds from first session |
| No `decision-tracker` | `decisions.md` not synced to long-term memory; squad still writes to the file |
| No `project-orchestration` | `squad-sync` not auto-triggered on session end; user invokes manually |
| Background agent unavailable | Run `squad-sync` inline at session end (slightly blocks wrap-up) |

---

## Red Flags

1. **Loading all agent files upfront** — Always lazy-load. Only routing rules load at session start.
2. **Skipping the tiered lookup** — Never jump straight to full history load. Tier 1 → 2 → 3 → 4 → 5.
3. **Agents making calls outside their authority** — Tester never blocks; Scribe never decides. Enforce charter authority.
4. **Write-back mid-session** — History is written at session end only. Mid-session writes fragment the dated sections.
5. **Duplicating history entries** — Always read existing entries before writing new ones.
6. **Flooding subagent prompts** — Inject top 2-3 relevant entries only, never a full history dump.
7. **Faking parallel dispatch with sequential persona switching** — "🔧 Backend: ... 🎨 Frontend: ..." inline in the main conversation is not parallel dispatch. The whole point of separate-session squad is that specialists can't see each other's reasoning. Use the `Task` tool, in a single message with multiple calls.
8. **Sequential consultation when answers are independent** — Two `Task` calls in two separate messages run sequentially. Both calls go in **one** assistant message to fan out concurrently.
9. **Lead synthesis when the user wants to read the raw opinions** — Lead synthesis collapses N opinions into 1. Use it only when the workflow expects one answer (`writing-plans` review, `pre-push-review` verdict). For brainstorming exploration, present each specialist's prefixed response.

---

## Common Rationalizations

| Rationalization | Why It's Wrong | Correct Action |
|---|---|---|
| "I'll ask Backend, then Frontend, then synthesize" | Sequential consultation lets the second specialist anchor on the first; same wall-clock cost as parallel and worse output | Dispatch both as Task subagents in a single message |
| "I'll just answer in the main conversation as Backend" | The main conversation has the full session context — it cannot give an isolated specialist perspective. The whole point of separate-session squad is isolation | Dispatch a Task subagent. Cost: one tool call. Benefit: an answer free of session anchoring |
| "Subagent dispatch is overkill for a simple question" | If the question is trivial, the routing algorithm shouldn't surface a specialist at all. If it surfaces one, dispatch | If you find yourself thinking "skip the dispatch", revisit whether the routing match was correct |
| "Lead always synthesizes" | Lead synthesis is one extra Task dispatch. Use it only when the workflow needs ONE answer | Default to light-touch synthesis (present each prefixed response). Lead-synthesize only on explicit need |
| "Persona-switching inline is faster" | Faster, yes — but eliminates the isolation that gives squad its value. Two specialists' answers are now one specialist's monologue with two voices | Dispatch as parallel subagents even if it feels like overhead |
| "I don't need to load history; the charter is enough" | Charter is voice and authority. History is project-specific knowledge. Tier-5 (charter only) is the LAST resort, not the default | Always run the tiered lookup — tier 1 → 2 → 3 → 4 → 5 |

---

## Quick Reference

| Action | Steps | Files touched |
|---|---|---|
| Route a question | Match routing rules → tiered lookup → **parallel Task dispatch** → integrate | `routing.md`, `charter.md`, `history.md` |
| squad-init | Create dirs → copy charters → create empty histories | `~/.claude/squad/` or `.squad/` |
| squad-status | Read team.md → count history entries → report | `team.md`, `history.md` |
| squad-sync | Background agent → distill → append to histories → update decisions.md | `history.md`, `decisions.md` |
| squad-ask | Identify agent(s) → tiered lookup per agent → **parallel Task dispatch** | `charter.md`, `history.md` |

---

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship |
|---|---|
| `superpowers:brainstorming` | Squad intercepts clarifying questions and **dispatches relevant specialists in parallel** as Task subagents. Multi-specialist questions return all responses in one message |
| `superpowers:writing-plans` | Tester + Scribe dispatched **in parallel** as a single Task message after the plan is drafted. Both findings merge into the `## Squad Review` section |
| `superpowers:subagent-driven-development` | Squad enriches each task subagent's prompt with role-specific tier-1 history. Independent of squad's own dispatch — both can run side by side |
| `superpowers:dispatching-parallel-agents` | The dispatch primitive squad uses internally. Squad's routing layer decides WHICH specialists to dispatch; dispatching-parallel-agents is the lower-level skill governing how to construct multi-call messages |
| `pre-push-review` | Tester (Phase 3 risk) + Scribe (Phase 2 decisions) dispatched in parallel during the review's evidence-gathering phase |
| `project-orchestration` | `squad-sync` auto-triggers on `pause-work`. `plan-roadmap` dispatches all five specialists in parallel for roadmap-scope perspectives, then Lead synthesizes |
| `decision-tracker` | Shares `decisions.md`; decision-tracker syncs it to LongtermMemory-MCP. Squad's Scribe is what writes new decisions to the file |
