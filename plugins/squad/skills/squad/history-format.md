# History File Format

Agent history files are append-only markdown logs.

## File Locations

- Global wisdom: `~/.claude/squad/agents/{name}/history.md`
- Project-specific: `.squad/agents/{name}/history.md`

During lookup, project entries are shown first; global entries follow.

## Format

Each session's learnings are written as a dated section:

```
## YYYY-MM-DD

- One concrete fact per bullet
- Start with the fact, not the rationale
- Under 120 characters per entry
```

## Entry Examples

**Good entries:**

```
## 2026-03-25

- JWT with 1h expiry, refresh tokens in httpOnly cookie
- AuthService is the single entry point — no direct token handling elsewhere
- Decided against OAuth (added complexity, no external IdP needed yet)
- All API errors return { code, message, details } shape
```

**Bad entries:**

```
- The authentication system uses JSON Web Tokens which provide stateless auth...  ← too long, use bullet facts
- Added GetById to UserRepository  ← implementation detail, not a decision
- We use JWT  ← too vague, no context
```

## What Each Agent Captures

| Agent | Capture |
|---|---|
| Lead | Architectural decisions, rejected alternatives, structural patterns, cross-cutting constraints |
| Backend | API conventions, service patterns, data model decisions, auth/infra choices, naming rules |
| Frontend | Component patterns, styling conventions, state management approach, accessibility targets |
| Tester | Known risky areas, test strategy decisions, coverage gaps to watch, recurring failure modes |
| Scribe | Cross-cutting naming conventions, team norms, documentation standards |

## What NOT to Capture

- Implementation details local to a single file or function
- Temporary task-specific decisions (use decisions.md instead)
- Anything already captured verbatim in decisions.md
- Entries that duplicate a previous entry in the same file

## Write-back Timing

Entries are written by the background agent at session end (triggered by `squad-sync`). Never write mid-session. If the session ends abruptly, the next `squad-sync` will catch up from the conversation history.
