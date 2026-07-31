# Brand Mark — `SPX`

**Product:** `SPX` · **Mark type:** `geometric` · **Generated:** `2026-07-31` · **Design system:** `absent — no design system`

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
- **Examples are not content.** Every block headed **Example —** is illustrative. All of them have been deleted from this record.

Citations name a reference file and a section — `construction.md § Counter discipline` — rather than linking, because this file lives in the project and the references live in the skill.

## Concept & rationale

Two square frames of one weight, the second the first translated by three quarters of its own side, meeting on a single shared wall block. The frame is the construction the suite already is; the extension is the same construction, one step on, joined to it by exactly one wall rather than bolted onto it. Nothing in the mark is placed: the translate's position, both counters and every edge fall out of the seed's side and the mark's one declared weight.

| Field | Record |
|---|---|
| The brief, in one line | Verbatim, as supplied. Invocation: `run the skill on this repository, which has no logo`. Q1, the string: `SPX`. Q2, what it does: `a marketplace of AI agent skill plugins for Claude Code — quality gates, project lifecycle, design systems, and code intelligence, extending the obra/superpowers suite`. Q3, mark type: `you choose, per the flow`. Q4, where it must survive: `all four — favicon / GitHub avatar (16–32 px), dark UI (GitHub dark mode), one-colour print / sticker, and large format`. Q5, must-avoid: `everything in references/anti-slop.md; additionally no robot/circuit/brain/"AI" imagery, and nothing that reads as a generic developer-tool app icon` |
| Why this candidate won | It is the only one of the three that carried no finding at any size on either ground after both renders. A's fix — an off-centre bar at the second declared weight — reads at 48 px and above and cannot read at 16 px, where a 16-unit bar is one device pixel and the asymmetry that removes its glyph collision is not expressible. C's construction is a spine with two arms and a longer middle bar, which is a capital `E` and cannot be made not to be one. B also says the most: an extension is the same construction as the thing it extends, offset and sharing one wall, which is what a plugin marketplace on top of an existing suite is |
| Candidates rejected | `A "Through" — a square ring with a bar driven through it. First draw read as the CJK character U+4E2D at every size; the second draw broke the symmetry with a 16-unit bar off the centreline, which removes the reading at 48 px and above but not at 16, 20 or 24 px.` · `C "The seat" — a solid block with a slot cut in from one edge and a bar seated in it. Reads as a capital E at every size in the band; the brief's string is SPX, and no change inside the direction removes it, because the construction is the letter.` |
| Keywords present from anti-slop.md pattern 6's list | `none` — the brief contains none of the eight |
| Type chosen because | Two signals in `mark-types.md` § Choosing the type land on geometric and none on another type. Question 4 named a favicon, a GitHub avatar and a one-colour print or sticker, which is that table's *"the mark has to work with the name removed — app icon, favicon, embroidery, a stamp"* row; and question 3's "you choose" defaults to geometric in the same section. Monogram was the near miss and is excluded by its own recipe, which caps a monogram at two letters: `SPX` is three, and *"three initials at a 16 px render is about five pixels per letter, which is not a letter"* |

## Construction

Everything a reviewer needs to re-derive this mark without having been there. `logo-review` reads this section for the derivation answers that no source test can supply.

### The rule, and the derivation chain

**Seed:** a square ring of outer side 128, at the mark's single declared weight of 32, placed at `16 … 144` on both axes.

**Deviation from `mark-types.md` § Geometric step 1, recorded rather than inferred:** the recipe places the seed *"centred on (128, 128)"*. This seed is not; its centre is `(80, 80)`. The seed is placed so that the **pair it generates** is centred on `(128, 128)` — a seed centred on the artboard would put its translate at `(176, 176)` with an outer box running to `272`, off the artboard. The recipe's step 1 assumes the seed is the mark's centre, which is false for any derivation that translates.

**Rule (abstract marks):** `n/a — geometric`

Every element after the first is one application of an element already placed.

| Element | Derived from | Arithmetic | Result |
|---|---|---|---|
| Seed ring | placed on the grid | outer side 128 = 8 × 16; wall = the single declared weight, 32 | outer `16 … 144`, inner `48 … 112`, both axes, before correction 4 |
| Translation distance | the seed's own outer side | 128 × 3/4 = 96 | the translate's outer box is `112 … 240` on both axes |
| Shared wall block | the two outer boxes | 144 − 112 = 32, which is the declared weight exactly | one 32 × 32 block at `112 … 144` on both axes, inside both rings' ink. 96 is the only translation on the grid that leaves the rings sharing one block and no more: at 80 they share two, at 112 they meet at a point |
| Counter width | the seed's outer side and the weight | 128 − 2 × 32 = 64 | both counters 64 wide |
| Counter height | the same, after correction 4 | 128 − 2 × 30.72 = 66.56 | both counters 66.56 tall |
| Pair centre | the seed's centre and half the translation | (80, 80) + (48, 48) | (128, 128); the pair is exactly centred, which is what correction 6 requires of a mark with no drawn container |

### Optical exceptions

Every `OPTICAL:` flag in every shipped file, copied verbatim, so the exception list is auditable by someone who was not there when it was drawn.

| Variant | Flag, verbatim | Distinct reason |
|---|---|---|
| `logo-mark.svg` | `OPTICAL: ring horizontal walls 32 -> 30.72 · horizontal strokes read heavier · 32 x 0.96; inner edges 46.72 / 113.28 on the seed ring and 142.72 / 209.28 on its translate, outer edges held on 16, 112, 144 and 240` | 1 — correction 4 |
| `logo-mono-black.svg` | the same flag, verbatim | 1 — the same reason; the file is the master with `color` resolved |
| `logo-mono-white.svg` | the same flag, verbatim | 1 — the same |
| `logo-full.svg` | the same flag, verbatim | 1 — the same |
| `logo-stacked.svg` | the same flag, verbatim | 1 — the same |
| `logo-favicon.svg` | none — the favicon carries no `OPTICAL:` flag, because correction 4 is `declined` on it | `n/a — no flag` |
| `logo-wordmark.svg` | none — the file contains no drawn geometry | `n/a — no flag` |

**Surviving flags:** `1` distinct reason against `construction.md` § Precedence's ceiling of six. **Flags in a separate dark master:** `n/a — no fork; D1 state 2, recorded under Colour`.

### The nine corrections

One row per correction. `n/a` means it does not reach this mark; `declined` means it binds and was not taken, which is a recorded deviation and not an exemption.

The rows below are the master's. The favicon is its own drawing, not a scale of the master — where it answers a correction differently, a second row names the variant.

| # | Correction | Status | How it was answered |
|---|---|---|---|
| 1 | Overshoot at a shared edge | `n/a` | The set is entirely rectilinear. Nothing curved or pointed shares an alignment edge with a flat form, in any variant |
| 2 | Whole-shape size matching | `n/a` | The two rings are congruent by construction — one is the other translated — so there is no pair that has to be *made* to read as the same size |
| 3 | Apex centring | `n/a` | No triangle and no single-apex form anywhere in the set |
| 4 | Horizontal strokes read heavier | `32 → 30.72` | All four horizontal walls, 32 × 0.96. Per precedence rule 2 the outer edges are held on the grid — 16, 112, 144, 240 — and the thinning is spent on the free inner edges, which land on 46.72, 113.28, 142.72 and 209.28. Residual to the nearest permitted value is 1.28, over the 0.5 snap tolerance, so the exception survives and is flagged |
| 4 | — the same, on `logo-favicon.svg` | `declined` | It would take that variant's horizontal walls to 30.72, which is 1.92 px against 2.00 px at the only size the variant renders at. The correction is below the resolution of every size this variant renders at, and taking it would buy an `OPTICAL:` flag against the ceiling of six for a difference no rasteriser resolves |
| 5 | Perpendicular stroke width | `n/a` | No diagonal is drawn as a filled outline; every edge in the set is axis-aligned |
| 6 | Placement inside a drawn container | `n/a` | No container is drawn. The two rings are the mark; nothing sits inside them as a separate element, and the artboard is not a container. The pair is therefore exactly centred on (128, 128) and takes no 45:55 split |
| 7 | Corners and joins | answered | Every interior join is 90° or its 270° reflex, both clear of the 60° floor. No corner is rounded, so `inner radius = outer radius − w` has nothing to act on |
| 8 | Rotation | `n/a` | Nothing is rotated. The rule is a translation, and a translation leaves both copies in the same orientation, so correction 4 is re-derived to the same answer on each — which is why the two rings *are* byte-identical to each other here, and correction 8's "a four-fold rotation whose copies are byte-identical has skipped correction 4" does not apply |
| 9 | Optical sidebearings | `n/a` | No letterform is positioned by hand. `logo-wordmark.svg` and both lockups are single `text` runs, which correction 9's own scope note excludes |

### Stroke and counters

| Field | Record | Source |
|---|---|---|
| Declared weight(s) | `32`, single | `construction.md` § Stroke discipline |
| Construction | `filled` | `construction.md` § Stroke discipline — "the safer final form" |
| Narrowest ink | `30.72` — the four horizontal walls after correction 4 | |
| Widest ink | `32` — the vertical walls and the shared block | |
| Thick–thin axis | `n/a — 1.04×, far under the ~2× threshold in construction.md § Stroke discipline` | |
| Counter count at 256 | `2` | `construction.md` § Counter discipline caps it at three |

| Counter | Family | Narrowest width | Clears | Source |
|---|---|---|---|---|
| The seed ring's hole | `parallel straight` | `64` (the 66.56 axis is the wider one) | target | `128 − 2 × 32 = 64`, against `max(32 × 1.25, 32) = 40` plus the dark increment `r · w = 0.96`, so 40.96 — `reproduction.md` § The counter consequence |
| The translate ring's hole | `parallel straight` | `64` | target | the same arithmetic; the rings are congruent |

### Silhouette

| Field | Record |
|---|---|
| Ink area, computed analytically | `23224.32` units² — `2 × (128² − 64 × 66.56) − 32²` = `2 × 12124.16 − 1024` |
| Convex hull area | `40960` units² — monotone chain over the six hull vertices `(16,16) (144,16) (240,112) (240,240) (112,240) (16,144)`, shoelace sum 81920 |
| Ratio | `0.567` |
| Deliberate primitive? | `n/a — 0.567 is under reproduction.md § Mono collapse's M4 gate of 0.85` |

### Derivation answers for the anti-slop patterns

Two patterns cannot be decided from source, and two more need the number that produced the geometry. The answers live here — written by whoever drew the mark, not inferred by a reviewer.

| Pattern | Applies? | Test A — what produced this number | Test B — what is left when the feature is removed |
|---|---|---|---|
| 1 — circle with a gap | `n/a — no interrupted ring; the set contains no arc at all, and both frames close` | `n/a — nothing to derive` | `n/a — nothing to delete` |
| 9 — hexagon container | `n/a — no hexagon in any variant, and no container of any shape` | `n/a` | `n/a` |
| 6 — the lens | `n/a — no lens, and the brief contains none of pattern 6's eight keywords, so neither clause hits` | `n/a` | `n/a — Test B does not apply to this pattern` |
| 8 — the loop | `n/a — no lemniscate; there is no arc command anywhere in the set, and no subpath crosses itself` | `n/a` | `n/a — Test B does not apply to this pattern` |

### Type-specific records

Fill the row for this mark's type; the rest are `n/a`.

| Field | Applies to | Record |
|---|---|---|
| Base sidebearing `s` | monogram | `n/a — geometric mark, no positioned letterforms` |
| Container clearance at the letterform's nearest point, after correction 6 moved it | monogram | `n/a — geometric mark, no letterform and no container` |
| Wordmark model | wordmark | `single text run — the default`, in `logo-wordmark.svg` and both lockups |
| Tracking | wordmark | `letter-spacing = font-size × 0.1`; `80 × 0.1 = 8` in `logo-wordmark.svg` and `logo-full.svg`, `64 × 0.1 = 6.4` in `logo-stacked.svg` |
| Fit | wordmark | `UNRUN — the contact sheet ran, but the declared face is not installed on the machine that ran it. The harness reported "Inter" NOT AVAILABLE and its readings — advance edge 32.00 … 216.08, ink edge 208.08, fit × 1.0904 → font-size 87.23 — describe the fallback face, not Inter. The recorded font-size 80 is a starting value, not a measured result` |
| Row asymmetry | wordmark | Fitting the right ink edge to 224 does not put the left ink edge on 32. `text-anchor="start"` at `x="32"` sets an **origin**, not a painted edge, and the first glyph's ink begins one left sidebearing inside it, so the row's ink is not symmetric about 128 |
| The one custom detail | wordmark | `declined — mark-types.md budgets exactly one custom detail for a wordmark-TYPE mark. This is the wordmark VARIANT of a geometric mark, whose one custom element is logo-mark.svg itself; a second detail here would be a second mark` |
| Rule applications | abstract | `n/a — geometric mark` |

## Variants

Every shipped file, its use, and its minimum size. **Every minimum cites the formula or the measurement it came from** — a threshold recorded without its source cannot be re-checked when the mark or the typeface changes.

| File | Intended use | `viewBox` | Aspect | Minimum size | Source of the minimum |
|---|---|---|---|---|---|
| `logo-mark.svg` | the master; anywhere the name is already present | `0 0 256 256` | 1:1 | `9 px` | `reproduction.md` § Minimum sizes, `R = 256 × required device px / feature width in units`, taken over both terms with this mark's numbers: ink `256 × 1 / 30.72 = 8.33`, counter `256 × 2 / 64 = 8.00`. **The ink binds, not the counter**, because the counters were built well over target; 8.33 rounds up to 9 px |
| `logo-full.svg` | horizontal lockup, wide placements | `0 0 512 256` | 2:1 | `UNRUN — derived from its components, and the type side needs φ, which is unrun; see Lockup measurements` | derived from its components — the mark side from `k`, the type side from the wordmark's φ |
| `logo-stacked.svg` | stacked lockup, square-ish placements | `0 0 256 384` | 2:3 | `UNRUN — same` | derived — same |
| `logo-wordmark.svg` | the name alone, on the square artboard; the file the φ values are measured off | `0 0 256 256` | 1:1 | `UNRUN — the φ values come off this file's own 256 px render and the declared face did not resolve on the render machine` | measured — see Lockup measurements |
| `logo-mono-black.svg` | one-colour, on light | `0 0 256 256` | 1:1 | `inherits logo-mark's 9 px` | the `currentColor` binding — same geometry, so `reproduction.md` § Print's "the mono variants inherit their source's minimums exactly" |
| `logo-mono-white.svg` | one-colour, on dark | `0 0 256 256` | 1:1 | `inherits logo-mark's 9 px` | the same; no fork, D1 state 2, recorded under Colour |
| `logo-favicon.svg` | favicon, GitHub avatar, 16–32 px | `0 0 256 256` | 1:1 | `16 px` | `reproduction.md` § The favicon redraw. The variant is built to that section's own spec for a 16 px render — a 32-unit weight and one counter at 80 units. Its own terms compute lower (ink `256 × 1 / 32 = 8 px`, counter `256 × 2 / 80 = 6.4 px`), so 16 px is the size the spec targets rather than a binding constraint |

Non-square variants declare their `viewBox` above; the aspect column is what each lockup's width minimum is computed from. Square variants all carry the identical `viewBox`.

### Lockup measurements

**`logo-wordmark.svg` is square — `0 0 256 256`, like the master.** Only the two lockups are non-square, per `reproduction.md` § Artboard hygiene.

**The two φ values are measured off the `logo-wordmark` variant's 256 px render on the contact sheet, not off a render of the lockup.** The sheet ran. The measurement did not, for the reason recorded in every row below.

| Field | Record |
|---|---|
| `k` — mark's rendered height ÷ lockup cap height | `UNRUN — the mark's height inside both lockups is 256, but the cap height is a metric of the declared face, and that face did not resolve on the machine that ran the sheet` |
| Cap-height minimum from the mark side | `UNRUN — 9 px ÷ k, and k is unrun` |
| `φ_ink` — narrowest ink ÷ cap height, off the `logo-wordmark` render | `UNRUN — the sheet ran and the harness reported "Inter" NOT AVAILABLE; every width it printed describes the fallback face` |
| `φ_ctr` — narrowest counter ÷ cap height, off the same render | `UNRUN — same` |
| Cap-height minimum from the type side | `UNRUN — max(1 / φ_ink, 2 / φ_ctr), and both φ are unrun` |
| Lockup `viewBox` width ÷ cap height inside the lockup | `UNRUN — the viewBox widths are 512 and 256 and are read off the files, but the cap height inside each is unrun` |
| Lockup width minimum | `UNRUN — the row above is unrun` |
| Lockup's own size status | derived from its components — the mark side from `k`, the type side from the wordmark's φ. The lockup is not size-tested on the contact sheet |
| Typeface the φ values were measured against | `UNRUN — no φ value was measured. The declared face is Inter 700 and it is not installed on the machine that ran the sheet` |

### Favicon

The favicon is a redraw, not a scale. Record what it dropped, in reproduction terms — "simplified for small sizes" is not a reason.

| Feature dropped | Why, in reproduction terms |
|---|---|
| The second counter — the translate ring is filled solid | F3 caps this variant at one counter **and** requires strictly fewer than the master's two. At 16 px each master counter measures `64 × 16 / 256 = 4.0` device px and does not close, so the drop is the cap, not a closure. The budget is what makes the cap right here: along the shared diagonal the master alternates `32 + 64 + 32 + 64 + 32 = 224` units — the entire 224-unit live area, 14 px at a 16 px render — against the `32 + 40.96 + 32 = 104.96`-unit budget `reproduction.md` computes for one counter at this variant's mandated 32-unit weight. Filling the translate solid returns 5 px of that 14 to a single mass |
| The master's 128-unit module | F1 requires that no complete subpath of the favicon appear as a complete subpath of the master, and the master's outer contour is exactly the two-frames-sharing-a-block silhouette. The surviving frame therefore grows to outer side 144 and the solid form to 112, which also satisfies the favicon's own coverage rule — its ink reaches 16 and 240 on both axes, where a 128-module version reaches them too but shares the master's outline |

| Field | Record |
|---|---|
| Nodes — favicon / master | `12` / `16` |
| Counters — favicon / master | `1` / `2` |
| Subpaths shared with the master | `none` — the favicon's outer subpath is `M16 16H160V128H240V240H128V160H16Z` against the master's `M16 16H144V112H240V240H112V144H16Z`, and its counter subpath is `M48 48H128V128H48Z` against the master's `M48 46.72H112V113.28H48Z` and `M144 142.72H208V209.28H144Z` |
| Declared weight | `32` units |
| Ink reaches the live-area bounds on its longer axis | graded on the **geometry box**, which is the sound end of the bracket for a coverage check. The variant is filled, so the geometry box and the `ink bbox` coincide and the item is simply decidable; the sheet's readout reports `ink bbox x 16.00 … 240.00` and `y 16.00 … 240.00`, spanning the bounds on both axes |
| Uniform weight | recorded as a `declined` correction in [The nine corrections](#the-nine-corrections) |

### Print minimums

One row per process the brief named. **The brief named `one-colour print / sticker` and named no vendor and no process**, so the three rows below are the trade-default processes that answer for a one-colour print and a sticker, and every `L` and `g` is a trade default from `reproduction.md` § Print rather than a vendor spec. A real vendor spec replaces them and the Minimum column recomputes. Computed from this mark's own `u_ink` 30.72 and `u_ctr` 64, never from `reproduction.md`'s worked table, which is the worst legal construction.

| Process | `L` mm | `g` mm | Source of `L` and `g` | Minimum |
|---|---|---|---|---|
| Digital toner or inkjet, coated — the sticker route | `0.15` | `0.03` | trade default from `reproduction.md` § Print; no vendor was named | `2 mm` — ink `256 × 0.15 / 30.72 = 1.25`, counter `256 × 0.21 / 64 = 0.84`; the ink binds, rounded up |
| Offset litho, coated | `0.20` | `0.05` | trade default; no vendor was named | `2 mm` — ink `256 × 0.20 / 30.72 = 1.67`, counter `256 × 0.30 / 64 = 1.20`; the ink binds, rounded up |
| Screen print, textile | `0.50` | `0.20` | trade default; no vendor was named | `5 mm` — ink `256 × 0.50 / 30.72 = 4.17`, counter `256 × 0.90 / 64 = 3.60`; the ink binds, rounded up |

## Colour

### Binding

`currentColor` only; no palette was invented, and `ui-design-system` was suggested. Never bind to a semantic colour.

### Contrast

| Variant | Against | Ratio | Clears 3:1 (WCAG 2.2 SC 1.4.11) |
|---|---|---|---|
| `logo-mono-black.svg` (`color` = `#000000`) | `#ffffff` | `21:1` | `yes` |
| `logo-mono-white.svg` (`color` = `#ffffff`) | `#000000` | `21:1` | `yes` |
| `logo-mark.svg` | whatever the call site resolves `color` to | `n/a — the master specifies no ground of its own` | `n/a — the two grounds it is specified for are the two rows above, and the master is byte-identical to both apart from the resolved color` |

### One-colour print and mono

| Field | Record |
|---|---|
| Mono collapse M1 — every paint is `currentColor` | `yes` — the sheet's readout reports `paint: currentColor ×1` on `logo-mark.svg`, `logo-favicon.svg` and `logo-wordmark.svg`, and the remaining four variants carry the same paint attributes |
| M2 — no element's geometry wholly inside another's | `n/a — one path, knockout only` on the four square path-bearing variants; a single element never enters the pairwise test. On the two lockups M2a screens two elements each and neither pair's bounding boxes nest — in `logo-full.svg` the type sits entirely right of the mark's box, and in `logo-stacked.svg` entirely below it |
| M3 — inversion identity at 256 px | `UNRUN — the sheet rendered 256 px on both grounds, but M3 is a per-pixel diff of a black-on-white render against an inverted white-on-black one, and the harness computes no such diff. What would decide it: rendering logo-mono-black.svg and logo-mono-white.svg at 256 px and comparing the second inverted against the first, per channel, against the 2/255 gate` |
| M4 — ink ÷ hull | recorded in [Construction § Silhouette](#silhouette) — `0.567` |
| One-colour print | `logo-mono-black.svg` in a single ink on light stock, `logo-mono-white.svg` reversed; the per-process minimums are in [Print minimums](#print-minimums) |

### Dark inversion

| Field | Record | Source |
|---|---|---|
| `r`, the reversed-weight compensation rate | `default — the rate pinned in reproduction.md § r is pinned` | |
| `r · w` for this mark | `0.96` units — `32 × 0.03` | |
| Fork threshold at this `w` and `r` | `267 px` — `256 / 0.96 = 266.67`, rounded **up** because the threshold is the first whole pixel size at which the compensation is worth a pixel | Computed for this mark; not copied from the worked table |
| **D1 — the dark fork** | the second row below | |
| — no fork, at or above the threshold | the compensation was **not** taken; the dark variant is nominally heavy by `r · w` = `0.96` units at large format, which question 4 named and which is above the 267 px threshold. `logo-mono-white.svg` is byte-identical to `logo-mono-black.svg` apart from the resolved `color` — and byte-identity alone does not pass state 2, which is why this row exists | |
| **D2** — every counter reduced by `r · w` still clears its target | `64 − 0.96 = 63.04` on both counters, against `max(1.25 × 32, 32) = 40`. Nothing relies on the 16-unit floor | |
| Counters drawn at target plus compensation | `yes` — the target plus compensation is 40.96 and both counters are drawn at 64 | |

## Clearspace & minimum sizes

Per-variant minimum sizes are in the [Variants](#variants) table, with their sources. They are not repeated here.

### Clearspace

| Field | Record |
|---|---|
| Largest **enclosed** counter | either ring's hole — they are congruent — `64 × 66.56` |
| Widest axis of it | `66.56` |
| Rounded up to a whole grid unit | `80` — `ceil(66.56 / 16) = 5`, × 16 |
| Floor applied? | `no` — 80 exceeds the 64-unit floor |
| **Clearspace** | `80` units = `31.25%` of the mark's rendered size |
| Datum | the artboard edge, per `reproduction.md` § Clearspace — never the ink, and the live area's margin is not counted toward it |
| For the lockup | `80 ÷ 256 × H` on all four sides of the lockup's bounding box. `H` is 256 in both lockups — the mark occupies the full artboard height in each — so the value is `80` units in both |

### The counter floor

`n/a — every counter clears the target.` The block is not filled because no counter sits under it: both are 64 against a target of 40.96. Three of the four aggregate conditions fail anyway — a dark variant ships, a favicon ships, and no render-size branch was ever claimed — so the floor was never available to this mark and nothing depends on it.

## Misuse

The specific ways **this** mark breaks. Every row names a number from this file.

| Do not | What breaks, in this mark's terms |
|---|---|
| Render `logo-mark.svg` below `9 px` | the horizontal walls are the narrowest ink at 30.72 units; below 9 px they fall under one device pixel and anti-alias to a soft band. The counters are not the binding term here — they hold to 8 px |
| Use `logo-mark.svg` at 16–32 px where `logo-favicon.svg` belongs | the master carries two counters at 64 units and the favicon carries one at 80. At 16 px that is 4.0 device px against 5.0, and the master's second counter is exactly what F3 removed |
| Scale the master down to favicon size | the redraw dropped the second counter and moved the module from 128 to 144 / 112 so the ink reaches 16 and 240; a scaled master reaches those bounds too but keeps the two-counter alternation that spends all 224 units of the live area |
| Place ink closer than `80 units` — 31.25% of the rendered size — to the artboard edge | a gap narrower than 66.56 units gets recruited into the form, because that is the widest dimension of the hole the eye has already agreed to read as interior |
| Recolour, add a gradient, a filter, or a shadow | the mark's structure is the two counters and the shared 32 × 32 block; every one of those constructs carries structure that vanishes on collapse, and the flattened result would be a silhouette at an ink/hull of 0.567 with nothing inside it |
| Use it on a ground under 3:1 | the two recorded pairings are 21:1; anything between is untested and this file records no value for it |
| Reset the wordmark in another face | every measured minimum in this file that depends on type is already `UNRUN` against Inter 700; changing the face does not make them measurable, it changes which face they would have to be measured against |
| Use the `text`-bearing wordmark or either lockup where the webfont is not guaranteed | outline conversion has not been performed — see [Production handoff](#production-handoff) |
| Take the two rings apart and use one alone | the seed ring alone is a plain square frame with a 64-unit hole; the mark is the 96-unit translation and the one shared 32 × 32 block, and neither survives the separation |

## Production handoff

### Outline conversion — not performed

**This skill has no font engine and does not convert type to outlines. That is an explicit non-goal, not an oversight.** Where this mark ships a `text` element, the master resolves against the declared webfont at render time. **Outline conversion has NOT been performed here.** It must happen before the mark is used anywhere the webfont is not guaranteed — print, embroidery, a third party's site, an email client. Until it has, a `text`-bearing wordmark is not a finished asset.

This paragraph ships with the template and is not edited or removed.

### Typeface

A wordmark whose typeface is not written down is not reproducible.

| Field | Record |
|---|---|
| Family | `Inter` |
| Weight | `700` |
| `letter-spacing` | `8` in `logo-wordmark.svg` and `logo-full.svg`, `6.4` in `logo-stacked.svg`; `t` = `0.1` in all three |
| Fallback stack | `Inter, sans-serif`, as written in each of the three files |
| Licence / where it is hosted | `UNRUN — not established. The face is declared in the files; no licence check and no hosting or self-hosting decision has been recorded for this repository, and the face is not installed on the machine that ran the contact sheet` |

### Trademark clearance — not performed

**No trademark, design-mark or prior-art clearance has been performed, and nothing in this skill measures collision with an existing mark.** A vision pass over a contact sheet can notice a resemblance it happens to recognise; that is not a search, and it did not run as one here. Clearance is a step for counsel, before the mark is used commercially or filed.

This paragraph ships with the template and is not edited or removed.

### Checks recorded unrun

An unrunnable check recorded as unrun is honest; an unrunnable check reported as passed is not. Every row here is a check that applies and was not run — never one that does not apply.

| Check | Why it could not be run | What would decide it |
|---|---|---|
| `text` element top and bottom extents | `getBBox()` returns the layout box — ascent to descent — not tight ink, and the relation between them is a property of the face | `UNRUN — nothing available in this skill computes it. The harness reported the layout box as y 88.00 … 177.00 on logo-wordmark.svg, which is not ink` |
| `text` element left extent | the anchor is an origin, not a painted edge; a negative left sidebearing puts ink to the left of it | `UNRUN — the anchor is x 32 and the ink edge left of it is a font metric of a face that did not resolve` |
| `text` element right extent | graded on the harness's `ink edge`, never `advance edge` | `UNRUN — the harness read ink edge 208.08, but reported the declared face NOT AVAILABLE, so that reading is the fallback's` |
| `φ_ink` and `φ_ctr`, and everything derived from them | the declared face is not installed on the machine that ran the sheet | `UNRUN — installing Inter 700 on the render machine, or self-hosting it beside the sheet, and re-running the contact sheet` |
| `k`, and both lockups' cap-height and width minimums | they are derived from a cap height that is a metric of the same unresolved face | `UNRUN — the row above` |
| Mono collapse M3, inversion identity at 256 px | the harness renders both grounds but computes no per-pixel diff, and the flow supplies no other instrument for it | `UNRUN — a per-channel diff of the 256 px black-on-white render against the inverted white-on-black one, against the 2/255 gate` |
| Lockup composition | the contact sheet is built for the square artboard and stops on a non-square `viewBox`; the flow names no instrument that renders a lockup | `UNRUN — a render of logo-full.svg and logo-stacked.svg at their declared aspects` |
| Stroked containment, indeterminate | — | `n/a — every drawn variant is filled, so the geometry box and the ink bbox coincide and no extent is indeterminate` |
| Critique item C6, the 4% horizontal thinning | it is judged on the sheet's two largest columns, and 1.28 units is 1.28 px at the 256 px column against a 30.72 px wall — a 4% difference that did not resolve in any screenshot of the sheet | `UNRUN — the correction is confirmed present from the source and from the readout's coordinates, but the visual half of C6 did not resolve. A side-by-side crop of one horizontal wall against one vertical wall at 256 px or larger would decide it` |

Where the contact sheet did run, every row it settled is recorded with its value and removed from this table.

### Still to do

| Step | Status |
|---|---|
| Outline conversion | **not performed** — see above |
| Trademark clearance | **not performed** — see above |
| Install or self-host Inter 700 on the machine that runs the contact sheet, then re-run it | **not done** — it is what turns eight of the nine rows above into values |
| Run `ui-design-system` to produce `docs/design/MASTER.md` | **not done** — the mark ships in `currentColor` and no palette was invented; a design system would give the Colour § Binding table real values |
| Copy or symlink `logo-favicon.svg` to a site root as `favicon.svg` if one is ever added | **not done** — this repository has no site root today. The asset is not renamed; the manifest records it under its own name |

## Asset manifest

Every file that ships, and nothing that does not.

| Path | Role | `viewBox` | Nodes | Distinct `OPTICAL:` reasons | Notes |
|---|---|---|---|---|---|
| `assets/brand/logo-mark.svg` | master | `0 0 256 256` | `16` | `1` | contours 8 · 4 · 4; reuse 10/19 = 0.53; ink/hull 0.567 |
| `assets/brand/logo-wordmark.svg` | the name alone, square artboard | `0 0 256 256` | `0` | `0` | one `text` run, no drawn geometry; the harness counts 0 path nodes |
| `assets/brand/logo-full.svg` | horizontal lockup | `0 0 512 256` | `16` | `1` | aspect 2:1; the mark's path data is byte-identical to the master's |
| `assets/brand/logo-stacked.svg` | stacked lockup | `0 0 256 384` | `16` | `1` | aspect 2:3; `text-anchor="middle"`, taken deliberately |
| `assets/brand/logo-mono-black.svg` | one-colour on light | `0 0 256 256` | `16` | `1` | the master with `color="#000000"`; path data byte-identical |
| `assets/brand/logo-mono-white.svg` | one-colour on dark | `0 0 256 256` | `16` | `1` | the master with `color="#ffffff"`; path data byte-identical |
| `assets/brand/logo-favicon.svg` | favicon and avatar, 16–32 px | `0 0 256 256` | `12` | `0` | contours 8 · 4; reuse 5/14 = 0.36; ink/hull 0.627; correction 4 `declined` |

| Field | Record |
|---|---|
| Files in the set | `7` |
| Every variant carries `role="img"` and an `aria-label` naming the product | `yes, the favicon included` — every root `svg` carries `role="img"` and `aria-label="SPX"` |
| No `width` or `height` on any root `svg` element | `yes` |
| No empty groups, unreferenced `defs`, or surviving construction geometry | `yes` — there is no `g` and no `defs` anywhere in the set |
| Mono variants diffed against their source | `pass` — both differ from `logo-mark.svg` only in the added root `color` attribute and the comment; the `d` attributes are byte-identical |
| Every variant's ink sits inside the live area | graded on the **geometry box**, which coincides with the `ink bbox` on every drawn variant because all of them are filled — the sheet's readout reports `16.00 … 240.00` on both axes for `logo-mark.svg` and `logo-favicon.svg`, both `inside`. On `logo-wordmark.svg` the reported box is a `text` layout box, not ink, and its extents are carried into [Checks recorded unrun](#checks-recorded-unrun) |
