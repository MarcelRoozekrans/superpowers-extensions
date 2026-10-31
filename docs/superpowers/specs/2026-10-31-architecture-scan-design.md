# Architecture Scan — Design

Date: 2026-10-31
Status: approved

## Intent

Before a refactor can be planned, someone has to decide which refactor is worth doing. Today the suite starts at `refactor-analysis`, which maps the blast radius of a refactor that has already been chosen. Nothing finds the candidates.

`architecture-scan` is a new plugin that fills that step. It looks where the git history shows the most change and finds shallow modules there. It presents ranked refactor candidates with before/after diagrams, and after the user picks one, it hands that candidate to brainstorming. The spec that brainstorming writes then flows into writing-plans, and `refactor-analysis` runs first there, as it does today.

It is adapted from Matt Pocock's MIT-licensed skills: `skills/engineering/improve-codebase-architecture` (SKILL.md, HTML-REPORT.md) and `skills/engineering/codebase-design` (SKILL.md, DEEPENING.md, DESIGN-IT-TWICE.md) in [mattpocock/skills](https://github.com/mattpocock/skills). The vocabulary and the core method (deep modules, the deletion test, dependency categories, design-it-twice) come from there. The integration with this suite is new.

## Goals

- Scope the scan to the areas with the most recent git history, unless the user names an area.
- Have a subagent with a fresh context find shallow modules with the deep-module vocabulary and the deletion test.
- Publish a ranked report as an Artifact, one card per candidate with a before/after diagram, and a top recommendation.
- Let the user pick a candidate with AskUserQuestion, with the top recommendation marked as recommended.
- Hand the chosen candidate to `superpowers:brainstorming` with a briefing, so the spec carries the scan's findings and vocabulary.
- Record rejected candidates in `decision-tracker`, and skip them in later scans.
- Ground findings in Roslyn evidence on .NET when `roslyn-codelens-integration` tools are available.
- Credit Matt Pocock under MIT.

## Non-goals

- Mapping the impact of the chosen refactor. That stays with `refactor-analysis`.
- Writing the spec or the interface design itself. That is brainstorming's job, fed by the briefing.
- Creating or maintaining a domain glossary or ADR folder. Upstream's `GLOSSARY.md`, `docs/adr/` and `domain-modeling` skill are left out.
- Running unasked. The scan is invoked by the user, not after every feature.
- Metrics dashboards or trend tracking across scans.

## Anti-goals (failure even if it "works")

- **Generic advice.** Cards that say "improve separation of concerns" or "cleaner code" without naming a module, its interface and what the deletion test showed.
- **Vocabulary drift.** "Component", "service", "API", "boundary" or "layer" in place of module, interface and seam.
- **Interfaces proposed before the pick.** Upstream's rule holds: the report names what would change, not the new interface. Interface design happens in brainstorming.
- **Re-suggesting a rejected candidate.** A candidate the user rejected for a lasting reason shows up again in a later scan.
- **Files in the repo.** The scan itself writes nothing into the user's repository: the report is an Artifact (or a temp file), rejections go to long-term memory.
- **Scanning everything evenly.** A whole-repo sweep that ignores where change actually happens.

## Decisions (Marcel's)

| Topic | Decision |
|-------|----------|
| Place in the chain | The step before `refactor-analysis` |
| After the pick | Hand off to `superpowers:brainstorming` with a briefing: the chosen card, its files, its dependency category and a pointer to the vocabulary. Design-it-twice supplies the alternatives in brainstorming's approaches step |
| Rejected candidates | Recorded in `decision-tracker`, not in an ADR folder |
| Report | Published as an Artifact, not a temp file. Layout as in the approved sample (see **Report**) |
| Questions | AskUserQuestion, with a recommended option |
| .NET | `roslyn-codelens-integration` tools when available |
| Names | Plugin and skill `architecture-scan`; vocabulary skill `codebase-design` |
| Packaging | One plugin with two skills (see **Approaches**) |
| Credit | Matt Pocock, under MIT |

### Claude's calls (not discussed; correct if wrong)

| Topic | Call | Why |
|-------|------|-----|
| Hot-spot window | The last 200 commits on the current branch, change counts per directory, excluding lockfiles, generated files, `CHANGELOG.md` and docs. If the top five directories hold less than 30% of the changes, the history counts as scattered and the scan widens to the whole source tree | Upstream says "a good stretch" and "widen if scattered" without numbers. Fixed numbers make the scope reproducible and show in the report |
| Explore subagent | One `general-purpose` subagent on Sonnet, with an explicit `model`. It returns structured candidates; the main session builds the report | `context-budget` rule: Sonnet for non-lookup subagents, never Fable. One agent keeps the comparison across hot spots in one context |
| Candidate count | Up to six cards, ranked by strength, then by churn in the area. Aim for at least three, but never pad with invented candidates when the scan finds fewer | More than six turns the report into a list; padding to a quota produces the generic advice this design rules out |
| Existing glossary and ADRs | If the repo already has a glossary (`GLOSSARY.md`, `CONTEXT.md` or similar) or an ADR folder, the scan reads it and uses its terms. It never creates one | Keeps upstream's benefit where the project already has these, without adding files |
| Rejection record | `task` type, importance 5, tags `decision`, `project:<name>`, `task-specific`, `rejected-candidate`, `architecture-scan` and an area tag. Text names the candidate, its files and the reason | Matches decision-tracker's task-specific category, so its recall and deduplication work unchanged |
| Which rejections are recorded | Only a rejection with a lasting reason ("tax rules ship on a separate release cycle"). "Not now" is not recorded | Upstream's filter for ADRs; a temporary reason would block a candidate that becomes right later |
| Directory depth for hot spots | Counts roll up to directories at most three levels below the repo root (`src/orders/intake/`) | Deep enough to separate modules, shallow enough that a hot area isn't split across many leaf folders |
| Unpicked candidates | A candidate the user simply doesn't pick is not a rejection and is not recorded | Only an explicit rejection carries a reason worth keeping |
| Matching a rejection later | The subagent matches recorded rejections by what the candidate does and the area it covers, not by exact file paths | Files get renamed and moved; a path match would let a rejected candidate come back |
| Without long-term memory | The scan says the rejection cannot be persisted and how to install LongtermMemory-MCP. It writes no file | The user ruled out an ADR folder; a stray file in the repo would be one by another name |
| Other harnesses | Without the Artifact tool, write the report to `<tmpdir>/architecture-scan-<timestamp>.html` with Mermaid loaded from a pinned CDN URL, and give the path. Without AskUserQuestion, ask a numbered question with the recommended option marked | Codex, Gemini and OpenCode lack both tools; upstream's temp-file flow is the fallback |
| Report styling | Plain CSS with colour tokens for light and dark, no Tailwind. Mermaid rendered natively in the Artifact | Artifacts render in the viewer's theme and need exact library versions; Mermaid needs no library there |

## Approaches considered

- **A. One plugin, two skills.** **Chosen.** `plugins/architecture-scan/` holds `skills/architecture-scan/` and `skills/codebase-design/`. Brainstorming can load `codebase-design` by name through the briefing, and anyone can load it directly when designing a module. One registration, one commitlint scope, one NOTICE.md.
- **B. One skill, vocabulary as reference files.** Rejected. Simplest layout, but the vocabulary could not be loaded by name, so brainstorming would have to read into another skill's folder. That works against the brainstorming handoff.
- **C. Two plugins.** Rejected. A separate `codebase-design` plugin is cleaner reuse, but doubles the registry and release overhead and adds a marketplace dependency, while nothing else needs the vocabulary yet.

For the step after the pick, three flows were considered: the scan runs its own design dialogue and writes the spec; it hands off to brainstorming with a briefing; or the card goes straight to `refactor-analysis`. Marcel chose the briefing handoff: brainstorming already has the approval gate, the builder check and the hooks of `decision-tracker` and `roslyn-codelens-integration`, and a second dialogue would duplicate them. Going straight to `refactor-analysis` would plan a refactor whose interface was never designed.

## How it works

### 1. Recall and scope

1. Recall decisions with `decision-tracker` (it runs once per session) and collect the ones tagged `rejected-candidate`.
2. If the user named an area, a module or a pain point, that is the scope. Skip step 3.
3. Otherwise compute hot spots from the git history with the window from **Claude's calls**, and keep the counts for the report. `scripts/hotspots.mjs` does the counting so the result is the same on every run.
4. Read an existing glossary and ADR folder if present.

### 2. Explore (subagent)

The main session dispatches one subagent with a brief that contains:

- the scope: the hot-spot directories with their counts, or the named area;
- the `codebase-design` vocabulary and principles, by loading that skill;
- the rejected candidates, so it does not return them;
- the glossary terms, if any;
- on .NET with roslyn-codelens tools available: an instruction to back each finding with `get_complexity_metrics`, `find_callers` (fan-in), `get_public_api_surface` (interface size), `get_type_hierarchy` and `find_circular_dependencies` where relevant, as `roslyn-codelens-integration` describes.

It explores the way upstream describes: where understanding one concept means bouncing between small modules, where modules are shallow, where extracted pure functions moved the bugs into the call sites, where coupled modules leak across their seams, and what is hard to test through its interface. It applies the deletion test to every suspect.

It returns, per candidate: title, files, problem, solution (no interface), wins in glossary terms, strength (`Strong`, `Worth exploring`, `Speculative`), dependency category (`in-process`, `local-substitutable`, `ports & adapters`, `mock`), the deletion-test result, evidence (file:line, and Roslyn figures when used), a conflict with an existing ADR or recorded decision if any, and a diagram sketch: which pattern fits and what goes in before and after.

### 3. Report

The main session builds the report from `references/report.md` and publishes it as an Artifact. The layout follows the approved sample:

- a header with repo name, date and the legend (module, seam, leak across a seam, deep module);
- **Where the scan looked**: the hot spots with their change counts, and the candidates skipped because of a recorded rejection;
- one card per candidate: title, strength and dependency-category badges, files, a before/after pair, Problem, Solution and Wins as one line each, and a warning callout when it conflicts with a recorded decision or ADR;
- **Top recommendation**: one candidate, one sentence on why, an anchor link to its card.

Diagram patterns, mixed across cards: Mermaid graph for call flow and dependencies, mass diagram for an interface as wide as its implementation, cross-section for layered pass-throughs, call-graph collapse, and hand-built boxes when Mermaid's layout fights the point. Tone rules from upstream's HTML-REPORT.md carry over: sparse prose, the vocabulary used exactly, no hedging.

The report shows the before/after shape, not the new interface.

### 4. Pick

AskUserQuestion: one option per candidate (up to the tool's limit, the rest under Other), with the top recommendation first and marked "(Recommended)", plus "None of these". When the user rejects a candidate, ask for the reason if it isn't given, and record it as in **Claude's calls** when the reason is lasting.

### 5. Hand off

Write the briefing into the conversation and invoke `superpowers:brainstorming`. The briefing holds:

- the chosen card in full, with the evidence and the deletion-test result;
- the dependency category and what it means for testing, from `codebase-design`'s DEEPENING.md;
- the instruction to load `codebase-design` and use its vocabulary in the spec;
- the instruction that the approaches step uses design-it-twice from `codebase-design`'s DESIGN-IT-TWICE.md: parallel subagents, each with a different constraint, compared on depth, locality and seam placement;
- that the spec is a refactor spec, so writing-plans runs `refactor-analysis` first, as that skill's "With superpowers v7+ brainstorming" section describes.

The scan's job ends at the handoff.

## The `codebase-design` skill

Adapted from upstream's `codebase-design`, with its two reference files:

- `SKILL.md`: the glossary (module, interface, implementation, depth, seam, adapter, leverage, locality), deep against shallow, the principles (the deletion test, the interface is the test surface, one adapter is a hypothetical seam and two are a real one), designing for testability and the rejected framings.
- `references/deepening.md`: dependency categories, seam discipline, replace-don't-layer testing.
- `references/design-it-twice.md`: the parallel-subagent pattern. Subagents get an explicit `model` (Sonnet) per `context-budget`.

References to `GLOSSARY.md` become "the project's glossary, if it has one". The description triggers on designing or deepening a module's interface, deciding where a seam goes and making code testable through its interface, and on being named by the architecture-scan briefing.

## Plugin layout

```text
plugins/architecture-scan/
  .claude-plugin/plugin.json
  NOTICE.md
  skills/
    architecture-scan/
      SKILL.md
      references/report.md        # diagram patterns, card rules, tone
      templates/report.template.html  # the page scaffold from the approved sample
      scripts/hotspots.mjs        # hot-spot counts from git log, with tests
    codebase-design/
      SKILL.md
      references/deepening.md
      references/design-it-twice.md
```

`NOTICE.md` follows `plugins/ui-design-system/skills/ui-design-system/design-systems/NOTICE.md`: which files are adapted from which upstream files, what changed, and the full MIT licence text with Matt Pocock's copyright line. The README entry credits him as well.

The plugin is registered everywhere `demo-video` was: `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.codex/INSTALL.md`, `.copilot-cli/INSTALL.md`, `.cursor-plugin/plugin.json`, `.opencode/plugins/superpowers-extensions.js`, `GEMINI.md`, `hooks/session-start`, `package.json`, `release-please-config.json`, `commitlint.config.js` (scope `architecture-scan`) and `README.md`.

This is the first plugin with two skills. The OpenCode paths, the Codex symlink loops and GEMINI.md assume one skill per plugin at `plugins/<name>/skills/<name>`, so `codebase-design` would not load outside Claude Code. The OpenCode plugin and the Codex loops change to take every skill folder of a plugin, GEMINI.md gets a line per skill, and `check:registries` checks every skill folder rather than only the one named after its plugin.

## Integration with existing skills

- `refactor-analysis`: its relationship table and workflow chain get `architecture-scan` as the optional step before brainstorming.
- `decision-tracker`: its relationship table names `architecture-scan` as a writer of `rejected-candidate` decisions and a reader of them at scan start.
- `roslyn-codelens-integration`: its list of skills it enhances gets `architecture-scan`, with the tools from **Explore**.

## Verification

Like `demo-video` and `anti-slop`, the skill gets a RED/GREEN evaluation under `docs/superpowers/evals/`, run on a small fixture repository with a scripted git history: one hot area with a shallow pass-through chain, one deep module that should not be flagged, cold code, and one recorded rejection. Criteria:

1. Scope comes from the hot spots, and cold code gets no card.
2. Every card names modules and interfaces in the vocabulary, with no drift terms.
3. The deletion-test result is stated per candidate, and the deep module is not flagged.
4. Every card has a before/after diagram, and diagram patterns vary.
5. The recorded rejection is skipped and listed under "Where the scan looked".
6. No interface is proposed before the pick.
7. The pick is asked with a recommended option, and the handoff goes to brainstorming with the briefing.

The baseline runs the same brief without the skill. A trigger check confirms the description fires on "find refactor candidates" and "architecture review" and not on "rename X everywhere", which belongs to `refactor-analysis`.

## Left to the builder

- The exact wording of the subagent brief and the structured return format.
- The fixture repository's code and history script.
- The exact AskUserQuestion copy.
