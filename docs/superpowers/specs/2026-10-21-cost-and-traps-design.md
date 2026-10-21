# Cheaper runs and trap detection — design

**Date:** 2026-10-21
**Status:** Draft for approval

## Intent

Bring the useful ideas from GadaaLabs/claude-code-on-steroids into superpowers-extensions, built on top of obra/superpowers v7 rather than replacing it. Their fork renames and overwrites the core skills; we keep v7 as the base and add to it, the way the rest of the suite already does.

Two things motivate the work:

1. **Cost.** An analysis of all 697 local session logs (about 25,000 model calls, 2026-09 to 2026-10) shows where the money actually goes. Weighting each token type by its relative price (cache read 0.1×, cache write 1.25×, output 5× base input):
   - 70% of cost is cache reads: the whole conversation re-read on every call. Calls with more than 150k tokens of context carry 77% of cost. The most expensive sessions averaged 400–490k context per call over 600–800 calls.
   - 93% of cost runs on Opus. Subagent dispatches with an explicit `model: opus` outnumber `haiku` about 8 to 1, and 76 dispatches named no model at all, so they inherited Opus.
   - Subagents are 53% of cost. The worst single-task implementers (Daedalus, BlazorNative, ZeroAlloc) ran 100–270 calls and grew to 300–550k context each.
   - Shell output is not the driver: Bash results average about 1k characters. Long-lived context is.
2. **Brownfield safety.** Their `pathfinder` skill has a "trap detection" pass that our `map-codebase` lacks: finding the files and spots that bite you before you change them.

## Goals

- Cut cost where the data says it goes: model choice for subagents, and the size of long-running main sessions and subagents.
- Make `map-codebase` find traps before work starts.
- Measure before and after with claude-usage (phuryn/claude-usage), which the user runs locally.

## Non-goals

- Adopting their renamed core skills, their installer, their override script, their domain how-to skills (ML, embedded, AI engineering), their grep-based memory ("chronicle"), or `/tokenburn`. claude-usage replaces `/tokenburn`.
- Changing obra/superpowers itself. Everything here lives in this repo and hooks into v7 from the outside.

## Anti-goals

- **Never interrupt a good session.** If the work needs a big context for the best result, it keeps it. A size check never stops work, never breaks into a task in progress, and stays silent when the next step builds on what is in context. Result quality outranks cost.
- **No Fable.** The model tiers are Haiku, Sonnet and Opus. Nothing in the suite may route to Fable.
- **No silent quality drop.** Cheaper models must not be pushed onto work that needs judgment; the escalation path to Opus stays.

## Part 1 — Model choice

### Decided with the user

- **Default:** implementer and reviewer subagents run on **Sonnet**.
- **Opus when the plan marks it:** when a plan is written through project-orchestration, tasks that are genuinely hard (architecture, tricky concurrency, cross-module work) carry an Opus mark, and their implementer is dispatched on Opus.
- **Opus when stuck:** an unmarked task whose implementer comes back stuck is retried on Opus. v7's subagent-driven development already escalates to "a more capable model" from fix round 4; our rule makes that step concrete: it lands on Opus.
- **Every dispatch names its model.** No more inherited Opus.
- **No Fable**, anywhere.
- **The rule applies everywhere,** not only when project-orchestration or squad drives the run. A plain subagent-driven-development or executing-plans run follows it too. Where it conflicts with v7's Model Selection, which allows a cheap model for mechanical implementers, this rule wins.

### My calls

- **Haiku** is for mechanical lookups and searches only (Explore-style "find where X is"). Implementers never go below Sonnet, even for tasks v7 would call mechanical. This is stricter than v7's own Model Selection, which allows a cheap model for mechanical implementation; the user's rule ("Sonnet for implementers") wins.
- **The whole-branch final review stays on Opus,** as v7 already requires ("most capable available model"). That is one dispatch per branch.
- **Enforcement is a hook, not only skill text.** The new plugin (Part 3) adds a `PreToolUse` hook on the `Agent`/`Task` tool. Skill text alone already exists in v7, and the logs show it is not followed reliably.
  - **Any Fable model:** denied, for every agent type.
  - **No `model`:** denied only for `general-purpose` and untyped dispatches. Those are the ones that silently inherit the session model. Built-in or plugin agent types that pin their own model, and the `fork` type, which ignores `model`, are left alone, so the hook cannot break flows this suite does not own.
  - **Opt-out:** `"enforceDispatchModel": false` in `.claude/context-budget.json`.
  - **The deny message** names the rule in one line, so Claude re-dispatches correctly on the first try.
- **Where the rule is written:**
  - **context-budget skill:** the rule itself, stated once, since it must hold in every run. Its description triggers on dispatching implementer or reviewer subagents. The deny message of the dispatch hook repeats the rule in one line, so Claude meets it even when the skill is not loaded. `check:upstream` gets anchors on v7's Model Selection section and its fix-round escalation, so the upstream watch flags any change there.
  - **project-orchestration:** a "Model choice" overlay in the section that already adjusts upstream skills when project-orchestration drives them, next to "Brainstorming's hand-off". It covers how writing-plans marks hard tasks and how executing or subagent-driven runs pick models.
  - **squad:** its "Parallel Subagent Dispatch" section names a model per specialist. Specialists default to Sonnet; Lead may use Opus for reconciling conflicting answers.
- **Plan mark format:** a line in the task, `**Model:** opus`, with a short reason. Absent means Sonnet.

## Part 2 — Trap detection in `map-codebase`

Add a step to project-orchestration's `map-codebase` process, between "Identify patterns" and "Summarize", and a **Traps** section to the codebase map it writes. The step is written for any stack; their version used TypeScript and Python grep commands.

What it looks for:

- **Large or complex files:** what they own, with a note not to add to them blindly. On .NET, when roslyn-codelens tools are available, use its complexity metrics and god-object detection instead of line counts.
- **Change hotspots:** files that git history shows change most often, or most often in `fix:` commits.
- **Hidden coupling:** shared mutable or global state, circular dependencies (roslyn-codelens on .NET), and environment variables with no default.
- **Known-broken spots:** TODO, FIXME and HACK markers, with a note to leave them alone unless the planned work is about them.
- **Test baseline:** run the test suite once and record which tests already fail, so later work does not "fix" them by accident or get blamed for them. If the suite is too slow or needs services that are not available, record that instead of running it.
- **Critical files:** auth, migrations, schema, CI configuration and similar, flagged as "read fully before changing".

The map's existing "Recommended starting points" section should reference the traps that touch the planned work.

## Part 3 — Keeping context small

### Decided with the user

- **A hook measures the real context size.** Claude cannot see its own context size reliably, so a hook reads it.
- **Two thresholds, adjustable per project:**
  - **200k, nudge:** at the next natural break, Claude offers to continue in a fresh session.
  - **400k, firm:** Claude offers it at the very next break and says the cost is now high.
- **Only ever a suggestion.** The user decides; nothing stops on its own.
- **Natural breaks** are a finished plan task, phase or PR, or a delivered result the user has not yet followed up on. A hook can't see the user going quiet, so Claude makes the offer at the end of its reply that finishes such a piece of work.
- **Big context is fine when the work needs it** (user, 2026-10-21: "it must not be in between a good session. if we need such a big context for the best result then we need it"). Crossing a threshold is not enough on its own. Claude offers a fresh session only when both hold:
  - it is at a natural break, and
  - the next piece of work would not lose anything it needs from the current context. For example, the next phase is independent, or everything it needs is already written down in STATE.md, the plan or the handoff note.

  When the next step builds on what is in context, such as a debugging thread or a design still being worked out, Claude says nothing and carries on. The firm level only changes the wording, saying that the cost is now high; it does not lower the bar.

### My calls

- **A new plugin, `context-budget`,** holds the hooks and a short skill. It is separate from project-orchestration so it works in every project, including ones without `docs/planning/`.
- **How size is measured:** a hook reads the latest assistant entry's `usage` in the session transcript (`input_tokens + cache_creation_input_tokens + cache_read_input_tokens`). The transcript path is passed to hooks on stdin.
- **Which hook:** `UserPromptSubmit` adds the reminder as context for the next turn. It stays silent below 200k.
- **Re-arming:** a reminder that arrives mid-task is correctly ignored, so the hook can't stay quiet for good after the first one. Above the nudge threshold it reminds again after every further 50k tokens of growth, and again after a compaction resets the size. The reminder is one short line telling Claude to apply the "both hold" test below. It is not a request to act, so repeats cost little and never interrupt.
- **State:** the last-reminded size is stored per session, keyed by session id, under the plugin's data directory.
- **Configuration:**
  - The thresholds are overridable in `.claude/context-budget.json` in the project, e.g. `{"nudge": 200000, "firm": 400000}`.
  - The defaults live in the plugin.
  - A missing or invalid file falls back to the defaults.
- **The handoff itself:**
  - When `docs/planning/STATE.md` exists, use project-orchestration's `pause-work`, which already writes a resumable state.
  - Otherwise, the `context-budget` skill writes a short handoff note to `.claude/handoff.md` covering the goal, current state, decisions made, next step, and files in play, and gives the user one line to paste into the new session.
- **Smaller plan tasks:** project-orchestration's planning overlay adds a sizing rule. A plan task should be small enough for one implementer to finish in a short run. A task touching more than about five files, or combining a new component with its integration, is split. This targets the 100–270-call implementers.
- **Subagents get no size hook.** Hooks see the main session; subagent size is controlled through task sizing and the model rule instead.
- **The dispatch-model hook** from Part 1 also lives in `context-budget`.

## Constraints

- Every plugin must be registered everywhere `scripts/check-registries.mjs` checks: marketplace, release-please config, the opencode plugin list, commitlint scopes and the README.
- Plugin layout: `plugins/context-budget/.claude-plugin/plugin.json`, `plugins/context-budget/skills/context-budget/SKILL.md`, and `plugins/context-budget/hooks/hooks.json` plus its scripts.
- Hook scripts must run on Linux, macOS and Windows. The user works on Windows too: they asked for PowerShell earlier. Node is already a dependency of the repo's tooling, so hook scripts are written in Node with no extra packages.
- Hooks must be fast (well under a second) and must never fail a turn. On any error they exit 0 silently.
- `check:upstream` anchors must keep passing. Any new reference to v7 text (e.g. the Model Selection section or fix-round escalation) gets an anchor so the upstream watch flags it if v7 changes.
- The repo's own conventions apply: conventional commits with plugin scopes, no nested parentheses in commit bodies, markdownlint.

## Measuring

Before merging, note the current baseline from claude-usage for two or three active projects: Opus share of cost, subagent share of cost, and average context per call. After two weeks of normal use, compare. The work succeeds if Opus share and average context per call both fall clearly, without more fix rounds per task in the subagent-driven ledgers.

## Left to the builder

- Exact wording of the skill overlays, the hook messages and the trap-detection step.
- The hotspot heuristic: how many commits back, and how many files to list.
- How the deny message for a dispatch without a model is worded, so Claude re-dispatches correctly on the first try.
- Tests for the hook scripts (transcript parsing, threshold crossing, config fallback, the dispatch check), runnable with `npm test`.
- Delivery as one PR or several. A natural split: model choice plus `context-budget`, then trap detection.
