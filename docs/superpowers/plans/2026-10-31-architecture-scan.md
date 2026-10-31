# Architecture Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 16th plugin, `architecture-scan`, with two skills: `architecture-scan` finds deepening candidates in hot areas of the git history and publishes them as a ranked Artifact report, and `codebase-design` holds the deep-module vocabulary that the scan and brainstorming both load.

**Architecture:** Markdown skills adapted from Matt Pocock's MIT-licensed `improve-codebase-architecture` and `codebase-design`. A small Node script makes the hot-spot counts deterministic. The report scaffold is an HTML template, taken from the approved sample. The registries learn that a plugin can hold more than one skill.

**Tech Stack:** Markdown skills, Node ≥ 20 ESM (`node:test`), git, markdownlint-cli2, the existing `scripts/check-*.mjs` guards.

**Spec:** `docs/superpowers/specs/2026-10-31-architecture-scan-design.md`

**Upstream source:** clone `https://github.com/mattpocock/skills` (depth 1) into the scratchpad. The files are `skills/engineering/improve-codebase-architecture/{SKILL.md,HTML-REPORT.md}` and `skills/engineering/codebase-design/{SKILL.md,DEEPENING.md,DESIGN-IT-TWICE.md}`. The approved report sample is `docs/superpowers/evals/2026-10-31-architecture-scan-sample.html` (Task 3 commits it).

## Global Constraints

- Vocabulary used exactly: module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality. Never component, service, unit, API, signature, boundary or layer in their place, in skill text and in report copy.
- Hot-spot window: the last 200 commits; counts per directory at most three levels below the repo root; excluded: lockfiles, generated files, `CHANGELOG.md` and docs. Scattered when the top five directories hold less than 30% of the counted changes.
- Explore subagent: one `general-purpose` subagent with `model: sonnet` passed explicitly. Design-it-twice subagents: `model: sonnet`. Never Fable.
- Up to six candidates, ranked by strength, then churn. Never padded with invented candidates.
- Strength values: `Strong`, `Worth exploring`, `Speculative`. Dependency categories: `in-process`, `local-substitutable`, `ports & adapters`, `mock`.
- No interface is proposed before the pick.
- Rejection record: memory type `task`, importance 5, tags `decision`, `project:<name>`, `task-specific`, `rejected-candidate`, `architecture-scan` and an area tag. Only lasting reasons are recorded; an unpicked candidate is not a rejection; matching later is by what the candidate does and its area, not by path.
- The scan writes no file into the user's repo. Without long-term memory: say the rejection cannot be persisted, write nothing.
- Fallbacks: no Artifact tool → `<tmpdir>/architecture-scan-<timestamp>.html` with Mermaid from a pinned CDN URL; no AskUserQuestion → a numbered question with the recommended option marked.
- Report: plain CSS with colour tokens for light and dark, no Tailwind; Mermaid native in the Artifact; layout as the approved sample.
- After the pick: hand off to `superpowers:brainstorming` with the briefing from spec §5. The scan's job ends there.
- Credit Matt Pocock under MIT: `plugins/architecture-scan/NOTICE.md` with the full licence text and copyright line `Copyright (c) 2026 Matt Pocock`, plus a README credit.
- Commit scope `architecture-scan` (Task 6 adds it to commitlint). No Claude signatures or session links in commits or PRs. No nested parentheses in commit bodies.

## Review Focus

- **A repo with fewer than 200 commits, or a shallow clone.** The hot-spot script must count what exists and not fail. Owned by Task 1 (short-history test).
- **A rename in the window.** A move must count once, under the new path, not under both. Owned by Task 1 (`--name-status`, only `A` and `M` counted, and a rename test).
- **The skill fires on a refactor that is already chosen** ("rename X everywhere"), which belongs to `refactor-analysis`. Owned by Task 8's trigger check.
- **A rejected candidate comes back under a new file name.** Owned by Task 4's fixture (the rejected area is renamed once in its history) and Task 8's grading.
- **Second skill missing on Codex, Gemini or OpenCode.** Owned by Task 6 (check-registries fails on a skill folder missing from GEMINI.md, and the OpenCode plugin reads the skill folders).

---

### Task 1: Hot-spot script

**Files:**

- Create: `plugins/architecture-scan/skills/architecture-scan/scripts/hotspots.mjs`
- Create: `plugins/architecture-scan/skills/architecture-scan/scripts/hotspots.test.mjs`

**Interfaces:**

- Produces:
  - `countHotspots(paths: string[], { depth = 3, topN = 5, threshold = 0.3 } = {}) => { dirs: Array<{ dir: string, count: number }>, total: number, scattered: boolean }`. `paths` is one entry per file per commit. Excluded paths are dropped before counting. `dir` is the file's directory cut to `depth` segments with a trailing `/`; a root file counts under `./`. `dirs` is sorted by count descending, then name. `scattered` is true when the top `topN` counts sum to less than `threshold * total`, and also when `total` is 0.
  - `isExcluded(path: string) => boolean`. True for: basenames `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `packages.lock.json`, `Cargo.lock`, `poetry.lock`, `composer.lock`, `Gemfile.lock`, `go.sum` and any `*.lock`; `CHANGELOG.md`; anything under `docs/`; any `*.md` at the repo root; path segments `node_modules`, `dist`, `build`, `bin`, `obj`, `vendor`, `generated`; suffixes `.min.js`, `.g.cs`, `.Designer.cs`, `.generated.*`, `.snap`.
  - CLI: `node hotspots.mjs [--repo <dir>] [--commits 200] [--depth 3]` runs `git -C <repo> log -n <commits> --no-renames --name-status --pretty=format:%x00`, counts only paths with status `A` or `M`, and prints the result of `countHotspots` as JSON, plus `commits` (the number actually read). It exits 2 when the directory is not a git repo, with a one-line error.

- [ ] **Step 1: Write the failing tests** in `hotspots.test.mjs`:
  - `countHotspots(['src/a/b/c/d.js', 'src/a/b/c/e.js', 'src/x.js'])` gives `dirs` `[{dir:'src/a/b/',count:2},{dir:'src/',count:1}]` and `total` 3.
  - A root file `index.js` counts under `./`.
  - `isExcluded` is true for `package-lock.json`, `web/yarn.lock`, `CHANGELOG.md`, `docs/guide/x.md`, `README.md`, `app/node_modules/x.js`, `src/Foo.g.cs`, `dist/app.js`, and false for `src/README-parser.js` and `src/docs.js`.
  - Ten files spread over ten directories, one each: `scattered` true. Ten files where eight are in one directory: `scattered` false.
  - An empty list: `total` 0, `scattered` true.
  - CLI against a temp git repo with three commits (helper creates it with `git init`, commits with fixed `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`): JSON `commits` is 3 with `--commits 200` (short history), and `total` matches the changed files.
  - CLI after a `git mv src/a/old.js src/b/new.js` commit: that commit adds 1 to `src/b/` and nothing to `src/a/`, because `--no-renames` reports the move as `D` plus `A` and `D` is not counted. Assert `src/a/` is absent from `dirs`.
  - CLI on a non-repo temp dir exits 2.
- [ ] **Step 2: Run** `node --test plugins/architecture-scan/skills/architecture-scan/scripts/hotspots.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `hotspots.mjs` (ESM, no dependencies; the CLI runs only when `import.meta.url` is the entry point). Count commits by the `\0` separators.
- [ ] **Step 4: Run** `npm test`. Expected: all suites pass.
- [ ] **Step 5: Commit** `feat(architecture-scan): count git hot spots per directory`. Commitlint lacks the scope until Task 6; run `npx commitlint --from origin/master` after Task 6.

### Task 2: codebase-design skill and NOTICE

**Files:**

- Create: `plugins/architecture-scan/skills/codebase-design/SKILL.md`
- Create: `plugins/architecture-scan/skills/codebase-design/references/deepening.md`
- Create: `plugins/architecture-scan/skills/codebase-design/references/design-it-twice.md`
- Create: `plugins/architecture-scan/NOTICE.md`

**Interfaces:**

- Produces: the skill `codebase-design`, loaded by name from Task 5's briefing; reference paths `references/deepening.md` and `references/design-it-twice.md`.

- [ ] **Step 1: Write `SKILL.md`.** Frontmatter `name: codebase-design`. Description starts "Use when", triggers on designing or deepening a module's interface, deciding where a seam goes, making code testable through its interface, and on being named by an architecture-scan briefing; skips one-off edits that change no interface. The body carries upstream's SKILL.md content (glossary, deep against shallow with the two box diagrams, principles, designing for testability, relationships, rejected framings), with these changes: "GLOSSARY.md" becomes "the project's glossary, if it has one"; links go to `references/deepening.md` and `references/design-it-twice.md`; a closing line credits the source and points to `../../NOTICE.md`.
- [ ] **Step 2: Write the two references** from upstream DEEPENING.md and DESIGN-IT-TWICE.md. In design-it-twice, each subagent dispatch passes `model: sonnet` explicitly (context-budget), and the brief includes the project's glossary only if one exists.
- [ ] **Step 3: Write `NOTICE.md`** in the shape of `plugins/ui-design-system/skills/ui-design-system/design-systems/NOTICE.md`: a table mapping each adapted file in this plugin to its upstream file, a list of what changed (Artifact report instead of temp file, brainstorming handoff instead of grilling, decision-tracker instead of ADRs, no GLOSSARY.md or domain-modeling, Roslyn evidence, hot-spot script), and the full MIT licence text with `Copyright (c) 2026 Matt Pocock`.
- [ ] **Step 4: Verify.** `npx markdownlint-cli2 "plugins/architecture-scan/**/*.md"` reports 0 issues. `grep -nwiE "component|service|boundary" plugins/architecture-scan/skills/codebase-design/SKILL.md` prints only lines inside the rejected-framings and "Avoid" notes.
- [ ] **Step 5: Commit** `feat(architecture-scan): add the codebase-design vocabulary skill`.

### Task 3: Report template and reference

**Files:**

- Create: `docs/superpowers/evals/2026-10-31-architecture-scan-sample.html` (copy of the approved sample)
- Create: `plugins/architecture-scan/skills/architecture-scan/templates/report.template.html`
- Create: `plugins/architecture-scan/skills/architecture-scan/references/report.md`
- Create: `plugins/architecture-scan/skills/architecture-scan/scripts/report-template.test.mjs`

**Interfaces:**

- Produces: the template with these placeholders, each appearing exactly once: `{{TITLE}}`, `{{EYEBROW}}`, `{{SCOPE}}`, `{{CANDIDATES}}`, `{{TOP}}`, `{{MERMAID_SCRIPT}}`. `{{MERMAID_SCRIPT}}` is replaced by an empty string in an Artifact and by `<script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"; mermaid.initialize({ startOnLoad: true, theme: "neutral" });</script>` in the temp-file fallback. The CSS classes the cards use are those of the sample: `article`, `.head`, `.badges`, `.badge`, `.b-strong`, `.b-explore`, `.b-spec`, `.files`, `.pair`, `.panel`, `.panel.after`, `.fields`, `.wins`, `.adr`, `.stack`, `.band`, `.band.thick`, `.mass`, `.mod`, `.if`, `.impl`, `.hot`, `.bar`, `.recalled`, `.top`.

- [ ] **Step 1: Copy the sample** from the scratchpad path the controller gives (`.../scratchpad/sample/architecture-scan-sample.html`) to the evals path.
- [ ] **Step 2: Write the failing test** `report-template.test.mjs`:
  - each placeholder occurs exactly once;
  - every `var(--name)` used is defined in the first bare `:root {` block;
  - both `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])` and `:root[data-theme="dark"]` exist and redefine the same token set;
  - no `<script src=` in the template, and no `cdn.tailwindcss.com`;
  - `.b-spec` is defined (the sample lacks a `Speculative` badge style).
- [ ] **Step 3: Run** `node --test plugins/architecture-scan/skills/architecture-scan/scripts/report-template.test.mjs`. Expected: FAIL (file missing).
- [ ] **Step 4: Write the template** from the sample: keep its `<style>` and structure, replace the header text, scope section, articles and top section with the placeholders, add `.b-spec` (slate-like neutral, tokens only), and put `{{MERMAID_SCRIPT}}` at the end. Mermaid `linkStyle` colours in diagrams are the one literal-colour exception; `report.md` says to use the leak red there.
- [ ] **Step 5: Write `report.md`.** Sections: how to fill the template (placeholders, Artifact vs fallback, the publish call with `icon: "diagram"` and a one-sentence description, the title `Architecture scan <repo>`); the scope section markup (one `.hot` row per directory with the bar width as a percentage of the top count, and the `.recalled` line listing skipped rejections); the card markup with the field order Title, badges, files, before/after pair, Problem, Solution, Wins, ADR or decision callout; the diagram patterns from upstream HTML-REPORT.md (Mermaid graph, hand-built boxes, cross-section, mass diagram, call-graph collapse) with the sample's markup for each, and the rule to vary them; the top-recommendation block; upstream's tone section with its use-exactly and never-substitute lists. It cites the template rather than repeating its CSS.
- [ ] **Step 6: Verify.** The test passes. Fill the template with the sample's content into a scratch file, open it in Chromium with Playwright at 400 px and 1280 px wide, light and dark colour schemes: `document.documentElement.scrollWidth <= innerWidth` in all four. `npx markdownlint-cli2 "plugins/architecture-scan/**/*.md"` reports 0 issues.
- [ ] **Step 7: Commit** `feat(architecture-scan): add the report template and report reference`.

### Task 4: Eval fixture and RED baseline

**Files:**

- Create: `docs/superpowers/evals/architecture-scan-fixture/make-fixture.mjs`
- Create: `docs/superpowers/evals/2026-10-31-architecture-scan-brief.md`
- Create: `docs/superpowers/evals/2026-10-31-architecture-scan-baseline.md`

**Interfaces:**

- Consumes: `hotspots.mjs` CLI (Task 1).
- Produces: `node make-fixture.mjs <targetDir>` builds a git repo (plain JavaScript, no dependencies) with fixed commit dates, and the brief reused verbatim in Task 8.

- [ ] **Step 1: Write `make-fixture.mjs`.** Areas and commit counts:
  - `src/orders/intake/` (40 commits): `handler.js → validator.js → normalizer.js → mapper.js → ../repo.js`, each forwarding with little logic, and `handler.js` reading raw fields that `mapper.js` owns.
  - `src/search/` (30): one `engine.js` exporting only `search(query, options)` with tokenising, ranking and paging inside (deep; must not be flagged).
  - `src/notifications/` (25): `dispatcher.js → router.js → templates.js → channels.js → smtp.js`, one channel only.
  - `src/billing/pricing-client.js` (20), renamed to `src/billing/pricing/client.js` at commit 10 of its 20: twelve one-line exported wrappers, with three callers repeating the same currency, rounding and retry sequence. This is the recorded-rejection area.
  - `src/legacy/reports/` (1): shallow pass-throughs, cold.
  - Root `README.md`, `package.json` and `package-lock.json` touched in a few commits (excluded).
- [ ] **Step 2: Verify the fixture.** Run it into a scratch dir, then `node plugins/architecture-scan/skills/architecture-scan/scripts/hotspots.mjs --repo <dir>`: the top four directories are `src/orders/intake/`, `src/search/`, `src/notifications/` and `src/billing/` (or `src/billing/pricing/` plus `src/billing/`), `src/legacy/reports/` has count ≤ 1, and `scattered` is false.
- [ ] **Step 3: Write the brief.** It gives the fixture path and says: scan this repo for architecture refactor candidates; decision-tracker recall returns one decision, "Rejected architecture-scan candidate: deepen the Pricing client in src/billing/pricing-client.js. Reason: pricing is owned by another team and its interface is a published contract"; the user will pick the top candidate and reject the notifications candidate because "we add SMS next quarter, so channels will vary"; write the report to `<scratch>/report.html` and give, as text, the question you would ask the user and the handoff you would make. No mention of the skill or its vocabulary.
- [ ] **Step 4: RED.** Dispatch a fresh `general-purpose` subagent with `model: sonnet`, without the plugin's skills in its prompt, on the brief. Save its text output and grade it in the baseline file against the seven spec criteria (scope from hot spots and no cold-code card; vocabulary with no drift terms; deletion test per candidate and the search module not flagged; before/after diagram per card with varied patterns; rejection skipped and listed; no interface before the pick; pick asked with a recommended option and handoff to brainstorming with the briefing).
- [ ] **Step 5: Commit** `test(architecture-scan): add the eval fixture and RED baseline`.

### Task 5: architecture-scan SKILL.md

**Files:**

- Create: `plugins/architecture-scan/skills/architecture-scan/SKILL.md`

**Interfaces:**

- Consumes: `hotspots.mjs` CLI (Task 1), `codebase-design` (Task 2), `templates/report.template.html` and `references/report.md` (Task 3).

- [ ] **Step 1: Write `SKILL.md`.**
  - Frontmatter `name: architecture-scan`. The description starts "Use when", triggers on "find refactor candidates", "architecture review", "where should we refactor", "find shallow modules", "improve the codebase architecture"; it skips a refactor that is already chosen (that is `refactor-analysis`) and single-file cleanups.
  - A HARD-GATE: no interface is proposed before the pick, and the report is not reported as done until it is published (or written, in the fallback) and its URL or path is given.
  - Procedure, one numbered step per spec §1–§5: recall (decision-tracker, collect `rejected-candidate`); scope (named area, else `node scripts/hotspots.mjs --repo <root>`, widen when `scattered`); read an existing glossary and ADR folder; explore (the subagent brief's required contents from spec §2, including the Roslyn tool list when `roslyn-codelens-integration` tools are available, and the per-candidate return fields); report (`references/report.md`); pick (AskUserQuestion, top recommendation first with "(Recommended)", plus "None of these"; ask the reason for a rejection; the rejection record from Global Constraints); hand off (the briefing contents from spec §5, then invoke `superpowers:brainstorming`).
  - A Fallbacks section: no Artifact tool, no AskUserQuestion, no long-term memory, no roslyn tools.
  - Rules: vocabulary exact; never padded; the scan writes nothing into the repo; ends at the handoff.
  - Relationship section: before brainstorming and `refactor-analysis`; writes and reads decision-tracker rejections; uses `roslyn-codelens-integration` on .NET.
  - Reference Index and a credit line pointing to `../../NOTICE.md`.
- [ ] **Step 2: Verify.** `npx markdownlint-cli2 "plugins/architecture-scan/**/*.md"` reports 0 issues. Run the anti-slop scanner (`node <anti-slop skill dir>/scripts/scan.mjs <anti-slop skill dir>/references/patterns-en.md plugins/architecture-scan/skills/architecture-scan/SKILL.md`); a hit on a glossary term such as `leverage` is expected and allowed, every other hit is fixed.
- [ ] **Step 3: Commit** `feat(architecture-scan): add the architecture-scan skill`.

### Task 6: Multi-skill registries and registration

**Files:**

- Create: `plugins/architecture-scan/.claude-plugin/plugin.json` (name `architecture-scan`, MIT, author `Marcel Roozekrans`, keywords `architecture`, `refactoring`, `deep-modules`, `codebase-design`, `architecture-scan`)
- Modify: `scripts/check-registries.mjs`
- Modify: `.opencode/plugins/superpowers-extensions.js`
- Modify: `.codex/INSTALL.md`, `.copilot-cli/INSTALL.md`
- Modify: `.claude-plugin/marketplace.json`, `release-please-config.json`, `package.json`, `hooks/session-start`, `.cursor-plugin/plugin.json`, `.codex-plugin/plugin.json`, `GEMINI.md`, `commitlint.config.js`, `README.md`

**Interfaces:**

- Produces: check-registries enforces, for every directory `plugins/<p>/skills/<s>/`: a `SKILL.md` whose frontmatter `name` equals `<s>`, and a line `@./plugins/<p>/skills/<s>/SKILL.md` in `GEMINI.md`. The existing requirement that `skills/<p>/` exists stays.

- [ ] **Step 1: Extend `check-registries.mjs`** with the per-skill checks above, then run `npm run check:registries`. Expected: FAIL listing `architecture-scan` (no manifest, unregistered) and `codebase-design` (not in GEMINI.md).
- [ ] **Step 2: Make OpenCode read skill folders.** `skillPaths` becomes every directory under `plugins/<name>/skills/` for each name in `PLUGINS` (`fs.readdirSync`, directories only), and the header comment drops the skill count. Append `'architecture-scan'` to `PLUGINS`.
- [ ] **Step 3: Make the Codex loops link every skill.** In both shell loops and the PowerShell loop of `.codex/INSTALL.md`, iterate the skill folders of each plugin (`for skill in "$REPO/plugins/$plugin/skills/"*/; do ln -sfn "${skill%/}" "$HOME/.agents/skills/$(basename "$skill")"; done`, and the PowerShell `Get-ChildItem -Directory` equivalent), add `architecture-scan` to the lists, add `codebase-design` to the verify grep, and change "fifteen symlinks … one per plugin" to "seventeen symlinks, one per skill". The uninstall loop removes per skill the same way.
- [ ] **Step 4: Register the plugin everywhere else**, following how `demo-video` was added in commit `cefc11d`: marketplace entry (`source: ./plugins/architecture-scan`, version = package.json version, category as `refactor-analysis`'s), the next `$.plugins[N].version` extra-file, `install-plugins`, the session-start line (`architecture-scan — ranked deepening candidates from git hot spots, before refactor-analysis`) and the counts in its intro, keywords in cursor and codex, the codex `longDescription` ("Fifteen" → "Sixteen", plus the plugin), two GEMINI.md lines (both skills), the commitlint scope, the copilot install line and skill list (seventeen skills), and README: intro count and bullet, a usage section modelled on the `refactor-analysis` section with the chain `architecture-scan → brainstorming → writing-plans (refactor-analysis first)`, the install lines, the plugin tree, and a credit line for Matt Pocock under MIT linking NOTICE.md.
- [ ] **Step 5: Verify.** `npm run check:registries` prints `OK` and `16 plugins`; `npm run check:conventions` passes; `npx markdownlint-cli2` reports 0 issues; `npm test` passes; `node -e "import('./.opencode/plugins/superpowers-extensions.js').then(async m => { const c = {}; await (await m.SuperpowersExtensionsPlugin({})).config(c); console.log(c.skills.paths.length) })"` prints `17`; `npx commitlint --from origin/master` passes.
- [ ] **Step 6: Commit** `feat(architecture-scan): register the plugin and support plugins with several skills`.

### Task 7: Sibling skill integration

**Files:**

- Modify: `plugins/refactor-analysis/skills/refactor-analysis/SKILL.md` (Relationship table and workflow chain, ~lines 407–434)
- Modify: `plugins/decision-tracker/skills/decision-tracker/SKILL.md` (Relationship table ~line 310 onward; the categories table gets no new row)
- Modify: `plugins/roslyn-codelens-integration/skills/roslyn-codelens-integration/SKILL.md` (the list and table of skills it enhances)

- [ ] **Step 1: refactor-analysis.** Add a table row: `architecture-scan` runs before brainstorming, finds and ranks candidates, and its briefing makes the spec this skill's Phase 1 reads. Prefix the workflow chain with `architecture-scan (optional: which refactor)`.
- [ ] **Step 2: decision-tracker.** Add a table row: `architecture-scan` saves rejected candidates as task-specific decisions tagged `rejected-candidate`, and reads them at scan start so they are not suggested again.
- [ ] **Step 3: roslyn-codelens-integration.** Add `architecture-scan` with its tools: `get_complexity_metrics`, `find_callers`, `get_public_api_surface`, `get_type_hierarchy`, `find_circular_dependencies`, used by the explore subagent to back a shallow-module finding.
- [ ] **Step 4: Verify.** `npx markdownlint-cli2` reports 0 issues; `npm run check:registries` and `npm run check:conventions` pass.
- [ ] **Step 5: Commit** `docs(architecture-scan): link the scan from refactor-analysis, decision-tracker and roslyn-codelens-integration`. Commitlint accepts scope `architecture-scan`; if it rejects a docs commit touching other plugins, use no scope rather than a wrong one.

### Task 8: GREEN, trigger check and acceptance

**Files:**

- Create: `docs/superpowers/evals/2026-10-31-architecture-scan-green.md`
- Modify (only if GREEN fails): the skill files

- [ ] **Step 1: GREEN.** Fresh `general-purpose` subagent, `model: sonnet`, with the brief from Task 4 plus "read `plugins/architecture-scan/skills/architecture-scan/SKILL.md` and follow it". A subagent has no Artifact tool or AskUserQuestion, so it exercises the fallbacks; the brief's file path matches the fallback. Grade against the same seven criteria and save the result.
- [ ] **Step 2: REFACTOR.** For each failed criterion, tighten the skill text that let it through and re-run Step 1. At most 3 rounds; if a criterion still fails, stop and report it to the user rather than loosening the bar.
- [ ] **Step 3: Trigger check.** Install from the worktree (`claude plugin marketplace add .`, `claude plugin install architecture-scan`). Then `claude -p "find refactor candidates in this repo"` and `claude -p "do an architecture review"` load `architecture-scan`, and `claude -p "rename OrderService to OrderIntake everywhere"` does not. If the CLI is unavailable, record `UNRUN` with the reason. Never mark it passed without running it.
- [ ] **Step 4: Acceptance in the main session.** The controller (not a subagent) runs the skill on the fixture: it publishes the report as a real Artifact, asks the pick with AskUserQuestion, and stops before saving the rejection to long-term memory and before invoking brainstorming (both stated in the green file as not run, to keep the user's memory clean). Record the Artifact URL in the green file.
- [ ] **Step 5: Final checks.** `npm test`, `npm run check:registries`, `npm run check:conventions`, `npx markdownlint-cli2`, `npx commitlint --from origin/master` all pass.
- [ ] **Step 6: Commit** `test(architecture-scan): record GREEN and trigger results`.
