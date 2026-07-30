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
| Counter, both edges on full grid units | 1 | construction.md's hard floor. One clean pixel, conditional on the alignment surviving to the raster — see below. |
| Anything that came from a font | 2 | A glyph's edges are font metrics, not grid values, so the aligned exemption can never apply to them. |

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

That does not contradict construction.md, it bounds it. The floor is real and it is exactly one clean pixel at exactly 16 px. It is simply not available to any variant whose render size you do not control.

## Minimum sizes

### Mark alone — `logo-mark`

Solve the pixel rule for the render size at which the narrowest feature reaches its requirement:

```text
R = 256 × required device px / feature width in units
```

| Mark built to | Narrowest counter | Arithmetic | Screen minimum |
|---|---|---|---|
| the counter **target** (≥ 32 units) | 32 | `256 × 2 / 32` | **16 px** |
| the counter **floor** (16 … 31.99, grid-aligned) | 16 | `256 × 2 / 16` | **32 px** |

Check the ink side against both: at the bottom of construction.md's weight band a 16-unit stroke needs `256 × 1 / 16` = 16 px for its one pixel, which the target row already clears and the floor row clears twice over. The counter is the binding term in every case, which is why construction.md spends its arithmetic there.

**So the number is 16 px, and the floor costs you a doubling.** A mark that spends counter width down to the floor is buying interior detail with its own minimum size. That is a legitimate trade and construction.md says to record it in `LOGO.md`; this is the price tag.

### Full lockup — `logo-full`, `logo-stacked`, `logo-wordmark`

The binding feature is the type, and the skill has no font metrics — the same limit mark-types.md states for the wordmark recipe. So the lockup's minimum is **measured, not computed**, and it is the one threshold on this page that works that way.

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

The `L` and `g` columns are trade defaults, not derived — they are the inputs, and a real vendor spec replaces them. The `Minimum` column is derived from them and recomputes when they change. Uncoated stock is the only row where the counter binds rather than the ink; that is dot gain doing exactly what the `2g` term is there to model.

**Embroidery at 16 mm is the row that kills marks.** If the brief said "it has to embroider", that number is a constraint on the drawing, not a footnote after it — a 16-unit stroke needs a 16 mm mark before a single stitch is placed. Raise the stroke weight or lose the counter, and decide it before drawing, per mark-types.md's type selection.

### The variant table

| Variant | Binding feature | Screen minimum | Print minimum |
|---|---|---|---|
| `logo-mark` | narrowest counter | 16 px at target, 32 px at floor | from the table above |
| `logo-full` | the set type | measured cap height, and width from the aspect | measured, same two formulas in mm |
| `logo-stacked` | the set type | same cap height as `logo-full`; the width minimum is lower because the aspect is | as `logo-full` |
| `logo-wordmark` | the set type | as `logo-full`, mark side does not apply | as `logo-full` |
| `logo-mono-black`, `logo-mono-white` | identical geometry to their source | identical to their source | identical to their source |
| `favicon.svg` | its single counter | **16 px** — see the redraw section | screen only, no print minimum |

The mono variants inherit their source's minimums exactly, because construction.md's `currentColor` binding guarantees they are the same geometry. If a mono variant has a different minimum, it is not a mono variant — it is a second drawing, and the dark-inversion section below is where that gets decided.

## Clearspace

**Clearspace is a ratio of the mark's own geometry, never a pixel value.** A pixel value is correct at exactly one size and silently wrong at every other, which is the failure the rule exists to prevent.

**The value.** Take the mark's **largest counter**, round it up to the next whole grid unit, and take 64 units as the floor:

```text
clearspace units = max( 64 , ceil( largest counter / 16 ) × 16 )
clearspace as a fraction of the mark's rendered size = clearspace units / 256
```

**Why the largest counter.** construction.md establishes that negative space narrower than the mark's own ink is read as part of the form: "Any negative space narrower than the stroke closes the same way whether or not it is enclosed." Extend that outward. A gap beside the mark that is smaller than the biggest hole *inside* the mark gets recruited into the form rather than separating it from what sits next to it. The mark's largest counter is the width at which the eye has already agreed to read negative space as interior, so clearspace has to exceed it.

**The 64-unit floor** is a stated convention, not a derivation, and it exists for marks whose largest counter is small or absent — an abstract union mark under mark-types.md's rule 5 has no enclosed counter at all. 64 is 4 grid units, 25% of the artboard, and the third step of the `256 → 128 → 64` half-step chain mark-types.md names, so it is a number the mark's own construction already contains.

**The datum is the artboard edge.** construction.md fixes this: the 224-unit live area is "breathing room inside the file, not clearspace." Measure clearspace outward from the `0 0 256 256` box, not from the ink. The live area's own 16 units of margin is headroom you already have; it is not part of the number and must not be counted toward it.

Worked, against the fragments in the other two files:

```text
mark-types.md monogram   largest counter 67.84 (the O)  →  ceil to 80 units  →  31.25%
mark-types.md vesica     largest counter 64 (the hole)  →  64 units, = floor →  25%
mark-types.md pinwheel   no enclosed counter            →  floor, 64 units  →  25%
```

**For a lockup**, compute the value from the mark's geometry, then apply it at the size the mark renders at *inside the lockup*. If the mark sits at height `H` in the lockup, clearspace is `(clearspace units / 256) × H` on all four sides of the lockup's bounding box — not of the mark's box.

**The test is binary.** Measure the shortest distance from the variant's artboard edge (or the lockup's bounding box) to the nearest neighbouring ink, rule, image edge or container boundary in the layout. It is at or above the stated value, or it fails.

## Mono collapse

Every variant must survive being flattened to a single value. construction.md's `currentColor` binding is what makes the flattening mechanical; this section is what the flattened result has to satisfy.

**The test:** set `color` to one literal value for the whole file and render. Nothing else changes. Four checks, all binary.

**M1 — source.** Every `fill` and `stroke` in the master is `currentColor`. Any literal colour value, any `fill-opacity` or `opacity` below 1, any `mix-blend-mode`, any `linearGradient` or `radialGradient` reference: fail. Most of these are already banned by construction.md's forbidden-constructs table; mono collapse is where the ban has teeth, because each of them carries structure that a single value cannot express.

**M2 — source, enclosure.** No painted element's geometry may be wholly enclosed by another painted element's geometry. Two separate elements taking the same value merge into one silhouette on collapse and the inner one stops existing. Test conservatively on bounding boxes: for every pair of painted elements A and B, if `bbox(B)` sits inside `bbox(A)`, fail.

There is exactly one legal form of an enclosed shape, and it is not two elements: it is **two subpaths in one `path` with `fill-rule="evenodd"`**, which is construction.md's knockout. That passes M2 because it is one element.

**M3 — render, inversion identity.** Render at 256 px with `color: #000` on white, then with `color: #fff` on black. Invert the second image. The two must be identical within anti-aliasing tolerance. Any difference is something in the file that is not colour-neutral, and it will be exactly the thing that vanishes in one-colour print.

**M4 — render, structure.** Render the flattened mark at 256 px. Compute the ink area and the area of the silhouette's convex hull.

```text
ink area / convex hull area ≤ 0.85        pass
                            >  0.85        pass only if LOGO.md's Construction section
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

**The model, stated once so everything below is one substitution.** Let the light region expand by `ε` on every edge, and let `r` be the compensation rate that type practice applies to a reversed stem — **2% to 4% of the stem width, a stated convention from type, not a derivation.** Then:

```text
ink grows by      2ε = r · w
counter shrinks by 2ε = r · w
```

The same absolute number, in opposite directions. Everything below falls out of `r · w`.

### Does the compensation survive construction.md's snap rule?

Precedence rule 3 snaps any correction landing within 0.5 units of a permitted value and drops the flag. So a compensation only exists at all when `r · w ≥ 0.5`:

```text
r · w ≥ 0.5   →   r ≥ 0.5 / w
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

At `r = 3%`:

| `w` | `r · w` units | `R` at which it reaches 1 device px |
|---|---|---|
| 16 | 0.48 | 533 px |
| 24 | 0.72 | 356 px |
| 32 | 0.96 | 267 px |

**Below that size, do not fork.** The dark variant is the master with `color` resolved, exactly as construction.md says, and the discrepancy is under a pixel. **At or above it**, the compensation is a visible drawing difference and one of two things has to be recorded in `LOGO.md`:

- the compensation was **not** taken, and the dark variant is nominally heavy by `r · w` units at that size; or
- a **separate dark master** exists, carrying its own `OPTICAL:` flags against its own ceiling of six, and construction.md's derivability guarantee does not cover it.

Both are acceptable. Silently shipping a forked geometry as though it were derived is not.

### The counter consequence, which binds regardless

Compensation or no compensation, the counters on a dark ground are narrower by `r · w`. Re-run construction.md's counter check against the reduced widths:

```text
effective counter on dark = drawn counter − r · w
```

At `r = 3%`, a counter drawn at exactly the 32-unit target measures 31.52 on dark at `w = 16`, and 31.04 at `w = 32`. Both fall under the target. So:

> **A mark that ships a dark variant draws its counters at `32 + r · w` units, not at 32.**

At `r = 3%`: 32.48 at `w` 16, 32.72 at `w` 24, and 40.96 at `w` 32 (whose target was already 40). None of these needs grid alignment — construction.md's counter table frees any counter of 32 or more from it — so this costs nothing but the two decimal places.

**And the 16-unit counter floor is not available to a mark that ships a dark variant at all.** At `r = 3%` a 16-unit counter measures 15.52 on dark, which is below the floor, and the floor was the last thing standing between it and closing. This is the same conclusion the favicon reaches by a different route.

### The two tests

- **D1 — source.** If a separate dark master exists, `LOGO.md` records why, at what size, and its own flag count. If none exists, `logo-mono-white` is byte-identical to `logo-mono-black` apart from the resolved `color`.
- **D2 — computed.** Every counter, reduced by `r · w`, still clears construction.md's target. No counter relies on the 16-unit floor.

## The favicon redraw

**The favicon is redrawn, not scaled.** It is its own drawing on the same `0 0 256 256` artboard, built to a tighter spec than the master, and it drops detail on purpose.

### It is detectable which one you did

A scaled favicon and its master have identical topology. Three binary tests catch it:

- **F1.** The favicon's path data is not identical to, and does not contain, any of the master's path data.
- **F2.** `nodes(favicon) < nodes(master)`. A redraw that did not lose a node did not simplify anything.
- **F3.** `counters(favicon) ≤ max(1, counters(master) − 1)`. Detail was dropped, and the cap below is the ceiling.

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

**No counter may use the 16-unit floor.** Two independent routes reach this and they agree: a floor-using counter's minimum size is 32 px, and the favicon renders at 16; and grid alignment — the floor's precondition — does not reach the raster at device pixel ratios of 1.25 or 1.5, which turn a nominal 16 px favicon into 20 or 24 device px. Every favicon counter meets the target.

**The ink fills the live area.** The master may sit small on its artboard because it will be placed inside a lockup. The favicon has 14 px and no lockup, so its ink bounding box reaches the live-area bounds — 16 and 240 — on its longer axis, overshoot excepted. Anything less throws away pixels there is no way to get back.

**Correction 4 does not bind, and that is the point.** construction.md says the 4% horizontal thinning "is invisible below about a 64 px render." The favicon renders at 16. Thinning a 32-unit ring to 30.72 changes it from 2.00 px to 1.92 px and buys a flag against the ceiling of six for a difference no rasteriser resolves. **Record the uniform weight as a decision in `LOGO.md`, with this as the reason** — construction.md requires a uniform ring to be recorded, and "the correction is below the resolution of every size this variant renders at" is the reason that only exists here.

### Worked

A ring at the favicon's own spec, audited against construction.md coordinate by coordinate in the comment.

```svg
<svg viewBox="0 0 256 256" role="img" aria-label="Example favicon">
  <!-- Favicon spec. Stroke weight 32 (2 px at a 16 px render).
       Outer r 112: edges 128 ± 112 = 16 and 240, both ×16, and exactly the live-area
       bounds — the favicon fills them by rule.
       Inner r 80:  edges 128 ± 80 = 48 and 208, both ×16.
       Ring thickness 112 − 80 = 32, the declared weight, uniform everywhere.
       One counter, 2 × 80 = 160 units across = 10 px at 16 px, far above the
       max(32 × 1.25, 32) = 40 target. It does not use the floor.
       Uniform weight is a decision, not an oversight: correction 4 would take the ring
       to 30.72 at its horizontal tangents, which is 1.92 px against 2.00 px at the only
       size this variant renders at. Recorded in LOGO.md.
       Both subpaths wind the same way (sweep-flag 0), which nonzero would fill solid;
       fill-rule="evenodd" is what makes the hole a hole.
       4 nodes, no OPTICAL flags, every painted edge on a multiple of 16. -->
  <path fill="currentColor" fill-rule="evenodd"
        d="M128 16A112 112 0 1 0 128 240A112 112 0 1 0 128 16Z
           M128 48A80 80 0 1 0 128 208A80 80 0 1 0 128 48Z"/>
</svg>
```

## Path complexity

**A mark with hundreds of nodes was traced, not constructed.** The ceiling is derived from the same pixel rule as everything else.

Two nodes are distinguishable only if they are at least 2 device px apart at the variant's minimum size. At 16 px, 2 device px is 32 artboard units. The longest closed contour the live area permits is the perimeter of the 224-unit square:

```text
perimeter        = 4 × 224 = 896 units
node spacing     = 32 units
nodes per contour = 896 / 32 = 28
```

| Ceiling | Value | Status |
|---|---|---|
| Nodes on any one closed contour | **28** | derived above |
| Nodes in the file | **56** | stated — two full contours' worth. A mark is a silhouette plus what is inside it, and construction.md's counter target means each counter after the first eats the room the next one needs. |
| Redraw signal | **24** | stated. The richest fragment in construction.md and mark-types.md is the two-letter monogram at 16 nodes. 24 is 50% headroom over the busiest thing this skill actually draws. |
| Favicon | 28 per contour, at most 2 contours, and `nodes(favicon) < nodes(master)` | from F2 and the one-counter cap |

Count a node as any point the path data lands on: every `M`, `L`, `H`, `V`, `A` endpoint and every cubic endpoint. **Bézier control points are not nodes** — construction.md exempts them from the grid for the same reason they are exempt here: they locate ink without being ink.

### Two tracing signatures, both readable from the source

**Coordinate reuse.** A constructed mark reuses its numbers, because every element after the first is derived from one already placed. A traced outline reuses nothing, because each point came off a bitmap.

```text
reuse ratio = distinct coordinate values / total coordinate values
```

Compute it per `path`, and only on paths carrying **12 or more** coordinate values — below that the ratio is noise. Above **0.75** is a tracing signal. Measured against the fragments in the other two files:

```text
mark-types.md pinwheel   7 distinct / 13 total  = 0.54    pass
mark-types.md monogram H 7 distinct / 15 total  = 0.47    pass
```

**Curve runs.** A long run of `C` or `c` commands with no repeated radius and no repeated handle length is a sampled outline. A constructed curve uses `circle`, `ellipse`, or `A` arcs at a radius that appears elsewhere in the file — construction.md's curve-authoring section says to prefer exactly those, and this is the check that notices when you did not.

Precision noise is already caught upstream: construction.md forbids more than two decimal places, and a traced path is full of them.

## Artboard hygiene across the variant set

construction.md's self-check covers a single file. These are the items that only exist because there is a *set* of files, and each is binary.

- Every square variant carries the identical `viewBox="0 0 256 256"`. A variant on a different artboard cannot be swapped for another at a call site.
- Non-square variants — the horizontal and stacked lockups — declare their `viewBox` and record the aspect ratio in `LOGO.md`. That ratio is what the lockup width minimum is computed from.
- No variant carries `width` or `height` on the root `svg` element.
- Every variant carries `role="img"` and an `aria-label` naming the product. The favicon included.
- No empty `g` element, no unreferenced `defs`, no leftover construction geometry. Anything invisible in the file is either a bug or something that was meant to be deleted.
- The mono variants differ from their source only in the resolved `color`. Diff them.

## The binary checklist

Every item is answerable from the file or from one render. This is the criteria list; `logo-review` supplies the grading.

**Minimum sizes**

- [ ] `logo-mark`'s narrowest counter clears the target, or `LOGO.md` states the 32 px minimum that the floor costs.
- [ ] The lockup's `φ_ink` and `φ_ctr` were measured off a 256 px render, and the cap-height and width minimums are recorded in `LOGO.md`.
- [ ] Print minimums computed for each process the brief named, from the vendor's `L` and `g` where one was available.
- [ ] Every minimum in `LOGO.md`'s **Variants** table is a computed or measured number, not a round one someone liked.

**Clearspace**

- [ ] The value is `max(64, ceil(largest counter / 16) × 16)` units, expressed as a fraction of the rendered size.
- [ ] It is measured outward from the artboard edge, not from the ink.
- [ ] The lockup's clearspace is derived from the mark's geometry at the size the mark renders inside it.

**Mono collapse**

- [ ] M1 — every paint is `currentColor`; no literal colour, no alpha, no blend mode, no gradient.
- [ ] M2 — no painted element's bounding box sits inside another's. Knockouts are one `path`, two subpaths, `fill-rule="evenodd"`.
- [ ] M3 — the black-on-white and inverted white-on-black renders are identical.
- [ ] M4 — ink area over convex hull area is at or below 0.85, or `LOGO.md` names the silhouette as a deliberate primitive.

**Dark inversion**

- [ ] D1 — `logo-mono-white` is byte-identical to `logo-mono-black` apart from the resolved `color`, or `LOGO.md` records the fork, its size threshold, and its own flag count.
- [ ] D2 — every counter, reduced by `r · w`, still clears construction.md's target. Nothing relies on the 16-unit floor.

**Favicon**

- [ ] F1 — no path data shared with the master.
- [ ] F2 — strictly fewer nodes than the master.
- [ ] F3 — at most one counter, and at least one fewer than the master unless the master had one.
- [ ] Stroke weight 32 units; no counter on the floor; ink reaches the live-area bounds on its longer axis.
- [ ] The uniform weight is recorded as a decision with the sub-resolution reason.
- [ ] `LOGO.md` names every dropped feature and why, in reproduction terms.

**Path complexity**

- [ ] No contour above 28 nodes; no file above 56; anything above 24 was looked at again.
- [ ] Reuse ratio at or below 0.75 on every `path` carrying 12 or more coordinate values.
- [ ] No long `C` run without a repeated radius or handle length.

**Artboard hygiene**

- [ ] Identical `viewBox` across square variants; declared `viewBox` and recorded aspect on the lockups.
- [ ] No `width` or `height`; `role` and `aria-label` on every variant.
- [ ] No empty groups, unreferenced `defs`, or surviving construction geometry.

## Related references

| File | Covers |
|---|---|
| [construction.md](construction.md) | The grid, the nine corrections, stroke and counter discipline, forbidden constructs, colour binding, the self-check. Every threshold above is derived from its arithmetic. |
| [mark-types.md](mark-types.md) | The four shippable mark types and the construction recipe for each. Its fragments are what the worked numbers above are measured against. |
| [anti-slop.md](anti-slop.md) | The visual clichés that signal machine authorship regardless of how well the mark reproduces. |
| `docs/design/LOGO.md` | Where every number on this page is recorded for the specific mark. A threshold computed and not written down is a threshold nobody can re-check. |
