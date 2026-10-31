---
name: architecture-scan
description: Use when the user asks to "find refactor candidates", wants an "architecture review", asks "where should we refactor", wants to "find shallow modules" or to "improve the codebase architecture". Finds shallow modules in the areas the git history changes most, publishes a ranked report with before/after diagrams, lets the user pick one candidate and hands it to brainstorming. Skip when the refactor is already chosen ("rename X everywhere", "extract this into", which is refactor-analysis) and for single-file cleanups.
---

# Architecture Scan

Finds **deepening candidates**: places where shallow modules could become one deep module. It looks where the git history shows the most change, has a fresh subagent apply the deletion test there, publishes a ranked report, lets the user pick, and hands the pick to `superpowers:brainstorming`. The scan never designs the new interface; brainstorming does that after the pick.

<HARD-GATE>
1. **No interface before the pick.** Until the user has picked a candidate, nothing you write names a new interface: no method names, no parameter lists, no "single entry point", no "one `dispatch(event)`", no `accept(order)` label in a diagram. This holds for the report, the pick question and your reply. The report says *which modules merge and what moves behind the seam*; brainstorming designs the interface.
2. **The report is not done until it is published and its location is given.** Publish it as an Artifact and give the URL, or, in the fallback, write the file and give its absolute path. Before you say so, check that the file or Artifact source contains no `{{` placeholder. Describing the report in chat is not publishing it.
</HARD-GATE>

## Vocabulary

Load the `codebase-design` skill (Skill tool, `architecture-scan:codebase-design`; without the Skill tool, read [../codebase-design/SKILL.md](../codebase-design/SKILL.md)) before step 4. Use its terms exactly, in the brief, the report and every reply: **module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality**.

Never write component, service or unit for module; API or signature for interface; boundary for seam; layer or wrapper for module or adapter. A label such as "Boundary:" counts too.

## Procedure

`<skill dir>` is the directory holding this SKILL.md; commands run from the user's repo, so give script paths in full. `<root>` is the repo root (`git rev-parse --show-toplevel`).

### 1. Recall rejected candidates

Recall decisions with `decision-tracker`. It recalls once per session: if it already ran, reuse its list. Otherwise do its two steps: call `search_by_tags` with `["decision", "project:<name>"]`, then keep the results that also carry the `rejected-candidate` tag. Add any rejection the user states in the conversation. These go to the subagent in step 4 and to the report's scope section.

### 2. Scope

Run the script at `<skill dir>/scripts/hotspots.mjs`: `node <skill dir>/scripts/hotspots.mjs --repo <root>`. It prints `{dirs:[{dir,count}], total, scattered, files:[{path,count}], filesTruncated, commits}` for the last 200 commits: `dirs` counted per directory at most three levels deep, `files` per file, both without lockfiles, generated files, `CHANGELOG.md` and docs. `files` holds only files inside the top five `dirs`, at most 100 of them, and `filesTruncated` says whether more were left out. Exit code 2 means `<root>` is not a git repo: ask the user for an area instead.

- **The user named an area, a module or a pain point:** that is the scope. Rerun the script with `--under <area>` (a repo-relative directory, trailing slash optional) so `dirs`, `files`, `total` and `scattered` count only paths under it. Do not pick directories from `dirs`.
- **Otherwise:** the scope is the **top five directories** in `dirs` with their counts. When `scattered` is true, the top five hold less than 30% of the changes: widen the scope to the whole source tree and say so in the report.

Keep the counts; the report shows them.

**Hot files, not only hot directories.** A directory can be hot because of one file. Take the per-file change counts from the script's `files` field; it already covers only the scope directories.

A card's files must be among the files this history changes repeatedly. Every card's Files line shows each file's change count in the window, so a file with one or two changes is visible on the card. A candidate whose files changed only once or twice each gets no card, even when it is shallow and its directory is hot.

### 3. Read the project's glossary and ADRs

If the repo has a glossary (`GLOSSARY.md`, `CONTEXT.md` or similar) or an ADR folder (`docs/adr/`, `docs/decisions/`, `adr/`), read it and use its domain terms: "the Order intake module", not "the FooBarHandler". Never create either.

### 4. Explore (one subagent)

Dispatch **one** `general-purpose` subagent with `model: sonnet` passed explicitly (`context-budget`: never Fable, never an inherited model). One agent keeps the comparison across hot spots in one context. Its brief contains:

1. **The scope:** the hot-spot directories with their counts, or the named area, plus the per-file counts from `files` inside it.
2. **The vocabulary:** "Load the `codebase-design` skill and use its terms exactly; never component, service, unit, API, signature, boundary, layer or wrapper."
3. **The recorded rejections**, each with its reason: "Do not return these. Match by what the candidate does and the area it covers, not by file path: a rejected module that was renamed or moved is still rejected. List each one you skip and why it matches."
4. **The glossary terms**, if step 3 found any.
5. **On .NET** (`*.sln`, `*.slnx` or `*.csproj` present) **with roslyn-codelens tools available:** "Back each finding with `get_complexity_metrics`, `find_callers` (fan-in), `get_public_api_surface` (interface size), and `get_type_hierarchy` and `find_circular_dependencies` where relevant, as `roslyn-codelens-integration` describes. Use them instead of Grep for structural questions."
6. **What to look for**, from upstream: where understanding one concept means bouncing between many small modules; where modules are shallow, with an interface nearly as complex as the implementation; where pure functions were extracted for testability but the bugs hide in how they are called (no locality); where coupled modules leak across their seams; what is hard to test through its current interface.
7. **The deletion test, on every suspect:** "Imagine deleting the module. If complexity vanishes, it was a pass-through: a candidate. If complexity reappears across its callers, it earns its keep: it is deep, and not a candidate. State the result for every suspect, candidate or not."
8. **The rules:** read-only, edit nothing; a candidate's files must be files the history changes repeatedly, each listed with its change count, and a candidate whose files changed only once or twice each is not returned; never propose an interface (no method names, parameters or entry points); up to six candidates, ranked by strength and then by churn in the area; return fewer when fewer are real, never pad with invented ones.
9. **The return format**, per candidate:
   - **Title:** a short name for the deepening, such as "Collapse the Order intake pipeline".
   - **Files**, each with its change count in the window.
   - **Problem:** one sentence naming the shallow modules.
   - **Solution:** one sentence on which modules merge and what moves behind the seam. No interface.
   - **Wins:** short bullets in glossary terms (locality, leverage, interface shrinks).
   - **Strength:** `Strong`, `Worth exploring` or `Speculative`.
   - **Dependency category:** `in-process`, `local-substitutable`, `ports & adapters` or `mock`.
   - **Deletion-test result:** one line, such as "complexity vanishes: the four modules only forward the call".
   - **Evidence:** file:line references, change counts, and Roslyn figures when used.
   - **Conflict:** a recorded decision or ADR it touches, if any.
   - **Diagram sketch:** which pattern fits (Mermaid graph, hand-built boxes, cross-section, mass diagram, call-graph collapse) and what goes in Before and After.

   And once, after the candidates: the modules found deep by the deletion test, the rejections skipped with the reason each matches, and the suspects left out because their files changed only once or twice.

### 5. Report

Build the report from [references/report.md](references/report.md) and `templates/report.template.html`, from the subagent's return. Check the return first: drop a candidate whose files changed only once or twice each, and rewrite any drift term or interface proposal before it reaches the page.

- **Where the scan looked** (`{{SCOPE}}`): the hot-spot rows with their counts, the history window, and the `.recalled` line listing every rejection skipped, with its reason. Note there when the rejected module has moved or been renamed since.
- **One card per candidate**, in ranked order, each with:
  - a **before/after diagram pair**. Every card has one. Vary the patterns: with two or more cards, use at least two different patterns. The After side shows the shape (one deep module where there were several shallow ones; a narrower interface over a larger implementation), labelled with the module's name, what it owns and which seams remain. No method names, parameter lists or method counts.
  - **Problem** that states the deletion-test result in words, such as "Four shallow modules; deletion test: complexity vanishes, each only forwards the call."
  - **Solution** that says which modules merge or what moves behind the seam, never the new interface.
  - **Wins** in glossary terms.
  - the `.adr` callout only when the candidate conflicts with a recorded decision or ADR.
- **Top recommendation** (`{{TOP}}`): one candidate, one sentence on why, a link to its card.

Always write the filled HTML to `<tmpdir>/architecture-scan-<timestamp>.html` first (see Fallbacks for `<tmpdir>` and `<timestamp>`), with `{{MERMAID_SCRIPT}}` empty, whether or not an Artifact tool exists. Run these checks on that file before publishing:

- `grep -niwE "component|service|services|unit|api|signature|boundary|layer|wrapper"` on the file finds nothing in report copy. A hit inside a file or directory name, such as `pricing-api.js`, is fine.
- No `{{` remains.
- Every `<article>` holds a `.pair`.
- No Solution line or After panel names a method, a parameter list or a method count.

Then publish the content of that file as an Artifact per `report.md`, or, in the fallback, put the pinned script line into the file and give its absolute path. Give the URL or the path (the HARD-GATE).

### 6. Pick

Ask with AskUserQuestion: "Which candidate should go to brainstorming?" AskUserQuestion takes at most four options, so with "None of these" in the last slot three candidates fit before Other. The top recommendation comes first, labelled "(Recommended)"; then the next candidates in rank order. Lower-ranked candidates beyond the limit stay reachable through Other: say so in the question. Still no interface in the option labels.

If the user already gave the pick, or a rejection and its reason, use those answers. Do not ask again.

**When the user rejects a candidate**, ask for the reason if it is not given. Record it only when the reason is lasting ("pricing is owned by another team", "we add SMS next quarter, so channels will vary"). Do not record "not now", and do not record a candidate the user simply did not pick. To record it, deduplicate first (`search_memory` with the text; `update_memory` on a close match), then `save_memory`:

```text
content:     Rejected architecture-scan candidate: <what it does> in <area>, files <files>. Reason: <reason>.
memory_type: task
importance:  5
tags:        decision, project:<name>, task-specific, rejected-candidate, architecture-scan, <area tag such as notifications>
```

`<name>` follows `decision-tracker`'s project-name detection. Say which rejections you saved.

"None of these" ends the scan: record any lasting rejections and stop.

### 7. Hand off to brainstorming

Write the briefing into the conversation, then invoke `superpowers:brainstorming` with the Skill tool. The briefing holds:

1. **The chosen card in full**: title, files with counts, Problem, Solution, Wins, strength, the evidence and the deletion-test result.
2. **The dependency category and what it means for testing**, from `codebase-design`'s [references/deepening.md](../codebase-design/references/deepening.md). For example, `in-process`: merge the modules and test through the new interface directly, no adapter; `ports & adapters`: a port at the seam, an in-memory adapter for tests.
3. **"Load `codebase-design` and use its vocabulary in the spec."**
4. **"In the approaches step, use design-it-twice"** from [references/design-it-twice.md](../codebase-design/references/design-it-twice.md): parallel subagents with `model: sonnet`, each with a different constraint, compared on depth, locality and seam placement.
5. **"This is a refactor spec":** writing-plans runs `refactor-analysis` first, as that skill's "With superpowers v7+ brainstorming" section describes.
6. The recorded decisions that touch the chosen area, and the report's URL or path.

The scan's job ends at the handoff. It does not design the interface, write the spec or run `refactor-analysis`.

## Fallbacks

- **Artifact shows Mermaid source as text:** republish with `{{MERMAID_SCRIPT}}` filled by the pinned script line from `report.md`, as in the fallback below.
- **No Artifact tool:** fill `{{MERMAID_SCRIPT}}` with the pinned script line from `report.md` and write the file to `<tmpdir>/architecture-scan-<timestamp>.html`, where `<tmpdir>` is `$TMPDIR`, else `/tmp` (`%TEMP%` on Windows), and `<timestamp>` is `YYYYMMDD-HHMMSS`. Try to open it (`xdg-open`, `open` or `start`); if that fails, the absolute path is enough. Give the path.
- **No AskUserQuestion:** ask a numbered question in text, top recommendation first and marked, "None of these" last:

  ```text
  Which candidate should go to brainstorming?
  1. Collapse the Order intake pipeline (Recommended)
  2. Merge the Notifications pass-through chain
  3. None of these
  Reply with a number. To reject a candidate, name it and give the reason.
  ```

- **No subagent tool:** do step 4 yourself, with the same brief and the same return format, before you start step 5.
- **No long-term memory** (`save_memory` or `search_by_tags` missing): recall skips the memory lookup and uses rejections stated in the conversation. On a rejection, say it cannot be persisted and how to install it: `claude plugin install longterm-memory` ([LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP)). Write no file in its place.
- **No roslyn-codelens tools on .NET:** the subagent works from the code and git history, and the evidence says the Roslyn figures are missing.

## Rules

- **Vocabulary exact.** The ten terms above; never the substitutes.
- **Never padded.** Up to six cards; three is the aim, but fewer real candidates beat invented ones. No generic advice: every card names its modules, their interface and the deletion-test result.
- **Only hot code.** Scope comes from the hot spots or the user's named area; a candidate whose files changed only once or twice each gets no card.
- **No interface before the pick.** See the HARD-GATE.
- **Writes nothing into the repo.** The report is an Artifact or a temp file; rejections go to long-term memory. No glossary, no ADR, no notes file.
- **Ends at the handoff.**

## Relationship to other skills

| Skill | Relationship |
|-------|--------------|
| `superpowers:brainstorming` | **Runs after this skill.** Receives the briefing and designs the interface. |
| `refactor-analysis` | **Runs later**, when writing-plans starts on the refactor spec. This skill finds the refactor; `refactor-analysis` maps its blast radius. |
| `codebase-design` | **Loaded by this skill and by brainstorming.** The vocabulary, the dependency categories and design-it-twice. |
| `decision-tracker` | **Read and written.** Recall supplies `rejected-candidate` decisions at scan start; the pick step saves new ones in its task-specific shape. |
| `roslyn-codelens-integration` | **Used on .NET** when its tools are available, for the explore subagent's evidence. |
| `context-budget` | Holds the model rule for the explore subagent: Sonnet, explicit, never Fable. |

Chain: `architecture-scan` → `superpowers:brainstorming` → `superpowers:writing-plans` (with `refactor-analysis` first) → implementation.

## Reference Index

| File | Contents |
|------|----------|
| [references/report.md](references/report.md) | Filling the template, publishing, the scope and card markup, diagram patterns, the top recommendation, tone |
| `templates/report.template.html` | The report page and its stylesheet, with light and dark tokens |
| `scripts/hotspots.mjs` | Change counts per directory and per file from git history; `--under <dir>` limits them to one area, `files` is capped at 100 |
| [../codebase-design/SKILL.md](../codebase-design/SKILL.md) | Vocabulary and principles |
| [../codebase-design/references/deepening.md](../codebase-design/references/deepening.md) | Dependency categories, seam discipline, testing |
| [../codebase-design/references/design-it-twice.md](../codebase-design/references/design-it-twice.md) | The parallel-subagent pattern for alternative interfaces |

Adapted from Matt Pocock's MIT-licensed `improve-codebase-architecture` skill. See [NOTICE.md](NOTICE.md) for the source and licence.
