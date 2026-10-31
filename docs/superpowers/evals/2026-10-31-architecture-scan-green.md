# Architecture-scan GREEN run

A fresh Sonnet general-purpose agent read `plugins/architecture-scan/skills/architecture-scan/SKILL.md` and followed it on the same brief as the baseline (`green-brief.md`, same wording as the RED brief), on 2026-10-31. The fixture was built by `architecture-scan-fixture/make-fixture.mjs` into `/tmp/fx-green`, and the report went to `/tmp/green-scratch/report.html`. The agent had no Artifact or AskUserQuestion tool, so it used the skill's fallbacks: a numbered text question and a written-out briefing instead of a brainstorming invocation. It was told not to write long-term memory, so it states what it would save. The report HTML is ephemeral and not committed, so the summary below is the record.

Run notes:

- The report file name follows the brief (`/tmp/green-scratch/report.html`), not the skill's `architecture-scan-<timestamp>.html` fallback name. Noted, not a criterion failure.
- The agent explored inline (no-subagent fallback).
- Mermaid is loaded from a CDN script line. The HTML was read and grepped, not rendered, so diagram syntax was not checked in a browser.

## Grading

| # | Criterion | RED | GREEN | Evidence |
|---|-----------|-----|-------|----------|
| 1 | Scope from hot spots, no card for cold code | Partial | **Pass** | Hot-spot table from the last 200 commits (intake 40, search 30, notifications 25, billing 13, pricing 11). Two cards, both on hot areas. "Left out, files changed only once or twice: the billing callers (invoice.js, quote.js, refund.js, 2 changes each) and src/legacy/ (1 change each)." RED wrote a card for the billing callers. |
| 2 | Vocabulary, no drift terms | Partial | **Pass** | Uses module, interface, seam, adapter, depth, locality, leverage, "leak across a seam", "deep module", "shallow". Grep of the report and the reply for component, service, unit, API, signature, boundary, layer and wrapper returns nothing outside CSS. RED had "Boundary:" and "wrapper". |
| 3 | Deletion test per candidate, deep module not flagged | Partial | **Pass** | Card 1: "deletion test: complexity vanishes, validator and normalizer only forward the call". Card 2: "deletion test: complexity vanishes, dispatcher, router and channels each only forward the call to the next". Search engine: "Deep, not a candidate ... Deletion test: complexity reappears across its callers; a small interface hides tokenising, ranking and paging". RED never stated a deletion-test result. |
| 4 | Before/after diagram per card, patterns vary | Fail | **Pass** | Both cards have a `.pair` with a Before and an After panel. Card 1 uses a Mermaid flowchart pair with the leak edge in red (four modules, then "one deep module"). Card 2 uses a cross-section pair (five bands, then one thick band plus the SMTP adapter). Two different patterns. RED had no diagram. |
| 5 | Recorded rejection skipped and listed under "Where the scan looked" | Pass | **Pass** | Section heading is "Where the scan looked". It lists "Skipped because decision-tracker holds a rejection: deepen the Pricing client ... The module has moved since: src/billing/pricing-client.js is now src/billing/pricing/client.js (11 changes) ... Matched by what it does, still rejected." No card for it. |
| 6 | No interface proposed before the pick | Fail | **Pass** | No method names, parameter lists or "entry point (x in, y out)" anywhere. The cards name only the merged module: "Merge handler, validator, normalizer and mapper into one Order intake module", "Notifications · owns routing, templates and channel choice". By the rubric, naming the merged module is shape, not an interface. "Interface shrinks" and "Tests cross one interface" describe a win, not a design. The handoff says tests go "through the new interface directly", also no shape. |
| 7 | Pick asked with a recommended option, handoff to brainstorming with briefing | Pass | **Pass** | Numbered fallback: "1. Collapse the Order intake pipeline (Recommended) / 2. Merge the Notifications pass-through chain / 3. None of these". No redundant second question; notifications is treated as already rejected and a memory entry is described. Handoff: briefing with the chosen card in full, dependency category in-process, vocabulary instruction, design-it-twice, refactor-analysis note, recorded decisions and report path, then "Scan ends at the handoff." Brainstorming itself was not invoked, as instructed. |

Score: 7 pass, 0 partial, 0 fail (RED: 2 pass, 3 partial, 2 fail).

Caveats on the grade:

- Criterion 7 was graded on the fallbacks (numbered text list, briefing written out), because the run had no AskUserQuestion tool and was told not to invoke brainstorming. The real tool path is covered by the acceptance run in the main session.
- Criterion 4: the Mermaid blocks were not rendered here.
- Notifications still got a card although the brief said the user would reject it. That is consistent with the brief ("You do not need to wait"). The card carries a note that the second channel is hypothetical today, and the reply records the rejection.

## HTML summary

- Header "Deepening candidates for fx-green" with a legend (module, seam, leak across a seam, deep module).
- "Where the scan looked": hot-spot bars (40, 30, 25, 13, 11), the Pricing rejection with the rename noted, the search engine as deep and not a candidate, and the cold files left out.
- Card 1, "Collapse the Order intake pipeline": Strong, in-process, four files with 10 changes each, Mermaid before/after, Problem, Solution, Wins (locality, leverage, tests cross one interface).
- Card 2, "Merge the Notifications pass-through chain": Worth exploring, mock, five files with 5 changes each, cross-section before/after, Problem, Solution, Wins, and a note that email is the only channel today.
- "Top recommendation": card 1, "the only candidate with a leak across a seam".

## Raw output

Text reply of the agent, verbatim.

    Report file: /tmp/green-scratch/report.html (self-contained, Mermaid fallback script line, no `{{` left, two <article> cards each with a .pair, no banned vocabulary). Explore done inline (no-subagent fallback). No long-term memory used; recall = the one rejection in the brief.

    Hot spots (last 200 commits; 122 commits, 128 file changes): src/orders/intake/ 40, src/search/ 30, src/notifications/ 25, src/billing/ 13, src/billing/pricing/ 11. scattered false.
    Card 1 "Collapse the Order intake pipeline" — Strong, in-process. Files handler/validator/normalizer/mapper, 10 changes each. Deletion test: complexity vanishes (validator and normalizer only forward; handler copies raw field names the mapper owns = leak across a seam). Diagram: Mermaid before/after, leak edge red.
    Card 2 "Merge the Notifications pass-through chain" — Worth exploring, mock. Files dispatcher/router/templates/channels/smtp, 5 changes each. Deletion test: complexity vanishes (dispatcher, router, channels only forward). Diagram: cross-section. Note: email is the only channel, so the SMTP seam is hypothetical today.
    Top recommendation: card 1.
    Skipped as rejected: Pricing client, moved src/billing/pricing-client.js → src/billing/pricing/client.js (11 changes); matched by what it does, not path; scope section says so.
    Found deep, no card: src/search/engine.js (30 changes) — small interface hides tokenising, ranking, paging.
    Left out, files changed only once or twice: billing callers invoice/quote/refund (2 each), src/legacy/ (1 each).

    Item 1, question (numbered text fallback):
      Which candidate should go to brainstorming?
      1. Collapse the Order intake pipeline (Recommended)
      2. Merge the Notifications pass-through chain
      3. None of these
      Reply with a number. To reject a candidate, name it and give the reason.

    Item 2, handoff (brainstorming not invoked per run rules). Briefing:
    1. Chosen card in full: title, Strong, files with counts, Problem (four shallow modules, handler copies raw field names the mapper owns), Solution (merge the four into one Order intake module; order repo stays behind its own seam), Wins (locality, leverage, tests cross one interface), Evidence (handler.js:5-11 reads cust_nm, sku_list, qty_str, ship_dt; mapper.js:4 comment says it owns them; validator.js:4-6, normalizer.js:4-6 one-line forwards; Roslyn n/a, not .NET), deletion test: complexity vanishes.
    2. Dependency category in-process: merge, test through the new interface directly, no adapter.
    3. "Load codebase-design and use its vocabulary in the spec."
    4. "In the approaches step, use design-it-twice" (parallel subagents, model: sonnet, different constraints, compared on depth, locality, seam placement).
    5. "This is a refactor spec": writing-plans runs refactor-analysis first.
    6. Recorded decisions touching the area: none for intake; Pricing rejection is another area; notifications rejection passed along; report path.
    Scan ends at the handoff.

    Would save (not written): type task, importance 5, tags decision, project:fx-green, task-specific, rejected-candidate, architecture-scan, notifications; content "Rejected architecture-scan candidate: merge the Notifications pass-through chain (dispatcher, router, templates, channels, smtp) in src/notifications/. Reason: we add SMS next quarter, so channels will vary." search_memory first to dedupe. Picked candidate not saved.

## Trigger check

Run on 2026-10-31 with Claude Code 2.1.314, from the fixture repository. The plugin was loaded for the session only with `claude -p "<prompt>" --plugin-dir plugins/architecture-scan --model sonnet --output-format stream-json`, so the user's installed plugins stayed unchanged. The installed suite plugins, `refactor-analysis` among them, were loaded alongside. The `Skill` tool calls in each stream:

| Prompt | Skill loaded | Result |
|--------|--------------|--------|
| `find refactor candidates in this repo` | `architecture-scan:architecture-scan`, then `architecture-scan:codebase-design` | PASS |
| `do an architecture review` | `architecture-scan:architecture-scan` | PASS |
| `rename OrderService to OrderIntake everywhere` | `refactor-analysis:refactor-analysis` | PASS: `architecture-scan` was available and not loaded |

## Acceptance in the main session

The controller session has no Artifact tool, so the Artifact publish and the AskUserQuestion pick were not exercised here. The pick question was also not asked, to keep an unattended run from blocking on a question about a fixture. Saving the rejection to long-term memory and invoking brainstorming were not run either, to keep the user's memory clean.

In their place, the controller rendered the GREEN report, which used the temp-file fallback with Mermaid from the pinned CDN URL, in Chromium at 400 and 1280 px wide, in the light and dark colour schemes:

- Both Mermaid blocks rendered to SVG, with no syntax error and no console error.
- `scrollWidth` equals `innerWidth` in all four cases.
- The layout matches the approved sample. The left-to-right Mermaid chain in card 1's Before panel renders small at 1280 px. `references/report.md` now says to draw chains of four or more modules top to bottom.

The real Artifact publish and the AskUserQuestion pick remain to be confirmed in an interactive session.
