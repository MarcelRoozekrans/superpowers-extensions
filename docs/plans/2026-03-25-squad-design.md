# Squad Plugin Design

**Date:** 2026-03-25
**Inspired by:** [bradygaster/squad](https://github.com/bradygaster/squad)

---

## Overview

Squad is a superpowers-extensions plugin that creates persistent AI agent teams within Claude Code. Rather than treating Claude as a single assistant, squad instantiates specialized agents (Lead, Backend Engineer, Frontend Engineer, Tester, Scribe) that participate actively in superpowers workflows — answering brainstorming questions, enriching subagent prompts, reviewing plans — and grow smarter about your project across sessions by automatically updating their knowledge histories.

---

## Core Architecture

### Approach: Context Injection

Agents are **not** separate processes or subagents. They live within the same Claude session as injected personas. When routing determines that a specialist should respond, Claude loads that agent's `charter.md` + `history.md` and responds in that agent's voice. No background processes, no cron jobs, no extra API calls beyond the session itself.

The only disk operations are:
- Reading `routing.md` at session start (small, always needed)
- Reading an agent's `charter.md` + `history.md` on demand (lazy — only when that agent is invoked)
- Writing `history.md` at session end (background agent, non-blocking)
- Appending to `decisions.md` when a decision is made

---

## File Structure

### Global Team (user-scoped)

```
~/.claude/squad/
  team.md                     # roster: names, roles, active flag
  routing.md                  # routing rules: "if task involves X → route to Y"
  agents/
    lead/
      charter.md              # role, expertise, voice, decision authority
      history.md              # accumulated project-agnostic wisdom
    backend/
      charter.md
      history.md
    frontend/
      charter.md
      history.md
    tester/
      charter.md
      history.md
    scribe/
      charter.md
      history.md
```

### Project Override (project-scoped, committed to git)

```
.squad/
  team.md                     # add/remove/rename roles for this project
  routing.md                  # project-specific routing overrides
  decisions.md                # shared team decision log (fed by decision-tracker)
  agents/
    {name}/
      history.md              # project-specific knowledge (stacks on top of global)
```

### Merge Rules

- `charter.md` always comes from `~/.claude/squad/` — agent persona is stable across projects
- `history.md` stacks: global wisdom + project-specific knowledge, project entries shown first
- `routing.md` merges: project rules take precedence, global rules fill gaps
- `team.md` merges: project can add/remove agents from the global roster

---

## Default Team Roster

Five built-in agents with default charters bundled in the plugin:

| Agent | Expertise | Answers questions about | Decision authority |
|---|---|---|---|
| **Lead** | Architecture, coordination, trade-offs | "Should we build X or extend Y?" | Full — can make calls autonomously |
| **Backend Engineer** | APIs, data models, services, infra | "How should this endpoint work?" | Domain — autonomous on backend decisions |
| **Frontend Engineer** | UI, components, styling, UX | "How should this page be structured?" | Domain — autonomous on frontend decisions |
| **Tester** | Test strategy, coverage, edge cases | "What could go wrong here?" | Advisory — flags concerns, defers to Lead |
| **Scribe** | Decisions, docs, conventions | "What did we decide about X?" | None — records and recalls only |

Users can override any agent in `.squad/team.md` — rename roles, add a DevOps engineer, remove Frontend for a backend-only project, change decision authority.

---

## Tiered Context Lookup

To keep context lean, agent invocation uses a tiered lookup strategy — stopping as soon as sufficient context is found:

```
1. Semantic search (LongtermMemory-MCP)
   └─ search_memory(query, tags=[agent-name, project])
   └─ If 2+ strong hits → answer from memory alone

2. Grep history
   └─ grep keywords from question against .squad/agents/{name}/history.md
   └─ If relevant lines found → load only those lines

3. Read recent history
   └─ Read last 50 lines of history.md (most recent entries)
   └─ Used when grep finds nothing but history exists

4. Full history load
   └─ Read entire history.md
   └─ Last resort — only for deep-dive or complex architectural questions

5. Charter only
   └─ No history yet → answer from charter expertise alone
```

For simple factual questions ("what auth pattern do we use?"), tier 1-2 almost always suffices. Full history load is reserved for complex questions via background subagent (see below).

---

## Integration Points

### Brainstorming

When a clarifying question arises, squad checks `routing.md` to identify the relevant specialist. It runs the tiered lookup, then responds as that agent:

```
> [Brainstorming] How should authentication work?

  🔧 Backend Engineer: We've been using JWT with a 1h expiry
  across this project — see the AuthService pattern. I'd extend
  that rather than introduce a new mechanism.

> [Brainstorming] Confirmed. Moving on...
```

The Lead agent acts as coordinator — it can redirect questions to the right specialist and synthesize conflicting opinions from multiple agents. Agents answer autonomously; the user only intervenes to override.

### Subagent-Driven Development

When tasks are dispatched to parallel subagents, squad injects the 2-3 most relevant history entries from the appropriate specialist into each agent's prompt. Uses semantic search (tier 1) to keep injected context minimal and focused.

### Writing Plans

- **Tester** reviews the completed plan for missing test coverage and edge cases
- **Scribe** checks for undocumented decisions and flags them for `decisions.md`

### Pre-Push Review

- **Tester** contributes to Phase 3 (code quality) with project-specific risk knowledge
- **Scribe** checks Phase 2 (plan adherence) against `decisions.md` history

### Project Orchestration

Squad hooks into `pause-work` to trigger `squad sync` automatically when the user ends a session.

---

## Background Write-back

History write-back uses `Agent` tool with `run_in_background: true` — it doesn't block the conversation wrapping up.

The background agent:
1. Reviews the session conversation for new conventions, patterns, decisions
2. Identifies which agents contributed and what they learned
3. Appends dated entries to each relevant `history.md`
4. Syncs architectural/convention-level decisions to `decisions.md`
5. decision-tracker picks up `decisions.md` changes and persists to LongtermMemory-MCP

**History entry format** (append-only, dated):

```markdown
## 2026-03-25
- JWT with 1h expiry, refresh tokens stored in httpOnly cookie
- AuthService is the single entry point — no direct token handling elsewhere
- Decided against OAuth for now (added complexity, no external IdP needed)
```

**Sync with decision-tracker:** Any architectural or convention-level entry in `decisions.md` is also persisted to LongtermMemory-MCP — squad history and long-term memory stay in sync without duplication.

---

## Sub-Skills

| Sub-skill | Trigger | What it does |
|---|---|---|
| `squad-init` | "initialize my squad" / first use | Creates `~/.claude/squad/` with default team, or `.squad/` for project override |
| `squad-status` | "who's on my team?" / `@squad status` | Shows roster, last active date, history entry count per agent |
| `squad-sync` | "squad sync" / session end / `pause-work` | Distills session learnings → appends to `history.md` files (background) |
| `squad-ask` | `@agentname ...` | Routes a direct question to a specific agent outside of brainstorming |

---

## Plugin Structure

```
plugins/squad/
  .claude-plugin/
    plugin.json                   # metadata, soft dependencies: decision-tracker, project-orchestration
  skills/
    squad/
      SKILL.md                    # main skill: routing, persona switching, write-back
      routing-rules.md            # default routing logic reference
      history-format.md           # history.md format spec
      default-team/
        lead.md                   # default Lead charter
        backend.md                # default Backend Engineer charter
        frontend.md               # default Frontend Engineer charter
        tester.md                 # default Tester charter
        scribe.md                 # default Scribe charter
```

---

## Graceful Degradation

| Missing dependency | Behavior |
|---|---|
| No `~/.claude/squad/` | `squad-init` prompted on first agent invocation |
| No `.squad/` project folder | Global team used, no project-specific routing |
| No LongtermMemory-MCP | Skip tier 1 (semantic search), fall through to grep |
| No `history.md` yet | Agent answers from charter only, begins building history |
| No `decision-tracker` | `decisions.md` not synced to long-term memory |
| No `project-orchestration` | `squad-sync` not auto-triggered, user invokes manually |

---

## Success Criteria

- Squad agents answer domain questions during brainstorming without user intervention
- After 3+ sessions on a project, agents demonstrably know project conventions (auth pattern, naming, architecture)
- Context cost per agent invocation stays under ~500 tokens in the common case (tiers 1-2)
- History write-back completes in background without blocking session end
- `squad-init` takes under 60 seconds to set up a default team
