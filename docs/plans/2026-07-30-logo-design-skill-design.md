# logo-design — Design

Date: 2026-07-30
Status: Approved, ready for `writing-plans`
Origin: Brainstorm of "do we have a logo design skill?" — we did not. The nearest neighbour, `ui-design-system`, mentions logos only incidentally (placing an existing mark in a nav bar or footer, or describing a real brand's mark in a vendored reference). Nothing in the suite designs one.

---

## Goal

Add a 12th plugin, `logo-design`, that produces a brand mark for a project: a `docs/design/LOGO.md` brief plus a set of real SVG assets. It reads `docs/design/MASTER.md` for palette and typography so the mark inherits decisions the design system already made, and it critiques its own output with vision before showing anything to the user.

## Non-goals

- **Pictorial, mascot, and illustrative-emblem marks.** The skill refuses these by name and says why. Hand-written SVG does not draw a convincing fox.
- **Type conversion to outlines.** No font engine is available. Wordmarks ship referencing a declared webfont with outline conversion recorded as a production handoff step.
- **Trademark clearance.** A vision check for "does this collide with a mark I recognise" is not a legal search, and the output says so.
- **A broader `brand-identity` scope** — social cards, email signatures, slide templates. YAGNI. A `brand-*` sub-skill can be added later if the logo half proves itself.
- **Replacing an existing logo silently.** If one is found, the skill routes to `logo-review` instead.

## Decisions taken during the brainstorm

| Question | Decision | Rejected alternatives |
|---|---|---|
| Deliverable | Brief **and** generated SVG, in two stages | Spec-only (ships nothing); SVG-only (no recorded rationale, nothing to audit against) |
| Mark scope | Competence zone only — geometric, monogram, wordmark, abstract | Attempt everything (ships obviously machine-drawn marks); competence zone + pictorial brief (extra surface for a case better served by refusal) |
| Selection loop | 3 concepts drawn as SVG, user picks, winner refined | 3 described in prose, 1 drawn (user chooses blind); single direction iterated (no exploration) |
| Render + critique | HTML contact sheet, Playwright screenshot, vision self-critique | Contact sheet with no critique; raw SVG files with no comparison view |
| Packaging | New standalone plugin, two sub-skills | Sub-skill of `ui-design-system`; broader `brand-identity` plugin |

### Why a separate plugin rather than a sub-skill of `ui-design-system`

`ui-workflow` already establishes that *depending on* `MASTER.md` does not mean *living inside* `ui-design-system`. Beyond precedent, `ui-design-system`'s trigger contract is explicitly one of absence — "run only if `docs/design/MASTER.md` is missing." Logo work is on-demand and repeatable, so grafting it on would mean bolting an opposite trigger model onto an existing skill. `ui-design-system` is also the heaviest plugin in the suite (74 vendored references, a 440-line `SKILL.md`), and it currently needs no MCP server; a separate plugin keeps the Playwright dependency contained and lets someone install the logo skill without carrying the catalog.

## Architecture

### Plugin layout

```text
plugins/logo-design/
├── .claude-plugin/
│   └── plugin.json                      # name: logo-design, category: workflow
└── skills/
    └── logo-design/
        ├── SKILL.md                     # router, both sub-skills, refusal gate
        ├── references/
        │   ├── mark-types.md            # the 4 shippable types + construction recipes
        │   ├── construction.md          # grids, optical correction, stroke/counter rules
        │   ├── reproduction.md          # clearspace, min sizes, mono collapse, favicon
        │   └── anti-slop.md             # logo-specific AI tells
        └── templates/
            ├── logo.template.md         # the LOGO.md skeleton
            └── contact-sheet.template.html
```

This follows the suite's established convention: sub-skills live inside a single `SKILL.md` (`project-orchestration` packs 18 into one; `ui-workflow` packs 2), with reference and template material in companion files.

Two placement rules matter:

- **The refusal gate lives in `SKILL.md`, not in `references/mark-types.md`.** It is a behavioural gate, not lookup material. Buried in a reference file it would be skipped.
- **`contact-sheet.template.html` is a real file, not inline markup.** Its job is to be byte-identical across runs so screenshots are comparable between iterations and between projects. Generating it inline would let it drift every invocation.

### Manifest registration

12th entry in `.claude-plugin/marketplace.json` at the current suite version, category `workflow`. Also registered in the other harness manifests: `.cursor-plugin/plugin.json`, `.codex-plugin/plugin.json`, `GEMINI.md`, `.opencode/plugins/superpowers-extensions.js`, and the Copilot CLI install list. `README.md` carries the plugin count ("eleven skills") and install commands in several places — this is a find-and-fix pass, not a single edit.

## Sub-skill: `logo-concept`

### Step 0 — context and guard

1. Read `docs/design/MASTER.md` if present; inherit palette, typography, brand feel. If absent, note that running `ui-design-system` first produces a better result, then ask the two extra questions it would have covered. **Never block on it.**
2. Scan for existing brand assets (`assets/brand/`, `public/favicon.*`, `static/logo.*`, `wwwroot/brand/`).
3. **If a logo already exists, stop and route to `logo-review`.** Do not silently generate a replacement.

### Step 1 — questions

Five, not seven — `MASTER.md` already carries the colour and type decisions.

1. The exact string to be set in type. Capitalisation and spacing are design decisions, not typos.
2. What the product does, in one sentence. This is what the concept is *about*.
3. Mark type preference: geometric / monogram / wordmark / abstract / "you choose".
4. Where it has to survive: favicon, app icon, one-colour print or embroidery, dark UI, large format.
5. Must-avoid.

Question 4 does the most work — "it needs to embroider" eliminates half the solution space *before* anything is drawn, which is where a constraint belongs.

Quick mode (`logo-design: fintech, monogram, must work at 16px`) skips the questions, matching `ui-design-system`'s mode convention.

### Step 2 — three directions, stated as ideas

Each concept is written as a rationale before it is drawn, so the reasoning is not reverse-engineered from whatever shape came out.

### Step 3 — draw, under construction rules

From `references/construction.md`:

- One declared grid; every coordinate a grid multiple or an explicitly flagged optical exception.
- Fixed `viewBox`. No `<filter>`. No gradients by default.
- `currentColor` so the mono variant falls out for free.

### Step 4 — render, then self-critique with vision

1. Write the contact sheet from the template: each candidate at 16 / 32 / 48 / 256px, light and dark, full colour and forced mono.
2. Screenshot it via Playwright MCP.
3. **Read the PNG back** and grade against a fixed checklist: legible at 16px, survives mono collapse, optically balanced rather than mathematically centred, not a cliché, not a collision with a mark that already exists.
4. Fix and re-render. **Capped at two iterations** so it cannot loop.
5. Only then show the user.

The collision check carries a caveat into the output: a vision check is not a trademark search, and `LOGO.md` says so and recommends real clearance before commercial use.

### Step 5 — user picks

Or blends — "A's grid with C's counters" is a valid answer.

### Step 6 — variant set

`logo-full`, `logo-stacked`, `logo-mark`, `logo-wordmark`, `logo-mono-black`, `logo-mono-white`, `favicon.svg`.

The favicon is **redrawn, not scaled** — its own simplification step with its own critique pass, because the thing that reads at 256px is rarely the thing that reads at 16.

### Step 7 — finalise

Write `LOGO.md`, regenerate the contact sheet against final assets, commit.

## Sub-skill: `logo-review`

Takes an existing logo — the user's, or one this skill produced — renders it across the reproduction matrix, screenshots it, and audits with vision. Three-layer grading, deliberately the same shape as `ui-workflow:ui-review` so verdicts read consistently across the suite.

| Layer | Type | Checks |
|---|---|---|
| Reproduction hazards | binary | 16px legibility, mono collapse, dark inversion, clearspace, artboard hygiene, path complexity |
| Anti-slop scan | binary | circle-with-a-gap, gradient blob, overlapping translucent circles, isometric cube, connected-nodes network, reflexive leaf, arbitrarily sliced letterform, infinity loop, unmotivated hexagon container, colour-dependent mark |
| 5-dimension critique | 1–5 each | Distinctiveness / Simplicity / Memorability / Appropriateness / Versatility |

Floor is the gate on the critique layer, not the average. The final verdict is the worst of the three layers. Report written to `docs/design/YYYY-MM-DD-logo-review.md`.

## Output artifacts

### `docs/design/LOGO.md`

```markdown
# Brand Mark
**Product:** · **Mark type:** · **Generated:** · **Design system:** ../design/MASTER.md

## Concept & rationale        what the mark means, why this one won
## Construction               grid unit, geometry, flagged optical exceptions
## Variants                   file / intended use / minimum size
## Colour                     on-light, on-dark, mono, one-colour print
## Clearspace & minimum sizes
## Misuse                     the specific ways this mark breaks
## Production handoff         wordmark → outlines; clearance not performed
## Asset manifest
```

The **Production handoff** section is what keeps the skill honest: it states plainly what was not done.

### Asset placement — stack-detected

Reusing `ui-design-system`'s stack detection so assets land where the framework expects:

| Stack | Path |
|---|---|
| React / Next / Astro / Vue | `public/brand/` |
| Blazor | `wwwroot/brand/` |
| Anything else | `assets/brand/` |

The contact sheet always goes to `docs/design/logo-contact-sheet.html` — it is documentation, not a shipped asset.

## Degradation

Playwright MCP is **optional**. Without it the skill writes the contact sheet, skips the self-critique pass, and states plainly that it is shipping uncritiqued marks and the user is the only judge. It does not fail, and it does not claim to have critiqued anything. This matches the posture `decision-tracker` and `memorylens-integration` already take toward their MCP dependencies.

## Integration

| Skill | Relationship |
|---|---|
| `ui-design-system` | `LOGO.md` reads `MASTER.md` for palette and type. Suggests running it first when absent; never blocks. |
| `ui-workflow` | `ui-phase` can cite `LOGO.md` when a contract covers a header, nav, or splash. The two anti-slop scans are siblings, not duplicates — different subject matter. |
| `project-orchestration` | Commits pass `type` / `scope` / `subject` through the **Commit & Release Protocol** and let `docs/planning/CONVENTIONS.md` render the message. No hardcoded commit format — that is the bug the `feat/project-conventions` branch just fixed. |
| `regression-test` | Shares the Playwright MCP dependency. No direct call. |

## Verification

Three levels, because "the agent said it drew a logo" is not evidence.

1. **Structural** — every manifest file exists; each SVG parses; `viewBox` present; no `<filter>`; mono variants actually use `currentColor`.
2. **Render** — the contact sheet screenshots cleanly at all six size/theme combinations, nothing clipped or invisible.
3. **Dogfood** — run `logo-concept` on this repository. `superpowers-extensions` has no logo, so it is a real subject rather than a fixture, and the result is recorded the way commit `6f14c86` recorded the project-orchestration acceptance test.

Level 3 is the one that matters. A skill that produces a plausible `LOGO.md` and an ugly mark has failed, and only looking at the mark catches that.

## Open risks

- **SVG quality is the whole product.** Every other risk is secondary. If the dogfood mark is not something the maintainer would actually ship, the construction rules in `references/construction.md` are wrong and need another pass — not the flow around them.
- **Self-critique may be too generous.** An agent grading its own output tends toward "good enough". The fixed checklist and the binary reproduction gates exist to make the critique mechanical rather than impressionistic, but this needs watching during dogfood.
- **The two-iteration cap is a guess.** It may prove too tight to fix real problems or too loose to stay cheap. Revisit after dogfood.
