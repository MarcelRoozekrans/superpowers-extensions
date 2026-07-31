---
name: logo-design
description: Use when a project needs a logo or brand mark, or when an existing mark needs auditing. Triggers on "design a logo", "we need a brand mark", "review our logo", "audit our logo". Generates geometric, monogram, wordmark, and abstract marks as SVG, through to a favicon; refuses pictorial, mascot, and illustrative-emblem marks. Reads docs/design/MASTER.md for palette and typography when present. Skip for UI icon sets, illustrations, and broader brand collateral (social cards, slide templates, email signatures).
---

# Logo Design Skill

Two sub-skills in one file: `logo-concept` draws a new mark — or derives the variant set for a mark that already exists — and `logo-review` audits one. This file is the router, the refusal gate, and the protocol both sub-skills inherit.

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

> "Starting logo-design. I'll check for an existing mark first, then route to `logo-concept` — to draw a mark, or to derive variants of one you already have — or to `logo-review` to audit what is already there."

Each sub-skill carries its own announce line in its own section.

## Prerequisites

- **Playwright MCP — optional.** Every render-dependent check in this skill goes through it. Without it, both sub-skills still run and every such check is recorded **unrun**, never passed. See [Shared Protocol](#shared-protocol) item 3.
- Everything else — the drawing, the arithmetic, and the source-level anti-slop signatures — needs nothing beyond `Read`, `Write` and `Glob`.

## Mode Detection

Three modes, in priority order, mirroring `ui-design-system`'s convention:

| Trigger | Mode |
|---|---|
| A mark is found on disk, supplied inline, or named by path — whatever the phrasing | **Review** — run `logo-review`, unless the request is for *variants* of that mark; see [The existing-mark guard](#the-existing-mark-guard) |
| `logo-design: <one-liner>` and no mark on disk | **Quick** — run `logo-concept` from the one-liner, skipping the questions it answers |
| `logo-design` with no description and no mark on disk | **Guided** — run `logo-concept` and ask its question set |

Quick mode skips *questions*, not *records*: every obligation in [Shared Protocol](#shared-protocol) still binds, including capturing the brief. `logo-concept` owns which questions survive quick mode and which are asked anyway.

## Sub-Skill Router

| The user says | Route to |
|---|---|
| "design a logo", "we need a brand mark", "draw a mark for this product" | `logo-concept` |
| "review our logo", "audit our mark", "is our logo any good", "will this work as a favicon" | `logo-review` |
| "make us a favicon", "we need a dark version", "we need a stacked lockup" — and the guard below finds a mark | `logo-concept`, on its **variants-only** entry path |
| anything else, where the existing-mark guard below finds a mark | `logo-review` |
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

**A hit does not decide the route on its own — what was asked for does.** Three-way, and the middle row is the one this guard used to get wrong:

| Found | Asked for | Route |
|---|---|---|
| nothing | anything | `logo-concept`, full flow |
| a mark | **variants of it** — a favicon, a dark or mono version, a lockup, an app icon | `logo-concept`, **variants-only** entry path |
| a mark | an audit — or a **new** mark | `logo-review` |

**Never generate a replacement for a mark that exists.** A replacement offered after an audit is a decision the user can weigh; one offered instead of an audit is a guess about work somebody already paid for, and it arrives with no evidence that anything was wrong. Deriving the variants somebody explicitly asked for is not that: it draws nothing new and changes nothing that shipped.

**Announce the route and why**, whichever it is — that a mark was found, at which path, and which of the three rows above matched. A user who meant the other row can then say so before any work happens.

The variants-only path has a precondition: the existing mark has to be conformant before variants are derived from it. `logo-concept` states that gate in its own [Entry paths](#entry-paths) section, and it is not waivable there.

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

Draws a new mark from a brief, or — where a conformant mark already exists — derives its variant set. Eight numbered steps run in order, and a structural self-verification that gates the commit.

> "Starting logo-concept. I'll read `docs/design/MASTER.md` if it is there, ask five questions one at a time, write three directions before drawing any of them, render all three on a contact sheet and critique the render, then hand you the set to pick from."

On the variants-only path the announce says that instead: *"Starting logo-concept against your existing mark. I'll check it against the reproduction layer first, then draw the variants you asked for. No new concepts, and nothing you already ship gets redrawn."*

Every item of the [Shared Protocol](#shared-protocol) binds every step below. Three land in a specific place and are named again there: item 1 at Step 0, item 3 at Step 4, item 7 at Step 7.

### Entry paths

Three, decided in Step 0 by [the existing-mark guard](#the-existing-mark-guard) and never revisited later in the flow.

| Entry path | Precondition | What runs |
|---|---|---|
| **New mark** | the guard finds nothing | Steps 0 → 7, all of them |
| **Variants only** | the guard finds a mark **and** the request is for variants of it | Step 0, then Steps 4, 6 and 7 against the existing master. **Steps 1, 2, 3 and 5 do not run** — no concept is generated and nothing that ships is redrawn, the favicon excepted, which is a redraw by rule. |
| **Neither** | the guard finds a mark and the request is an audit, or a *new* mark | `logo-review`. This sub-skill does not run. |

**The variants-only path requires a conformant master, and this gate is not waivable.** Before anything is drawn, grade the existing mark against `reproduction.md` § The binary checklist — that is `logo-review`'s reproduction layer, borrowed rather than restated. If it fails, **stop there**: name the items that failed, offer the audit, and produce no variants. A variant set derived from an unsound master inherits the fault into every file and then documents it as though it had been checked, which is worse than the master alone.

**What this path can record, and what it must not.** `logo.template.md` assumes the mark was drawn here. On this path it was not, and the three kinds of slot are treated differently:

- **Readable from the file** — weights, counters, node counts, reuse ratio, silhouette areas, paint values, `viewBox`. Measured from the source and recorded as values, exactly as on the full path.
- **Held only by whoever drew it** — the seed, the derivation chain, `anti-slop.md`'s Test A answers. Recorded `UNRUN — the mark was not drawn here; <what would establish it>`. Never guessed, and never inferred backwards from the shape: an inferred derivation is the reviewer's inference, which is the one thing `logo.template.md` says that section must not contain.
- **The brief that produced the mark.** Not on file. The *keywords present from anti-slop.md pattern 6's list* row reads `UNRUN — the mark was not drawn here; the brief that produced it is not on file`, and pattern 6 cannot be graded on this mark by anyone. That is [Shared Protocol](#shared-protocol) item 1 failing in the only direction it is allowed to fail: visibly.

The request that opened *this* run is still captured verbatim, per item 1 — it is the brief for the variants, and it is what question 4's consequences are read off.

### Step 0 — context and guard

1. **Read `docs/design/MASTER.md` if it exists** and bind values per `construction.md` § Colour binding, into `LOGO.md` § Colour → *Binding*. If it is absent, say that running `ui-design-system` first produces a better result, ship in `currentColor`, and replace that table with the single line `logo.template.md` prescribes for the absent case. **Never block on it** — [Shared Protocol](#shared-protocol) item 6.
2. **Scan for an existing mark** at the paths in [The existing-mark guard](#the-existing-mark-guard). They are listed there; do not carry a second copy of the list into the flow.
3. **Route** by the three-way table in that section, and announce the path and the row that matched.
4. **Detect where assets go**, reusing `ui-design-system`'s stack detection: React, Next, Astro or Vue → `public/brand/`; Blazor → `wwwroot/brand/`; anything else → `assets/brand/`. The contact sheet is documentation rather than a shipped asset and goes to `docs/design/logo-contact-sheet.html` on every project.
5. **Start `docs/design/LOGO.md` now**, from `templates/logo.template.md`. It is filled progressively as the flow runs and closed out at Step 7 — it is not written from memory at the end.
6. **Capture the brief verbatim, at this point and not later.** [Shared Protocol](#shared-protocol) item 1. The invoking request goes into § Concept & rationale's *brief, in one line* row word for word, and is scanned against the eight-keyword list in `anti-slop.md` pattern 6 — cite that list, do not copy it — with the hits, or `none`, in the *keywords* row. Step 1's answers are appended verbatim as they arrive and the scan re-runs over the whole of it. Reconstructing a brief from the finished mark reconstructs the evidence, which is why this happens in Step 0 rather than as a Step 7 chore.

### Step 1 — the five questions

Ask them **one at a time — one question per message.** A batched list gets a batched answer, and question 4 is the one that goes missing from it.

| # | Question | In quick mode | Where the answer lands |
|---|---|---|---|
| 1 | The exact string to be set in type. Capitalisation and spacing are design decisions, not typos. | asked if the one-liner does not carry it | § Concept & rationale *brief*; the `aria-label` on every variant |
| 2 | What the product does, in one sentence. | asked if absent | § Concept & rationale *brief*; it is what Step 2's directions are about |
| 3 | Mark type preference — geometric, monogram, wordmark, abstract, or "you choose". | defaults to "you choose" | § Concept & rationale *Type chosen because* |
| 4 | **Where it must survive** — favicon, app icon, one-colour print or embroidery, dark UI, large format. | **asked standalone, always** | more slots than any other answer; see below |
| 5 | Must-avoid. | defaults to none | § Concept & rationale *brief*, verbatim with the rest |

**"You choose" defaults to geometric**, per `mark-types.md` § Choosing the type, which also carries the signal-to-type table for every other answer.

**Question 4 survives quick mode because it eliminates half the solution space before anything is drawn.** Never defaulted and never inferred from silence: an unanswered question 4 is asked as its own message even when every other answer was in the one-liner. Each context it names has a mechanical consequence, and all of them are taken before Step 3 rather than discovered after it:

| Answer names | Consequence, taken at Step 3 |
|---|---|
| a favicon | condition 3 in `reproduction.md` § The counter floor, in aggregate is now unmet, so every counter is built to the target; `logo-favicon.svg` ships |
| a dark UI | condition 2 in that same list is unmet, and counters are drawn at the target **plus** the increment derived in `reproduction.md` § The counter consequence, which binds regardless |
| one-colour print or embroidery | a row per process in § Variants → *Print minimums*, computed from this mark's own `u_ink` and `u_ctr`. Embroidery is a constraint on the stroke weight before a line is drawn, not a footnote after it. |
| an app icon | a drawn container, so `construction.md`'s correction 6 binds and its split is taken at the point its order of application puts it |
| large format | correction 4 becomes visible, and is judged on the sheet's two largest columns at Step 4 |

### Step 2 — three directions, written as rationale

Three directions, written out **before anything is drawn**, so the reasoning is not reverse-engineered from whatever shape came out. Each states:

- the idea, in one sentence;
- the type it implies, and the signal from `mark-types.md` § Choosing the type that picked it;
- the seed — the first element, placed on the grid, that everything else will derive from;
- what it gives up.

**All three from the same type**, unless the brief is genuinely undecided. `mark-types.md`'s opening says why: three types is a survey, not an exploration.

**Run `anti-slop.md` over the directions, not only over the drawings.** Its signatures need a source and there is none yet, but every pattern also carries a *tell* stated in prose, and a direction that already reads as pattern 1, 5, 6 or 8 does not get drawn to find out. Where Step 0's keyword row came back non-empty, a lens-shaped direction is on the strict Test A door before it exists: it names the number that produces its geometry, or it is replaced.

Record § Concept & rationale *Type chosen because* here. *Why this candidate won* and *Candidates rejected* wait for Step 5.

### Step 3 — draw

Draw all three, on one grid, to `construction.md` throughout and to `mark-types.md`'s recipe for the chosen type. `construction.md` § Order of application fixes the sequence the corrections are applied in — do not work through them 1 → 9.

**`construction.md` § Self-check before rendering runs against every candidate, not only the one you like.** A candidate failing any item is fixed here. The contact sheet is for judging ideas; at its largest size most construction errors are invisible and at its smallest they all look like the same problem.

Fill these `LOGO.md` slots as you draw. None of them needs a render, so none of them is ever `UNRUN` on account of a missing Playwright MCP:

| Slot | What goes in it |
|---|---|
| § Construction → *The rule, and the derivation chain* | the seed as one sentence, the rule as one sentence where the type is abstract, and one row per element naming what produced its number |
| § Construction → *Optical exceptions* | every `OPTICAL:` flag verbatim, per shipped file, and the count of **distinct reasons** against `construction.md` § Precedence's ceiling |
| § Construction → *The nine corrections* | one row each: a value, `n/a`, or `declined` with its reason. A correction left blank reads as an oversight, which is exactly what `construction.md` says it must not. |
| § Construction → *Stroke and counters* | weights and their ratio, filled or stroked, narrowest and widest ink, the thick–thin ratio, and one row per counter naming the family it was built into and the formula its gap came from |
| § Construction → *Silhouette* | ink and hull areas computed **analytically** — `reproduction.md` § Mono collapse calls that M4's primary route and the only one a markdown-only skill can run |
| § Construction → *Derivation answers for the anti-slop patterns* | patterns 1, 9, 6 and 8, written here by whoever drew the mark |
| § Construction → *Type-specific records* | the row for this type. A wordmark's *Fit* is `UNRUN` until Step 4 renders: `mark-types.md` measures the fit on the ink edge, and until the sheet has run there is no measured edge. |
| § Colour → *Contrast* | computed, not eyeballed, against every background the mark is specified for, per `construction.md` § Colour binding |
| § Clearspace & minimum sizes | the clearspace value from the mark's largest **enclosed** counter, and the counter-floor block wherever a counter sits under the target |

### Step 4 — render and self-critique

1. **Write the sheet.** Copy `templates/contact-sheet.template.html` to `docs/design/logo-contact-sheet.html` and substitute its placeholders — the template's own **PLACEHOLDERS** comment names each one and its occurrence count. **Never regenerate the file.** Two runs stop being comparable the moment it drifts, and comparability is the only reason it is a file.
2. **Screenshot it** with Playwright MCP: **two shots**, per the template's own **HOW TO SCREENSHOT IT** comment — the full page for the marks, and an element-scoped shot on `#readout` for the numbers, at the viewport width that comment fixes. One shot is not enough: a measurement that is a smudge in a downscaled PNG does not exist to the agent reading it.
3. **Read both PNGs back** with `Read`. This is the pass. Taking the screenshot is not the pass.
4. **Grade against the checklist below.** The harness prints each number beside the threshold it is held against and returns no verdict — [Shared Protocol](#shared-protocol) item 4. Never quote a readout row as a pass.
5. **Fix and re-render, once.** The cap below is real.

#### The critique checklist

Nine items, fixed. Each names what to look at and the file that holds what it is held against. **Do not substitute a different list per mark** — a fixed instrument is the only kind whose two runs can be compared.

| # | What is judged | Read it off | Held against |
|---|---|---|---|
| C1 | Is it still the same mark in the smallest column — counters open, no two features merged into one | small band, both grounds | `reproduction.md` § Minimum sizes |
| C2 | The two device-pixel-ratio columns — what a nominal favicon actually rasterises to | small band | `reproduction.md` § When grid alignment actually reaches the raster |
| C3 | Do the mono columns carry the structure the colour columns did | mono columns | `reproduction.md` § Mono collapse. M1, M2 and M4 are graded from source and arithmetic; this column is a preview and cannot model alpha. |
| C4 | On the dark ground: has ink grown, have counters closed | dark columns | `reproduction.md` § Dark inversion |
| C5 | Optically balanced rather than arithmetically centred — apex, container split, overshoot | the largest band | `construction.md` corrections 1, 3 and 6 |
| C6 | The horizontal thinning | the two largest columns only | `construction.md` correction 4. Below the size the sheet's own header names it is invisible, so it cannot be judged in the small band at all. |
| C7 | Does the render read as any of the ten clichés | full-page shot | `anti-slop.md`. The source signatures ran at Step 3; this is the half that needs eyes. |
| C8 | Does it resemble a mark you happen to recognise | full-page shot | [Shared Protocol](#shared-protocol) item 5 — this sees, it does not search, and it is never described or summarised as a trademark search |
| C9 | Every `warn` and `bad` row in the readout is a finding until it is answered | `#readout` shot | whichever file that row's own note names |

A finding names the candidate, the checklist number, and the fix. "Candidate B is a bit heavy" is not a finding. "Candidate B's counter closes in the smallest column on the dark ground — C1 and C4 — so its counters go to the target plus the dark increment" is.

#### The two-iteration cap

**Two renders of the sheet per presentation: the first, and one re-render after fixes. There is no third.**

When an item still fails after the second render:

- A **binary** failure — anything on `reproduction.md` § The binary checklist — **withdraws that candidate from Step 5.** It is not presented with a caveat. [The Refusal Gate](#the-refusal-gate) sets out why a caveat is not a mitigation, and that reasoning does not weaken because the failure arrived late.
- A **judgement** failure — balance, a resemblance, a cliché reading — is presented with the finding named beside its candidate and recorded in `LOGO.md`.
- **If every candidate is withdrawn, do not render again.** Say so, name the constraint that killed all three — it is almost always the hardest context question 4 named — and return to **Step 2** with that constraint stated up front. That is a new set of directions and a fresh pair of renders, announced as such rather than slipped in as a third iteration. **At most one such restart.** A second means the brief and its reproduction constraints are incompatible, and saying so is the answer; three more drawings are not.

#### Without Playwright MCP

[Shared Protocol](#shared-protocol) item 3 governs, and this is the step it exists for. **Degrade; do not fail, and do not let the output read as though a critique happened.**

- **Write the sheet anyway** and save it. It is documentation, and it is what lets somebody who has the MCP run the pass later without redoing the flow.
- **Stop at the screenshot.** Do not open the HTML, do not describe what it would have shown, and do not grade C1 … C9 off the source instead — the checklist reads a render, and a source-derived stand-in is a different check wearing this one's name.
- **Record all nine as `UNRUN — <what would decide it>`** in `LOGO.md` § Production handoff → *Checks recorded unrun*, alongside every render-dependent item on `reproduction.md` § The binary checklist and the wordmark fit `mark-types.md` leaves unmeasured. `grep UNRUN` over the finished file must list every one of them.
- **Write no absence.** Not "no cliché found", not "no collision found", not "reads balanced". An absent pass has no result, and C8's absence in particular is never "no collision".
- **Say it in the first sentence at Step 5**, not in a closing footnote: the marks are uncritiqued and the user is the only judge.
- The cap is not spent. It caps a pass that did not run.

### Step 5 — present; the user picks or blends

Present each surviving candidate with, in this order: its direction from Step 2, what the sheet showed, and every checklist finding against it. Where the critique did not run, that is the **first** sentence of the presentation.

The user picks one, or blends — "A's grid with C's counters" is a valid answer. **A blend is a new drawing.** It re-enters Step 3, runs `construction.md`'s self-check again, and gets its own pair of renders under a fresh cap. It does not inherit either parent's records; a blended mark whose derivation chain was copied from the candidate it borrowed half its geometry from cannot answer *what produced this number* for the other half.

Record § Concept & rationale: *Why this candidate won* — what it does that the other two did not — *Candidates rejected*, one reason each, and the section's opening two or three sentences, written **without a colour word**. If that sentence collapses without one, `anti-slop.md` pattern 10 is the finding and the mark is not finished.

### Step 6 — the variant set

Seven files, written to the directory Step 0 detected. `logo.template.md` § Variants is where the filenames live; the favicon is **`logo-favicon.svg`**, carrying the `logo-` prefix the other six carry.

**Where a host expects the name `favicon.svg` at a site root, put a copy or a symlink of `logo-favicon.svg` there.** Do not rename the asset. The manifest records the shipped file under its own name, with the copy noted beside it — a second name in the manifest is a second file to keep in sync.

Draw them in this order; each later one depends on an earlier:

1. **`logo-mark.svg`** — Step 5's winner, unchanged.
2. **`logo-wordmark.svg`** — the name set in type on the **square master artboard**, per `mark-types.md` § Wordmark and its worked fragment. Square is load-bearing here: this is the variant `φ_ink` and `φ_ctr` are measured off, and the harness renders a square artboard at full size. Its family, weight and tracking go to § Production handoff → *Typeface*; the un-performed outline conversion is already the template's fixed text and ships unedited.
3. **`logo-full.svg`** and **`logo-stacked.svg`** — the lockups. Each declares its own non-square `viewBox` and records its aspect, per `reproduction.md` § Artboard hygiene. **They are not size-tested on the sheet.** The harness is built for the square artboard and would render them letterboxed at a fraction of the size the square variants get, so a measurement taken there describes the letterboxing rather than the lockup. They are checked for **composition and clearspace only** — `reproduction.md` § Clearspace's lockup rule — and their minimum sizes are **derived from their components**: the mark side from `k`, the type side from the wordmark's φ. `reproduction.md` § Full lockup carries that derivation; record the result *and* the derived status in § Variants → *Lockup measurements*.
4. **`logo-mono-black.svg`** and **`logo-mono-white.svg`** — derived by resolving `color`, never redrawn. Determine the D1 **state first, from the size**, per `reproduction.md` § Three states, not two, then meet that state's obligation. Byte-identity on its own is not a pass at or above the threshold. Diff them against their source and record the result.
5. **`logo-favicon.svg`** — **redrawn, not scaled.** Its own drawing on the same artboard, to `reproduction.md` § The favicon's own spec, satisfying F1, F2 and F3. Every dropped feature goes into § Variants → *Favicon* in reproduction terms: the measurement, the device pixels it works out to, and what that does to the raster. "Simplified for small sizes" is not a reason.

**The favicon gets its own critique pass.** Write the sheet again with the favicon in a candidate slot, screenshot, read back, and grade **C1, C2, C3 and C9** — the small-size and readout items. C5 and C6 do not apply: the favicon renders at one size, and it is not the size at which either correction is visible. Same cap of two, same degradation, same `UNRUN` recording.

Also at this step: § Variants → *Print minimums*, one row per process question 4 named, computed from **this mark's** own `u_ink` and `u_ctr` — never lifted from `reproduction.md`'s worked table, which is the worst legal construction rather than this one.

**Where the chosen type makes a variant meaningless, it is not written.** A wordmark-type mark has no mark-alone symbol, so there is no `logo-mark.svg` and no lockup distinct from the wordmark itself. The § Variants row then reads `n/a — <why>`, the file does not ship, and *Files in the set* records what actually did. Writing an empty or duplicated file to make the count reach seven is worse than recording the gap.

### Step 7 — finalise

1. **Close out `docs/design/LOGO.md`.** It was started at Step 0 and filled as the flow ran.
   - **Delete every block headed `Example —`.** The template says it: examples are not content.
   - Fill § Misuse with rows that each name a number from this file. A row that would be true of any logo is not doing work.
   - Fill § Production handoff → *Still to do*. The outline-conversion and trademark-clearance paragraphs ship **unedited**; where no variant carries a `text` element, add the one-line `n/a` the template prescribes under the first of them.
   - Fill § Asset manifest, one row per shipped file.
   - **Sweep for empty cells.** An empty slot is a finding, not a silence, and the four tokens in `logo.template.md` § Recording conventions are the only legal fills. Every one of them carries a reason after the dash.
2. **Regenerate the sheet against the final assets.** The sheet has three candidate slots and the set has three distinct square drawings: `logo-mark.svg`, `logo-favicon.svg` and `logo-wordmark.svg`. The mono pair is the master with `color` resolved and is already rendered in the master's own mono columns; the lockups are not size-tested, per Step 6. Screenshot, read back, run the checklist once.
   This is a **verification** render, not a new iteration. A failure here is a defect in a final asset: fix it in Step 6 for that variant and re-verify **once**. If it fails again, stop and report it — do not commit a set whose own sheet contradicts its record.
3. **Run the structural self-verification** below. It gates the commit.
4. **Commit**, as below.

#### Structural self-verification

Runs before Step 7 completes, against the files actually on disk. Five checks:

- [ ] Every file named in § Asset manifest exists at its recorded path — **and** every SVG in the asset directory appears in the manifest. Both directions: a file on disk and absent from the table is a leftover or an undocumented variant, and `logo.template.md` calls both findings.
- [ ] Each SVG parses.
- [ ] Each root `svg` carries a `viewBox`, and the square variants all carry the identical one, per `reproduction.md` § Artboard hygiene.
- [ ] No `filter` element anywhere in the set.
- [ ] The mono variants bind every paint to `currentColor`, and differ from their source only in the resolved `color`.

**A failure here is a bug in the generated assets, not a warning to pass along.** Fix it and re-run all five. Do not commit, do not present it as a caveat beside the assets, and do not write it into `LOGO.md` as a finding and move on.

**None of the five is render-dependent.** They read the files, so they run identically with and without Playwright MCP and are **never** recorded `UNRUN`. A set that skipped them because the MCP was absent skipped them for no reason at all.

#### The commit

[Shared Protocol](#shared-protocol) item 7. Supply the triple to `project-orchestration`'s **Commit & Release Protocol**, which loads the host project's `docs/planning/CONVENTIONS.md`, runs the branch guard, and renders the message:

- **`type`** — `feat`
- **`scope`** — resolved by the protocol from the host project's `Scope source`; where no allowed scope matches, its `Fallback when scope not allowed` decides. Do not invent one.
- **`subject`** — `add brand mark — <product name>, <mark type>`

Stage by explicit pathspec — the asset directory, `docs/design/LOGO.md`, and `docs/design/logo-contact-sheet.html`. This flow runs inside the user's own project and other work may be in the tree, so never stage everything.

**Render nothing locally.** No message literal, no message format, no tag scheme, anywhere in this flow.

### Where each `LOGO.md` slot is filled

`logo.template.md` carries a slot for every value the reference files ask to be written down, and an empty one is a finding. This is the map from its sections to the step that fills them; a section with no step would be a gap in this flow rather than a silence in the record.

| `LOGO.md` section | Filled by |
|---|---|
| Header — product, mark type, generated, design system | Step 7, from Step 0's `MASTER.md` result and Step 5's winner |
| Concept & rationale | Step 0 (brief, keywords), Step 2 (type chosen because), Step 5 (opening sentences, why it won, candidates rejected) |
| Construction — chain, optical exceptions, nine corrections, stroke and counters, silhouette, anti-slop derivations, type-specific | Step 3; the favicon's own rows at Step 6; a wordmark's *Fit* at Step 4 |
| Variants — table, lockup measurements, favicon, print minimums | Step 6 |
| Colour — binding | Step 0 |
| Colour — contrast | Step 3 |
| Colour — one-colour print and mono | Step 3 for M1, M2 and M4; Step 4 for M3, or `UNRUN` |
| Colour — dark inversion | Step 6 |
| Clearspace & minimum sizes | Step 3 |
| Misuse | Step 7 |
| Production handoff — outline conversion, trademark clearance | the template's fixed text, shipped unedited |
| Production handoff — typeface | Step 6 |
| Production handoff — checks recorded unrun | Step 4, and Step 7's sweep |
| Production handoff — still to do | Step 7 |
| Asset manifest | Step 7, verified by the structural self-verification |

**One answer has no slot: question 5's must-avoid.** It constrains every direction and `logo.template.md` has no field for it. Record it verbatim inside the *brief, in one line* row with the rest of the brief, where Step 2 reads it. If a later revision of the template adds a field, it moves there and this note goes.

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
