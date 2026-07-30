---
name: logo-design
description: Use when a project needs a logo or brand mark, or when an existing mark needs auditing. Triggers on "design a logo", "we need a brand mark", "review our logo", "audit our logo". Generates geometric, monogram, wordmark, and abstract marks as SVG, through to a favicon; refuses pictorial, mascot, and illustrative-emblem marks. Reads docs/design/MASTER.md for palette and typography when present. Skip for UI icon sets, illustrations, and broader brand collateral (social cards, slide templates, email signatures).
---

# Logo Design Skill

Two sub-skills in one file: `logo-concept` draws a new mark, `logo-review` audits an existing one. This file is the router, the refusal gate, and the protocol both sub-skills inherit.

The substance lives in the six files listed under [Reference Index](#reference-index). **Cite them; never restate them.** A threshold copied into this file is a second copy that goes stale, and the copy is always the one somebody reads.

## When to Use

Invoke `logo-design` when:

- A project has no brand mark and needs one — "design a logo", "we need a brand mark", "draw us an identity"
- An existing mark needs auditing — "review our logo", "audit our mark", "does our logo survive at favicon size"
- `docs/design/MASTER.md` exists and the product now needs a mark that inherits its palette and typography

Do NOT invoke when:

- The request is for a **UI icon set** — icons are component work; that is `ui-design-system` and `ui-workflow` territory
- The request is for an **illustration**, a hero graphic, or a spot drawing
- The request is for **broader brand collateral** — social cards, slide templates, email signatures. Out of scope by design, not by oversight.
- The mark wanted is **pictorial, a mascot, or an illustrative emblem** → [The Refusal Gate](#the-refusal-gate) applies. Read it before answering.

## Announce Line

> "Starting logo-design. I'll check for an existing mark first, then route to `logo-concept` to draw one or `logo-review` to audit what is already there."

Each sub-skill carries its own announce line in its own section.

## Prerequisites

- **Playwright MCP — optional.** Every render-dependent check in this skill goes through it. Without it, both sub-skills still run and every such check is recorded **unrun**, never passed. See [Shared Protocol](#shared-protocol) item 3.
- Everything else — the drawing, the arithmetic, and the source-level anti-slop signatures — needs nothing beyond `Read`, `Write` and `Glob`.

## Mode Detection

Three modes, in priority order, mirroring `ui-design-system`'s convention:

| Trigger | Mode |
|---|---|
| A mark is found on disk, supplied inline, or named by path — whatever the phrasing | **Review** — run `logo-review` |
| `logo-design: <one-liner>` and no mark on disk | **Quick** — run `logo-concept` from the one-liner, skipping the questions it answers |
| `logo-design` with no description and no mark on disk | **Guided** — run `logo-concept` and ask its question set |

Quick mode skips *questions*, not *records*: every obligation in [Shared Protocol](#shared-protocol) still binds, including capturing the brief. `logo-concept` owns which questions survive quick mode and which are asked anyway.

## Sub-Skill Router

| The user says | Route to |
|---|---|
| "design a logo", "we need a brand mark", "draw a mark for this product" | `logo-concept` |
| "review our logo", "audit our mark", "is our logo any good", "will this work as a favicon" | `logo-review` |
| anything, where the existing-mark guard below finds a mark | `logo-review` |
| the request names a pictorial, mascot, or illustrative-emblem mark | **neither** — [The Refusal Gate](#the-refusal-gate) |

### The existing-mark guard

**Before routing to `logo-concept`, scan for a mark already on disk:**

```text
assets/brand/
public/brand/
wwwroot/brand/
public/favicon.*
static/logo.*
```

A hit routes to `logo-review`. **Never generate a replacement for a mark that exists.** A replacement offered after an audit is a decision the user can weigh; one offered instead of an audit is a guess about work somebody already paid for, and it arrives with no evidence that anything was wrong.

> **Open case, not yet resolved.** "Make us a favicon" and "we need a dark version" come from projects that already have a mark, and this guard sends every one of them to an audit they did not ask for. The resolution is an open design question recorded in `docs/plans/2026-07-30-logo-design-skill-plan.md` under Task 8 and belongs to `logo-concept`'s flow. Until it is answered, route by the rule above **and say plainly what happened** — announce that a mark was found, that an audit is what this skill can offer against it today, and let the user redirect.

## The Refusal Gate

<HARD-GATE>
This gate fires on the **request**, before anything is drawn. It is not a quality bar applied to output — by the time there is output it has already failed.

**Three kinds of mark are refused:**

| Refused | What it is |
|---|---|
| **Pictorial** | The mark is a recognisable object or living thing drawn as itself — a fox, a mountain, a coffee cup, a rocket, a house. |
| **Mascot or character** | Anything with a face, a posture, a gesture, or a name. |
| **Illustrative emblem** | A badge, crest, or roundel whose interior is a depicted scene rather than a construction. |

**The test, so this is not a taste call.** Can the mark be built by one of the four recipes in [references/mark-types.md](references/mark-types.md) — a chain of derived primitives, one or two drawn letterforms, set type plus exactly one detail, or one rule applied three or four times? If reaching the requested form needs freehand curve sampling instead, it is refused.

**Why, and it is not modesty.** This skill draws by arithmetic: every coordinate in [references/construction.md](references/construction.md) is derived from one already placed, and [references/reproduction.md](references/reproduction.md) treats an outline that reuses none of its own numbers as a *tracing signature* and fails it. A convincing animal is exactly that outline — many nodes, no shared radius, nothing derived. The skill would be measuring its own output as slop and it would be right. Hand-authored SVG does not draw these convincingly, and no amount of care inside this skill changes what it is doing.

**Stop before generating. Offer these three, and nothing else:**

1. **A brief-only deliverable** — the Concept & rationale section of [templates/logo.template.md](templates/logo.template.md) written out in full, with no SVG, so that whoever draws it starts from a real brief instead of a sentence.
2. **A different mark type that serves the same goal** — a monogram, a geometric mark, a wordmark, or an abstract mark, chosen against `mark-types.md` § Choosing the type. Say which goal it serves and which it does not.
3. **Commission a designer or illustrator.** This is a legitimate answer and is often the right one. Say so without hedging.

**What is not on offer:**

- **Do not generate a degraded version and caveat it.** A caveat does not repair a mark; it ships one and disclaims it. The user gets a file, the file gets used, and the disclaimer stays in a document nobody opens.
- **Do not draw "just the outline" or "a simplified version" of the refused form.** A simplified fox is a fox drawn worse. The refusal is of the subject, not of the effort level.
- **Do not draw it "as a placeholder", "as a rough", "to show the idea", or "temporarily".** Every shipped logo in history was temporary once.

**Rationalizations, answered in advance:**

| "But…" | Answer |
|---|---|
| "It's a simple animal, just a silhouette" | A silhouette is the hardest case, not the easiest — it has no interior detail to carry the recognition, so the outline has to do all of it. |
| "I'll fix it later / it's a placeholder" | Refused. See above. |
| "Just try it and we'll see" | Trying it is generating it. The gate is before generation for this reason. |
| "You're being too strict — other tools do this" | Other tools are not bound by `construction.md`. This one is, and the mark it would emit fails its own reproduction and anti-slop layers. |
| "Add a caveat and ship it" | A caveat is not a mitigation. It is a record of a decision that should not have been taken. |

This gate is not negotiable by the user and not waivable by the agent. If the offer of the three alternatives is declined, the skill ends there.
</HARD-GATE>

## Shared Protocol

Both sub-skills inherit every item below. They are here rather than in either flow so that neither can be written without them.

**1. Capture the brief, in the user's own words, before drawing.** `logo-concept` records it verbatim into `LOGO.md`'s **Concept & rationale** table — the *brief, in one line* row and the *keywords present from anti-slop.md pattern 6's list* row — at the **start** of the flow, not the end. Nine of `anti-slop.md`'s ten patterns are decidable from the file. Pattern 6, the reflexive leaf, is the exception: its test is an eight-keyword list checked against **what was asked for**, and no file can supply that. A mark whose brief was never written down is a mark `logo-review` cannot grade pattern 6 on, and reconstructing the brief from the finished mark reconstructs the evidence.

**2. Cite the rule; record the value.** `LOGO.md` carries this mark's numbers and names the reference file and section each came from. It never carries a copy of the rule. Same discipline in this file.

**3. Unrun is never passed.** Where Playwright MCP is absent, write the contact sheet anyway — it is documentation — then stop at the screenshot. Record every render-dependent check as `UNRUN — <what would decide it>`, per `logo.template.md` § Recording conventions. Take the list of which checks those are from `reproduction.md` § The binary checklist and `mark-types.md`'s wordmark recipe, which marks its own fit as unmeasured until a render exists. **Do not fail, do not skip silently, and do not imply a critique happened.** This is the plugin's central honesty guarantee: `grep UNRUN` over a finished `LOGO.md` must list everything the record admits it does not know.

**4. The harness measures; the sub-skill grades.** `contact-sheet.template.html` prints each number beside the threshold it is held against and returns no verdict — it says so itself. `reproduction.md` is likewise the criteria list, not the grading. The verdict is this file's, delivered by whichever sub-skill is running. Never quote a harness readout as a pass. The contact-sheet pass itself belongs to **`logo-concept`**: every render-dependent check in `reproduction.md`, and the wordmark fit in `mark-types.md`, routes to it by name.

**5. The vision pass sees; it does not search.** Where the sheet has been screenshotted and read back, one of the things to look for is a resemblance to a mark the model happens to recognise. Three things are true of that pass, and all three go into `LOGO.md`:

- **It measures nothing.** No corpus is consulted and no register is queried. A resemblance the model does not recognise is not a resemblance that is absent. `anti-slop.md`'s pattern 8 states the same boundary from its side and leaves the verdict here.
- **It is not a trademark search** and must never be described, softened, or summarised as one. `logo.template.md` § Production handoff carries the clearance paragraph as fixed text; it ships unedited.
- **Where it has not run, it is recorded unrun** — never as "no collision found". An absent pass has no result.

**6. `MASTER.md` when present, `currentColor` alone when not — never an invented palette.** Read `docs/design/MASTER.md` if it exists and bind values per `construction.md` § Colour binding. If it is absent, say that running `ui-design-system` first produces a better result, ship in `currentColor`, and record the absence in `LOGO.md`. **Never block on it.**

**7. Commit through `project-orchestration`.** Both sub-skills commit by supplying the triple — `type`, `scope`, `subject` — to `project-orchestration`'s **Commit & Release Protocol**, which loads the host project's `docs/planning/CONVENTIONS.md`, runs the branch guard, and renders the message. **Render nothing locally.** Do not write a commit message literal, a message format, or a tag scheme anywhere in this file or in either flow: the host project's configuration decides the format, and a literal here is wrong for every project that does not share ours. Each sub-skill states the triple it supplies, in its own section.

## logo-concept

> **PLACEHOLDER — NOT A FLOW. Do not run this section; there is nothing here to run.**
>
> The seven-step generation flow is written by **Task 8** of `docs/plans/2026-07-30-logo-design-skill-plan.md`, together with its announce line, its question set, its structural self-verification, and its commit triple. Two design questions are open and recorded in that plan — the entry path for projects that already have a mark, and the contact-sheet pass for the two non-square lockups. **Neither is answered here, and neither may be inferred from this file.**
>
> What is already fixed and binds Task 8 when it is written: [The Refusal Gate](#the-refusal-gate), the existing-mark guard, and every item of the [Shared Protocol](#shared-protocol) — in particular item 1 (capture the brief before drawing), item 3 (unrun is never passed), and item 4 (the contact-sheet pass is this sub-skill's).

## logo-review

> **PLACEHOLDER — NOT A FLOW. Do not run this section; there is nothing here to run.**
>
> The three-layer audit, its verdict logic, its report format, and its commit triple are written by **Task 9** of `docs/plans/2026-07-30-logo-design-skill-plan.md`.
>
> What is already fixed: `reproduction.md` is the criteria list and **`logo-review` supplies the grading** — the file states thresholds and says explicitly that grading is this sub-skill's job. `anti-slop.md` is graded binary, all ten patterns, with the bounded carve-out its own *Two of these are shapes, not mistakes* section defines. The [Shared Protocol](#shared-protocol) binds here too: a render-dependent criterion with no render is recorded unrun, not failed and not passed.

## Reference Index

Six files hold the substance. Load the one you need; do not load all six by reflex, and do not paraphrase any of them into a flow.

| File | What it holds | Load it when |
|---|---|---|
| [references/construction.md](references/construction.md) | The 16-unit grid on a 256 artboard, permitted values, the nine numbered optical corrections and their order, stroke and counter discipline, curve authoring and arc flags, forbidden constructs, `currentColor` binding, and a self-check | Before writing a single path, and again before any candidate reaches the contact sheet. Every coordinate question is answered here. |
| [references/mark-types.md](references/mark-types.md) | The four shippable types — geometric, monogram, wordmark, abstract — with a recipe, a worked fragment, and the characteristic failure of each | When choosing the type, and while drawing to its recipe |
| [references/reproduction.md](references/reproduction.md) | The binary layer: minimum sizes for screen and print, clearspace, mono collapse M1–M4, dark inversion D1–D2, the favicon redraw F1–F3, path complexity, and the binary checklist | When computing any threshold, and as `logo-review`'s first grading layer |
| [references/anti-slop.md](references/anti-slop.md) | Ten clichés, each with a source signature, plus the bounded derivation carve-out for patterns 1 and 9 and the strict-form one for 6 and 8 | Before presenting any candidate, and as `logo-review`'s second grading layer |
| [templates/logo.template.md](templates/logo.template.md) | The `docs/design/LOGO.md` skeleton, with a slot for every value the reference files ask to be written down, and the recording conventions that keep *unrun* distinct from *not applicable* | When writing or auditing `LOGO.md` |
| [templates/contact-sheet.template.html](templates/contact-sheet.template.html) | The fixed render harness — every candidate at each size, on both grounds, in colour and mono, with a measurement readout | When rendering the sheet. Substitute placeholders; never regenerate the file, or two runs stop being comparable. |

## Relationship to Other Skills

| Skill | Relationship |
|---|---|
| `ui-design-system` | Supplies `docs/design/MASTER.md`. This skill reads it for palette and typography and never invents one; see [Shared Protocol](#shared-protocol) item 6. Suggest running it first when absent — never block on it. |
| `ui-workflow` | `ui-phase` can cite `LOGO.md` when a contract covers a header, nav, or splash. The two anti-slop lists are siblings, not duplicates: that one is about screens, this one about marks. |
| `project-orchestration` | Owns the **Commit & Release Protocol** that every commit in this skill delegates to; see [Shared Protocol](#shared-protocol) item 7. |
| `regression-test` | Shares the Playwright MCP dependency. No direct call in either direction. |
