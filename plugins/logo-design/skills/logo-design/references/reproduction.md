# Reproduction Thresholds

This is the binary layer. Every item on this page is a number you compute from the file or measure off a render, and every item ends in pass or fail. `logo-review` consumes it as its first grading layer, so a criterion that cannot be tested does not belong here — judgement lives in the critique layer, not this one.

[construction.md](construction.md) supplies the arithmetic. Its 16-unit grid, its 16 … 32 stroke band and its counter table are what make these thresholds achievable, and every number below is derived from them rather than introduced alongside them. Where a value is a stated convention rather than a derivation, the line says so.

Nothing here restates construction.md's rules or [mark-types.md](mark-types.md)'s recipes. This file answers one question: **at what size, on what ground, in how many colours does the thing still work?**

## The pixel rule

One conversion underlies the whole page. On the fixed `0 0 256 256` artboard:

```text
device px      = artboard units × render size in px / 256
artboard units = device px × 256 / render size in px
```

So one grid unit (16 artboard units) is `render size / 16` device pixels, which is the table construction.md already gives under *The grid*.

**Ink survives at one device pixel. A counter needs two.** The asymmetry is the whole of this section and it is not arbitrary: ink that spreads across two half-covered pixel rows is still visibly a line, only softer. A counter that spreads is *closed*, and a closed counter is the failure construction.md's counter discipline exists to prevent. Widening ink is cosmetic; widening a counter is structural.

| Feature | Required device px | Where the number comes from |
|---|---|---|
| Ink — any painted band, stroke or filled stem | 1 | Below one pixel the band can land entirely inside a single pixel's coverage and disappear. At one pixel, worst case it is two rows at 50% — soft, present. |
| Counter — enclosed or open negative space | 2 | construction.md's design target says it directly: "At a 16 px render, 32 units is 2 px — enough for the hole to survive anti-aliasing wherever it falls." Two pixels is the width at which an arbitrary half-pixel offset still leaves one fully covered pixel of hole. |
| Counter, both edges on full grid units | 1 | construction.md's hard floor. One clean pixel — **conditional on the alignment surviving to the raster**, which is a separate question and usually answers no. See the next two sections. |
| Anything that came from a font | 2 | A glyph's edges are font metrics, not grid values, so the aligned exemption can never apply to them. |

### One unit of measure, twice

The table above mixes two quantities and it is worth naming the seam, because everything downstream depends on it holding.

Rows 1 to 3 are **coverage** thresholds — how much of a pixel the rasteriser fills. The dark-inversion section further down uses the same unit for **apparent** width, which is a perceptual quantity: `15.52` units of counter on a dark ground is still `0.97` device px of coverage at a 16 px render, and no rasteriser can tell it from `1.00`.

The substitution is deliberate and it is applied consistently — to the 32-unit target as well as to the 16-unit floor, and in the same direction. It is licensed by what the thresholds are *for*. A counter's job is to be seen as a hole, not to be measured as one. Coverage is the floor under that job, never the whole of it, and where the two disagree the perceptual number is the one a viewer experiences. This is the same precedence construction.md sets in its opening: "A mathematically clean coordinate that looks wrong is wrong."

Say so out loud because this is the substitution that removes a sibling file's rule, and a rule removed by a silent change of units is a rule removed by accident.

### When grid alignment actually reaches the raster

The 1-pixel counter floor is conditional, and the condition is checkable. One grid unit lands on a whole device pixel only when `render size / 16` is an integer — that is, only at render sizes that are integer multiples of 16 px.

```text
16 px → 1 grid unit = 1.00 px   aligned
20 px → 1 grid unit = 1.25 px   not aligned
24 px → 1 grid unit = 1.50 px   not aligned
32 px → 1 grid unit = 2.00 px   aligned
48 px → 1 grid unit = 3.00 px   aligned
```

A browser at a device pixel ratio of 1.25 rasterises a nominal 16 px favicon at 20 device px; at 1.5 it rasterises it at 24. **Both are common on Windows and Android, and neither is a multiple of 16.** So a mark that leans on the counter floor cannot rely on the floor anywhere it is rendered at a nominal CSS size — which is everywhere on the web.

**The target does not have this problem, and that asymmetry is the point.** At the same 20 device px, a 32-unit counter measures `32 × 20 / 256` = **2.5 px** — two fully covered pixels remain whatever the subpixel offset. A 16-unit counter measures **1.25 px** and there is no offset at which one whole pixel of it survives. The target's guarantee is unconditional; the floor's is a precondition that has already failed.

That does not contradict construction.md, it bounds it. The floor is real and it is exactly one clean pixel at exactly 16 px. It is simply not available to any variant whose render size you do not control.

### The counter floor, in aggregate

This page reaches the counter floor from four directions — minimum size, raster alignment, dark inversion, and the favicon — and it would be easy to read four separate hedges instead of one conclusion. **Here is the conclusion, once. Every other mention on this page points back here rather than restating it.**

**This list is canonical.** construction.md's [When the floor is actually available](construction.md#when-the-floor-is-actually-available) points here rather than enumerating; do not work from a copy anywhere else. There are **four** conditions and all four must hold at once:

> construction.md's 16-unit counter floor survives only for a mark that
>
> 1. carries a **declared weight of 16 or 32** — construction.md's own derivation, from its grid rule: no 24-wide stroke can put both counter edges on full units, so a 24-unit mark forfeits the floor outright. This is the one condition that is grid arithmetic rather than raster arithmetic, and it is [Stroke discipline](construction.md#stroke-discipline)'s to change, not this page's;
> 2. ships **no dark variant** — *Dark inversion* below;
> 3. has **no favicon** — *The favicon redraw* below;
> 4. is rendered on **one of the two size branches** in the next paragraph — *When grid alignment actually reaches the raster* above.
>
> A mark failing any one of the four meets the 32-unit target instead.

### The two size branches, and what each costs

Condition 4 has two branches because both are sufficient and they are reached differently. Both numbers are derived on this page; construction.md takes them from here.

| Branch | Why it works | Minimum render size | Cost against a target-built mark |
|---|---|---|---|
| **A — never rendered below 32 px** | At 32 px a 16-unit counter is 2 device px, which survives any subpixel offset. Alignment is irrelevant. | **32 px** | **A doubled minimum.** A target-built mark works at 16 px; this one does not. |
| **B — rendered only at sizes you control that are integer multiples of 16 px** | At 16 px a grid-aligned 16-unit counter is exactly 1 clean device px. This is construction.md's floor arithmetic, holding exactly. | **16 px** | **Nothing** — the same minimum a target-built mark has. The price is the constraint itself: every render size must be one you control and can show to be a multiple of 16 px. |

Branch B is narrower than it looks. A device pixel ratio of 1.25 or 1.5 turns a nominal 16 px favicon into 20 or 24 device px, so *any* variant sized by the browser is on branch A whether or not you meant it to be. **Name the branch in `LOGO.md` and state its number**; a floor-built mark with no branch recorded is on neither and is not documented.

The floor is not wrong and it is not dead. It is a special case with four conditions and a branch, and this paragraph exists so a future change touches one place instead of four.

## Minimum sizes

### Mark alone — `logo-mark`

Solve the pixel rule for the render size at which the narrowest feature reaches its requirement:

```text
R = 256 × required device px / feature width in units
```

| Mark built to | Narrowest counter | Device px demanded | Arithmetic | Screen minimum |
|---|---|---|---|---|
| the counter **target** (≥ 32 units) | 32 | 2 | `256 × 2 / 32` | **16 px** |
| the counter **floor** (16 … 31.99, grid-aligned) | 16 | **2, not the 1 its alignment would allow** | `256 × 2 / 16` | **32 px** |

**The floor row is deliberately taking the conservative branch, and this is the sentence that says so.** The pixel-rule table three rows up grants a grid-aligned counter one device pixel, and at exactly 16 px, exactly aligned, that is right. The row above demands two anyway, because the alignment that licenses the exemption does not reach the raster at a device pixel ratio of 1.25 or 1.5 — at 20 device px the same counter is 1.25 px and no whole pixel of it survives, while the target row's counter is 2.5 px and two do. **The exemption is not being denied; its precondition is being checked and found absent.** A mark whose render size you genuinely control, at a multiple of 16 px, may use the 1 px branch and state a 16 px minimum — see [The counter floor, in aggregate](#the-counter-floor-in-aggregate) for the full set of conditions.

Check the ink side against both: at the bottom of construction.md's weight band a 16-unit stroke needs `256 × 1 / 16` = 16 px for its one pixel, which the target row already clears and the floor row clears twice over. The counter is the binding term in every case, which is why construction.md spends its arithmetic there.

**So the number is 16 px, and the floor costs you a doubling.** A mark that spends counter width down to the floor is buying interior detail with its own minimum size. That is a legitimate trade and construction.md says to record it in `LOGO.md`; this is the price tag.

### Full lockup — `logo-full`, `logo-stacked`, `logo-wordmark`

The binding feature is the type, and the skill has no font metrics — the same limit mark-types.md states for the wordmark recipe. So the lockup's minimum is **measured, not computed**: it is the only *minimum size* on this page that is, though M3 and M4 below also need a render.

The render comes from `logo-concept`'s contact sheet, which is where every measurement and every render check on this page is actually taken. Without it — Playwright MCP absent — these items are **unrun, and recorded as unrun**. That is honest; reporting them as passed is not.

Two constraints, both must clear.

**1. The mark side, computed.** Record the ratio `k` of the mark's rendered height to the lockup's cap height in `LOGO.md`. Then:

```text
cap height ≥ mark-alone minimum / k
```

At `k = 1` (mark set to cap height) and a target-conformant mark, that is a 16 px cap height. At `k = 1.5` it is 10.67 px. The mark side is almost never the binding one.

**2. The type side, measured.** Render the set type at a 256 px cap height. Measure, in pixels, the narrowest ink `n_ink` and the narrowest counter `n_ctr` of the glyphs actually used. Express both as fractions of the cap height:

```text
φ_ink = n_ink / 256        φ_ctr = n_ctr / 256
cap height ≥ max( 1 / φ_ink , 2 / φ_ctr )        round up to the next 4 px
```

Worked, with values measured off one bold geometric sans — **re-measure for your own face, these are not constants:**

```text
measured at a 256 px cap height:  stem 56 px, tightest lowercase counter 36 px
φ_ink = 56 / 256  = 0.219        1 / 0.219 = 4.6 px
φ_ctr = 36 / 256  = 0.141        2 / 0.141 = 14.2 px
cap height minimum = 14.2  →  round up  →  16 px
```

Then convert to the number people actually measure, using the same render:

```text
lockup width minimum = cap minimum × (measured lockup width / measured cap height)
                     = 16 × (1120 / 256) = 70 px        for a six-letter name at that aspect
```

Record the measured `φ` values, the aspect, and both minimums in `LOGO.md`. Changing the typeface invalidates all of them.

### Print

Two process constants, both from the vendor's own spec sheet where one exists:

- `L` — the minimum reproducible line width, in mm.
- `g` — ink spread per edge, in mm. Ink grows into a counter from both sides, so a counter loses `2g`.

Solve for the printed height `S` of the 256-unit artboard:

```text
ink:      u_ink × S / 256 ≥ L          →  S ≥ 256 · L / u_ink
counter:  u_ctr × S / 256 ≥ L + 2g     →  S ≥ 256 · (L + 2g) / u_ctr
S = the larger of the two, rounded up to the next whole millimetre
```

At the worst legal construction — `u_ink = 16` (bottom of the weight band) and `u_ctr = 32` (the counter target) — the two expressions reduce to `16L` and `8(L + 2g)`. A mark with a heavier stroke or wider counters computes smaller numbers; compute yours and put them in `LOGO.md`.

| Process | `L` mm | `g` mm | `16L` | `8(L + 2g)` | Minimum |
|---|---|---|---|---|---|
| Laser etch / engrave | 0.10 | 0.02 | 1.60 | 1.12 | **2 mm** |
| Digital toner or inkjet, coated | 0.15 | 0.03 | 2.40 | 1.68 | **3 mm** |
| Offset litho, coated | 0.20 | 0.05 | 3.20 | 2.40 | **4 mm** |
| Offset litho, uncoated | 0.25 | 0.15 | 4.00 | 4.40 | **5 mm** |
| Pad print | 0.30 | 0.10 | 4.80 | 4.00 | **5 mm** |
| Flexo — film, corrugate | 0.40 | 0.20 | 6.40 | 6.40 | **7 mm** |
| Screen print, textile | 0.50 | 0.20 | 8.00 | 7.20 | **8 mm** |
| Foil stamp, emboss, deboss | 0.50 | 0.15 | 8.00 | 6.40 | **8 mm** |
| Embroidery, flat stitch | 1.00 | 0.30 | 16.00 | 12.80 | **16 mm** |

The `L` and `g` columns are trade defaults, not derived — they are the inputs, and a real vendor spec replaces them. The `Minimum` column is derived from them and recomputes when they change.

**Uncoated stock is the only row where the counter binds rather than the ink** — 4.40 against 4.00 — which is dot gain doing exactly what the `2g` term is there to model. Flexo is an exact tie at 6.40, so it is not a second such row; recompute it with a vendor's own `g` and it will fall to one side or the other.

**Embroidery at 16 mm is the row that kills marks.** If the brief said "it has to embroider", that number is a constraint on the drawing, not a footnote after it — a 16-unit stroke needs a 16 mm mark before a single stitch is placed. Raise the stroke weight or lose the counter, and decide it before drawing, per mark-types.md's type selection.

**The mono variants inherit their source's minimums exactly**, because construction.md's `currentColor` binding guarantees they are the same geometry. If a mono variant has a different minimum, it is not a mono variant — it is a second drawing, and the dark-inversion section below is where that gets decided.

## Clearspace

**Clearspace is a ratio of the mark's own geometry, never a pixel value.** A pixel value is correct at exactly one size and silently wrong at every other, which is the failure the rule exists to prevent.

**The value.** Take the mark's **largest enclosed counter, measured on the axis where it is widest**, round it up to the next whole grid unit, and take 64 units as the floor:

```text
clearspace units = max( 64 , ceil( widest dimension of the largest enclosed counter / 16 ) × 16 )
clearspace as a fraction of the mark's rendered size = clearspace units / 256
```

Two words in that sentence are doing work and both are there because the looser version is undecidable.

**"Enclosed."** The pixel-rule table above defines a counter as enclosed *or open*, matching construction.md, and that definition is right everywhere else on this page. It is wrong here. An open gap is already continuous with the space outside the mark — it is part of what clearspace is measuring, not a separate thing to measure against — so counting it would have the mark set its own clearance from a gap that clearance already contains. Only enclosed counters qualify. mark-types.md's pinwheel, whose four notches open outward, therefore has **no** qualifying counter and takes the floor.

**"On the axis where it is widest."** A non-circular counter has more than one dimension and the rule has to name which. Take the widest, because clearspace is about the largest hole the eye has already accepted as interior. The monogram's `O` counter is 67.84 × 69.12; the widest is 69.12, and both round to the same 80 units, so nothing in the worked set depends on the choice — which is exactly why it has to be stated before a mark arrives where it does.

**Why the largest counter at all.** construction.md establishes that negative space narrower than the mark's own ink is read as part of the form: "Any negative space narrower than the stroke closes the same way whether or not it is enclosed." Extend that outward. A gap beside the mark that is smaller than the biggest hole *inside* the mark gets recruited into the form rather than separating it from what sits next to it. The mark's largest counter is the width at which the eye has already agreed to read negative space as interior, so clearspace has to exceed it.

**The 64-unit floor** is a stated convention, not a derivation, and it exists for marks whose largest enclosed counter is small or absent — an abstract union mark under mark-types.md's rule 5 has none at all. 64 is 4 grid units, 25% of the artboard, and the third step of the `256 → 128 → 64` half-step chain mark-types.md names, so it is a number the mark's own construction already contains.

**The datum is the artboard edge.** construction.md fixes this: the 224-unit live area is "breathing room inside the file, not clearspace." Measure clearspace outward from the `0 0 256 256` box, not from the ink. The live area's own 16 units of margin is headroom you already have; it is not part of the number and must not be counted toward it.

Worked, against the fragments in the other two files:

```text
mark-types.md monogram   O counter 67.84 × 69.12, widest 69.12  →  ceil to 80  →  31.25%
                         (the two H slots are 32 wide and are not the largest)
mark-types.md vesica     the r-32 hole, 64 × 64                 →  64, = floor →  25%
mark-types.md pinwheel   no *enclosed* counter — the four
                         notches open outward and do not count  →  floor, 64  →  25%
```

**For a lockup**, compute the value from the mark's geometry, then apply it at the size the mark renders at *inside the lockup*. If the mark sits at height `H` in the lockup, clearspace is `(clearspace units / 256) × H` on all four sides of the lockup's bounding box — not of the mark's box.

**The test is binary.** Measure the shortest distance from the variant's artboard edge (or the lockup's bounding box) to the nearest neighbouring ink, rule, image edge or container boundary in the layout. It is at or above the stated value, or it fails.

## Mono collapse

Every variant must survive being flattened to a single value. construction.md's `currentColor` binding is what makes the flattening mechanical; this section is what the flattened result has to satisfy.

**The test:** set `color` to one literal value for the whole file and render. Nothing else changes. Four checks, all binary.

**M1 — source.** Every `fill` and `stroke` in the master is `currentColor`. Any literal colour value, any `fill-opacity` or `opacity` below 1, any `mix-blend-mode`, any `linearGradient` or `radialGradient` reference: fail. Most of these are already banned by construction.md's forbidden-constructs table; mono collapse is where the ban has teeth, because each of them carries structure that a single value cannot express.

**M2 — source, enclosure.** The failure is an element that stops existing when the colours merge. That is not the same as an element that overlaps another one, and the difference has to be mechanical because a legitimate construction sits on the wrong side of the naive test.

Run it in two stages.

- **M2a — the screen, cheap.** For every pair of painted elements A and B, does `bbox(B)` sit inside `bbox(A)`? If no pair does, M2 passes and you are done.
- **M2b — the verdict, on geometry not boxes.** For each pair the screen caught: does **B's geometry lie wholly inside A's geometry?** If yes, **fail** — flattening deletes B and the mark loses it at every size, in every colour mode, with no error. If B's ink extends beyond A's anywhere, **pass**: B is an additive overlay, merging is what it is for, and the merged silhouette is the shape that was drawn.

That second stage is what admits mark-types.md's wordmark detail — drawn geometry anchored to one letter, in the same paint, at the mark's declared weight. Its bounding box may well nest inside the type's; its ink is not contained by the type's, so it survives collapse intact. **The sanctioned wordmark overlay passes M2 by construction and must not be reported as a failure.**

There is exactly one legal form of a genuinely enclosed shape, and it is not two elements: it is **two subpaths in one `path` with `fill-rule="evenodd"`**, which is construction.md's knockout. One element never enters the pairwise test at all.

**M3 — render, inversion identity.** Render at 256 px with `color: #000` on white, then with `color: #fff` on black. Invert the second image and compare pixel by pixel. **Maximum per-channel difference ≤ 2/255**, which is anti-aliasing and rounding; anything above it is something in the file that is not colour-neutral, and it will be exactly the thing that vanishes in one-colour print.

**M4 — computed, structure.** Compute the ink area and the area of the silhouette's convex hull **analytically, from the geometry**. This is the primary route and the only one a markdown-only skill can actually run — there is no image-analysis path from a PNG to an area, and both worked examples below were computed this way rather than measured.

- **Ink area:** shoelace over the node set for straight-sided forms; the closed form for a circle, ellipse, ring, sector or lens; sum the pieces and subtract the counters.
- **Hull area:** monotone chain over the node set, **plus each arc's axis extrema**, which are on the hull and are not nodes. Where the silhouette is already convex — a lens, a disc, a regular polygon — the hull *is* the silhouette and no chain is needed.

A render is a **cross-check**, not the measurement: if the contact sheet at 256 px disagrees with the arithmetic, the arithmetic missed a piece of geometry and both need looking at.

```text
ink area / convex hull area ≤ 0.85        pass
                            >  0.85       pass only if LOGO.md's Construction section
                                          names the silhouette as a deliberate primitive
```

This is the "does it still have structure" test made countable. A mark whose ink fills its own convex hull has no interior and no concavity — it is a blob, and everything that distinguished it was carried by colour. The escape hatch is real and it is narrow: a solid disc or a solid triangle is a legitimate mark, and `LOGO.md` saying so is the difference between a decision and a collapse.

Checked against the fragments in mark-types.md:

```text
vesica    lens area 11321, counter 3217, hull = the lens (a lens is convex)
          ink 8104 / hull 11321 = 0.716    pass
pinwheel  ink 12042 (shoelace over its 12 nodes)
          hull 24453 (an octagon, not the 192 × 192 box)
          12042 / 24453 = 0.492            pass
```

## Dark inversion

A light mark on a dark ground reads optically heavier than the same mark dark on light. The ink appears to grow and the counters appear to shrink, by the same absolute amount — this is irradiation, and it is the reason type designers cut reversed weights lighter than the ones they invert from.

**The model, stated once so everything below is one substitution.** Let the light region expand by `ε` on every edge, and let `r` be the compensation rate that type practice applies to a reversed stem — 2% to 4% of the stem width, a stated convention from type, not a derivation. Then:

```text
ink grows by      2ε = r · w
counter shrinks by 2ε = r · w
```

The same absolute number, in opposite directions. Everything below falls out of `r · w`.

### `r` is pinned at 3%

A 2%-to-4% band is fine for prose and useless for a gate: D2 below returns pass at `r` = 2% and fail at `r` = 4% for any counter between 32.32 and 32.64, so an unpinned `r` makes the whole section unreproducible.

> **The gate runs at `r = 3%`**, the midpoint of the type-practice band, unless `LOGO.md` records a different value inside 2% … 4%. Where it does, every threshold below recomputes from the recorded value and D2 grades against that. Outside the band is not a recorded choice, it is a different model, and it needs its own justification.

Every worked number on this page uses 3%.

### Does the compensation survive construction.md's snap rule?

construction.md's precedence rule 3 snaps any correction landing within its snap tolerance of a permitted value and drops the flag. **That tolerance is construction.md's number, currently 0.5 units, and it is the only borrowed literal in this section** — call it `t`. Every value below is derived from it, so if construction.md moves `t`, this table is what recomputes. construction.md points here for the result rather than carrying its own copy.

A compensation exists at all only when `r · w ≥ t`:

```text
r · w ≥ t   →   r ≥ t / w        with t = 0.5:
w 16  →  r ≥ 3.13%
w 24  →  r ≥ 2.08%
w 32  →  r ≥ 1.56%
```

| `w` | at `r` = 2% | at `r` = 3% | at `r` = 4% | Rate below which it snaps away |
|---|---|---|---|---|
| 16 | 0.32 — snaps | 0.48 — snaps | 0.64 — survives | 3.13% |
| 24 | 0.48 — snaps | 0.72 — survives | 0.96 — survives | 2.08% |
| 32 | 0.64 — survives | 0.96 — survives | 1.28 — survives | 1.56% |

**A 16-unit mark at the middle of the type-practice band has no dark compensation at all** — it rounds away under construction.md's own tolerance. That is one more reason a single 16-unit weight is the safer default the stroke-discipline section already recommends.

### When the dark variant forks from the master

construction.md promises that `logo-mono-black` and `logo-mono-white` are "the same geometry with `color` resolved, so producing them cannot introduce a drawing difference." Applying a compensation by redrawing would break that promise. So the threshold is not *whether* to compensate but *whether the compensation is visible at the size the dark variant ships at*:

```text
the compensation is worth one device pixel when   r · w × R / 256 ≥ 1
                                                  R ≥ 256 / (r · w)
```

At `r = 3%`, taking the ceiling — the threshold is the first *whole* pixel size at which the compensation is worth a pixel, so `256 / (r · w)` rounds **up**, never to nearest:

| `w` | `r · w` units | `256 / (r · w)` | Threshold | Compensation at the threshold |
|---|---|---|---|---|
| 16 | 0.48 | 533.33 | **534 px** | `0.48 × 534 / 256` = 1.00125 px |
| 24 | 0.72 | 355.56 | **356 px** | `0.72 × 356 / 256` = 1.00125 px |
| 32 | 0.96 | 266.67 | **267 px** | `0.96 × 267 / 256` = 1.00125 px |

At 533 px the `w = 16` compensation is 0.99937 px — under a pixel, and so under the threshold that row exists to define. 534 is the first size that clears it.

### Three states, not two

It is tempting to read this as fork or do-not-fork. Across all sizes there are **three** legal states, and the middle one is the whole reason this section is graded rather than assumed — it looks exactly like the first and carries the obligations of the third.

| # | Size against the threshold | Compensation | Geometry | What `LOGO.md` must record |
|---|---|---|---|---|
| **1** | below | cannot be expressed — it is under a device pixel | byte-identical, derived | **nothing.** construction.md's guarantee holds exactly. |
| **2** | at or above | **not taken** | **byte-identical, derived** | **that the compensation was not taken, and that the dark variant is nominally heavy by `r · w` units at that size.** |
| **3** | at or above | taken | a **separate dark master**, carrying its own `OPTICAL:` flags against construction.md's ceiling of six | the fork, the size that justified it, and that file's own flag count. construction.md's derivability guarantee does not cover it. |

All three are acceptable. **State 2 is the one that fails open**, because byte-identity is true of it and of state 1, so any gate phrased as "byte-identical *or* records a fork" waves it through with nothing written down — while it is precisely the state whose discrepancy is visible and undocumented. Silently shipping a forked geometry as though it were derived is the other failure; state 2 is the quieter one.

**So the state is determined first, from the size, and the obligation follows from the state.** Byte-identity is never on its own sufficient at or above the threshold.

### The counter consequence, which binds regardless

Compensation or no compensation, the counters on a dark ground are narrower by `r · w`. Re-run construction.md's counter check against the reduced widths:

```text
effective counter on dark = drawn counter − r · w
```

At `r = 3%`, a counter drawn at exactly its target measures under that target on dark, at every legal weight — note the `w = 32` row uses a target of 40, because `max(1.25 × 32, 32)` is 40 and a 32-unit counter is not legal there at all:

```text
w 16   target max(20, 32) = 32   →  32 − 0.48 = 31.52   under
w 24   target max(30, 32) = 32   →  32 − 0.72 = 31.28   under
w 32   target max(40, 32) = 40   →  40 − 0.96 = 39.04   under
```

So:

> **A mark that ships a dark variant draws its counters at `max(1.25 w, 32) + r · w` units — the target plus the compensation, never the bare 32.**

At `r = 3%`: 32.48 at `w` 16, 32.72 at `w` 24, and 40.96 at `w` 32 (whose target was already 40). None of these needs grid alignment — construction.md's counter table frees any counter of 32 or more from it — so this costs nothing but the two decimal places.

**And the 16-unit counter floor is not available to a mark that ships a dark variant at all.** At `r = 3%` a 16-unit counter measures 15.52 on dark, below the floor, and the floor was the last thing standing between it and closing. That 15.52 is an *apparent* width, not a coverage width — see [One unit of measure, twice](#one-unit-of-measure-twice) for why apparent width is allowed to fail a threshold the rasteriser would pass. This is one of the four routes collected in [The counter floor, in aggregate](#the-counter-floor-in-aggregate).

### The two tests

- **D1 — source, in three states.** Determine the state first, from the dark variant's largest specified size against the threshold table; then check that state's obligation. **Byte-identity alone never passes state 2.**
  - **State 1** — below the threshold. `logo-mono-white` is byte-identical to `logo-mono-black` apart from the resolved `color`, and `LOGO.md` records nothing.
  - **State 2** — at or above, compensation not taken. Also byte-identical, **and `LOGO.md` records that the compensation was not taken and that the variant is nominally heavy by `r · w` at that size.** Byte-identical with nothing recorded is a **fail** here, not a pass.
  - **State 3** — at or above, compensation taken. A separate dark master exists and `LOGO.md` records why, at what size, and its own flag count.
- **D2 — computed, at the recorded `r` (3% unless `LOGO.md` says otherwise).** Every counter, reduced by `r · w`, still clears `max(1.25 w, 32)`. No counter relies on the 16-unit floor.

## The favicon redraw

**The favicon is redrawn, not scaled.** It is its own drawing on the same `0 0 256 256` artboard, built to a tighter spec than the master, and it drops detail on purpose.

### It is detectable which one you did

A scaled favicon and its master have identical topology. Three binary tests catch it:

- **F1.** No **complete subpath** of the favicon appears as a complete subpath of the master. Subpath is the granularity: a whole `d` attribute is too coarse (change one number and it passes) and a command is too fine (`A96 96 0 1 0` is a legitimate coincidence between two marks that share a radius, and construction.md's derivation rules make shared radii *likely*).
- **F2.** `nodes(favicon) < nodes(master)`, counted by the rule under [Path complexity](#path-complexity). A redraw that did not lose a node did not simplify anything.
- **F3.** `counters(favicon) ≤ 1`, **and** `counters(favicon) < counters(master)` unless `counters(master) = 1`. Both clauses: the first is the cap below, the second is the evidence that detail was dropped. The earlier single-expression form — `≤ max(1, counters(master) − 1)` — returned 2 for a three-counter master and contradicted the cap.

`LOGO.md`'s **Variants** section names every feature removed and why. "Simplified for small sizes" is not a reason; "the crossbar counter measured 24 units, which is 1.5 px at 16 and greys at any device pixel ratio that is not 1 or 2" is.

### The favicon's own spec

**Stroke weight 32 units.** At a 16 px render that is 2 device px, so a half-pixel of subpixel offset still leaves one fully covered row of ink. At 16 units the same offset splits one pixel into two half-covered rows, both grey. This pins the favicon to the top of construction.md's weight band, for this variant only.

**At most one counter.** The arithmetic, at the 32-unit stroke the rule above requires and the `max(32 × 1.25, 32) = 40`-unit counter target that follows from it:

```text
live area                        224 units  (14 px at a 16 px render)
one counter  = 32 + 40 + 32    = 104 units  (6.5 px)   46% of the live area
two counters = 32 + 40 + 32 + 40 + 32 = 176 units  (11 px)   79% of the live area
```

Two counters spend four fifths of the favicon on the alternation of hole and wall and leave 48 units — 3 px — to carry everything that makes the mark that mark. One is the cap. This tightens construction.md's "at most three counters at 256" for this variant; it does not contradict it, because construction.md's three is a ceiling at 256 px and this is a ceiling at 16.

The 40-unit figure is the light-ground target. A favicon that also ships on a dark tab bar takes the dark-inversion increment on top of it — `40 + r · w` = 40.96 at `r` 3% and the mandated `w` 32 — for the reason the dark-inversion section gives. The 104-unit budget line becomes 104.96, which changes nothing about the cap.

**No counter may use the 16-unit floor.** Two independent routes reach this and they agree: a floor-using counter's minimum size is 32 px, and the favicon renders at 16; and grid alignment — the floor's precondition — does not reach the raster at device pixel ratios of 1.25 or 1.5, which turn a nominal 16 px favicon into 20 or 24 device px. Every favicon counter meets the target. This is one of the four routes collected in [The counter floor, in aggregate](#the-counter-floor-in-aggregate).

**The ink fills the live area.** The master may sit small on its artboard because it will be placed inside a lockup. The favicon has 14 px and no lockup, so its ink reaches the live-area bounds — 16 and 240 — on its longer axis, overshoot excepted. Anything less throws away pixels there is no way to get back.

This is a **coverage** check, not a containment one, so it reads the opposite end of the bracket: a stroked favicon passes it on the **geometry** box and fails it on `ink bbox`. See [What a bounding box can and cannot tell you](#what-a-bounding-box-can-and-cannot-tell-you) — the boxes coincide on a filled favicon and the item is simply decidable.

**Correction 4 does not bind, and that is the point.** construction.md says the 4% horizontal thinning "is invisible below about a 64 px render." The favicon renders at 16. Thinning a 32-unit ring to 30.72 changes it from 2.00 px to 1.92 px and buys a flag against the ceiling of six for a difference no rasteriser resolves. **Record the uniform weight as a decision in `LOGO.md`, with this as the reason** — construction.md requires a uniform ring to be recorded, and "the correction is below the resolution of every size this variant renders at" is the reason that only exists here.

### Worked

A ring at the favicon's own spec, audited against construction.md coordinate by coordinate in the comment.

```svg
<svg viewBox="0 0 256 256" role="img" aria-label="Example favicon">
  <!-- Favicon spec. Declared weight 32 (2 px at a 16 px render) — this is a FILLED
       annulus, not a stroked circle: there is no stroke attribute anywhere in it, and
       the 32 is construction.md's "distance between its two edges" for a filled form.
       Two consequences. The geometry box and the ink bbox coincide, so every extent
       below is tight ink and the bracketing rules under "What a bounding box can and
       cannot tell you" do not apply. And there is no cap and no join, so neither the
       butt-cap nor the miter rider arises.
       Outer r 112: edges 128 ± 112 = 16 and 240, both ×16, and exactly the live-area
       bounds — the favicon fills them by rule, measured on the tight box.
       Inner r 80:  edges 128 ± 80 = 48 and 208, both ×16.
       Ring thickness 112 − 80 = 32, the declared weight, uniform everywhere.
       One counter, 2 × 80 = 160 units across = 10 px at 16 px, far above the
       max(32 × 1.25, 32) = 40 target. It does not use the floor.
       Uniform weight is a decision, not an oversight: correction 4 would take the ring
       to 30.72 at its horizontal tangents, which is 1.92 px against 2.00 px at the only
       size this variant renders at. Recorded in LOGO.md.
       Both subpaths wind the same way (sweep-flag 0), which nonzero would fill solid;
       fill-rule="evenodd" is what makes the hole a hole.
       Corrections 1, 2, 3, 5, 6, 7, 8 and 9 do not bind: nothing flat shares an edge
       with the curve, nothing has to read as the same size as anything else, there is
       no apex, no diagonal outline, no drawn container (the ring is the mark, and it
       encloses nothing), no corner or join, no rotation, and no letterform.
       Correction 4 binds and is answered above.
       4 nodes, no OPTICAL flags, every painted edge on a multiple of 16.
       Reuse ratio 7 distinct / 20 written = 0.35, well under the 0.75 tracing signal. -->
  <path fill="currentColor" fill-rule="evenodd"
        d="M128 16A112 112 0 1 0 128 240A112 112 0 1 0 128 16Z
           M128 48A80 80 0 1 0 128 208A80 80 0 1 0 128 48Z"/>
</svg>
```

## Path complexity

**A mark with hundreds of nodes was traced, not constructed.** The ceiling is derived from the same pixel rule as everything else.

Two nodes are distinguishable only if they are at least 2 device px apart at the variant's minimum size. At 16 px, 2 device px is 32 artboard units. The longest closed contour available is the perimeter of **construction.md's live area** — 224 units square, its number not this page's, so this ceiling recomputes if it moves:

```text
perimeter        = 4 × 224 = 896 units
node spacing     = 32 units
nodes per contour = 896 / 32 = 28
```

| Ceiling | Value | Status |
|---|---|---|
| Nodes on any one closed contour | **28** | derived above |
| Nodes in the file | **56** | stated — two full contours' worth. A mark is a silhouette plus what is inside it, and construction.md's counter target means each counter after the first eats the room the next one needs. |
| Redraw signal | **24** | stated. The richest fragment in construction.md and mark-types.md is the two-letter monogram at 16 nodes under the rule below. 24 is 50% headroom over the busiest thing this skill actually draws. |
| Favicon | 28 per contour, at most one counter, and `nodes(favicon) < nodes(master)` | from F2 and F3 |

### Counting a node

The count feeds a binary test and three ceilings, so it has to give one answer. Ambiguity here is worth a 50% swing on any curve-heavy mark.

- **Count each distinct point the geometry lands on.** Every `M`, `L`, `H`, `V`, `A`, `C`, `S`, `Q` and `T` endpoint.
- **A closing point coincident with its subpath's `M` counts once, not twice.** `Z` returns to a point that is already counted; counting it again inflates every closed contour by one per subpath.
- **Primitives have nodes too**, and this is the clause that matters most, because construction.md actively prefers them — "Prefer `circle` and `ellipse` when the shape is one." A mark built entirely from primitives would otherwise score zero and clear every ceiling by default. Count `circle`, `ellipse` and `rect` as **4** (their four axis extrema, which is what an equivalent path would carry); `line` as **2**; `polygon` and `polyline` as one per listed point.
- **Bézier control points are not nodes** — construction.md exempts them from the grid for the same reason they are exempt here: they locate ink without being ink. Note they *do* count for the reuse ratio below, which is measuring something else.

Worked, so the rule is not re-derivable two ways:

```text
favicon ring above     M128 16 · A→128 240 · A→128 16 (= the M, counts once)   2 per subpath
                       × 2 subpaths                                             = 4 nodes
mark-types.md H        M + 11 H/V endpoints, Z returns to the M                = 12 nodes
mark-types.md O        2 arc endpoints per subpath × 2 subpaths                =  4 nodes
mark-types.md monogram 12 + 4                                                  = 16 nodes
mark-types.md pinwheel M + 11 H/V endpoints, Z returns to the M                = 12 nodes
```

### Two tracing signatures, both readable from the source

**Coordinate reuse.** A constructed mark reuses its numbers, because every element after the first is derived from one already placed. A traced outline reuses nothing, because each point came off a bitmap.

```text
reuse ratio = distinct coordinate values / total coordinate values
```

**Which numbers count**, because the ratio moves by 20 points depending on the answer:

- **Count every coordinate value as written in the path data.** `H48` contributes one value, not two — the implied `y` was never written and a constructed mark's economy of notation is part of what is being measured.
- **Count arc `rx` and `ry`.** They are the construction: a shared radius is the clearest evidence of derivation on the page.
- **Do not count the arc rotation or either flag.** They are not coordinates, they take three values between them, and including them dilutes the ratio toward pass on every arc-heavy mark.
- **Count Bézier control-point values.** They are excluded from the node count and included here, and the asymmetry is the point: a traced outline is nothing but control points, so excluding them would blind the check to exactly the thing it exists to catch.

Compute per `path`, and only on paths carrying **12 or more** counted values — below that the ratio is noise. Above **0.75** is a tracing signal. Measured against the fragments in the other two files and the favicon above:

```text
mark-types.md pinwheel   7 distinct / 13 counted  = 0.54    pass
mark-types.md monogram H 7 distinct / 13 counted  = 0.54    pass
mark-types.md monogram O 8 distinct / 20 counted  = 0.40    pass
favicon ring above       7 distinct / 20 counted  = 0.35    pass
```

The two polygon paths land on the identical ratio, which is not a coincidence worth hiding: both are `MHVHVHVHVHVHZ`, both write 13 values, and both reuse 6 of them. **A rule that gave those two different totals would be the wrong rule**, and an earlier draft of this page did exactly that.

**Curve runs.** A long run of `C` or `c` commands with no repeated radius and no repeated handle length is a sampled outline. A constructed curve uses `circle`, `ellipse`, or `A` arcs at a radius that appears elsewhere in the file — construction.md's curve-authoring section says to prefer exactly those, and this is the check that notices when you did not.

Precision noise is already caught upstream: construction.md forbids more than two decimal places, and a traced path is full of them.

## What a bounding box can and cannot tell you

Every extent check on this page and in construction.md's self-check — the live area, the favicon's fill of it, the lockup's aspect — is a question about **painted ink**. The DOM does not answer that question. It answers two nearby ones, and the true ink lies between them.

`logo-concept`'s contact-sheet harness (`templates/contact-sheet.template.html`) prints both, per candidate:

| Readout field | What it is | Relation to ink |
|---|---|---|
| geometry box, from `getBBox()` | fill geometry only; the stroke is excluded | **lower bound** — a stroked region always contains the path that generated it |
| `ink bbox` | that box widened by `w/2` per side wherever a stroke is actually painted | **upper bound**, subject to the miter rider below |

**For a filled element the two coincide and the box is tight.** The harness says so directly: a filled mark has no gap between them. Every extent check on a filled mark is decidable, and the rest of this section does not apply to it. construction.md already calls filled paths "the safer final form"; this is one more reason.

For a stroked element they do not coincide, and neither one is the answer. construction.md's own 16-wide stem on centreline 120, butt caps:

```text
geometry box   x 120 … 120   y  48 … 208     under-reports x by w/2 = 8 per side
ink bbox       x 112 … 128   y  40 … 216     over-reports  y by w/2 = 8 per end
true ink       x 112 … 128   y  48 … 208
```

The widening is exact laterally and up to `w/2` too long at a **butt-capped open end**, because a butt cap stops dead at its endpoint. There is no correction that is right in general and no DOM call that returns the tight box — `getBoundingClientRect` uses the same conservative box in Chrome.

### Grade against the bracket, not against one box

The two boxes bound the ink, so read whichever end of the bracket makes the answer sound. **Containment and coverage read opposite ends**, and getting that backwards is how this produces a wrong verdict in either direction.

For a **containment** check — "all geometry within 16 … 240", the live-area item:

- **Geometry box escapes the bounds → FAIL.** It is a lower bound; if the lower bound is already outside, the ink is outside. Sound.
- **`ink bbox` sits inside the bounds → PASS.** It is an upper bound; if the upper bound is inside, the ink is inside. Sound.
- **Geometry box inside, `ink bbox` outside → INDETERMINATE. Record it unrun, with both boxes and the gap. Do not FAIL.**

That third case is the one this section exists for, because the naive check gets it wrong in the expensive direction:

```text
a 16-wide stem, butt caps, sitting exactly on the live-area edge:  M120 16V240
  geometry box   y  16 … 240      inside      → lower bound passes
  ink bbox       y   8 … 248      outside     → naive check FAILs
  true ink       y  16 … 240      conformant  → the mark is correct
```

A false FAIL in the binary layer is worse than a false pass: it sends an agent to redraw a mark that was already right, and the redraw has nowhere to go.

For a **coverage** check — the favicon's "ink reaches the live-area bounds", where the ink must be big *enough* — the ends swap:

- **Geometry box already spans the bounds → PASS.** The ink contains it, so the ink spans them too. Sound.
- **`ink bbox` fails to span the bounds → FAIL.** The ink is inside it, so the ink cannot span them either. Sound.
- Anything between → **INDETERMINATE, recorded unrun.**

### Making it decidable

An indeterminate extent is a fact about the drawing, not about the check, and two things already available in construction.md remove it:

- **Round or square caps.** With `stroke-linecap="round"` or `"square"` the widening is exact and `ink bbox` *is* the tight box. construction.md already requires the linecap declared explicitly on every stroked element, so this is a keyword you are writing anyway — but note it is not free, because those caps genuinely extend the ink by `w/2` where a butt cap does not. Choose the cap for the drawing, then read the box the cap gives you.
- **Convert the stroke to a filled outline.** The boxes coincide and every extent becomes tight.

### The miter rider

`w/2` is the outward offset along a smooth run and at a round or bevel join. **At a miter join it is not**, and the gap is the same size as the problem this section started with. The miter tip sits `(w/2) / sin(θ/2)` from the vertex, where `θ` is the interior angle:

```text
θ 180°  →  0.500 w     θ 120°  →  0.577 w     θ 90°  →  0.707 w     θ 60°  →  1.000 w
```

**The rule is `(w/2) / sin(θ_min/2)`, where `θ_min` is construction.md's interior-join floor — not a literal copied from it.** At its current floor of 60° that evaluates to exactly `w`: **the ink reaches `w` beyond the vertex, double the `w/2` the widened box assumes.** At `w` 16 that is an 8-unit understatement per corner, exactly the magnitude of the butt-cap error in the other direction. If construction.md ever moves the floor, re-evaluate the expression rather than reusing the `w` — at 45° it would be `1.307 w`.

SVG's default `stroke-miterlimit` of 4 replaces a miter with a bevel only below `θ` ≈ 28.96°, so it never rescues a conformant mark — construction.md has already rejected that geometry on its own 60° floor.

> **For any stroked element carrying a miter join, widen by `(w/2) / sin(θ_min/2)` per side — `w` at construction.md's current 60° floor — not `w/2`, before granting a PASS on a containment check.** The `ink bbox` field is not an upper bound until you have.

Nothing changes for the FAIL side: the geometry box is a lower bound regardless of joins.

### `text` is a third case, and mostly it is unrun

A `text` element's `getBBox()` is its **layout** box: vertically it runs from the font's ascent to its descent, not from cap height to baseline. It is not ink, no widening turns it into ink, and the relationship between the two is a property of the face. So a wordmark's extents cannot be graded the way a path's can.

| Extent of a `text` element | Status |
|---|---|
| Top and bottom | **Not computable. Record unrun.** Ascent and descent are font metrics with no fixed relation to the painted extent, and glyphs may exceed them. |
| Right | Grade against the harness's **`ink edge`**, never `advance edge`. `advance edge` is the raw `getBBox()` right edge and carries the trailing letter-spacing step; `ink edge` has it removed, and whether this renderer applies one is **measured** — the harness re-runs the same string at zero tracking and counts the steps in the difference — rather than assumed. |
| Left | The anchor `x`, not the first glyph's ink. A negative left sidebearing puts ink to the left of it. **Record unrun.** |

What *is* checkable is exactly what mark-types.md already says is checkable: the anchor `x` and the baseline `y` are values you chose, so they sit on the grid and they are graded like any other chosen number. The type's ink extents are recorded from the render, not asserted.

**An extent recorded as unrun is honest. An extent reported as passed because a number was available is not** — and this is the same posture the render-dependent items on this page already take.

## Artboard hygiene across the variant set

construction.md's self-check covers a single file. These are the items that only exist because there is a *set* of files, and each is binary.

- Every square variant carries the identical `viewBox="0 0 256 256"`. A variant on a different artboard cannot be swapped for another at a call site.
- Non-square variants — the horizontal and stacked lockups — declare their `viewBox` and record the aspect ratio in `LOGO.md`. That ratio is what the lockup width minimum is computed from.
- No variant carries `width` or `height` on the root `svg` element.
- Every variant carries `role="img"` and an `aria-label` naming the product. The favicon included.
- No empty `g` element, no unreferenced `defs`, no leftover construction geometry. Anything invisible in the file is either a bug or something that was meant to be deleted.
- The mono variants differ from their source only in the resolved `color`. Diff them.
- Every variant's ink sits inside `16 … 240`, graded per [What a bounding box can and cannot tell you](#what-a-bounding-box-can-and-cannot-tell-you). Decidable on a filled variant. On a stroked one it is a bracket, and the middle of the bracket is **unrun, not failed**. On a wordmark's `text` element the vertical extents are **unrun** and the right edge is graded on `ink edge`.

## The binary checklist

Every item is answerable from the file, from the analytic geometry, or from `logo-concept`'s contact-sheet render. This is the criteria list; `logo-review` supplies the grading. Where the render is unavailable, the items that need one are recorded **unrun**, not passed.

**Minimum sizes**

- [ ] `logo-mark`'s narrowest counter clears `max(1.25 w, 32)`, **or** all four conditions in [The counter floor, in aggregate](#the-counter-floor-in-aggregate) are shown to hold — checked against that list, not against a remembered count.
- [ ] A floor-built mark names its size **branch** in `LOGO.md` and states that branch's minimum: **32 px on branch A, 16 px on branch B.** A branch not named is not a branch shown to hold.
- [ ] The lockup's `φ_ink` and `φ_ctr` were measured off a 256 px render, and the cap-height and width minimums are recorded in `LOGO.md`.
- [ ] Print minimums computed for each process the brief named, from the vendor's `L` and `g` where one was available.
- [ ] Every minimum in `LOGO.md`'s **Variants** table cites the formula or the measurement it came from.

**Clearspace**

- [ ] The value is `max(64, ceil(widest dimension of the largest enclosed counter / 16) × 16)` units, expressed as a fraction of the rendered size. Open gaps excluded.
- [ ] It is measured outward from the artboard edge, not from the ink.
- [ ] The lockup's clearspace is derived from the mark's geometry at the size the mark renders inside it.

**Mono collapse**

- [ ] M1 — every paint is `currentColor`; no literal colour, no alpha, no blend mode, no gradient.
- [ ] M2a — any pair whose bounding boxes nest is identified. M2b — none of those pairs has the inner element's *geometry* wholly inside the outer's. Knockouts are one `path`, two subpaths, `fill-rule="evenodd"`, and do not enter the test.
- [ ] M3 — black-on-white and inverted white-on-black differ by at most 2/255 per channel.
- [ ] M4 — ink area over convex hull area, computed analytically, is at or below 0.85, or `LOGO.md` names the silhouette as a deliberate primitive.

**Dark inversion**

- [ ] `LOGO.md` records `r`, or the gate runs at 3%.
- [ ] D1 — the state (1, 2 or 3) is named in `LOGO.md`, determined from the dark variant's largest specified size against the threshold table.
- [ ] D1 — that state's obligation is met. **State 2 is byte-identical *and* must record the un-taken compensation and the `r · w` it is heavy by; byte-identity on its own does not pass it.**
- [ ] D2 — every counter, reduced by `r · w`, still clears `max(1.25 w, 32)`. Nothing relies on the 16-unit floor.

**Favicon**

- [ ] F1 — no complete subpath shared with the master.
- [ ] F2 — strictly fewer nodes than the master, counted by the node rule.
- [ ] F3 — at most one counter, and fewer than the master unless the master had one.
- [ ] Stroke weight 32 units; no counter on the floor; ink reaches the live-area bounds on its longer axis — a **coverage** check, graded on the geometry box where the two boxes differ.
- [ ] The uniform weight is recorded as a decision with the sub-resolution reason.
- [ ] `LOGO.md` names every dropped feature and why, in reproduction terms.

**Path complexity**

- [ ] No contour above 28 nodes; no file above 56; anything above 24 was looked at again. Primitives counted at 4 / 4 / 4 / 2.
- [ ] Reuse ratio at or below 0.75 on every `path` carrying 12 or more counted values.
- [ ] No long `C` run without a repeated radius or handle length.

**Extents**

- [ ] Each extent item names which box it was graded against, and says whether the two coincided.
- [ ] Containment graded FAIL on the geometry box escaping, PASS on `ink bbox` inside, **unrun** in between. Coverage graded the other way round.
- [ ] Any stroked element with a miter join was widened by `w`, not `w/2`, before a containment PASS.
- [ ] A `text` element's vertical extents are recorded **unrun**; its right edge is graded on `ink edge`, not `advance edge`.

**Artboard hygiene**

- [ ] Identical `viewBox` across square variants; declared `viewBox` and recorded aspect on the lockups.
- [ ] No `width` or `height`; `role` and `aria-label` on every variant.
- [ ] No empty groups, unreferenced `defs`, or surviving construction geometry.
- [ ] Every variant's ink sits inside `16 … 240` by the grading above.

## Related references

| File | Covers |
|---|---|
| [construction.md](construction.md) | The grid, the nine corrections, stroke and counter discipline, forbidden constructs, colour binding, the self-check. Every threshold above is derived from its arithmetic. |
| [mark-types.md](mark-types.md) | The four shippable mark types and the construction recipe for each. Its fragments are what the worked numbers above are measured against. |
| [anti-slop.md](anti-slop.md) | The visual clichés that signal machine authorship regardless of how well the mark reproduces. |
| `docs/design/LOGO.md` | Where every number on this page is recorded for the specific mark. A threshold computed and not written down is a threshold nobody can re-check. |
