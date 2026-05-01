---
name: squad
description: Use when the user runs squad commands (/squad-init, /squad-status, /squad-add), asks to "activate the team" / "set up agents" / "who is on the squad", or begins brainstorming/planning on a project that already contains a docs/squad/ directory. Activates persistent Lead/Backend/Frontend/Tester/Scribe agents that participate in brainstorming, answer domain questions from project history, and accumulate knowledge across sessions. Skip for one-off questions, single-file edits, or projects without an existing squad — do not auto-activate just because work is happening.
---

# Squad Skill

## Prerequisites

No hard requirements. The skill works standalone.

**Soft dependencies (enhance but are not required):**

- `LongtermMemory-MCP` — enables tier-1 semantic search in the tiered lookup. Without it, squad falls through to grep.
- `decision-tracker` skill — syncs `decisions.md` to long-term memory automatically.
- `project-orchestration` skill — auto-triggers `squad-sync` on `pause-work`.

## Overview

Squad activates persistent AI agent teams within your Claude Code session. Agents are **not** separate processes — they are personas injected via context. When a question is routed to a specialist, Claude loads that agent's `charter.md` + `history.md` using the tiered lookup strategy and responds in that agent's voice.

**Core principle:** Agents grow smarter about your project across sessions. After a few sessions, the Backend Engineer knows your auth pattern, the Tester knows the risky areas, the Scribe knows your naming conventions — without you having to re-explain them.

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
3. Identify the specialist. If multiple specialists are relevant, route to Lead to coordinate.
4. Run the tiered lookup for that specialist.
5. Respond as the specialist (see Persona Switching below).
6. After responding, return control to the calling workflow.

## Persona Switching

When responding as an agent, prefix the response with a visual label:

```text
🎯 Lead: [response]
🔧 Backend Engineer: [response]
🎨 Frontend Engineer: [response]
🧪 Tester: [response]
📝 Scribe: [response]
```

Keep the agent's voice consistent with their charter. The Backend Engineer is terse and pragmatic; the Tester is skeptical; the Scribe is neutral and precise.

After the agent speaks, the calling workflow resumes without re-announcing the transition.

## Integration with Superpowers Skills

### brainstorming

Squad integrates into the clarifying-questions phase. When brainstorming raises a question that a specialist can answer from project knowledge, squad intercepts it:

1. Route the question using the routing algorithm.
2. Run tiered lookup for the specialist.
3. Respond as the specialist.
4. Brainstorming treats the agent's answer as the resolved answer and continues.
5. User may override — if the user corrects the agent's answer, update routing or history accordingly.

The Lead agent coordinates multi-part questions. If a question spans Frontend and Backend, Lead asks both and synthesizes.

**Example:**

```text
> [Brainstorming] How should authentication work?

🔧 Backend Engineer: We're using JWT with 1h expiry and httpOnly refresh tokens — see AuthService. I'd extend that rather than introduce a new mechanism.

> [Brainstorming] Confirmed. Moving on...
```

### writing-plans

After the plan is drafted:

1. Invoke Tester to review the plan for missing test coverage — respond as Tester with a brief coverage assessment.
2. Invoke Scribe to check for undocumented decisions — respond as Scribe flagging any new conventions the plan introduces.
3. Both findings are appended to the plan as a `## Squad Review` section before saving.

### subagent-driven-development

When a task is dispatched to a parallel subagent:

1. Derive the relevant specialist from the task description.
2. Run **tier 1 only** (semantic search) for that specialist.
3. Inject the top 2-3 results into the subagent prompt under `## Squad Context`.
4. If tier 1 is unavailable, grep the specialist's history for task keywords and inject matching lines.

### pre-push-review

During Phase 3 (Code Quality):

- Invoke Tester to contribute project-specific risk knowledge ("we've had regressions in X area before").

During Phase 2 (Plan Adherence):

- Invoke Scribe to check `decisions.md` — flag if any change contradicts a recorded decision.

### project-orchestration

When `pause-work` fires, squad auto-triggers `squad-sync` as a post-hook. No separate invocation needed.

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
3. Respond as the agent.

**Example:**

```text
User: @tester what areas of this codebase are most likely to regress?

🧪 Tester: Based on history — the payment flow and the auth token refresh logic have had regressions before. I'd prioritize integration tests there before any refactor touches those paths.
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

---

## Quick Reference

| Action | Steps | Files touched |
|---|---|---|
| Route a question | Match routing rules → tiered lookup → persona switch | `routing.md`, `charter.md`, `history.md` |
| squad-init | Create dirs → copy charters → create empty histories | `~/.claude/squad/` or `.squad/` |
| squad-status | Read team.md → count history entries → report | `team.md`, `history.md` |
| squad-sync | Background agent → distill → append to histories → update decisions.md | `history.md`, `decisions.md` |
| squad-ask | Identify agent → tiered lookup → persona switch | `charter.md`, `history.md` |

---

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship |
|---|---|
| `superpowers:brainstorming` | Squad intercepts clarifying questions, routes to specialist, answers autonomously |
| `superpowers:writing-plans` | Tester reviews plan coverage; Scribe flags undocumented decisions |
| `superpowers:subagent-driven-development` | Squad injects top 2-3 relevant history entries into each agent's prompt |
| `pre-push-review` | Tester contributes risk knowledge; Scribe checks against decisions.md |
| `project-orchestration` | squad-sync auto-triggers on pause-work |
| `decision-tracker` | Shares decisions.md; decision-tracker syncs to LongtermMemory-MCP |
