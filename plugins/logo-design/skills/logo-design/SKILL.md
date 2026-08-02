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
- **The declared typeface has to be installed on the machine that renders the sheet — check it before the run, not after.** Every full `logo-concept` run sets type: the variant set at [Step 6](#step-6--the-variant-set) carries a wordmark and two lockups whatever type the mark itself turns out to be. Where the face does not resolve there, the harness detects it and says so at Step 4 — accurately, and too late to act on — and **seven `LOGO.md` slots go `UNRUN` behind that one fact**. [Step 0](#step-0--context-and-guard) item 8 names them and states the check. Like everything else here it degrades rather than blocks, which is exactly why nothing downstream will stop you.
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

Draws a new mark from a brief, or — where a conformant mark already exists — derives its variant set. Eight numbered steps run in order, plus Step 6.5, which is a half-step because it ships files rather than deciding anything and nothing downstream renumbers around it. **Step 8 is offered, never run on its own initiative** — it is the only step that overwrites files the project already had. A structural self-verification gates the commit.

> "Starting logo-concept. I'll read `docs/design/MASTER.md` if it is there, ask five questions one at a time, write three directions before drawing any of them, render all three on a contact sheet and critique the render, then hand you the set to pick from."

On the variants-only path the announce says that instead: *"Starting logo-concept against your existing mark. I'll check it against the reproduction layer first, then draw the variants you asked for. No new concepts, and nothing you already ship gets redrawn."*

Every item of the [Shared Protocol](#shared-protocol) binds every step below. Three land in a specific place and are named again there: item 1 at Step 0, item 3 at Step 4, item 7 at Step 7.

### Entry paths

Three, decided in Step 0 by [the existing-mark guard](#the-existing-mark-guard) and never revisited later in the flow.

| Entry path | Precondition | What runs |
|---|---|---|
| **New mark** | the guard finds nothing | Steps 0 → 7, all of them, Step 6.5 included, then Step 8 — offered, never run on its own initiative |
| **Variants only** | the guard finds a mark **and** the request is for variants of it | Step 0, then Steps 4, 6, 6.5 and 7 against the existing master, then Step 8 on the same offered terms. **Steps 1, 2, 3 and 5 do not run** — no concept is generated and nothing that ships is redrawn, the favicon excepted, which is a redraw by rule. |
| **Neither** | the guard finds a mark and the request is an audit, or a *new* mark | `logo-review`. This sub-skill does not run. |

**The variants-only path requires a conformant master, and this gate is not waivable.** Before anything is drawn, grade the existing mark against `reproduction.md` § The binary checklist — that is `logo-review`'s reproduction layer, borrowed rather than restated. If it fails, **stop there**: name the items that failed, offer the audit, and produce no variants. A variant set derived from an unsound master inherits the fault into every file and then documents it as though it had been checked, which is worse than the master alone.

**What this path can record, and what it must not.** `logo.template.md` assumes the mark was drawn here. On this path it was not, and the three kinds of slot are treated differently:

- **Readable from the file** — weights, counters, node counts, reuse ratio, silhouette areas, paint values, `viewBox`. Measured from the source and recorded as values, exactly as on the full path.
- **Held only by whoever drew it** — the seed, the derivation chain, `anti-slop.md`'s Test A answers. Recorded `UNRUN — the mark was not drawn here; <what would establish it>`. Never guessed, and never inferred backwards from the shape: an inferred derivation is the reviewer's inference, which is the one thing `logo.template.md` says that section must not contain.
- **The brief that produced the mark.** Not on file. The *keywords present from anti-slop.md pattern 6's list* row reads `UNRUN — the mark was not drawn here; the brief that produced it is not on file`, and pattern 6 cannot be graded on this mark by anyone. That is [Shared Protocol](#shared-protocol) item 1 failing in the only direction it is allowed to fail: visibly.

The request that opened *this* run is still captured verbatim, per item 1 — it is the brief for the variants, and it is what question 4's consequences are read off.

### Step 0 — context and guard

1. **Read what the project already says about itself, before asking the user for it.** Questions 1 and 2 at [Step 1](#step-1--the-five-questions) ask for the product's name and what it does, and both are usually on disk. Read whichever of these exist — `package.json`, `pyproject.toml`, `*.csproj`, `Cargo.toml`, `README.md`, `index.html`'s `<title>` — and take the name and the one-line description from them.

   **What is found is *proposed*, never assumed.** Show the user what was read and where it came from, in one message, and let them correct it: *"`package.json` says the name is `<x>` and the description is `<y>` — is that the string you want set in type, and is that what it does?"* A `package.json` name is a package identifier and is frequently not the brand string — capitalisation and spacing are design decisions per question 1, and a slug is neither.

   **The verbatim capture is of what the user confirms**, per [Shared Protocol](#shared-protocol) item 1 — not of what the file said. A description lifted from `package.json` and never confirmed is the project's words about itself, which is a different thing from the brief, and the pattern-6 keyword scan run over it is scanning the wrong text.

   **Never block on this, and never infer question 4 from it.** A repository says nothing about where the mark has to survive; that answer comes from the user and from nowhere else — see [Question 4's consequences](#question-4s-consequences).
2. **Read `docs/design/MASTER.md` if it exists** and bind values per `construction.md` § Colour binding, into `LOGO.md` § Colour → *Binding*. If it is absent, say that running `ui-design-system` first produces a better result, ship in `currentColor`, and replace that table with the single line `logo.template.md` prescribes for the absent case. **Never block on it** — [Shared Protocol](#shared-protocol) item 6.
3. **Scan for an existing mark** at the paths in [The existing-mark guard](#the-existing-mark-guard). They are listed there; do not carry a second copy of the list into the flow.
4. **Route** by the three-way table in that section, and announce the path and the row that matched.
5. **Detect where assets go**, reusing `ui-design-system`'s stack detection: React, Next, Astro or Vue → `public/brand/`; Blazor → `wwwroot/brand/`; anything else → `assets/brand/`. The contact sheet is documentation rather than a shipped asset and goes to `docs/design/logo-contact-sheet.html` on every project.
6. **Start `docs/design/LOGO.md` now**, from `templates/logo.template.md`. It is filled progressively as the flow runs and closed out at Step 7 — it is not written from memory at the end.
7. **Capture the brief verbatim, at this point and not later.** [Shared Protocol](#shared-protocol) item 1. The invoking request goes into § Concept & rationale's *brief, in one line* row word for word, and is scanned against the eight-keyword list in `anti-slop.md` pattern 6 — cite that list, do not copy it — with the hits, or `none`, in the *keywords* row. Step 1's answers are appended verbatim as they arrive and the scan re-runs over the whole of it. Reconstructing a brief from the finished mark reconstructs the evidence, which is why this happens in Step 0 rather than as a Step 7 chore.
8. **Establish the typeface, and check it resolves on this machine — now, before the run is spent.** Step 6 ships a wordmark and two lockups on every full run, so every full run sets type in a declared face; on the variants-only path the check binds wherever the request names the wordmark or a lockup. Take the family from `MASTER.md`'s typography where item 2 found one, and where it did not, choose it here rather than at Step 6 — from what is actually installed. Then **say out loud what an unavailable face costs**, because the user can still act on it at this point:

   - **Seven `LOGO.md` slots go `UNRUN` behind one missing face**, and they are values on any machine where it resolves: `φ_ink` and `φ_ctr`, `k`, both cap-height minimums and the width minimum in § Variants → *Lockup measurements*, and the wordmark *Fit* in § Construction → *Type-specific records*. `reproduction.md` § Full lockup is why — the type side of the lockup minimum is the one constraint on that page that is measured rather than computed, and it is measured off a render of the declared face.
   - **The remedy is to install the face where the sheet will run**, and there is no self-hosting route inside this plugin: a shipped master may not carry `style`, per `construction.md` § Forbidden constructs, and the sheet is filled by placeholder substitution only — adding a face to it is regenerating the instrument, which Step 4 forbids for the reason it gives there.
   - **A missing face never blocks and never fails.** It degrades to `UNRUN` like any other unrun measurement — [Shared Protocol](#shared-protocol) item 3 — and the install step goes into § Production handoff → *Still to do* at Step 7. The warning is here so that a five-minute install can be decided on before the run rather than discovered as a cascade after it.

### Step 1 — the five questions

Ask them **one at a time — one question per message.** A batched list gets a batched answer, and question 4 is the one that goes missing from it.

| # | Question | In quick mode | Where the answer lands |
|---|---|---|---|
| 1 | The exact string to be set in type. Capitalisation and spacing are design decisions, not typos. | asked if the one-liner does not carry it; where Step 0 item 1 found a name, proposed for confirmation rather than asked cold | § Concept & rationale *brief*; the `aria-label` on every variant |
| 2 | What the product does, in one sentence. | asked if absent; where Step 0 item 1 found a description, proposed for confirmation rather than asked cold | § Concept & rationale *brief*; it is what Step 2's directions are about |
| 3 | Mark type preference — geometric, monogram, wordmark, abstract, or "you choose". | defaults to "you choose" | § Concept & rationale *Type chosen because* and *Mark–name relationship*; on "you choose" both are derived from answers 1 and 4, per the procedure below |
| 4 | **Where it must survive** — favicon, app icon, one-colour print or embroidery, dark UI, large format. | **asked standalone, always** | more slots than any other answer; see below |
| 5 | Must-avoid. | defaults to none | § Concept & rationale *brief*, verbatim with the rest |

#### "You choose" is derived, not chosen

**Question 3's "you choose" is not a blank cheque: the type is derived from the answers already on the table, and the derivation is written down.** The two signals are question 1's string and question 4's contexts — the same signals `mark-types.md` § Choosing the type's table is read with. Its "default to geometric" is the row reached when neither signal decides, not the row reached first. Count question 1's string in **characters**, ignoring spacing; "size-hostile" below means question 4 named a context the name itself cannot be set in — a favicon, an app icon, embroidery, a stamp.

| Q1's string | Q4 size-hostile | Derived type |
|---|---|---|
| short — roughly four characters or fewer | yes | **Monogram**, on as many of those characters as `mark-types.md` § Monogram permits — that recipe sets the ceiling and says what three initials measure at a 16 px render, so a three-character string does not become a three-character monogram. A string this short *is* its own initials, and the lettermark is the construction that carries the name at the size that decides it. It is drawn as paths, so it takes no typeface dependency at all. |
| short | no | **Monogram** still, for the same reason minus the urgency. A **wordmark** is the one defensible alternative here — at four characters it is the monogram plus the remaining letters — and it is available only once Step 0 item 8's face question is settled, because a wordmark master ships a `text` element and inherits both that dependency and the un-performed outline conversion `mark-types.md` § Wordmark records. |
| long | yes | The name cannot be set at that size at all, so a **mark-alone variant is mandatory** and the type question is only about what that mark is: **monogram** where the initials are short and distinctive, **geometric** or **abstract** where they are not, on the remaining rows of that same table. |
| long | no | **Wordmark**, per that table's name-led row — nothing has to survive without the name. Same face question, same place. |

**Neither signal decides only where question 1's string is genuinely absent** — a mark for something with no settable name. That is the case `mark-types.md`'s "you choose" default is answering, and geometric is the answer there.

**The derived type may be departed from exactly once, in writing.** A geometric or abstract mark for a short string is legitimate and is sometimes the better mark — but it has a consequence, and the consequence is that **the mark does not reference the name**. Record it in § Concept & rationale's *Mark–name relationship* row in those words, naming the type the derivation produced, the type taken instead, and why. **A mark that reaches that state with the row empty is not a decision, it is drift** — the first dogfood answered `SPX`, required a favicon, took geometric, and shipped competent geometry bearing no relationship to those three letters, and nothing in the flow noticed. The row is what makes the disconnect unreachable without writing it down.

#### Question 4's consequences

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

Record § Concept & rationale *Type chosen because* here, and *Mark–name relationship* with it — both are written off Step 1's derivation, and the second is the row that stops a mark drifting away from the string it is for. *Why this candidate won* and *Candidates rejected* wait for Step 5.

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
2. **Screenshot it** with Playwright MCP: **two shots**, per the template's own **HOW TO SCREENSHOT IT** comment — the full page for the marks, and an element-scoped shot on `#readout` for the numbers, at the viewport width that comment fixes. One shot is not enough: a measurement that is a smudge in a downscaled PNG does not exist to the agent reading it. **Wait for the readiness signal that comment names before either shot**: the sheet rasterises M3 before it draws anything, so a shot taken early catches a blank page rather than a partial one.
3. **Read both PNGs back** with `Read`. This is the pass. Taking the screenshot is not the pass.
4. **Grade against the checklist below.** The harness prints each number beside the threshold it is held against and returns no verdict — [Shared Protocol](#shared-protocol) item 4. Never quote a readout row as a pass.
5. **Fix and re-render, once.** The cap below is real.

#### The critique checklist

Nine items, fixed. Each names what to look at and the file that holds what it is held against. **Do not substitute a different list per mark** — a fixed instrument is the only kind whose two runs can be compared.

| # | What is judged | Read it off | Held against |
|---|---|---|---|
| C1 | Is it still the same mark in the smallest column — counters open, no two features merged into one | small band, both grounds | `reproduction.md` § Minimum sizes |
| C2 | The two device-pixel-ratio columns — what a nominal favicon actually rasterises to | small band | `reproduction.md` § When grid alignment actually reaches the raster |
| C3 | Do the mono columns carry the structure the colour columns did | mono columns | `reproduction.md` § Mono collapse. M1, M2 and M4 are graded from source and arithmetic; this column is a CSS preview and cannot model alpha. **M3 is not judged here** — it is the readout's own `M3 inversion` row, an actual two-render pixel diff, and reading the filtered column in its place substitutes a look for a measurement. |
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
2. **`logo-wordmark.svg`** — the name set in type on the **square master artboard**, per `mark-types.md` § Wordmark and its worked fragment. **Declare the face Step 0 item 8 established, and if that check was skipped, run it before drawing rather than after** — this file and the two below it are what the seven slots named there hang off. Square is load-bearing here: this is the variant `φ_ink` and `φ_ctr` are measured off, and the harness renders a square artboard at full size. Its family, weight and tracking go to § Production handoff → *Typeface*; the un-performed outline conversion is already the template's fixed text and ships unedited.
3. **`logo-full.svg`** and **`logo-stacked.svg`** — the lockups. Each declares its own non-square `viewBox` and records its aspect, per `reproduction.md` § Artboard hygiene. **They are not size-tested on the sheet.** The harness is built for the square artboard and would render them letterboxed at a fraction of the size the square variants get, so a measurement taken there describes the letterboxing rather than the lockup. They are checked for **composition and clearspace only** — `reproduction.md` § Clearspace's lockup rule — and their minimum sizes are **derived from their components**: the mark side from `k`, the type side from the wordmark's φ. `reproduction.md` § Full lockup carries that derivation; record the result *and* the derived status in § Variants → *Lockup measurements*.
4. **`logo-mono-black.svg`** and **`logo-mono-white.svg`** — derived by resolving `color`, never redrawn. Determine the D1 **state first, from the size**, per `reproduction.md` § Three states, not two, then meet that state's obligation. Byte-identity on its own is not a pass at or above the threshold. Diff them against their source and record the result.
5. **`logo-favicon.svg`** — **redrawn, not scaled.** Its own drawing on the same artboard, to `reproduction.md` § The favicon's own spec, satisfying F1, F2 and F3. Every dropped feature goes into § Variants → *Favicon* in reproduction terms: the measurement, the device pixels it works out to, and what that does to the raster. "Simplified for small sizes" is not a reason.

**The favicon gets its own critique pass.** Write the sheet again with the favicon in a candidate slot, screenshot, read back, and grade **C1, C2, C3 and C9** — the small-size and readout items. C5 and C6 do not apply: the favicon renders at one size, and it is not the size at which either correction is visible. Same cap of two, same degradation, same `UNRUN` recording.

Also at this step: § Variants → *Print minimums*, one row per process question 4 named, computed from **this mark's** own `u_ink` and `u_ctr` — never lifted from `reproduction.md`'s worked table, which is the worst legal construction rather than this one.

**Where the chosen type makes a variant meaningless, it is not written.** A wordmark-type mark has no mark-alone symbol, so there is no `logo-mark.svg` and no lockup distinct from the wordmark itself. The § Variants row then reads `n/a — <why>`, the file does not ship, and *Files in the set* records what actually did. Writing an empty or duplicated file to make the count reach seven is worse than recording the gap.

### Step 6.5 — the raster set

Seven SVGs are not a shipped identity. A `favicon.ico`, an `apple-touch-icon.png` and the PWA icon sizes are what hosts, app stores and older browsers actually read, and none of them accepts SVG.

Run the bundled exporter against the directory Step 0 detected:

```bash
node <skill-dir>/scripts/export-raster.mjs <brand-dir>
```

It writes eight files and **routes each one to the SVG whose reproduction spec covers its size** — 16, 32, 48 and the `.ico` from `logo-favicon.svg`, and 180, 192, 512 and 1024 from `logo-mark.svg`. That routing is not configurable, and the reason is `reproduction.md § The favicon's own spec`: the favicon is a redraw for exactly those sizes, and the master is specified above its own computed minimum. **Never rasterise the master at 16 px** — it ships a mark this skill's own binary layer already failed.

**Read the exit code. It is a four-way contract, and three of the four are not failures of the mark:**

| Code | Means | What to do |
|---|---|---|
| **0** | The eight files were written | Record them, per the paragraph below |
| **1** | A converter failed at runtime — a malformed SVG, a crashed binary, an Inkscape that passed the `--version` probe and then rejected the 1.0+ export flags | A real failure, and the message carries the converter, the source, the size, the argv and the tool's own stderr. It also lists any files already written, so **the directory is half-populated** — read that list before doing anything else. Fix the cause and re-run; a re-run overwrites cleanly. |
| **2** | Usage error, or a source SVG is missing | Step 6 did not complete. Fix Step 6; do not work around it here. |
| **3** | No rasteriser on the machine | **`UNRUN`, not a failure** — see below |

**Exit code 3 degrades exactly as a missing Playwright MCP does** — [Shared Protocol](#shared-protocol) item 3. Ship the SVG set, record every raster row `UNRUN — no rasteriser on this machine; install one of the four the exporter names` in § Variants → *Raster set*, put the install step into § Production handoff → *Still to do*, and say so in the first sentence at Step 7. **Do not fake a PNG, do not substitute a screenshot, and do not report the icons as shipped.**

**Record every written file** in § Variants → *Raster set* and in § Asset manifest, each row naming the SVG it came from. A raster whose source is not recorded cannot be regenerated when the mark changes, and a raster nobody can regenerate is the file that goes stale first.

**No raster is graded.** The exporter is a converter, not an instrument: `reproduction.md`'s checklist is graded on the vector source, and a PNG adds no evidence about a mark whose geometry was already measured. This step ships files; it does not decide anything.

### Step 7 — finalise

1. **Close out `docs/design/LOGO.md`.** It was started at Step 0 and filled as the flow ran.
   - **Delete every block headed `Example —`.** The template says it: examples are not content.
   - Fill § Misuse with rows that each name a number from this file. A row that would be true of any logo is not doing work.
   - Fill § Production handoff → *Still to do*. The outline-conversion and trademark-clearance paragraphs ship **unedited**; where no variant carries a `text` element, add the one-line `n/a` the template prescribes under the first of them. **Where the declared face did not resolve on the render machine, *Still to do* carries the install step**, naming the face and the seven slots Step 0 item 8 lists — those rows are `UNRUN` for a reason somebody else can clear in five minutes, and a handoff that does not say so wastes it.
   - Fill § Asset manifest, one row per shipped file.
   - **Sweep for empty cells.** An empty slot is a finding, not a silence, and the four tokens in `logo.template.md` § Recording conventions are the only legal fills. Every one of them carries a reason after the dash.
2. **Regenerate the sheet against the final assets.** The sheet has three candidate slots and the set has three distinct square drawings: `logo-mark.svg`, `logo-favicon.svg` and `logo-wordmark.svg`. The mono pair is the master with `color` resolved and is already rendered in the master's own mono columns; the lockups are not size-tested, per Step 6. Screenshot, read back, run the checklist once.
   This is a **verification** render, not a new iteration. A failure here is a defect in a final asset: fix it in Step 6 for that variant and re-verify **once**. If it fails again, stop and report it — do not commit a set whose own sheet contradicts its record.
3. **Run the structural self-verification** below. It gates the commit.
4. **Commit**, as below.

#### Structural self-verification

Runs before Step 7 completes, against the files actually on disk. Eight checks:

- [ ] Every file named in § Asset manifest exists at its recorded path — **and** every SVG in the asset directory appears in the manifest. Both directions: a file on disk and absent from the table is a leftover or an undocumented variant, and `logo.template.md` calls both findings.
- [ ] Each SVG parses.
- [ ] **Each root `svg` carries `xmlns="http://www.w3.org/2000/svg"`.** Grep the file; do not render it to decide this. Inline in HTML the namespace is supplied for you, so a file missing it renders correctly on the contact sheet, measures correctly in the readout, and passes the vision critique — and then does not open as a file. The first dogfood run shipped all seven variants without it and no render-based check could have caught it. This item exists because that happened.
- [ ] Each root `svg` carries a `viewBox`, and the square variants all carry the identical one, per `reproduction.md` § Artboard hygiene.
- [ ] No `filter` element anywhere in the set.
- [ ] The mono variants bind every paint to `currentColor`, and differ from their source only in the resolved `color`.
- [ ] Every file the exporter reported written exists at its recorded path and appears in § Asset manifest with the SVG it was rasterised from. Where the exporter returned `UNRUN`, every raster row says so and no raster file is on disk.
- [ ] No raster file in the asset directory lacks a manifest row. A stray PNG is the same finding as a stray SVG.

**A failure here is a bug in the generated assets, not a warning to pass along.** Fix it and re-run all eight. Do not commit, do not present it as a caveat beside the assets, and do not write it into `LOGO.md` as a finding and move on.

**None of the eight is render-dependent.** They read the files, so they run identically with and without Playwright MCP and are **never** recorded `UNRUN`. A set that skipped them because the MCP was absent skipped them for no reason at all.

#### The commit

[Shared Protocol](#shared-protocol) item 7. Supply the triple to `project-orchestration`'s **Commit & Release Protocol**, which loads the host project's `docs/planning/CONVENTIONS.md`, runs the branch guard, and renders the message:

- **`type`** — `feat`
- **`scope`** — resolved by the protocol from the host project's `Scope source`; where no allowed scope matches, its `Fallback when scope not allowed` decides. Do not invent one.
- **`subject`** — `add brand mark — <product name>, <mark type>`

Stage by explicit pathspec — the asset directory, `docs/design/LOGO.md`, and `docs/design/logo-contact-sheet.html`. This flow runs inside the user's own project and other work may be in the tree, so never stage everything.

**Render nothing locally.** No message literal, no message format, no tag scheme, anywhere in this flow.

### Step 8 — wire it into the project

Optional, and **asked for rather than assumed**: Step 7 committed the asset set, and replacing a project's live icons is a separate decision with a separate blast radius. Offer it, name every file that would change, and wait.

> "The set is committed. I can also replace the icons this project already ships — I found `<paths>`. Nothing else would change, and I would not add any icon file the project does not already reference. Want me to?"

**1. Find the slots that already exist.** Only these, and only where the file is already there:

```text
public/favicon.ico          public/favicon.svg          public/apple-touch-icon.png
public/icon-192.png         public/icon-512.png         public/pwa-192x192.png
public/pwa-512x512.png      static/favicon.ico          wwwroot/favicon.ico
src/app/favicon.ico         app/favicon.ico
```

**An iOS asset catalog is deliberately not in that list.** `AppIcon.appiconset` needs sizes this flow does not produce — 20, 29, 40, 58, 60, 76, 80, 87, 120, 152 and 167 among them — and its `ios-marketing` entry must carry no alpha channel, which nothing here flattens. Filling the entries we happen to match and leaving the rest is how a build passes locally and fails App Store review later, with nothing pointing back at this step. Say the catalog exists, say it needs sizes and an opaque marketing icon this flow does not generate, and leave it alone.

**2. Refuse to overwrite anything git cannot give back.** Before writing to a path, check it with `git status --porcelain -- <path>` in the project that owns it. **Replace it only where it is tracked and clean.** Where it is untracked, ignored, or carries uncommitted edits, **name it, skip it, and say why** — the same posture as the row above. This is the difference between a replacement a reviewer can revert with one command and a file that no longer exists anywhere. It is cheap, it is checkable, and it is the only protection this step has: every other check here runs *after* the original is gone.

**3. Replace, never add.** A slot that does not exist is not created. The project's own build config decides which icons it ships, and this flow does not have that config in view — inventing a file the manifest never references leaves an orphan that outlives the reason for it. Where the project plainly wants an icon it has no file for, **say so and stop**; that is a change to the project's configuration, not to its assets.

**4. Match on the size the existing file actually is, never on its name.** Read the target's real pixel dimensions before choosing a source — a `.png`'s IHDR carries them, and a name like `apple-touch-icon.png` carries nothing. Then take the raster the exporter produced **at that exact size**: 16, 32 or 48 from the favicon redraw, and 180, 192, 512 or 1024 from the master. **Where the target's size is not one of those seven, do not substitute the nearest** — name it, skip it, and say which size would be needed. A 167 px slot filled with the 180 px raster is a manifest declaring a size the bytes do not have, and instruction 5 forbids fixing that by editing the declaration.

**A `favicon.ico` carries a size list of its own — read it before replacing it.** Ours packs 16, 32 and 48. Where the project's packs sizes beyond those, replacing it drops them, and no later check notices. Say which sizes would be lost and let the user decide; do not replace it silently.

**5. Update a manifest only where one already lists the file being replaced.** `manifest.json`, `site.webmanifest`, and `<link rel="icon">` tags in an existing `index.html`. Change the *file* an entry points at only where the filename itself changed; never add an entry, and never change an entry's `sizes` or `type` to suit our filenames. **Where our filename differs from the project's, keep the project's** — the host's build depends on its own names, and renaming its assets to match ours is a breaking change dressed as a logo update.

**6. Record what changed** in § Project files replaced, one row per replaced file, naming its size, the file it was replaced with, and the commit that can revert it — then fill the summary fields: how many files were replaced, that every one was tracked and clean before the write, and which slots were found but skipped, and why. A replaced file is a shipped file: a section that omits it is wrong about what this project now contains.

**7. Verify before committing.** Every replaced path still exists, is non-empty, and — for a raster — still carries the PNG or ICO magic bytes it did before. A replacement that truncated a file is worse than no replacement, because the asset it overwrote is already gone.

**A failure here is not a warning to pass along.** Restore the path from git — instruction 2's tracked-and-clean rule is what guarantees you can — re-run the replacement for that file alone, and verify again. Where it fails twice, restore it, leave the project's original in place, and record the slot as skipped. Never commit a replacement you could not verify.

#### The commit

[Shared Protocol](#shared-protocol) item 7. Supply the triple to `project-orchestration`'s **Commit & Release Protocol**, which loads the host project's `docs/planning/CONVENTIONS.md`, runs the branch guard, and renders the message:

- **`type`** — `chore`
- **`scope`** — resolved by the protocol from the host project's `Scope source`; where no allowed scope matches, its `Fallback when scope not allowed` decides. Do not invent one.
- **`subject`** — `replace project icons with the new brand mark`

Stage by explicit pathspec — every replaced file and `docs/design/LOGO.md`, nothing else. **Separate from Step 7's commit.** That one added the asset set; this one changes what the project ships, and a reviewer has to be able to revert the second without losing the first.

**Render nothing locally.** No message literal, no message format, no tag scheme, anywhere in this flow.

### Where each `LOGO.md` slot is filled

`logo.template.md` carries a slot for every value the reference files ask to be written down, and an empty one is a finding. This is the map from its sections to the step that fills them; a section with no step would be a gap in this flow rather than a silence in the record.

| `LOGO.md` section | Filled by |
|---|---|
| Header — product, mark type, generated, design system | Step 7, from Step 0's `MASTER.md` result and Step 5's winner |
| Concept & rationale | Step 0 (brief, keywords), Step 2 (type chosen because, mark–name relationship), Step 5 (opening sentences, why it won, candidates rejected) |
| Construction — chain, optical exceptions, nine corrections, stroke and counters, silhouette, anti-slop derivations, type-specific | Step 3; the favicon's own rows at Step 6; a wordmark's *Fit* at Step 4 |
| Variants — table, lockup measurements, favicon, print minimums | Step 6 |
| Variants — raster set | Step 6.5 |
| Colour — binding | Step 0 |
| Colour — contrast | Step 3 |
| Colour — one-colour print and mono | Step 3 for M1, M2 and M4; Step 4 for M3, or `UNRUN` |
| Colour — dark inversion | Step 6 |
| Clearspace & minimum sizes | Step 3 |
| Misuse | Step 7 |
| Production handoff — outline conversion, trademark clearance | the template's fixed text, shipped unedited |
| Production handoff — typeface | Step 0 item 8 establishes the family and whether it resolves here; Step 6 records it with the weight and tracking |
| Production handoff — checks recorded unrun | Step 4, and Step 7's sweep |
| Production handoff — still to do | Step 7 |
| Asset manifest | Step 7, from Step 6 and Step 6.5, verified by the structural self-verification |
| Asset manifest — project files replaced | Step 8, where it ran; `n/a — Step 8 was not run` otherwise |

**One answer has no slot: question 5's must-avoid.** It constrains every direction and `logo.template.md` has no field for it. Record it verbatim inside the *brief, in one line* row with the rest of the brief, where Step 2 reads it. If a later revision of the template adds a field, it moves there and this note goes.

## logo-review

Audits a mark that already exists — one this skill drew, or one it has never seen — across three layers, and writes a verdict to `docs/design/YYYY-MM-DD-logo-review.md`. Seven numbered steps run in order.

> "Starting logo-review. I'll find the mark and whatever record exists for it, render it across the reproduction matrix and read the screenshots back, then grade three layers — reproduction hazards, the ten anti-slop patterns, and a five-dimension critique — and write you a report with a verdict and a prioritised list."

Every item of the [Shared Protocol](#shared-protocol) binds every step below. Three land in a specific place and are named again there: item 1 at Step 1, item 3 in [The UNRUN rule](#the-unrun-rule), item 7 at Step 7.

**Two things this flow never does.**

- **It never writes `docs/design/LOGO.md`.** `logo.template.md`'s own opening fixes the division: `logo-concept` fills it in, `logo-review` audits against it. A missing answer is a finding in the report, and the finding names the slot it belongs in. An audit that fills its own gaps has graded its own writing.
- **It never redraws the mark.** Where the verdict is FAIL, offering `logo-concept` afterwards is a decision the user can weigh — [the existing-mark guard](#the-existing-mark-guard) sets out why a replacement *after* an audit is legitimate and one *instead of* an audit is not.

### The three layers

| # | Layer | Type | Criteria come from |
|---|---|---|---|
| 1 | Reproduction hazards | binary per item | [references/reproduction.md](references/reproduction.md) § The binary checklist — every item, in that file's own order and grouping |
| 2 | Anti-slop scan | binary per pattern | [references/anti-slop.md](references/anti-slop.md) — all ten, with the bounded carve-out its *Two of these are shapes, not mistakes* section defines |
| 3 | Five-dimension critique | 1 … 5 per dimension | Distinctiveness · Simplicity · Memorability · Appropriateness · Versatility — the table at [Step 5](#step-5--layer-3-the-five-dimension-critique) |

**The vocabulary is `ui-workflow`'s `ui-review`, deliberately** — **PASS / PARTIAL / FAIL** per layer, the floor rather than the average gating the critique layer, and the final verdict the worst of the three. A verdict on a mark and a verdict on a screen should mean the same thing to the person reading both.

**Layers 1 and 2 are consumed wholesale from their own files.** Do not restate an item, do not copy a threshold, and do not substitute a shorter list per mark. Both are fixed instruments for the same reason the contact sheet is one: two runs are only comparable while the instrument does not move.

### The UNRUN rule

Every other section depends on this, so it is stated before them.

**A binary layer has two grades and three states.** An item can pass, fail, or never have been decided — because the render did not happen, or because the record that would settle it does not exist. Reading that third state as either of the first two is the same defect as `reproduction.md`'s D1 state 2: a gate phrased as a binary, applied to a state space that is ternary, waves through the one state carrying an undocumented discrepancy.

> **`UNRUN` removes PASS from its layer's options. It does not remove FAIL.**
>
> A layer carrying an `UNRUN` item and no FAIL is **PARTIAL**. A layer carrying a FAIL is **FAIL**, whatever else is unrun.

Neither of the other two readings survives contact with the files:

- **`UNRUN` as a pass** destroys [Shared Protocol](#shared-protocol) item 3, which is the plugin's central honesty guarantee. `logo.template.md` § Recording conventions says it in one clause: never a pass.
- **`UNRUN` as a fail** condemns a mark for the auditor's missing evidence. `reproduction.md` § What a bounding box can and cannot tell you already rules on the direction — *"A false FAIL in the binary layer is worse than a false pass: it sends an agent to redraw a mark that was already right, and the redraw has nowhere to go."*

**One token, two reasons — there is no fifth token.** `logo.template.md` § Recording conventions fixes four, and `logo-concept`'s variants-only path already spends `UNRUN` on a record that does not exist rather than inventing a word for it. Both reasons below are the same token with a different clause after the dash, and `grep UNRUN` over the report lists every one of them:

| Reason shape | Reached when |
|---|---|
| `UNRUN — the sheet has not run; <the render that would decide it>` | Playwright MCP is absent, or the item needs a measurement off a render this flow did not take |
| `UNRUN — no record; <the LOGO.md slot that would decide it>` | The item's only remaining route is a sentence in `LOGO.md`, and the file or the slot does not exist |

**What is not `UNRUN`.** Three exclusions, and they are what stop the token swallowing the audit:

1. **An item decidable from the file is graded from the file.** A missing `LOGO.md` excuses nothing that names no record — M1, M2, M4, D2, F1, F2, F3, path complexity, the reuse ratio and every artboard-hygiene item are graded from the source on any mark, drawn here or not.
2. **An item whose file side passes is a PASS.** `reproduction.md`'s record clauses are escape hatches on a *failing* file side, not preconditions on a passing one. A silhouette at 0.72 clears M4 with no record at all; only a silhouette above the gate needs `LOGO.md` to name it as a deliberate primitive.
3. **A rule that does not reach this mark is `n/a — <why>`, and `n/a` caps nothing.** But **`n/a` needs a fact, not a silence**: the user said the mark never prints, or the set carries no `text` element. A question nobody answered is `UNRUN`, never `n/a` — an unanswered question is exactly the applicable-but-undecided case the token exists for.

So the record-dependent set is short, and it is read off the checklist item by item rather than carried here as a second copy.

### A mark with no `LOGO.md`

**The common case, not an edge.** The router sends any project with an existing mark to this flow, including marks this skill never touched, and `reproduction.md`'s checklist repeatedly offers "`LOGO.md` records X" as the escape hatch on a failing item. For an external mark that record does not exist and cannot be produced retroactively.

**A missing record is not a FAIL.** It is the second reason shape above: `UNRUN — no record`, capping its layer at PARTIAL by the same rule as a missing render. The two are the same epistemic situation — the mark may be perfectly sound and simply unchecked — so they take the same token and the same cap.

**What still runs, and it is most of the audit:**

| Layer | Runs without a record |
|---|---|
| 1 | Every item that names no record: the whole mono-collapse source side, D2, the favicon's three redraw tests, path complexity and both tracing signatures, clearspace, the computed minimum sizes, and artboard hygiene. Raster provenance's file side also runs without a record — every raster on disk can be listed and its size read against 48 px — but neither of its FAILs is reachable until a record exists to check the listing against. |
| 2 | Eight patterns of the ten, in full, from their source signatures |
| 3 | Simplicity, which is scored from the source alone |

**What goes `UNRUN`:** every pure-record item on the checklist; the record-side escape hatch on any item whose file side did not clear; raster provenance, whenever there is no `LOGO.md` or no *Raster files* table in it; `anti-slop.md`'s Tests A and B for patterns 1 and 9 and the strict Test A for 6 and 8, wherever the signature hit; pattern 6's brief where the user cannot supply it; and, in Layer 3, Distinctiveness, which names the derivation chain among its evidence.

**So an undocumented mark's ceiling is `PARTIAL — evidence-limited`, and saying so is the point.** The criteria files make the record a precondition of a clean bill — `reproduction.md` asks for values to be written down and `anti-slop.md`'s carve-out asks for an answer that only the person who drew the mark can give. A skill that issued PASS anyway would be certifying the absence of evidence. The remediation is a record, never a redraw, and it has exactly two routes: whoever drew the mark writes the derivation answers, or `logo-concept`'s **variants-only** path fills the slots readable from the file — which is most of them, and it leaves the derivation slots `UNRUN` by its own rule rather than guessing them.

**Never write the missing record and never infer it.** `anti-slop.md`'s carve-out is explicit — *"Not the reviewer's inference of it — the answer, written down, by whoever drew it"* — and `logo-concept`'s variants-only path takes the same line for the same reason. An inferred derivation is the reviewer's inference, which is the one thing that record must not contain.

**An `UNRUN`'s remediation is evidence to obtain, never a change to the mark.** A remediation list that says "widen the counter" for a counter nobody measured is how an audit damages a sound mark.

### Step 1 — the mark, the record, and the specification

1. **Collect the set.** Every file the [existing-mark guard](#the-existing-mark-guard) found, plus anything the user named by path or supplied inline. The audit runs against the *set*, not one file: hygiene, the mono diff and the favicon's three tests are all cross-file.
2. **Vector source, or nothing — but a raster *beside* a vector is not a raster-only mark.** Layers 1 and 2 read the SVG. Two cases, and conflating them is how a sound set gets audited as though it had no source:

   - **A raster with a vector master in the same set** — the icon files `logo-concept` § Step 6.5 ships, or any equivalent. Grade the **vector**. The rasters are conversions of a geometry that is already being measured and add no evidence of their own; they are checked only by the raster provenance item in Layer 1 below.
   - **A raster with no vector anywhere** — a PNG, an ICO or a screenshot and nothing else. **Both layers are entirely `UNRUN`**, that is the first sentence of the report, and the single remediation is the vector master.

   In neither case is a stand-in derived from a bitmap. A source-derived stand-in is a different check wearing this one's name.
3. **Normalise the artboard.** `reproduction.md`'s pixel rule is stated on `0 0 256 256` and an external mark is usually on something else. Scale every measured value by `256 / <the longer side of the declared viewBox>` before comparing it to any threshold, and record the factor in the report header. A root `svg` carrying no `viewBox` at all is an artboard-hygiene FAIL in its own right; normalise off its `width` and `height` and say that is what you did.
4. **Read `docs/design/LOGO.md` if it exists.** Where it does, every slot is evidence and every empty slot is a finding — `logo.template.md` says an empty slot is a finding rather than a silence, and this flow is the reader that makes that true.
5. **Ask only what the record does not already answer**, one question per message, at most two:
   - **Where must this mark work?** — the same question 4 that `logo-concept` § Step 1 asks. Its consequences table is read **in reverse** here: each context the answer names turns a row that would be undecided into a graded one. Do not ask it where `LOGO.md` already carries the answer in § Variants and § Colour.
   - **What was the brief?** — asked wherever the record does not carry it, because two grades turn on it: `anti-slop.md` pattern 6 wherever its geometry clause hit, and Layer 3's Appropriateness always. A brief the user states at audit time is captured verbatim per [Shared Protocol](#shared-protocol) item 1 and recorded in the report as supplied at audit time rather than at drawing time. **Never infer it from the mark** — reconstructing a brief from a finished mark reconstructs the evidence. Where nobody can state it, both grades are `UNRUN`, which is exactly where `logo-concept`'s variants-only path leaves pattern 6.

### Step 2 — render the reproduction matrix

1. **Write the sheet.** Copy `templates/contact-sheet.template.html` to `docs/design/YYYY-MM-DD-logo-review-contact-sheet.html` and substitute its placeholders per the template's own **PLACEHOLDERS** comment. **Never overwrite `docs/design/logo-contact-sheet.html`** — that file is `logo-concept`'s record of what the mark was signed off against, and an audit that overwrites it has destroyed the evidence it exists to weigh.
2. **Three slots, three distinct square drawings** — the master, the favicon and the wordmark, in that order, with unused slots replaced by the empty string as the template prescribes. **No lockup goes in a slot:** `reproduction.md` § Full lockup fixes that the harness is built for the square artboard and a lockup rendered there reports its letterboxing. A set carrying more than three distinct square drawings gets a second sheet, dated and numbered.
3. **Screenshot twice and read both PNGs back** with `Read` — the full page and an element-scoped shot on `#readout`, at the viewport the template's **HOW TO SCREENSHOT IT** comment fixes, and after the readiness signal that comment names. Reading them back is the pass; taking them is not.
4. **The harness measures and returns no verdict** — [Shared Protocol](#shared-protocol) item 4. Never quote a readout row as a pass. Every row is routed to the layer that grades it and graded there.
5. **Without Playwright MCP**, [Shared Protocol](#shared-protocol) item 3 governs: **write the sheet anyway** — it is documentation, and it is what lets somebody with the MCP finish the pass without redoing the flow — then **stop at the screenshot**. Do not open the HTML, do not describe what it would have shown, and record every item whose evidence is that render as `UNRUN`. Layer 2 is unaffected; see Step 4.

**Which of `logo-concept`'s nine critique items this render is read for, and where each reading goes.** That checklist is cited, not restated:

| From `logo-concept` § The critique checklist | Routed to |
|---|---|
| C1, C2, C3, C4 | Layer 1 — the reproduction item each one names |
| C9 | Layer 1 — every `warn` and `bad` readout row, against the file its own note names |
| The readout's **`M3 inversion`** row | Layer 1 — `reproduction.md`'s mono-collapse **M3**, which this row is the whole evidence for. It is where the two-render diff is computed; nothing else in the plugin rasterises. Read the number, not the mono columns — those are a viewing aid for C3 and are a different check. |
| C7 | Layer 2 — the render half of the anti-slop scan |
| C8 | Layer 3 — Distinctiveness, and the collision note below |
| C5, C6 | **Not read here.** Both grade `construction.md`, which this flow does not audit — see [What this audit does not cover](#what-this-audit-does-not-cover). |

**The collision note.** [Shared Protocol](#shared-protocol) item 5 governs C8 in full: it sees, it does not search; it measures nothing; **it is not a trademark search** and is never described, softened or summarised as one; and where it has not run it is recorded unrun, never as "no collision found". The report carries `logo.template.md` § Trademark clearance — not performed's paragraph unedited, exactly as `LOGO.md` does.

### Step 3 — Layer 1, reproduction hazards

Grade every item on `reproduction.md` § The binary checklist, in that file's order and under its own group headings. **It is the criteria list; this is the grading** — the file says so itself, and it is the only place the items live.

Each item takes exactly one of **PASS**, **FAIL**, `n/a — <why>`, `UNRUN — <why>`. Which one is decided by the item's shape, and the four shapes are what make two agents land on the same verdict:

| Item shape | How it is graded |
|---|---|
| **Computed or read from the file** — the mono-collapse source tests, D2, the favicon's redraw tests, path complexity, the reuse ratio, clearspace, the computed minimums, artboard hygiene | From the source, always. No record and no render is needed, and the absence of either is not an excuse. |
| **File side with a record as its escape hatch** — the silhouette above M4's gate, D1's three states, the counter floor's four conditions, the favicon's dropped features | **PASS** where the file side clears on its own. Where it does not and the record is present, grade the record. Where it does not and there is no record, `UNRUN — no record; <the slot>`. |
| **Render-dependent** — M3, `φ_ink` and `φ_ctr`, a `text` element's right edge, an indeterminate stroked extent | From the render, or `UNRUN`. `reproduction.md` already fixes the indeterminate bracket as unrun rather than failed; do not re-decide it here. **M3 is read off the readout's `M3 inversion` row**, which the harness computes — an `UNRUN` on it now means the render did not happen or that row says why it could not, never that nothing computes it. |
| **Pure record** — every minimum citing its source, a floor-built mark naming its branch, the favicon's uniform weight recorded as a decision | From `LOGO.md` alone. Present and answered is a **PASS**; absent is `UNRUN — no record; <the slot>`. |

**Grade the item the checklist states, not the quantity underneath it.** Several items ask for a *recording* rather than a value — a `text` element's vertical extents are the clearest case, and `reproduction.md` says outright that they are not computable by anything in this skill. The item is therefore satisfied by a record that says so, and a set whose `LOGO.md` § Checks recorded unrun carries those rows **passes it**. Reading the quantity instead of the item would put every wordmark-bearing set permanently at PARTIAL for a reason `reproduction.md` calls honest.

**One consequence, stated so it is not mistaken for a defect: an external mark with no record cannot reach Layer 1 PASS.** The pure-record items have nowhere to be satisfied, so `PARTIAL — evidence-limited` is the ceiling until somebody writes the record. It is not a FAIL and must not be reported as one.

**Context-dependent items.** Where an item depends on a context the mark ships into and Step 1 established that context, grade it. Where a named context needs a variant the set does not ship, that is a **FAIL** — a mark cannot reproduce into a context it has no file for. Where the context was never established, the item is `UNRUN`, per the `n/a` needs a fact rule above.

**Raster provenance.** Where the set carries rasters alongside a vector master, one item, graded from the files and the record. **Ask first whether there is a record at all** — the two failures below are only reachable once there is:

- **No `LOGO.md`, or no *Raster files* table in it** — `UNRUN — no record; LOGO.md § Asset manifest → Raster files`, like every other pure-record item. **Not a FAIL.** Every raster is unaccounted for, but by the auditor's missing evidence rather than the mark's fault, and the two rows below do not fire.
- **A record exists, and a raster on disk has no row in it** — an undocumented asset, and a **FAIL**. A file that ships without appearing in the manifest that claims to list what ships is the manifest being wrong, which is a finding against a record that exists rather than against one that does not.
- **A record exists, and a row for a raster at or below 48 px names the master** — a **FAIL**. It ships the master at a size its own recorded minimum excludes, which is the one thing `logo-concept` § Step 6.5's routing exists to prevent, and no caveat repairs it.

**A raster is never graded on its own pixels.** It carries no geometry this skill can measure — the mono tests, the counter arithmetic and the silhouette all read the vector. An audit that opens a PNG to judge the mark has substituted the conversion for the thing converted.

This item is not on `reproduction.md`'s checklist and has no group there — it is a record question rather than a reproduction hazard. Report it in Layer 1's per-item table under its own name, and count it in the group row as `Raster provenance`, so the group counts still sum to the items graded.

### Step 4 — Layer 2, the anti-slop scan

All ten, in `anti-slop.md`'s order, every time. `anti-slop.md` carries a source signature for each and states that **none of the ten requires eyes to detect**, so the scan runs with or without a render and a negative signature is a PASS that does not wait on one.

| What the source signature says | Grade |
|---|---|
| **Absent** | **PASS**, decided from source — no record, no render, no brief. This is most rows on most marks. Pattern 6 is two clauses and both must hit: geometry absent is a PASS before the brief is consulted, which is how `anti-slop.md` grades its own vesica fragment. |
| **Present**, and the pattern is 2, 3, 4, 5, 7 or 10 | **FAIL.** `anti-slop.md` § Exactly which patterns this reaches: no exception exists, because each is a construction failure as well as a cliché and no derivation repairs a construction failure. Do not accept one. |
| **Present**, pattern 1 or 9, and `LOGO.md` carries Tests A and B | **PASS** where both answers carry it, **FAIL** where the record is present and they do not. Name which test carried it, so the next reviewer does not re-litigate it. |
| **Present**, pattern 6 or 8, and `LOGO.md` carries the strict Test A | The same, on the strict form only: a number that produced the geometry. A rationale for why the shape suits the brief is not a derivation and does not qualify. |
| **Present**, pattern 1, 6, 8 or 9, and there is no record | `UNRUN — no record; LOGO.md § Construction → Derivation answers for the anti-slop patterns`. |
| **Present**, pattern 6's geometry only, brief not established | `UNRUN — no brief; the brief that produced the mark is not on file`. |

**A render can add a finding under any of the ten. It cannot clear one.** The source signature is the test; a mark that does not read as a cliché in a 1360 px screenshot still has the signature in its file.

**A pattern that also fails an item in Layer 1 is one finding, not two** — `anti-slop.md` says so of patterns 2, 3, 4 and 10. It is listed once, carrying both layer references; both sub-verdicts still record their FAIL.

### Step 5 — Layer 3, the five-dimension critique

Score 1 … 5 on each. Use the bands strictly and do not grade-inflate. **The score is the floor — the worst dimension — not the average**, for the reason `ui-review` gives: an average hides the worst dimension. 5/5/5/5/1 fails on Versatility alone, and that is correct, because a logo that cannot reproduce is not a logo.

| Dimension | What it grades | Scored from | 1 — Broken | 3 — Functional | 5 — Exceptional |
|---|---|---|---|---|---|
| **Distinctiveness** | Could a competitor use this mark unchanged? | the vision pass (C8), Layer 2's signature results, and `LOGO.md` § Construction's derivation chain | substitutable for any mark in the category; nothing derived | recognisably this category, with one element derived rather than chosen | no element placed without a number that produced it, and nothing else in the category looks like it |
| **Simplicity** | Can it be described in one sentence, and redrawn from that sentence? | node and counter counts per `reproduction.md` § Path complexity, plus the derivation chain. **Source only — never `UNRUN`.** | over a complexity ceiling, or needs a paragraph to describe | inside every ceiling; one sentence with a clause per element | one seed and one rule; the sentence is shorter than the file |
| **Memorability** | What survives one look | the full-page shot | nothing recalled but a colour | one feature recalled | the silhouette alone identifies it |
| **Appropriateness** | Does the form serve *this* product, or any product in its category? | the brief — from `LOGO.md` § Concept & rationale, or as the user stated it at Step 1 | contradicts what the brief asked for | fits the category and nothing narrower | reads off this product specifically; the brief's own words are visible in the form |
| **Versatility** | Does it survive every context it is specified for? | Layer 1's own results | Layer 1 FAILs a minimum-size, mono-collapse, dark-inversion or favicon item | Layer 1 is PASS and every specified context has a variant | Layer 1 is PASS with margin — counters at the target plus the dark increment, a favicon redrawn rather than scaled, print minimums computed per named process |

**A dimension is scored only where every evidence source its row names is available.** Where one is missing it is `UNRUN — <the missing source>`, never a guess and never a 3. Two consequences worth stating because they are what make this cheap rather than paralysing:

- **Versatility is `UNRUN` whenever Layer 1 is PARTIAL, and that costs nothing** — Layer 1 has already capped the verdict at PARTIAL, so the second cap changes no outcome. Where Layer 1 FAILs, Versatility is scored 1 or 2 from the row above, not `UNRUN`; a check that ran and failed is never excused by one that did not run.
- **Simplicity is never `UNRUN`.** Its evidence is the file, and the file is always there.

**Report the floor and the average over the scored dimensions only, and print the average with its denominator** — an average over three of five is not comparable to one over five, and a bare number invites the comparison.

### Step 6 — the verdict

Per layer first, then the worst of the three. The sub-verdict table is `ui-review`'s shape with the third state added to each row:

| Layer | PASS | PARTIAL | FAIL |
|---|---|---|---|
| 1 — Reproduction hazards | every item PASS or `n/a` | any item `UNRUN`, and no item FAIL | any item FAIL |
| 2 — Anti-slop scan | all ten PASS | any pattern `UNRUN`, and no pattern FAIL | any pattern FAIL |
| 3 — Five-dimension critique | no dimension `UNRUN`, floor ≥ 3, average ≥ 3.5 | no scored dimension ≤ 2, and either a dimension is `UNRUN` or the average is under 3.5 | any scored dimension ≤ 2 |

**Final verdict: the worst of the three.** Any FAIL makes the report FAIL.

**Where the verdict is PARTIAL, say which kind it is on the verdict line**, because the two mean opposite things to the reader:

- **`PARTIAL — evidence-limited`.** Every shortfall is an `UNRUN`. Nothing was measured and found wanting.
- **`PARTIAL — findings`.** At least one item is short on its own merits.

**The fully-unrun report is the common case for a user without Playwright MCP, and it must not read as a failure of the mark.** With no render and a complete `LOGO.md`, Layer 1 is PARTIAL on its render-dependent items, Layer 2 is PASS in full, and Layer 3 carries scores for Simplicity and Appropriateness with the rest `UNRUN`. The verdict is `PARTIAL — evidence-limited`, and the rationale says in its first sentence that no finding was raised against the mark and that the gap is the render. **That is the best verdict this skill can issue without a render, and it is a statement about the evidence, not about the mark.** Never present it as a defect, and never soften it into a PASS.

**One consistency check, and it runs every time.** Layers 1 and 2 are exactly the gates `logo-concept` already applies: its two-iteration cap withdraws any candidate failing a binary reproduction item, its Step 2 and Step 3 run the anti-slop signatures before and after drawing, and its Step 7 verification render re-checks the final assets. **So a mark this skill produced cannot legitimately FAIL Layer 1 or Layer 2.** If one does, that is a bug in `logo-concept`, not a finding against the mark: say so in the report, name the step that should have caught it, and do not file it as a defect in the drawing.

Layer 3 carries no such guarantee and must not. `logo-concept` never claimed the mark was good — the user picked it at Step 5 — so a conformant mark scoring 2 on Distinctiveness is this layer working, not the two flows disagreeing.

### Step 7 — the report and the commit

Write `docs/design/YYYY-MM-DD-logo-review.md`. **The reader has to find the failing item without reading the file**, which is what fixes the shape below: a verdict line, a three-row summary, then the failures. Layer 1 is the only layer whose passing items are not listed individually — its group counts are what keep the coverage auditable without printing a checklist nobody reads.

**If that path already exists, do not overwrite it.** Append `-2`, `-3` and so on, and name the prior report in the new one's header. The reason is the one given at Step 2 for the contact sheet: a second audit on the same day is usually a re-audit *after* remediation, so the earlier report is the evidence that the remediation was needed. Destroying it leaves a clean verdict with nothing showing what it replaced — and an audit trail that only ever holds the latest verdict is not an audit trail. The same applies to the sheet at Step 2, which shares the dated stem.

```markdown
# Logo Review: <product name>

**Date:** YYYY-MM-DD
**Mark audited:** <every file in the set, by path>
**Record:** `docs/design/LOGO.md`, or `absent — the mark was not drawn by this skill`
**Render:** `docs/design/YYYY-MM-DD-logo-review-contact-sheet.html`, or `not run — Playwright MCP absent`
**Artboard normalisation:** `× <factor>` from the declared viewBox, or `none — already 0 0 256 256`
**Verdict:** PASS | PARTIAL — evidence-limited | PARTIAL — findings | FAIL

## At a glance

| Layer | Sub-verdict | PASS | n/a | UNRUN | FAIL | The worst item |
|---|---|---|---|---|---|---|
| 1 — Reproduction hazards | | | | | | |
| 2 — Anti-slop scan | | | | | | |
| 3 — Five-dimension critique | | <floor> / <average> | | | | |

Layer 3 reports its floor and its average in place of the PASS and n/a counts.

## Layer 1 — Reproduction hazards

One row per checklist group with its counts, under the group headings the
checklist itself uses; then one row per item that is not PASS. A passing item
is not listed individually — the counts are what make the coverage auditable.

| Group | PASS | n/a | UNRUN | FAIL |
|---|---|---|---|---|

| Item | Status | Measured | Held against |
|---|---|---|---|

## Layer 2 — Anti-slop scan

All ten, always, in order.

| # | Pattern | Status | Evidence |
|---|---|---|---|

## Layer 3 — Five-dimension critique

| Dimension | Score | Evidence |
|---|---|---|
| **Floor** | | <which dimension> |
| **Average** | | over <n> scored of 5 |

## Findings, prioritised

FAILs first in layer order, then every UNRUN, then any dimension scoring 3.
Each names the layer, the item, what was measured against what, and the
remediation. An UNRUN's remediation is the evidence to obtain — never a change
to the mark.

## Verdict rationale

## What was not audited
```

**Fixed text that ships unedited:** `logo.template.md` § Trademark clearance — not performed's paragraph, into *What was not audited*. It is not paraphrased and not summarised, and no sentence anywhere in the report describes the vision pass as a search.

#### What this audit does not cover

Named in the report, every time, so that a PASS is not read as more than it is:

- **Trademark, design-mark and prior-art clearance.** Nothing here measures collision with an existing mark. [Shared Protocol](#shared-protocol) item 5.
- **`construction.md` conformance.** The grid, the permitted values and the nine corrections are a *drawing* standard for marks this skill draws — `logo-concept` gates them at its Step 3 self-check and its Step 7 structural verification. An external mark was not drawn to that grid, and grading it there would emit a wall of failures against a mark whose only fault is not having been made here. Where a construction rule genuinely reaches reproduction, `reproduction.md` already imports it by reference and Layer 1 grades it through that import.
- **Brand strategy, naming, and the market the mark competes in.** Layer 3's Appropriateness grades the form against the brief; it does not grade the brief.
- **Anything the report records `UNRUN`.** The rows are listed, not summarised.

#### The review's commit

[Shared Protocol](#shared-protocol) item 7. Supply the triple to `project-orchestration`'s **Commit & Release Protocol**, which loads the host project's `docs/planning/CONVENTIONS.md`, runs the branch guard, and renders the message:

- **`type`** — `docs`
- **`scope`** — resolved by the protocol from the host project's `Scope source`; where no allowed scope matches, its `Fallback when scope not allowed` decides. Do not invent one.
- **`subject`** — `add logo review — <product name>, <verdict>`

Stage by explicit pathspec — the report and the review's own contact sheet, and nothing else. **The audited files are not staged**: this flow did not change them, and a review that appears in a diff alongside the mark it graded is indistinguishable from a review that edited it.

**Render nothing locally.** No message literal, no message format, no tag scheme, anywhere in this flow.

Then announce the verdict in conversation with the layer that produced it, the FAIL count, the `UNRUN` count, and the top three findings. Where the verdict is `PARTIAL — evidence-limited`, the first sentence says that no finding was raised against the mark.

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
