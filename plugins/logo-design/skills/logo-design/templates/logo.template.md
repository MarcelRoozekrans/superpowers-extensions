# Brand Mark — `<product name>`

**Product:** `<product name>` · **Mark type:** `<geometric | monogram | wordmark | abstract>` · **Generated:** `<YYYY-MM-DD>` · **Design system:** `../design/MASTER.md`, or `absent — no design system`

> The record for one mark, saved at `docs/design/LOGO.md`. `logo-concept` fills it in; `logo-review` audits against it. Every value the skill's reference files ask to be written down has a slot below, and an empty slot is a finding rather than a silence.

## Recording conventions

Read this before filling anything in. The distinction it draws is the point of the file: a rule that never reached this mark and a rule that was never run must not look the same.

| Token | Means | Reach for it when |
|---|---|---|
| a value | **Recorded.** The number, the name, or the sentence. | It was done, and this is the result. |
| `n/a — <why>` | **Not applicable.** The rule does not reach this mark at all. | A geometric mark has no webfont. A mark with no drawn container takes no container split. |
| `declined — <why>` | **Applicable, deliberately not taken.** A recorded deviation from a rule that binds. | A uniform ring, where correction 4 binds and was not applied. |
| `UNRUN — <what would decide it>` | **Applicable, not done.** Never a pass. | The contact sheet did not run, so the wordmark's fit is unmeasured. |
| empty | Never valid. | — |

Four rules on top of the table:

- **Every token carries a reason after the dash.** A bare `n/a` is the same failure as an empty cell — it asserts a judgement without the fact that produced it.
- **`grep UNRUN` over this file lists everything this record admits it does not know.** That list is the honest one. It is not a list of failures, and it must never be emptied by promoting an unrun check to a passed one.
- **Cite, do not copy.** Where a threshold decided a value, name the reference file and its section in the source column. The value belongs here; the rule does not. A threshold copied into this file is a second copy that goes stale.
- **Examples are not content.** Every block headed **Example —** is illustrative, drawn from an already-audited fragment in the skill's reference files. Delete all of them from a real record.

Citations name a reference file and a section — `construction.md § Counter discipline` — rather than linking, because this file lives in the project and the references live in the skill.

## Concept & rationale

`<Two or three sentences: what the mark is, and what it means. No colour words — if the sentence collapses without one, see anti-slop.md pattern 10.>`

| Field | Record |
|---|---|
| The brief, in one line | `<what was asked for>` |
| Why this candidate won | `<what it does that the other two did not>` |
| Candidates rejected | `<B: reason>` · `<C: reason>` |
| Keywords present from anti-slop.md pattern 6's list | `<the ones the brief contains, or "none">` |
| Type chosen because | `<the signal from mark-types.md § Choosing the type — where the type was derived rather than asked for, the string length and the reproduction contexts it was derived from>` |
| Mark–name relationship | `<how the mark carries the string set in type>`, or `the mark does not reference the name — <the type the derivation produced, the type taken instead, and why>` |

## Construction

Everything a reviewer needs to re-derive this mark without having been there. `logo-review` reads this section for the derivation answers that no source test can supply.

### The rule, and the derivation chain

**Seed:** `<the first element, as one sentence — what was placed, where, at what size>`

**Rule (abstract marks):** `<the rule as one sentence, per mark-types.md § Abstract>` or `n/a — <type>`

Every element after the first is one application of an element already placed. A row that cannot name what produced its number is the failure mark-types.md describes under each type.

| Element | Derived from | Arithmetic | Result |
|---|---|---|---|
| `<element>` | `<seed, or an earlier element>` | `<the computation>` | `<the coordinates or dimensions it fixed>` |

> **Example — mark-types.md's vesica.**
>
> | Element | Derived from | Arithmetic | Result |
> |---|---|---|---|
> | Seed circles, `r` 96 at (80,128) and (176,128) | placed on the grid | centre distance 96 = `r`, so each centre sits on the other's circumference | lens x-extremes 80 and 176 |
> | Lens cusps | the two seed circles | 96 × √3/2 = 83.14 | cusps at y 44.86 and 211.14, interior angle 120° |

### Optical exceptions

Every `OPTICAL:` flag in every shipped file, copied verbatim, so the exception list is auditable by someone who was not there when it was drawn.

| Variant | Flag, verbatim | Distinct reason |
|---|---|---|
| `<file>` | `<the flag text as written in the file>` | `<the reason it counts against, numbered so repeats of one construction share a number>` |

**Surviving flags:** `<count of distinct reasons>` against construction.md § Precedence's ceiling. **Flags in a separate dark master:** `<count, or n/a — no fork>` (see Colour).

> **Example —** `OPTICAL: cusp y 128 ± 83.14 · lens cusp from grid circles · 96 × √3/2 = 83.14` — one reason, covering both cusps.

### The nine corrections

One row per correction. `n/a` means it does not reach this mark; `declined` means it binds and was not taken, which is a recorded deviation and not an exemption.

The rows below are the master's. The favicon is its own drawing, not a scale of the master — where it answers a correction differently, add a second row for that correction naming the variant.

| # | Correction | Status | How it was answered |
|---|---|---|---|
| 1 | Overshoot at a shared edge | `<value / n/a / declined / UNRUN>` | `<the arithmetic, or why it does not reach this mark>` |
| 2 | Whole-shape size matching | | |
| 3 | Apex centring | | |
| 4 | Horizontal strokes read heavier | | |
| 5 | Perpendicular stroke width | | |
| 6 | Placement inside a drawn container | | |
| 7 | Corners and joins | | |
| 8 | Rotation | | |
| 9 | Optical sidebearings | | |

> **Example — reproduction.md's favicon ring, correction 4.** `declined — correction 4 would take the ring to 30.72 at its horizontal tangents, 1.92 px against 2.00 px at the only size this variant renders at; the correction is below the resolution of every size this variant renders at.`

A uniform ring, a lone horizontal left at its declared weight, or any other decision not to apply a correction that binds is recorded here as `declined` with its reason. Left blank, it reads as an oversight, which is what construction.md § Optical correction says it must not.

### Stroke and counters

| Field | Record | Source |
|---|---|---|
| Declared weight(s) | `<w>`, or `<w1 : w2>` in a named ratio | construction.md § Stroke discipline |
| Construction | `<filled / stroked>` | |
| Narrowest ink | `<units>` | |
| Widest ink | `<units>` | |
| Thick–thin axis | `<ratio, recorded as a design decision where the widest ink exceeds the threshold in construction.md § Stroke discipline>`, or `n/a — <ratio, under it>` | |
| Counter count at 256 | `<n>` | |

| Counter | Family | Narrowest width | Clears | Source |
|---|---|---|---|---|
| `<which hole>` | `<concentric round / parallel straight / not computable>` | `<units>` | `<target / floor / UNRUN>` | `<the formula it was computed from>` |

A counter that is neither concentric-round nor parallel-straight has no closed-form narrowest point. Record it — `UNRUN — no closed-form narrowest point; the 16 px contact-sheet row decides` — and do not guess a number. Where a counter sits below the target, the floor decision belongs in [Clearspace & minimum sizes](#clearspace--minimum-sizes), not here.

> **Example — mark-types.md's vesica.** Narrowest ink 16 at y 128 (`96 − 48 − 32`); this is a filled form, so the narrowest ink is the weight. Widest ink 51.14 at the cusp, 3.2× the narrowest — recorded as a thick–thin axis.

### Silhouette

| Field | Record |
|---|---|
| Ink area, computed analytically | `<units²>` |
| Convex hull area | `<units²>` |
| Ratio | `<ink / hull>` |
| Deliberate primitive? | `n/a — <ratio is at or under reproduction.md § Mono collapse's M4 gate>`, or `<the sentence naming the solid disc, triangle or other primitive as the intended silhouette>` |

### Derivation answers for the anti-slop patterns

Two patterns cannot be decided from source, and two more need the number that produced the geometry. The answers live here — written by whoever drew the mark, not inferred by a reviewer.

| Pattern | Applies? | Test A — what produced this number | Test B — what is left when the feature is removed |
|---|---|---|---|
| 1 — circle with a gap | `<yes / n/a — no interrupted ring>` | `<what fixed the gap's angular width, and what fixed its position>` | `<is the closed-ring version worse, and why>` |
| 9 — hexagon container | `<yes / n/a — no hexagon>` | `<what fixed the across-corners dimension>` | `<is the mark worse with the container deleted>` |
| 6 — the lens | `<yes / n/a — <no lens, or no keyword in the brief>>` | `<the radius, angle or element the geometry was derived from — strict form>` | `n/a — Test B does not apply to this pattern` |
| 8 — the loop | `<yes / n/a — no lemniscate>` | `<the radius, angle or element the geometry was derived from — strict form>` | `n/a — Test B does not apply to this pattern` |

A rationale for why the shape suits the brief is not a derivation and does not qualify for patterns 6 and 8. Record which test carried the mark, so the next reviewer does not re-litigate it. The other six patterns have no exception available; nothing is recorded for them here.

### Type-specific records

Fill the row for this mark's type; the rest are `n/a`.

| Field | Applies to | Record |
|---|---|---|
| Base sidebearing `s` | monogram | `<value, solved back from the row fit — the file carries the gap, not s>` |
| Container clearance at the letterform's nearest point, after correction 6 moved it | monogram | `<value>` and `<the target it clears>` |
| Wordmark model | wordmark | `<single text run — the default>`, or `<individually placed glyphs, taken deliberately, with the flag-count consequence>` |
| Tracking | wordmark | `<letter-spacing = font-size × t, both numbers>` |
| Fit | wordmark | `<the fitted size, measured off the ink edge>`, or `UNRUN — the contact sheet has not run; the recorded size is a starting value, not a measured result` |
| Row asymmetry | wordmark | `<the statement that fitting the right ink edge does not put the left ink edge on the live-area bound, because the anchor is an origin and the first glyph's ink starts a sidebearing inside it>` |
| The one custom detail | wordmark | `<what it is, where it is anchored, and whether its position needed a measurement>` |
| Rule applications | abstract | `<count>` |

## Variants

Every shipped file, its use, and its minimum size. **Every minimum cites the formula or the measurement it came from** — a threshold recorded without its source cannot be re-checked when the mark or the typeface changes.

| File | Intended use | `viewBox` | Aspect | Minimum size | Source of the minimum |
|---|---|---|---|---|---|
| `logo-mark.svg` | `<use>` | `0 0 256 256` | 1:1 | `<px>` | `<formula from reproduction.md § Minimum sizes, with this mark's narrowest counter substituted>` |
| `logo-full.svg` | `<use>` | `<declared>` | `<w:h>` | `<px width>` | `<derived from its components — see the lockup block below>` |
| `logo-stacked.svg` | `<use>` | `<declared>` | `<w:h>` | `<px width>` | `<derived — same>` |
| `logo-wordmark.svg` | `<use>` | `0 0 256 256` | 1:1 | `<px width>` | `<measured — the φ values come off this file's own 256 px render; see the lockup block below>` |
| `logo-mono-black.svg` | `<use>` | `0 0 256 256` | 1:1 | `<inherits logo-mark's>` | `<the currentColor binding — same geometry>` |
| `logo-mono-white.svg` | `<use>` | `0 0 256 256` | 1:1 | `<inherits>` | `<same, or the fork recorded in Colour>` |
| `logo-favicon.svg` | `<use>` | `0 0 256 256` | 1:1 | `<px>` | `<reproduction.md § The favicon redraw>` |

Non-square variants declare their `viewBox` above; the aspect column is what each lockup's width minimum is computed from. Square variants all carry the identical `viewBox`.

### Lockup measurements

**`logo-wordmark.svg` is square — `0 0 256 256`, like the master.** Only the two lockups are non-square, per `reproduction.md` § Artboard hygiene. This is load-bearing rather than incidental: the whole measurement route below depends on the wordmark being renderable by the contact sheet, which stops on a non-square `viewBox`. A non-square wordmark silently removes the only variant the `φ` values can be taken from, and the failure surfaces as an unexplained `UNRUN` several sections later. The row above is pinned, not a placeholder.

**The two `φ` values are measured off the `logo-wordmark` variant's 256 px render on `logo-concept`'s contact sheet, not off a render of the lockup.** They are properties of the type — stem width and counter width against their own cap height — and the wordmark is the square-artboard variant that carries it. The lockup's own minimums are then **derived** from those `φ` values, from `k`, and from its declared `viewBox`; the lockup itself is checked for composition and clearspace only. Changing the typeface invalidates every row.

| Field | Record |
|---|---|
| `k` — mark's rendered height ÷ lockup cap height | `<ratio>` |
| Cap-height minimum from the mark side | `<px>` = `<mark-alone minimum>` ÷ `k` |
| `φ_ink` — narrowest ink ÷ cap height, off the `logo-wordmark` render | `<measured>`, or `UNRUN — the contact sheet has not run` |
| `φ_ctr` — narrowest counter ÷ cap height, off the same render | `<measured>`, or `UNRUN` |
| Cap-height minimum from the type side | `<px, rounded up per reproduction.md § Full lockup>` |
| Lockup `viewBox` width ÷ cap height inside the lockup | `<ratio, read off the lockup file — not measured>` |
| Lockup width minimum | `<px, derived from the row above and the cap-height minimum>` |
| Lockup's own size status | derived from its components — the mark side from `k`, the type side from the wordmark's `φ`. The lockup is not size-tested on the contact sheet. |
| Typeface the `φ` values were measured against | `<family, weight>` |

### Favicon

The favicon is a redraw, not a scale. Record what it dropped, in reproduction terms — "simplified for small sizes" is not a reason.

| Feature dropped | Why, in reproduction terms |
|---|---|
| `<feature>` | `<the measurement, the device px it works out to, and what it does to the raster>` |

> **Example —** the crossbar counter measured 24 units, which is 1.5 px at 16 and greys at any device pixel ratio that is not 1 or 2.

| Field | Record |
|---|---|
| Nodes — favicon / master | `<n>` / `<n>` |
| Counters — favicon / master | `<n>` / `<n>` |
| Subpaths shared with the master | `<none, or the finding>` |
| Declared weight | `<units>` |
| Ink reaches the live-area bounds on its longer axis | `<which box it was graded on>`, or `UNRUN — <the bracket>` |
| Uniform weight | recorded as a `declined` correction in [Construction](#the-nine-corrections) |

### Raster set

The files hosts read when they cannot read SVG. Every row names the SVG it was rasterised from — a raster whose source is not recorded cannot be regenerated when the mark changes.

**Nothing here is graded.** `reproduction.md`'s checklist is graded on the vector source; these are conversions of an already-measured geometry.

| File | px | Rasterised from | Intended slot |
|---|---|---|---|
| `favicon-16.png` | 16 | `logo-favicon.svg` | `<link rel="icon" sizes="16x16">` |
| `favicon-32.png` | 32 | `logo-favicon.svg` | `<link rel="icon" sizes="32x32">` |
| `favicon-48.png` | 48 | `logo-favicon.svg` | legacy browser tab |
| `favicon.ico` | 16/32/48 | `logo-favicon.svg` | site root, for hosts that ignore `favicon.svg` |
| `apple-touch-icon.png` | 180 | `logo-mark.svg` | iOS home screen |
| `icon-192.png` | 192 | `logo-mark.svg` | web app manifest |
| `icon-512.png` | 512 | `logo-mark.svg` | web app manifest, splash |
| `icon-1024.png` | 1024 | `logo-mark.svg` | app store listing |

**The routing is a rule, not a convenience.** Everything at or below 48 px comes from the favicon redraw and everything above it from the master, because the favicon is drawn for those sizes and the master is specified above its own computed minimum. A master rasterised at 16 px is a mark this skill's own reproduction layer already failed.

| Field | Record |
|---|---|
| Rasteriser used | `<name and version>`, or `UNRUN — no rasteriser on the machine that ran this; install one of the four the exporter names` |
| Sizes at or below 48 px come from the favicon redraw | `<yes>` — never the master; see `reproduction.md § The favicon's own spec` |
| Files written | `<n of 8>`, or `0 — UNRUN` |

Where the exporter returned `UNRUN`, every row above carries that token, no raster file is on disk, and the install step is in [Still to do](#still-to-do).

### Print minimums

One row per process the brief named. `L` and `g` come from the vendor's own spec sheet where one exists; where they are trade defaults, say so.

| Process | `L` mm | `g` mm | Source of `L` and `g` | Minimum |
|---|---|---|---|---|
| `<process>` | `<value>` | `<value>` | `<vendor spec / trade default from reproduction.md § Print>` | `<mm, from this mark's own u_ink and u_ctr>` |

## Colour

### Binding

| Role | `MASTER.md` source | Resolved value |
|---|---|---|
| Mark on light | Color Palette → Neutrals → Text primary | `<value>` |
| Mark on dark | Color Palette → Neutrals → Background, or pure white | `<value>` |
| Accent, two-colour derived variants only | Color Palette → Primary | `<value>`, or `n/a — single-value mark` |
| Background pairings tested | Color Palette → Neutrals → Background and Surface | `<values>` |

**Where `MASTER.md` is absent:** replace the table above with this line, and nothing else — `currentColor` only; no palette was invented, and `ui-design-system` was suggested. Never bind to a semantic colour.

### Contrast

| Variant | Against | Ratio | Clears 3:1 (WCAG 2.2 SC 1.4.11) |
|---|---|---|---|
| `<file>` | `<background>` | `<computed>` | `<yes / no>` |

### One-colour print and mono

| Field | Record |
|---|---|
| Mono collapse M1 — every paint is `currentColor` | `<yes, or the finding>` |
| M2 — no element's geometry wholly inside another's | `<yes / n/a — one path, knockout only>` |
| M3 — inversion identity at 256 px | `<max per-channel difference, from the contact-sheet readout's M3 inversion row>`, or `UNRUN — the contact sheet has not run`. On a variant carrying `text`, record the drawn geometry's number and the type's share as unrun, per reproduction.md § Mono collapse |
| M4 — ink ÷ hull | recorded in [Construction § Silhouette](#silhouette) |
| One-colour print | `<the value it prints in, and the process>` |

### Dark inversion

| Field | Record | Source |
|---|---|---|
| `r`, the reversed-weight compensation rate | `<value inside the band, recorded because it differs from the pinned rate>`, or `default — the rate pinned in reproduction.md § r is pinned` | |
| `r · w` for this mark | `<units>` | |
| Fork threshold at this `w` and `r` | `<px, computed from the expression in reproduction.md § When the dark variant forks>` | Never copy the worked table's numbers; compute this mark's. |
| **D1 — the dark fork** | exactly one of the three rows below | |
| — no fork, below the threshold | `logo-mono-white` is byte-identical to `logo-mono-black` apart from the resolved `color`; the dark variant ships below the threshold above, where the compensation is under one device pixel | |
| — no fork, at or above the threshold | the compensation was **not** taken; the dark variant is nominally heavy by `r · w` = `<units>` at `<the size it ships at>` | |
| — forked | `<why>` · **ships at:** `<size>` · **its own flag count:** `<n>` · construction.md's derivability guarantee does not cover it | |
| **D2** — every counter reduced by `r · w` still clears its target | `<the reduced widths>` | |
| Counters drawn at target plus compensation | `<yes / n/a — no dark variant>` | |

## Clearspace & minimum sizes

Per-variant minimum sizes are in the [Variants](#variants) table, with their sources. They are not repeated here.

### Clearspace

| Field | Record |
|---|---|
| Largest **enclosed** counter | `<which one>`, `<dimensions>` |
| Widest axis of it | `<units>` |
| Rounded up to a whole grid unit | `<units>` |
| Floor applied? | `<yes — no qualifying enclosed counter, or the counter is under the floor>` / `<no>` |
| **Clearspace** | `<units>` = `<%>` of the mark's rendered size |
| Datum | the artboard edge, per reproduction.md § Clearspace — never the ink, and the live area's margin is not counted toward it |
| For the lockup | `<units ÷ 256 × H>` on all four sides of the lockup's bounding box, where `H` is `<the mark's height inside the lockup>` |

> **Example — mark-types.md's pinwheel.** Its four notches open outward, so it has no enclosed counter and takes the floor.

### The counter floor

Fill this only if a counter sits under the target. All four conditions must be met — the aggregate list is in reproduction.md § The counter floor, in aggregate.

| Condition | Met? |
|---|---|
| Declared weight is 16 or 32 | `<yes / no>` |
| Never rendered below 32 px, **or** only at sizes you control that are integer multiples of 16 px | `<which branch, and why it holds>` |
| No dark variant | `<yes / no>` |
| No favicon | `<yes / no>` |

**What the floor costs:** `<the minimum render size this branch leaves>` — the two branches of the render-size condition above do not cost the same, so name the branch and take the number from reproduction.md § Minimum sizes. Recorded here and carried into the Variants table. If any condition fails, the counter meets the target instead and this block reads `n/a — every counter clears the target`.

## Misuse

The specific ways **this** mark breaks. Every row names a number from this file; a row that would be true of any logo is not doing work.

| Do not | What breaks, in this mark's terms |
|---|---|
| Render `logo-mark` below `<its minimum>` | `<which feature closes, and at what device px>` |
| Scale the master down to favicon size | `<what the favicon redraw dropped, and why the master cannot carry it>` |
| Place ink closer than `<the clearspace value>` | `<the counter that gets recruited into the form>` |
| Recolour, add a gradient, a filter, or a shadow | `<what the mark loses on collapse>` |
| Use it on a ground under 3:1 | `<the pairings that fail>` |
| Reset the wordmark in another face | `<every measured minimum in this file was taken against the recorded typeface>` |
| Use the `text`-bearing wordmark where the webfont is not guaranteed | outline conversion has not been performed — see [Production handoff](#production-handoff) |
| `<mark-specific>` | `<mark-specific>` |

## Production handoff

### Outline conversion — not performed

**This skill has no font engine and does not convert type to outlines. That is an explicit non-goal, not an oversight.** Where this mark ships a `text` element, the master resolves against the declared webfont at render time. **Outline conversion has NOT been performed here.** It must happen before the mark is used anywhere the webfont is not guaranteed — print, embroidery, a third party's site, an email client. Until it has, a `text`-bearing wordmark is not a finished asset.

This paragraph ships with the template and is not edited or removed. Where the mark carries no `text` element, add one line under it: `n/a — no text element in any variant`.

### Typeface

A wordmark whose typeface is not written down is not reproducible.

| Field | Record |
|---|---|
| Family | `<name>`, or `n/a — no text element` |
| Weight | `<value>` |
| `letter-spacing` | `<value>`, and `t` = `<ratio to font-size>` |
| Fallback stack | `<as written in the file>` |
| Licence / where it is hosted | `<record, or UNRUN — not established>` |

### Trademark clearance — not performed

**No trademark, design-mark or prior-art clearance has been performed, and nothing in this skill measures collision with an existing mark.** A vision pass over a contact sheet can notice a resemblance it happens to recognise; that is not a search, and it did not run as one here. Clearance is a step for counsel, before the mark is used commercially or filed.

This paragraph ships with the template and is not edited or removed.

### Checks recorded unrun

An unrunnable check recorded as unrun is honest; an unrunnable check reported as passed is not. Every row here is a check that applies and was not run — never one that does not apply.

| Check | Why it could not be run | What would decide it |
|---|---|---|
| `text` element top and bottom extents | `getBBox()` returns the layout box — ascent to descent — not tight ink, and the relation between them is a property of the face | `<nothing available in this skill>`, or `n/a — no text element` |
| `text` element left extent | the anchor is an origin, not a painted edge; a negative left sidebearing puts ink to the left of it | `n/a — no text element`, or `<what would decide it>` |
| `text` element right extent | graded on the harness's `ink edge`, never `advance edge` | `<the reading>`, or `UNRUN — the contact sheet has not run` |
| Stroked containment, indeterminate | geometry box inside the bounds, `ink bbox` outside — the true ink is between them | `<both boxes and the gap>`, or `n/a — filled mark, the two boxes coincide` |
| `<check needing a render>` | the contact sheet did not run — Playwright MCP absent | `<the render>` |

Where the contact sheet did run, every row it settled is recorded with its value and removed from this table. Where it did not, every render-dependent item on reproduction.md's binary checklist belongs here.

### Still to do

| Step | Status |
|---|---|
| Outline conversion | **not performed** — see above |
| Trademark clearance | **not performed** — see above |
| Declared face installed where the sheet renders | `<yes — the measured rows below carry values>`, or `not performed — <the face>; k, both cap-height minimums, the width minimum, φ_ink and φ_ctr in [Lockup measurements](#lockup-measurements), and the wordmark Fit in [Type-specific records](#type-specific-records), stay UNRUN until it is` |
| Icon raster set exported | `<yes — n files, rasteriser <name>>`, or `not performed — no rasteriser on the machine that ran this; the SVG set ships and the eight rows in [Raster set](#raster-set) stay UNRUN until it is` |
| `<any other step this mark hands off>` | `<status>` |

## Asset manifest

Every file that ships, and nothing that does not. A file in the directory and absent from this table is either a leftover or an undocumented variant; both are findings.

| Path | Role | `viewBox` | Nodes | Distinct `OPTICAL:` reasons | Notes |
|---|---|---|---|---|---|
| `<path>` | `<variant role>` | `<declared>` | `<n>` | `<n>` | `<reuse ratio, or anything the file carries that the tables above do not>` |

| Field | Record |
|---|---|
| Files in the set | `<n>` |
| Every variant carries `role="img"` and an `aria-label` naming the product | `<yes, the favicon included>` |
| No `width` or `height` on any root `svg` element | `<yes>` |
| No empty groups, unreferenced `defs`, or surviving construction geometry | `<yes>` |
| Mono variants diffed against their source | `<result, or the fork recorded in Colour>` |
| Every variant's ink sits inside the live area | `<which box each was graded against, and whether the two boxes coincided>`, with any indeterminate result carried into [Checks recorded unrun](#checks-recorded-unrun) |
| Raster files recorded in [Raster files](#raster-files) | `<n>`, or `n/a — UNRUN, no raster shipped` |

### Raster files

The table above records geometry. A raster has none — it records provenance, which is the only thing about it that can go stale.

| Path | px | Rasterised from | Bytes |
|---|---|---|---|
| `<path>` | `<n, or 16/32/48 for the ico>` | `<the SVG in the table above>` | `<n>` |

| Field | Record |
|---|---|
| Files in the raster set | `<n of 8>`, or `0 — UNRUN, no rasteriser` |
| Every raster's source appears in the SVG manifest above | `<yes>` |
| Rasteriser used | `<name and version>`, or `UNRUN — <why>` |
