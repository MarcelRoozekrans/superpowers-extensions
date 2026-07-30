# logo-design Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a 12th plugin, `logo-design`, that generates a brand mark — a `docs/design/LOGO.md` brief plus SVG variants — from three drawn candidates, and audits existing marks via a `logo-review` sub-skill.

**Architecture:** Pure-markdown skill plugin following the suite convention: one `SKILL.md` holding the router and both sub-skills, with `references/` for lookup material and `templates/` for output skeletons. Registration is enforced mechanically by `scripts/check-registries.mjs`, which enumerates `plugins/` from disk — creating the directory turns the guard red and names every missing registry, giving a real red/green loop.

**Tech Stack:** Markdown skills, Node 24 guard scripts (`check:registries`, `lint:md`), markdownlint-cli2, commitlint with a scope enum, release-please. Playwright MCP is an optional runtime dependency of the skill itself.

**Design doc:** [2026-07-30-logo-design-skill-design.md](2026-07-30-logo-design-skill-design.md)

---

## Correction to the design doc

The design doc says a new plugin must be added to "six other manifests." That undercounts. `scripts/check-registries.mjs` enforces **nine** registries, and two more files need hand-editing that the guard does not check:

| # | Registry | Enforced by guard |
|---|---|---|
| 1 | `plugins/logo-design/.claude-plugin/plugin.json` | yes — exists, `name` matches |
| 2 | `plugins/logo-design/skills/logo-design/SKILL.md` | yes — exists, frontmatter `name` matches |
| 3 | `.claude-plugin/marketplace.json` → `plugins[]` | yes — entry + `source` path |
| 4 | `package.json` → `install-plugins` script | yes |
| 5 | `hooks/session-start` | yes — name appears |
| 6 | `.opencode/plugins/superpowers-extensions.js` → `PLUGINS` | yes |
| 7 | `.cursor-plugin/plugin.json` → `keywords` | yes |
| 8 | `.codex-plugin/plugin.json` → `keywords` | yes |
| 9 | `commitlint.config.js` → `scope-enum` | yes |
| 10 | `release-please-config.json` → `extra-files` | yes — index-based, `$.plugins[11].version` |
| 11 | `GEMINI.md` | **no** — hand-edit, nothing checks it |
| 12 | `README.md` prose and counts | **no** — hand-edit |

Item 9 matters early: **without the commitlint scope, every `feat(logo-design):` commit in this plan is rejected by CI.** Task 1 adds it before any scoped commit is made.

---

## Task 1: Register the plugin skeleton

Creates the directory and satisfies all ten guard-enforced registries. This is the red/green task — everything after it is authoring.

**Files:**

- Create: `plugins/logo-design/.claude-plugin/plugin.json`
- Create: `plugins/logo-design/skills/logo-design/SKILL.md`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `package.json:8` (install-plugins script)
- Modify: `hooks/session-start:37` (append to skill listing)
- Modify: `.opencode/plugins/superpowers-extensions.js:26` (PLUGINS array)
- Modify: `.cursor-plugin/plugin.json` (keywords)
- Modify: `.codex-plugin/plugin.json` (keywords)
- Modify: `commitlint.config.js:7` (scope-enum)
- Modify: `release-please-config.json` (extra-files)
- Modify: `GEMINI.md`

**Step 1: Create the plugin manifest**

`plugins/logo-design/.claude-plugin/plugin.json`:

```json
{
  "name": "logo-design",
  "description": "Generates a brand mark: a docs/design/LOGO.md brief plus SVG variants, drawn from three candidates and self-critiqued with vision. Scoped to geometric, monogram, wordmark, and abstract marks. Also audits existing logos via logo-review.",
  "author": {
    "name": "Marcel Roozekrans"
  }
}
```

**Step 2: Create the SKILL.md stub**

Frontmatter only for now — Task 4 writes the body. The guard checks the frontmatter `name` matches the directory.

```markdown
---
name: logo-design
description: Use when a project needs a logo or brand mark, or when an existing mark needs auditing. Triggers on "design a logo", "we need a brand mark", "make a favicon", "review our logo". Generates geometric, monogram, wordmark, and abstract marks as SVG; refuses pictorial and mascot marks. Reads docs/design/MASTER.md for palette and typography when present.
---

# Logo Design Skill

Body written in Task 4.
```

**Step 3: Run the guard to see it fail**

Run: `npm run check:registries`

Expected: **FAIL**, exit 1, listing `logo-design` as missing from marketplace.json, package.json, hooks/session-start, the OpenCode PLUGINS array, both keyword lists, commitlint scope-enum, and release-please extra-files.

Read the output. It is the checklist for Steps 4–10 — if a registry appears there that this plan does not mention, fix it and note the discrepancy.

**Step 4: Add the marketplace entry**

Append to `.claude-plugin/marketplace.json` → `plugins[]`, after the `compress-memory` entry. Version must equal `package.json` version (`1.19.1` at time of writing — read it, do not copy this literal if it has moved):

```json
{
  "name": "logo-design",
  "description": "Generates a brand mark from three drawn SVG candidates: a docs/design/LOGO.md brief plus full, stacked, mark-only, wordmark, mono, and favicon variants. Renders a contact sheet and self-critiques with vision before presenting. Scoped to geometric, monogram, wordmark, and abstract marks; refuses pictorial and mascot work. Includes logo-review for auditing existing marks.",
  "version": "1.19.1",
  "author": {
    "name": "Marcel Roozekrans"
  },
  "source": "./plugins/logo-design",
  "category": "workflow"
}
```

**Step 5: Add to the install script**

`package.json`, end of the `install-plugins` value:

```text
 && claude plugin install logo-design
```

**Step 6: Add to the session-start listing**

`hooks/session-start`, after the `compress-memory` line, matching the existing column alignment:

```text
- logo-design           — brand mark as SVG, from brief to favicon
```

**Step 7: Add to the OpenCode PLUGINS array**

`.opencode/plugins/superpowers-extensions.js`, after `'compress-memory'`:

```js
  'compress-memory',
  'logo-design'
```

Also update the two prose mentions of "eleven skills" in that file's comments (module docstring, and the inline comment in the `config` hook) to "twelve".

**Step 8: Add the keyword to both harness manifests**

Append `"logo-design"` to the `keywords` array in **both** `.cursor-plugin/plugin.json` and `.codex-plugin/plugin.json`.

**Step 9: Add the commitlint scope**

`commitlint.config.js`, into the `scope-enum` array after `'compress-memory'`:

```js
'compress-memory', 'logo-design', 'manifests',
```

**Step 10: Add the release-please extra-files entry**

`release-please-config.json`. The existing entries run `$.plugins[0]` through `$.plugins[10]`; the new marketplace entry is index **11**. Append after the `$.plugins[10].version` block and before the `.cursor-plugin` block:

```json
{
  "type": "json",
  "path": ".claude-plugin/marketplace.json",
  "jsonpath": "$.plugins[11].version"
},
```

This is index-based and the guard checks it precisely because appending a plugin otherwise leaves it silently unbumped forever.

**Step 11: Add the Gemini import**

`GEMINI.md`, appended as the last line:

```text
@./plugins/logo-design/skills/logo-design/SKILL.md
```

**Step 12: Run the guard to verify it passes**

Run: `npm run check:registries`

Expected: **PASS**, exit 0, reporting `12 plugins registered across 9 registries, all at v1.19.1`.

If the plugin count still reads 11, the directory was not created where the guard looks.

**Step 13: Verify markdown still lints**

Run: `npm run lint:md`

Expected: PASS. `docs/plans` is ignored, but the new `SKILL.md` is linted.

**Step 14: Commit**

```bash
git add plugins/logo-design .claude-plugin/marketplace.json package.json \
  hooks/session-start .opencode/plugins/superpowers-extensions.js \
  .cursor-plugin/plugin.json .codex-plugin/plugin.json \
  commitlint.config.js release-please-config.json GEMINI.md
git commit -m "feat(logo-design): register the plugin across all twelve registries"
```

---

## Task 2: `references/mark-types.md`

The four shippable mark types, each with a construction recipe concrete enough to draw from.

**Files:**

- Create: `plugins/logo-design/skills/logo-design/references/mark-types.md`

**Step 1: Write the file**

One section per type. Each section carries: what it is, when it is the right choice, the construction recipe, a worked SVG fragment, and the specific way that type fails.

| Type | Recipe core | Characteristic failure |
|---|---|---|
| Geometric | Primitives on a declared grid; arcs from circle intersections, not freehand curves | Becomes a generic app icon — a rounded square with a shape in it |
| Monogram | One or two letterforms; the container is a design decision, not a default | Letter becomes unreadable once the container tightens |
| Wordmark | Type with deliberate tracking plus exactly one custom detail | The custom detail is applied to every letter instead of one |
| Abstract | A rule applied consistently — rotation, offset, subdivision | The rule is invisible, so it reads as an arbitrary blob |

Each SVG fragment must obey the construction rules from Task 3: fixed `viewBox`, no `filter` elements, no gradients, `currentColor` for fills.

**Task 3 is written first** — the plan numbers these 2 then 3, but the dependency runs the other way and the execution order was swapped. Read the finished `construction.md` before writing a single fragment here; it is the contract these examples demonstrate. An example that violates it destroys the authority of both files.

### Three findings from Task 3's review that land directly on this file

**1. The wordmark recipe must not promise outline conversion.** The design doc lists type-to-outlines as a non-goal — there is no font engine. A wordmark master ships with a `text` element referencing a declared webfont, and the conversion is recorded in `LOGO.md`'s Production handoff as a step that was *not* performed. Task 3's file said "convert to outlines before shipping" and had to be corrected; do not reintroduce it here.

Consequence for the recipe: "type with deliberate tracking plus exactly one custom detail" is only literally achievable when the glyphs are placed individually. A single `text` run inherits the font's sidebearings, and `letter-spacing` is global tracking that cannot express a per-pair correction. State which of the two the recipe assumes.

**2. Any knockout needs `fill-rule="evenodd"`, stated explicitly.** SVG's initial fill-rule is `nonzero`, under which two same-wound subpaths fill solid — a ring silently becomes a disc at every size with no error. This is a predictable agent failure and the geometric and abstract recipes both hit it.

**3. Prefer `circle`, `rect`, and `A` arcs over hand-authored cubics.** Where a cubic is unavoidable, control handles sit at `0.5523 × r` from the endpoints along the tangents. Four cubics without the kappa constant produce a visibly lumpy oval that passes every mechanical check in `construction.md`.

**Step 2: Verify it lints**

Run: `npm run lint:md`
Expected: PASS

**Step 3: Commit**

```bash
git add plugins/logo-design/skills/logo-design/references/mark-types.md
git commit -m "feat(logo-design): document the four shippable mark types"
```

---

## Task 3: `references/construction.md`

The rules that make agent-authored SVG look drawn rather than emitted. This is the file the design doc names as the one to revisit if the dogfood mark is bad.

**Files:**

- Create: `plugins/logo-design/skills/logo-design/references/construction.md`

**Step 1: Write the file**

Cover, in order:

1. **The grid.** Declare a unit up front (`viewBox="0 0 256 256"`, 16px unit). Every coordinate is a multiple, or is flagged inline as an optical exception with a stated reason.
2. **Optical correction — the section that matters most.** Mathematically centred is not visually centred. Enumerate the specific corrections: a circle must overshoot a square's cap height by ~2%; a triangle's optical centre sits above its geometric centre; horizontal strokes read heavier than vertical ones at equal width and must be thinned ~4%; a mark inside a container needs more space below than above.
3. **Stroke and counter discipline.** One stroke weight, or a stated ratio between exactly two. Counters (enclosed negative space) must stay open enough to survive 16px — this is the single most common reason a mark dies as a favicon.
4. **Forbidden constructs**, with the reason each is forbidden: `<filter>` (does not rasterise predictably, dies in one-colour print), gradients by default (no mono collapse), `<text>` in final assets (renders differently per machine — see the outline-conversion handoff), transforms baked into path data (unauditable), sub-pixel coordinates (blurs at small sizes).
5. **Colour binding.** Use `currentColor` so the mono variant is free. Colour values come from `docs/design/MASTER.md` when it exists.

**Step 2: Verify it lints**

Run: `npm run lint:md`
Expected: PASS

**Step 3: Commit**

```bash
git add plugins/logo-design/skills/logo-design/references/construction.md
git commit -m "feat(logo-design): add SVG construction and optical correction rules"
```

---

## Task 4: `references/reproduction.md` and `references/anti-slop.md`

**Files:**

- Create: `plugins/logo-design/skills/logo-design/references/reproduction.md`
- Create: `plugins/logo-design/skills/logo-design/references/anti-slop.md`

**Step 1: Write `reproduction.md`**

The survival matrix, stated as thresholds the review layer can test rather than advice:

- **Minimum sizes** per variant — full lockup, mark alone, favicon — in px for screen and mm for print.
- **Clearspace**, defined as a ratio of a feature of the mark itself, never an absolute px value, so it scales.
- **Mono collapse.** Every variant must survive being flattened to one colour. The test: fill everything with a single value and check the mark still has structure.
- **Dark inversion.** Not just "swap black for white" — the optical weight of a light mark on dark reads heavier, and thin strokes may need compensation.
- **Favicon rules.** Redraw, do not scale. Drop detail deliberately. State what was removed and why.
- **Path complexity ceiling.** A logo with hundreds of nodes is a logo that was traced, not constructed.

**Step 2: Write `anti-slop.md`**

Ten patterns, each with the tell and the reason it signals machine authorship. Mirrors the shape of `ui-design-system`'s anti-slop section so the two read as siblings:

1. Circle with a gap / orbiting swoosh — the default abstract mark
2. Gradient mesh blob, especially purple-to-pink
3. Overlapping translucent circles — the Venn tech startup
4. Isometric cube or impossible geometry
5. Connected-nodes network graph
6. A leaf, reflexively, for anything claiming sustainability
7. Letterform with a chunk arbitrarily sliced out
8. Infinity loop or Möbius strip
9. Hexagon container with no motivating reason
10. A mark that only works in the one colour it was drawn in

**Step 3: Verify both lint**

Run: `npm run lint:md`
Expected: PASS

**Step 4: Commit**

```bash
git add plugins/logo-design/skills/logo-design/references/reproduction.md \
        plugins/logo-design/skills/logo-design/references/anti-slop.md
git commit -m "feat(logo-design): add reproduction thresholds and the anti-slop list"
```

---

## Task 5: `templates/contact-sheet.template.html`

The render harness. Fixed by design so screenshots are comparable across iterations and projects.

**Files:**

- Create: `plugins/logo-design/skills/logo-design/templates/contact-sheet.template.html`

**Step 1: Write the template**

Self-contained, no external requests — it is screenshotted from a `file://` URL and must render offline. Placeholders `{{CANDIDATE_A}}`, `{{CANDIDATE_B}}`, `{{CANDIDATE_C}}` are replaced with inline `<svg>` markup; `{{PRODUCT_NAME}}` labels the sheet.

Structure:

```html
<!doctype html>
<meta charset="utf-8">
<title>Logo concepts — {{PRODUCT_NAME}}</title>
<style>
  :root { --paper:#fff; --ink:#111; }
  body { margin:0; font:14px/1.4 ui-sans-serif,system-ui,sans-serif; }
  .row { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
  .cell { padding:32px; display:flex; flex-direction:column; gap:20px; align-items:center; }
  .light { background:var(--paper); color:var(--ink); }
  .dark  { background:var(--ink); color:var(--paper); }
  .mono  { filter:grayscale(1) contrast(1000%); }
  .sizes { display:flex; align-items:flex-end; gap:16px; }
  .s16 svg,.s16 img { width:16px;  height:16px; }
  .s32 svg { width:32px;  height:32px; }
  .s48 svg { width:48px;  height:48px; }
  .s256 svg{ width:256px; height:256px; }
  h2 { font-size:11px; letter-spacing:.08em; text-transform:uppercase; opacity:.6; margin:0; }
</style>

<!-- Row 1: light, full colour, four sizes -->
<div class="row">
  <div class="cell light"><h2>A — light</h2>
    <div class="sizes">
      <span class="s16">{{CANDIDATE_A}}</span>
      <span class="s32">{{CANDIDATE_A}}</span>
      <span class="s48">{{CANDIDATE_A}}</span>
    </div>
    <span class="s256">{{CANDIDATE_A}}</span>
  </div>
  <!-- B and C identical -->
</div>

<!-- Row 2: dark -->
<!-- Row 3: forced mono, light -->
```

The `.mono` class uses a CSS filter purely as a *preview* of collapse. It is a viewing aid on the sheet only — never applied to a shipped asset, which uses `currentColor` instead. Note this in an HTML comment so nobody later copies the filter into an SVG.

**Step 2: Verify it renders**

Open the template in a browser with the placeholders replaced by any three test SVGs. Confirm all three rows render and nothing is clipped.

**Step 3: Commit**

```bash
git add plugins/logo-design/skills/logo-design/templates/contact-sheet.template.html
git commit -m "feat(logo-design): add the fixed contact-sheet render harness"
```

---

## Task 6: `templates/logo.template.md`

**Files:**

- Create: `plugins/logo-design/skills/logo-design/templates/logo.template.md`

**Step 1: Write the skeleton**

Exactly the structure from the design doc — Concept & rationale, Construction, Variants, Colour, Clearspace & minimum sizes, Misuse, Production handoff, Asset manifest.

The **Production handoff** section ships with its two disclaimers as fixed text, not placeholders, so they cannot be omitted by an agent filling the template in:

```markdown
## Production handoff

Two things this skill did not do:

- **Type is still live text.** The wordmark references `{{FONT_FAMILY}}` rather than
  outlined paths. Convert to outlines before production — it will otherwise render
  differently on any machine lacking the font.
- **No trademark clearance was performed.** The mark was checked against known logos
  by visual inspection only. That is not a legal search. Commission a clearance
  search before commercial use.
```

**Step 2: Verify it lints**

Run: `npm run lint:md`
Expected: PASS

**Step 3: Commit**

```bash
git add plugins/logo-design/skills/logo-design/templates/logo.template.md
git commit -m "feat(logo-design): add the LOGO.md output template"
```

---

## Task 7: `SKILL.md` — router, refusal gate, shared protocol

Replaces the Task 1 stub body.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md`

**Step 1: Write the routing and gate sections**

In order:

1. **When to Use / When Not To** — matching the shape of `ui-design-system`'s opening.
2. **Announce line.**
3. **Sub-skill router table** — trigger phrase → `logo-concept` or `logo-review`. Plus the guard: an existing logo found on disk routes to `logo-review`, never to silent replacement.
4. **The refusal gate**, marked `<HARD-GATE>` (the one XML element markdownlint permits, per `.markdownlint.yaml` MD033):

   > If the request is for a pictorial mark (a recognisable object or animal), a
   > mascot or character, or an emblem with an illustrative interior — **stop before
   > generating.** Say plainly that hand-authored SVG does not draw these
   > convincingly, and offer: a brief-only deliverable, a different mark type that
   > serves the same goal, or a recommendation to commission a designer. Do not
   > generate a degraded version and caveat it.

5. **Mode detection** — `logo-design: <one-liner>` quick mode versus guided, mirroring `ui-design-system`'s convention.
6. **Commit protocol** — pass `type` / `scope` / `subject` to `project-orchestration`'s Commit & Release Protocol; render nothing locally. State this explicitly rather than embedding a `git commit -m` literal, which is the failure the `feat/project-conventions` branch fixed.
7. **Reference index** — a table pointing at the four `references/` files, so the router stays short and the agent knows what to load when.

**Step 2: Verify lint and registry**

Run: `npm run lint:md && npm run check:registries`
Expected: both PASS. The registry check re-verifies the frontmatter `name` survived the rewrite.

**Step 3: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "feat(logo-design): add the router and the pictorial-mark refusal gate"
```

---

## Task 8: `logo-concept` sub-skill

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md`

### Open design question — resolve before writing Step 0

**Raised by the Task 1 code-quality review. Do not skip it.**

The Step 0 guard routes any project with an existing logo to `logo-review`. But "make us a favicon" and "we need a dark-mode version of our logo" are common requests from projects that already have a mark — and under the guard as designed, every one of them receives an audit report instead of the asset they asked for.

The trigger phrase `"make a favicon"` was removed from the skill description in `fix(logo-design): correct the trigger surface…` precisely because it advertised a path the flow does not serve. That removed the false promise; it did not solve the underlying gap.

Be precise about what that removal bought, because it is easy to over-read: it makes the skill *less likely to activate* on a favicon request. It does not change routing. If the skill fires anyway — via "through to a favicon" in the description, or any nearby phrasing — Step 0.3 still sends that user to `logo-review`. The narrowed trigger surface hides the gap more than it closes it.

Decide one of:

| Option | Shape | Cost |
|---|---|---|
| **A — variants-only entry path** | A third entry point: take an existing mark, skip concepts, run Step 6 (variant set) plus the Step 4 critique | New path to write and verify; the honest fix |
| **B — `logo-review` offers the handoff** | Audit runs first as designed; if it passes, offer to generate the missing variants | Cheaper; makes the audit a toll booth on a simple request |
| **C — leave the gap** | Existing-mark projects get an audit and must ask again | Free; the request the user actually made is never served |

Recommendation: **A**, scoped tightly to reusing Step 6 and Step 4 with no concept generation. It is the case the guard currently mishandles, and B makes users pay for an audit they did not ask for.

Whichever is chosen, record it in the design doc as an amendment — this changes the flow the design describes.

### Second open question — the non-square variants have no contact-sheet pass

**Raised by Task 5, which built the harness and ran it.**

Step 6 produces seven variants. Two of them — `logo-full` and `logo-stacked` — are lockups that declare their own **non-square** `viewBox`. The contact sheet assumes `0 0 256 256` throughout: the live-area bounds, the artboard-unit conversion, and the square cells all depend on it. The harness warns when the `viewBox` differs and then has nothing further to say.

So five of the seven variants can be rendered and critiqued, and two cannot. That is not a harness defect — nothing in any reference file defines what a lockup's contact-sheet pass should be.

Decide before writing step 6:

| Option | Shape |
|---|---|
| **A — a second sheet** | A lockup-specific template with its own cells and its own live-area rule, sized to the lockup's aspect |
| **B — normalise into the square** | Render the lockup letterboxed inside 256×256, accepting that its effective size is smaller than the mark-only variants at the same nominal px |
| **C — critique the components only** | Grade `logo-mark` and `logo-wordmark` on the sheet; the lockup is checked for composition and clearspace only, and that check is recorded as not size-tested |

`reproduction.md` computes lockup minimums by a different route already (mark side computed, type side measured), which is weak evidence for **C** — the file's own arithmetic treats the lockup as a composition problem rather than a rendering one. But whichever is chosen, the answer has to be written down, because step 6's self-verification currently implies all seven variants get the same treatment and they cannot.

**Step 1: Write the seven steps**

Per the design doc, as numbered procedure with explicit tool calls:

- **Step 0 — context and guard.** Read `MASTER.md` if present; scan `assets/brand/`, `public/brand/`, `wwwroot/brand/`, `public/favicon.*`, `static/logo.*`; route to `logo-review` on a hit. Never block on a missing `MASTER.md`.
- **Step 1 — five questions**, asked one at a time. Question 4 (where it must survive) is mandatory even in quick mode — infer it from the one-liner or ask it standalone, because it constrains the solution space before anything is drawn.
- **Step 2 — three directions as rationale**, written before drawing.
- **Step 3 — draw**, under `references/construction.md`.
- **Step 4 — render and self-critique.** Write the sheet from the template, screenshot via Playwright MCP, **Read the PNG back**, grade against the fixed checklist, fix, re-render. **Hard cap: two iterations.**
- **Step 5 — present and let the user pick or blend.**
- **Step 6 — variant set.** Seven files. The favicon is redrawn with its own critique pass, not scaled.
- **Step 7 — finalise**, regenerate the sheet against final assets, commit via the protocol.

**Step 2: Write the structural self-verification**

Before Step 7 completes, the skill checks its own output — verification level 1 from the design doc, run by the skill against the user's project rather than by repo CI:

- every file in the manifest exists
- each SVG parses
- `viewBox` present on each
- no `<filter>` anywhere
- mono variants use `currentColor`

A failure here is a bug in the generated assets, not a warning to pass along — fix and re-verify.

**Step 3: Write the degradation clause**

Playwright MCP absent → write the sheet, skip the critique, and state plainly that the marks are uncritiqued and the user is the only judge. Do not fail. Do not imply a critique happened.

**Step 4: Verify**

Run: `npm run lint:md`
Expected: PASS

**Step 5: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "feat(logo-design): add the logo-concept generation flow"
```

---

## Task 9: `logo-review` sub-skill

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md`

**Step 1: Write the three-layer audit**

Deliberately the same shape as `ui-workflow:ui-review` so verdicts read consistently across the suite.

| Layer | Type | Source |
|---|---|---|
| Reproduction hazards | binary pass/fail | `references/reproduction.md` |
| Anti-slop scan | binary pass/fail | `references/anti-slop.md`, all ten |
| 5-dimension critique | 1–5 each | Distinctiveness / Simplicity / Memorability / Appropriateness / Versatility |

**Step 2: Write the verdict logic**

Floor gates the critique layer, not the average — a mark scoring 5/5/5/5/1 fails on versatility alone, which is correct, because a logo that cannot reproduce is not a logo. Final verdict is the worst of the three layers. Mirror the table format `ui-workflow` uses.

**Step 3: Write the report output**

`docs/design/YYYY-MM-DD-logo-review.md`, with per-layer findings and a prioritised remediation list on anything short of PASS.

**Step 4: Verify**

Run: `npm run lint:md && npm run check:registries`
Expected: both PASS

**Step 5: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "feat(logo-design): add the logo-review three-layer audit"
```

---

## Task 10: Documentation and prose counts

The guard does not check prose. These are the places a stale count survives CI.

**Files:**

- Modify: `README.md` — several sites
- Modify: `.codex/INSTALL.md` — **added after Task 1 review**, see Step 1a
- Modify: `.copilot-cli/INSTALL.md` — **added after Task 1 review**, see Step 1a
- Modify: `.cursor-plugin/plugin.json` + `.codex-plugin/plugin.json` — `description` fields if they enumerate concerns
- ~~`.codex-plugin/plugin.json` → `interface.longDescription`~~ — **already done in Task 1**, see Step 3

**Step 1: Find every count and list**

Run:

```bash
grep -rn "eleven\|Eleven" README.md .codex .codex-plugin .cursor-plugin \
  .copilot-cli .opencode GEMINI.md hooks/
```

Expected: several hits. Each becomes "twelve" — **except one false positive**.

**`README.md:438` contains `elevenlabs`**, a design-system name in the curated-catalog table. A blanket find-and-replace corrupts it to `twelvelabs`. Match on word boundaries or review each hit by hand.

**Step 1a: The two unguarded install docs**

Task 1's implementer and its spec reviewer independently found these. Neither is read by `check-registries.mjs`, and neither was in the original Task 10 file list, so they would have shipped stale through a green CI:

| File | Sites |
|---|---|
| `.codex/INSTALL.md` | prose count (line 5), the bash symlink loop, the PowerShell array, the verify-grep alternation, the uninstall loop, and "You should see eleven symlinks" (line 59) |
| `.copilot-cli/INSTALL.md` | the install command block, and "The agent should list the eleven skills" (line 54) |

The loops and arrays enumerate plugin names, so each needs `logo-design` added — not just the count word changed.

**Step 2: Update README**

Four kinds of site, all needed:

1. The intro bullet list — add a `**logo-design**` entry
2. A new `## Logo Design Skill` section, placed after `## UI Design System Skill` — modes, the refusal boundary, outputs, prerequisites (Playwright MCP optional)
3. The install command block and the Manual Installation `xcopy` / `cp -r` pair
4. The `### Frontend Development` workflow block and the **Skill Composition at a Glance** table — logo-design slots between `ui-design-system` and `ui-workflow`
5. The Verify Installation slash-command list

**Step 3: Update the Codex long description — already done**

`.codex-plugin/plugin.json` → `interface.longDescription` was updated in Task 1 (count to "twelve", `logo-design (brand marks as SVG)` appended to the enumeration). **Expect to find this work complete.** Verify it rather than redoing it; an empty grep result here is the correct outcome, not a missed edit.

The same applies to `hooks/session-start`'s "Eleven skills cover…" sentence, also corrected in Task 1.

**Step 4: Optional cleanup — a pre-existing inconsistency**

`hooks/session-start:35` says `ui-design-system — design system from 70 vendored references`, but there are 74 and `README.md` says so. Not caused by this work; fix it here or leave it, but do not let it fail review as if it were new. If fixed, use scope `suite`, not `logo-design`.

**Step 5: Verify**

Run: `npm run lint:md && npm run check:registries`
Expected: both PASS

Then re-run the grep from Step 1. Expected: no remaining "eleven".

**Step 6: Commit**

```bash
git add README.md .codex-plugin/plugin.json .cursor-plugin/plugin.json
git commit -m "docs(readme): document logo-design and correct the plugin count to twelve"
```

---

## Task 11: Dogfood — the acceptance test

This is the task that decides whether the skill works. Everything before it is scaffolding.

**Files:**

- Create: `docs/design/LOGO.md`
- Create: `docs/design/logo-contact-sheet.html`
- Create: `assets/brand/*.svg`
- Create: `docs/plans/2026-07-30-logo-design-dogfood.md`

**Step 1: Run the skill on this repository**

`superpowers-extensions` has no logo, so this is a real subject rather than a fixture. Invoke `logo-concept` and answer honestly — do not steer toward an easy result.

Note: this repo has no `docs/design/MASTER.md`, which exercises the missing-design-system path. That is useful coverage, not a problem to work around.

**Step 2: Look at the contact sheet**

Actually open it. Read the screenshot. The failure mode this test exists to catch is a plausible `LOGO.md` next to an ugly mark, and only looking catches it.

**Step 3: Judge against the stated bar**

The bar from the design doc: **would the maintainer actually ship this mark?** If no, the flow is not the problem — `references/construction.md` is. Return to Task 3, revise the construction and optical-correction rules, and re-run. Record what was wrong; that is the most valuable output of this task.

**Step 4: Run `logo-review` on the result**

Exercises the second sub-skill against real input and cross-checks the first. A mark that `logo-concept` shipped and `logo-review` fails is an inconsistency between the two, and one of them is wrong.

**Step 5: Write the dogfood record**

`docs/plans/2026-07-30-logo-design-dogfood.md`, following the precedent of commit `6f14c86`: what was run, what came out, what failed, what changed as a result. A record saying "it worked" with no observations means the test was not really run.

**Step 6: Commit**

```bash
git add docs/design assets/brand docs/plans/2026-07-30-logo-design-dogfood.md
git commit -m "docs(logo-design): dogfood record — a real mark for this repo"
```

---

## Task 12: Branch review

**Step 1: Run the full local gate**

```bash
npm run lint:md && npm run check:registries && npm run check:conventions
```

Expected: all three PASS.

**Step 2: Verify commit scopes**

```bash
npx commitlint --from master --to HEAD --verbose
```

Expected: PASS. If `logo-design` scope is rejected, Task 1 Step 9 was missed and every commit on the branch is invalid.

**Step 3: Run pre-push-review**

Invoke the `pre-push-review` skill. Expected: PASS verdict, or a remediation list to work through.

---

## Notes for the implementer

- **Branch.** This work sits on `feat/logo-design`, branched from `feat/project-conventions` rather than `master`, because Task 7's commit protocol depends on the Commit & Release Protocol delivered there. If that branch merges first, rebase onto master before opening the PR.
- **Version literals.** `1.19.1` appears throughout this plan. Read the live value from `package.json` — release-please may have moved it.
- **Registry index.** Task 1 Step 10 hardcodes `$.plugins[11]`. That is correct only if logo-design is appended last and no plugin was added between this plan being written and executed. Count the array.
- **The guard is the spec.** Where this plan and `npm run check:registries` disagree, the guard wins — it is executable and this document is not.
