# SVG Construction Rules

You are drawing without eyes. Every judgement a designer makes by squinting at the screen has to be replaced here by a number you can compute and check. That is what this file is: the arithmetic that separates a mark that was drawn from a mark that was emitted.

Read it before writing a single path. Apply it to every candidate, not just the winner — the whole point of drawing three is that they are comparable, and they are only comparable if they were built on the same grid.

## The artboard

Every mark in this skill is authored on one artboard:

```svg
<svg viewBox="0 0 256 256" role="img" aria-label="[product name]">
```

### Required root attributes

| Attribute | Value | Why |
|---|---|---|
| `viewBox` | `0 0 256 256` | Square, fixed, identical across every candidate and every variant. A mark that changes artboard between variants cannot be compared or swapped. |
| `role` | `img` | The file is a picture, not a decorative flourish. |
| `aria-label` | the product name | Screen readers get the brand, not "image". |
| `width` / `height` | **absent** | Hardcoding pixels defeats the only advantage SVG has. Size it in CSS at the call site. |

Non-square artboards (a wide lockup, a stacked lockup) are legitimate **variants**, but they are derived after the mark is settled. The master is always `0 0 256 256`.

### The grid

The unit is **16**. The artboard is therefore a 16 × 16 cell grid. Every structural coordinate — the edges of shapes, the ends of strokes, the corners of counters — is a multiple of 16.

Two coordinates are **derived from a stroke weight** rather than placed, and both may sit on a half-unit (a multiple of 8), because stroke weights are themselves multiples of 8:

- a stroke centreline;
- the second painted edge of a filled stroke whose weight is not a multiple of 16 — a 24-wide stem starting at 128 ends at 152.

Neither is an optical exception and neither is flagged. Both follow mechanically from a legal stroke weight, and the cost is stated in [Stroke discipline](#stroke-discipline).

16 is not arbitrary. It is the number that makes the grid land on whole pixels at every size the mark will actually be rendered at:

| Render size | 1 grid unit | 1 half-unit |
|---|---|---|
| 16 px (favicon) | 1 px | 0.5 px |
| 32 px | 2 px | 1 px |
| 48 px | 3 px | 1.5 px |
| 64 px | 4 px | 2 px |
| 256 px (contact sheet) | 16 px | 8 px |

A straight edge on the grid maps to a pixel boundary at 16, 32, 48, 64 and 256 px. The same edge at, say, `x="70"` lands 0.375 px into a pixel at favicon size and anti-aliases into a grey smear. This is the entire reason the grid exists, and it is why the grid is only ever broken deliberately.

### The live area

Geometry occupies `16 … 240` on both axes — a 224-unit live area with one grid unit of artboard margin on all sides. This is breathing room inside the file, **not** clearspace; clearspace is measured outside the artboard and is defined in [reproduction.md](reproduction.md).

Two riders:

- When the container *is* the mark (an app-icon tile, a filled roundel), the container may run to the artboard edge and the 224 live area then applies to everything inside it.
- The live area bounds the **nominal** extents. Overshoot (correction 1 below) is measured outward from the nominal edge and is allowed to spill past the live area by its own amount — spilling is what overshoot is. Nothing else may.

## Precedence when the grid and the optics disagree

The grid rule says every coordinate is a multiple of 16. The optical rules below produce values like `66.56` and `30.72`. These genuinely conflict. Resolve it in this order, every time:

1. **Optical correction wins.** A mathematically clean coordinate that looks wrong is wrong. The grid is a tool for crispness, not an aesthetic authority.
2. **Spend the deviation on curves and points, not on straight edges.** Almost every optical correction moves a curve's extremum or a shape's apex — precisely the places a rasteriser anti-aliases anyway, where leaving the grid costs nothing. When a correction must move a straight axis-aligned edge (stroke thinning is the common case), move the *free* edge and keep the edge that aligns with another form on the grid.
3. **Snap back if the residual is under 0.5 units.** Compute the corrected value exactly, then compare it to the nearest **permitted grid value** — a multiple of **16** for a structural edge, a multiple of **8** for a stroke weight or any coordinate derived from one. Note that this is the distance to the nearest *permitted* value, not to the uncorrected value you started from; the two coincide only when the starting value was itself on the grid. If they are within 0.5 units, use the grid value and drop the flag. Grid alignment buys a crisp edge at every reproduction size; 0.5 units of size accuracy buys nothing.
4. **Two decimal places, never more.** `22.63`, not `22.6274`. One hundredth of a unit is 0.01 px at a 256 px render and 1/1600 px at favicon size — below any rasteriser's resolution. Trailing precision is noise that makes the file look machine-generated, which it is, and you are trying to hide that.
5. **Flag every surviving exception inline**, on the line above the geometry, in this format:

```svg
<!-- OPTICAL: r 64 → 66.56 · shared-edge overshoot · 2% of 128 = 2.56 per side -->
<circle cx="128" cy="128" r="66.56" fill="currentColor"/>
```

An unflagged non-grid number is a bug until proven otherwise. Every flag is copied into the **Construction** section of `docs/design/LOGO.md`, so the exception list is auditable after the fact by someone who was not there when it was drawn.

## Optical correction

This is the section that matters. Mathematically centred is not visually centred, and mathematically equal is not visually equal. An agent left to itself produces geometry that is arithmetically perfect and optically wrong, and that mismatch is the single loudest tell that nobody looked at the result.

Nine corrections. Each states the rule, the reason it has that value, and the arithmetic on the 256 artboard.

### 1. Overshoot at a shared edge

**Rule.** When a curved or pointed form shares an alignment edge with a flat one, the curved form must extend past it. Round forms overshoot by **2%** of the flat form's height at each end. Pointed forms (a triangle apex, a diamond vertex) overshoot by **3%**.

**Why.** The eye measures a shape by how much of it sits near the alignment line. A flat edge presents its full width there; a circle presents a tangent point and a pointed form presents almost nothing. Matched exactly, the round shape reads short and the point reads clipped. 2% and 3% are the typographic values — the same reason a lowercase `o` is drawn taller than an `x` in every serious typeface.

**Worked.** A 128-unit square, `y` 64 to 192. A circle of nominal 128 sharing both edges:

```text
overshoot  = 128 × 0.02 = 2.56 per side
diameter   = 128 + (2 × 2.56) = 133.12
radius     = 66.56
circle top = 128 − 66.56 = 61.44      (square top is 64)
circle base = 128 + 66.56 = 194.56    (square base is 192)
```

The centre stays at `128` — on grid. Only the radius leaves it. For a pointed form on the same edges: `128 × 0.03 = 3.84`, apex at `60.16`.

```svg
<svg viewBox="0 0 256 256" role="img" aria-label="Overshoot">
  <!-- Square, 96 × 96, every edge on the grid. Nominal layout: 16 + 96 + 32 + 96 + 16 = 256. -->
  <path d="M16 80H112V176H16Z" fill="currentColor"/>
  <!-- OPTICAL: r 48 → 49.92 · shared-edge overshoot · 2% of 96 = 1.92 per side -->
  <circle cx="192" cy="128" r="49.92" fill="currentColor"/>
</svg>
```

### 2. Whole-shape size matching

**Rule.** Two shapes read as "the same size" when their **areas** match, not their bounding boxes. A circle standing in for a square of side `s` has diameter `s × 1.128`.

**Why.** A square fills its bounding box completely; a circle fills 78.5% of it. Given equal bounding boxes the circle loses a fifth of its mass and reads noticeably smaller. Equal-area is the correction: `πr² = s²` gives `d = 2s/√π = 1.1284s`.

Do not confuse this with rule 1. Rule 1 is a ~2% nudge applied when two shapes **share an edge**. Rule 2 is a ~12% resize applied when two shapes must **read as equally big** in separate positions. Applying rule 1's number to rule 2's problem produces a circle that is visibly too small.

**Worked.** Matching a 128 square:

```text
diameter = 128 × 2/√π = 128 × 1.128379 = 144.43
residual against the nearest grid multiple (144 = 9 × 16) = 0.43  →  under 0.5, snap
diameter = 144, radius = 72                                        (on grid, no flag)
```

That is precedence rule 3 doing its job: the correction is large enough to matter and lands close enough to the grid to keep it.

Same treatment for other primitives. Every value in the last column is derived from the exact area match to a 128 square and then rounded to 2 dp — never from an already-rounded intermediate, which is how a table like this drifts:

| Shape | Area formula | Extent | Matching a 128 square |
|---|---|---|---|
| Circle | `πr²` | `1.1284 s` | d 144.43 → **snaps to 144** |
| Equilateral triangle | `(√3/4)a²` | `1.5197 s` side | side 194.52, height 168.46 |
| Diamond (square at 45°) | `a²` | `1.4142 s` diagonal | side 128, diagonal 181.02 |
| Hexagon (regular) | `(3√3/2)a²` | `1.2408 s` across corners | 158.82 across corners, 137.55 across flats |

Only the circle lands within 0.5 of a grid multiple. Every other value stays as a flagged exception under precedence rule 3.

**The triangle row does not survive contact with correction 3.** At 168.46 tall, a bounding-box-centred apex sits at `128 − 84.23 = 43.77`; the `h/6` centroid shift of 28.08 puts it at **15.69**, outside the live area. The ceiling for a triangle taking the full shift is:

```text
128 − h/2 − h/6 ≥ 16   →   2h/3 ≤ 112   →   h ≤ 168
```

So an equilateral triangle cannot be area-matched to a 128 square *and* take the full centroid shift. Shrink the triangle, per correction 3 — `h = 160` gives an apex at `128 − 80 − 26.67 = 21.33` and a base at `181.33`, both comfortably inside — and record that the mark is area-matched to a 121.6 square rather than a 128 one. Do not reduce the shift to make the number fit.

### 3. Apex centring

**Rule.** Centre a triangle — or any form with one pointed end — on its **centroid**, not its bounding box. For an apex-up triangle of height `h`, this moves the bounding box **up** by `h/6`.

**Why.** A triangle's area piles up toward the base. Bounding-box centring puts half the height on each side of the centre line but **three quarters of the mass below it** — the top half is a similar triangle at half scale, so it holds only a quarter of the area — and the shape reads as having slumped. The centroid sits at `h/3` from the base, the bbox centre at `h/2`; the difference is `h/6`, applied toward the apex. This is the correction behind every play button that had to be nudged right.

**Worked.** A 128-tall apex-up triangle centred in the 256 artboard:

```text
centroid offset = 128 / 6 = 21.33
bbox centred:   apex y = 64,     base y = 192
centroid centred: apex y = 42.67, base y = 170.67
```

This is the largest single correction in this file and the only one where over-application is visible, so check it on the contact sheet at 256 px before accepting it. If the shift pushes the apex outside the live area, the triangle is too big — shrink it, do not reduce the correction.

### 4. Horizontal strokes read heavier than vertical

**Rule.** At equal measured width, a horizontal stroke looks fatter than a vertical one. Thin horizontals by **4%**.

**Why.** Human vision resolves vertical edges better than horizontal ones, so a horizontal band bleeds outward more. Every text typeface ever cut applies this correction; a mark that skips it looks squat in exactly the way an untuned typeface does.

**Worked.**

| Vertical stem | Horizontal bar | Delta to the nearest permitted value |
|---|---|---|
| 16 | 15.36 | 0.64 |
| 24 | 23.04 | 0.96 |
| 32 | 30.72 | 1.28 |
| 8 (below the legal weight band — shown for the snap mechanism) | 7.68 → **snap back to 8** | 0.32, under the 0.5 tolerance |

Every legal weight — 16, 24, 32 — produces a delta that clears the snap tolerance, so on a legal mark this correction always survives. Apply it by moving the edge that is not shared:

```svg
<!-- An "L": 32-unit stem, 30.72-unit foot. The baseline (192) stays on grid. -->
<!-- OPTICAL: foot 32 → 30.72 · horizontal strokes read heavier · 32 × 0.96 -->
<path d="M96 64H128V161.28H192V192H96Z" fill="currentColor"/>
```

The correction is invisible below about a 64 px render. It is not wasted work — it is what makes the mark hold together on a billboard and in a slide deck, which is where marks are actually looked at closely.

### 5. Stroke width is measured perpendicular to the stroke

**Rule.** A diagonal drawn as a filled outline by offsetting `x` is thinner than it looks in the numbers. For a bar at angle `θ` from vertical, the horizontal offset needed for a perpendicular width `w` is `w / cos θ`.

**Why.** Offsetting horizontally measures across the bar at a slant, and the perpendicular distance is shorter by `cos θ`. At 45° that is a 29% shortfall — a diagonal that should match a 32-unit stem arrives at 22.6 and the mark visibly falls apart along its diagonals. This is not a perceptual correction, it is a geometry error, and it is the most common one in agent-authored path data.

**Do not cut this correction for length.** Everything else in this section tunes a shape that is already right; this one is the difference between a correct shape and a broken one, and it is the only correction here whose absence is visible at every size.

**Worked.** A 45° bar with a true perpendicular width of 32:

```text
horizontal offset = 32 / cos 45° = 32 × 1.41421 = 45.25
```

```svg
<!-- OPTICAL: horizontal run 32 → 45.25 (x 205.25 and 77.25) · perpendicular width · 32 / cos 45° -->
<path d="M32 192L160 64H205.25L77.25 192Z" fill="currentColor"/>
```

If the geometry is drawn with `stroke` rather than as a filled outline, `stroke-width` is already perpendicular and no correction applies. Mixing the two in one mark is how a diagonal ends up mismatched with the stem next to it — pick one construction and keep it (see [Stroke discipline](#stroke-discipline)).

Secondary correction, once the widths are correct: a diagonal at 45° still reads very slightly lighter than a vertical because the eye has no reference axis for it. Thicken it by up to **2%** — but only at 32 units and above, where `32 × 0.02 = 0.64` clears the snap tolerance. Below that the correction rounds away and the coordinate stays on grid.

### 6. Vertical placement inside a container

**Rule.** A mark inside a container — roundel, tile, badge, squircle — sits **above** the geometric centre. Split the slack **45% above, 55% below**.

**Why.** The optical centre of a bounded field is above its geometric centre; we read the base of a frame as heavier and a perfectly centred object as sagging. 45:55 is the smallest split that reliably reads as centred. Do not push further: at 40:60 the mark stops reading as centred and starts reading as deliberately top-aligned, which is a different design decision and needs stating as one.

**Worked.** A 128-unit mark inside the 256 artboard:

```text
slack = 256 − 128 = 128
above = 128 × 0.45 = 57.6      (geometric centring gives 64)
below = 128 × 0.55 = 70.4
mark top = 57.6, mark base = 185.6
shift = 6.4 up, or 2.5% of the container height
```

Two riders. First, the same correction does **not** apply horizontally — there is no optical left or right, so horizontal centring is exactly centred. Second, if the mark has a descending element (a tail, a dropped counter, a stroke that breaks the baseline), measure the slack from the ink extremes, not from the nominal box.

### 7. Corners and joins

**Rule.** Where two strokes of width `w` meet, the join accumulates ink and reads heavier than either straight run. Three consequences, all checkable:

- **Rounded corners:** `inner radius = outer radius − w`. If `outer < w`, the inner corner is sharp (`r = 0`). Equal radii on both sides is the tell of a machine-drawn corner: the stroke visibly bulges at the bend.
- **Angles:** no interior join tighter than **60°**. Below that the ink build-up cannot be relieved without redrawing, and at favicon size the join fills solid and swallows whatever the angle was supposed to express.
- **Relief:** at a 90° join in a stroke of 24 units or heavier, pull the inner corner back by `0.1 w` along both arms. At `w = 32` that is 3.2 units. Below 24 units the build-up is not visible at any reproduction size — skip the relief and keep the corner on the grid.

**Worked.** A 32-unit stroke turning a corner with a 48-unit outer radius:

```text
outer radius = 48   (grid, 3 units)
inner radius = 48 − 32 = 16   (grid, 1 unit)
```

Choosing outer radii that are `w` plus a grid multiple keeps both radii on the grid for free. Prefer those values.

### 8. Rotation

**Rule.** Rotating a form changes what it weighs to the eye even though nothing about it changed. Hold **area** constant across a rotation, then re-check the extent against the live area.

**Why.** A square rotated 45° keeps its area but grows its bounding extent by `√2`. It reads bigger, crowds its neighbours, and eats the artboard margin. The instinct is to shrink it to fit the old bounding box — which halves its area and makes it read far too small.

**Worked.** A 128 square rotated to a diamond:

```text
side stays 128, area stays 16384
diagonal = 128 × 1.41421 = 181.02      extent grows 41.4%
fitting the diagonal into 128 instead → side 90.51, area 8192 — half the mass, wrong
```

So: keep the side, accept the 181.02 extent, and confirm it fits `16 … 240`. It does (`128 ± 90.51` about the centre gives `37.49 … 218.51`), with room to spare.

**Rotation does not carry corrections with it.** Re-derive them from the final orientation, both ways:

- Rule 4 follows the axis, not the shape. A stem that rotates into a bar now needs the 4% thinning; a bar that rotates into a stem needs it taken out. Rotating a corrected shape and leaving the numbers alone gives you a form that is corrected on the wrong axis — worse than no correction at all.
- Rule 1 follows the final alignment edge. A square rotated to a diamond presents vertices where it presented flats, so any shared-edge overshoot goes from 2% to 3%.

### 9. Optical sidebearings in a wordmark

**Rule.** Letters are spaced by the area between them, not the distance between their bounding boxes. Take a base sidebearing `s` from the flat-sided letters and scale it by shape:

| Terminal shape | Letters | Sidebearing | At `s = 32` |
|---|---|---|---|
| Flat | H I E M N | `1.00 s` | 32 |
| Round | O C G S Q | `0.94 s` | 30.08 |
| Diagonal or pointed | A V W X Y | `0.88 s` | 28.16 |

**Why.** The same logic as rule 1, applied sideways. A round letter touches its sidebearing at a single tangent and a diagonal at a vertex, so equal measured gaps produce visibly larger holes next to `O` and `A` than next to `H`. Tracking a wordmark uniformly and stopping there is what makes set type look set rather than drawn.

Correct sidebearings before tracking, not after — tracking is a single global number and cannot fix a per-pair problem. The wordmark recipe itself is in [mark-types.md](mark-types.md).

### Order of application

Corrections compound, and applying them out of order produces a shape that is corrected twice on one axis and not at all on another. Always:

1. Lay the composition out on the grid, uncorrected.
2. Size the shapes against each other by area (rule 2).
3. Place them: container split (rule 6), apex centring (rule 3), rotation (rule 8).
4. Set stroke weights, then the axis corrections (rules 4, 5) and the joins (rule 7).
5. Apply shared-edge overshoot last (rule 1) — it only touches extrema, so nothing downstream depends on it.
6. Sidebearings, for wordmarks only (rule 9).
7. Round to 2 dp, snap anything within 0.5 of its permitted grid value (16 for a structural edge, 8 for a stroke weight or a coordinate derived from one), flag what survives.

## Stroke discipline

**One weight.** A mark uses a single stroke weight, or exactly two in a ratio you can name.

| Allowed weighting | Weights on the 256 artboard |
|---|---|
| Single weight (the default) | 16, 24 or 32 |
| 1:2 | 16 and 32 |
| 2:3 | 16 and 24 |
| 3:4 | 24 and 32 |

Both weights are multiples of 8. Three weights is not a system, it is an accident. A ratio the eye cannot name — 1:1.13, 1:1.4 — reads as a mistake rather than a decision, which is worse than having no contrast at all.

**Weight band.** Keep stroke weights between **16 and 32 units** (1 to 2 px at favicon size). Under 16 the stroke renders below a pixel at 16 px and anti-aliases to grey. Over 32 the counters start closing, which is the failure in the next section.

**What a 24-unit weight costs.** 16 and 32 are multiples of the grid unit, so both painted edges of a 16- or 32-wide filled stroke land on full units. 24 is not: a 24-wide stem starting at 128 ends at 152, putting one edge on the half-unit. Read that off the render table above — a half-unit is a whole pixel at 32, 64, 128 and 256 px, and half a pixel at 16 and 48 px. So a 24-unit weight softens one edge at exactly two reproduction sizes, one of which (16 px) is redrawn from scratch anyway — see [reproduction.md](reproduction.md).

That is an acceptable price for keeping two of the three ratios available, but it is a price. **A single weight of 16 or 32 puts every painted edge on a full unit and is the safer default.** Reach for 24 when the mark needs it, not by habit.

**Stroke or fill, not both.** Decide once per mark:

- **Filled paths** are the safer final form: no `stroke-width` to be scaled or dropped by a downstream tool, and knockouts work with `fill-rule`.
- **Stroked paths** are more auditable while drawing, because the weight is one number rather than a pair of parallel edges.

If you stroke, remember the stroke **straddles** the path. A 16-unit stroke centred on `y="64"` paints from 56 to 72 — neither on the grid. Put the centreline at `grid + w/2`:

```svg
<!-- centreline 120 = 112 + 16/2, so the painted edges land on 112 and 128 -->
<path d="M120 48V208" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="butt" stroke-linejoin="miter"/>
```

Declare `stroke-linecap` and `stroke-linejoin` explicitly on every stroked element. The defaults (`butt`, `miter`) are rarely what you want and never what you checked. `vector-effect="non-scaling-stroke"` is forbidden: it makes the mark a different shape at every size, which is the opposite of a logo.

## Counter discipline

A counter is enclosed negative space — the hole in an `o`, the gap inside a ring, the slot between two strokes. **Counters closing is the most common way a mark dies as a favicon**, and it happens silently: the 256 px version looks fine and the 16 px version is a blob.

The rules:

- **Design target: narrowest counter ≥ `max(stroke width × 1.25, 32 units)`.** At a 16 px render, 32 units is 2 px — enough for the hole to survive anti-aliasing wherever it falls. With a 32-unit stroke the binding term is `40`.
- **Hard floor: 16 units, and grid-aligned.** 16 units is exactly one pixel at 16 px, and it only stays one *clean* pixel if both edges are on the grid; half a unit off, it splits across two pixels and greys out. This makes the floor conditional on the stroke weight: only weights that are multiples of 16 leave both counter edges on full units, so **a mark built on a 24-unit weight forfeits the floor** and must meet the 32-unit target instead. Its target is 32 regardless (`max(24 × 1.25, 32)`), so in practice this costs nothing — but do not read the floor as available to a 24-unit mark. Between 16 and the target you are trading margin for detail deliberately and should say so in `LOGO.md`. Below 16 the counter does not exist at favicon size, and no amount of care at 256 px changes that. This is the one place the grid is load-bearing for legibility rather than crispness.
- **The rule covers open gaps too.** Any negative space narrower than the stroke closes the same way whether or not it is enclosed. Measure the narrowest point, not the average.
- **Measure at the narrowest point of the aperture**, including where a curve approaches a straight — that is where two anti-aliased edges meet and the gap goes first.
- **At most three distinct counters** at 256. More than three and you are relying on detail that no reproduction below 64 px will carry.

Verify with arithmetic before rendering, not by looking at the 256 px preview:

```text
counter width at 16 px = units / 16
32 units → 2.0 px    24 units → 1.5 px    16 units → 1.0 px    12 units → 0.75 px (gone)
```

Minimum sizes per variant and the favicon redraw rules are in [reproduction.md](reproduction.md). The counter floor here is what makes those thresholds achievable in the first place.

## Forbidden constructs

Each of these is banned for a specific failure, not on taste. If you believe you have a case for one, you have almost certainly found the case the ban was written for.

| Construct | Why it is forbidden | Instead |
|---|---|---|
| `<filter>`, `<feGaussianBlur>`, `<feDropShadow>` | Rasterises differently in every renderer, is dropped outright by PDF/X, embroidery digitisers, and most email clients, and has no meaning at all in one-colour print. A mark whose form depends on a filter has no form. | Draw the shape. If the effect is the idea, the idea is not a logo. |
| `<linearGradient>`, `<radialGradient>` | The mark must survive being flattened to a single value. A gradient carries structure that vanishes on collapse, and the flattened result is a silhouette with the interior missing. | Solid fills. A gradient may exist only in a derived colour variant that is never the master. |
| `<text>` in a final asset | Resolves against whatever fonts the rendering machine has. The same file renders correctly on the machine that drew it and wrong on the build server. | Draw with it while exploring; convert to outlines before shipping. The handoff is recorded in the **Production handoff** section of `LOGO.md`. |
| `transform` on final geometry | A coordinate that only means something after a matrix cannot be checked against the grid, and the exception flags become unverifiable. Nested `<g transform>` chains make it worse. | Use transforms while constructing; flatten every one into the path data before shipping. Every number in the final file reads directly against the grid. |
| `<mask>`, `<clipPath>` for knockouts | A mask needs two colours to exist. Under mono collapse the masked region takes the same value as the mask and the knockout disappears. | `fill-rule="evenodd"` on a single path. One element, one fill, correct in every colour mode. |
| Unrounded or sub-grid coordinates | `133.1199999` is not more accurate than `133.12`, and a straight edge at `x="70"` blurs at every size. Precision noise also makes it obvious the file was generated rather than drawn. | 2 dp; structural straight edges on the grid; exceptions flagged (see [Precedence](#precedence-when-the-grid-and-the-optics-disagree)). |
| `width` / `height` on the root `svg` | Pins the asset to one size and overrides the call site. | `viewBox` only. |
| `<image>`, embedded raster, data URIs | Not vector. Does not scale, does not collapse to mono, does not survive a redraw. | Draw it. |
| `<style>` blocks and CSS classes carrying geometry | Splits the definition of the shape across two places, one of which is stripped when the SVG is inlined. | Presentation attributes on the element. |

## Colour binding

**The master mark is one colour, and that colour is `currentColor`.**

```svg
<path d="M16 80H112V176H16Z" fill="currentColor"/>
```

Every geometry element carries `fill="currentColor"` (or `stroke="currentColor"`) explicitly. Omitting `fill` does not inherit — SVG's initial fill is black, which silently defeats the whole arrangement.

What this buys, for free and without a second file:

- **Mono collapse is automatic.** The mark is already single-value; nothing to flatten.
- **Dark inversion is a CSS property.** `color: #fff` on the container, no new asset.
- **The colour variants are derived, not authored.** `logo-mono-black` and `logo-mono-white` are the same geometry with `color` resolved. Generating them cannot introduce a drawing difference, because there is no drawing step.

**Two-colour marks.** If the mark genuinely needs a second value, the second element binds to a custom property with `currentColor` as the fallback:

```svg
<path d="M96 96H160V160H96Z" fill="var(--brand-accent, currentColor)"/>
```

`var()` needs a CSS-aware renderer, so this is acceptable in a **derived** asset only. The master file stays single-value `currentColor` so that a print RIP, an embroidery digitiser, or an SVG-to-PNG tool with no CSS engine gets a correct mark rather than a partly-black one.

**Where the values come from.** When `docs/design/MASTER.md` exists, take them from it — the mark should inherit decisions the design system already made rather than opening a second, contradictory palette:

| `LOGO.md` role | `MASTER.md` source |
|---|---|
| Mark on light | Color Palette → Neutrals → Text primary |
| Mark on dark | Color Palette → Neutrals → Background, or pure white |
| Accent (two-colour variants only) | Color Palette → Primary |
| Background pairings to test | Color Palette → Neutrals → Background and Surface |

Two prohibitions:

- **Never bind to a semantic colour** — success, warning, error, info. Those values are reserved for state and will be re-tuned without anyone thinking about the logo.
- **Never invent a palette.** If `MASTER.md` is absent, ship the mark in `currentColor` alone and say so in `LOGO.md`. Suggest running `ui-design-system`; do not guess a brand colour and present it as a decision.

**Contrast.** The mark against each background it is specified for must clear **3:1** (WCAG 2.2 SC 1.4.11, non-text contrast). Compute it; do not eyeball it. A mark that fails this is not a styling problem, it is an unusable asset.

## Self-check before rendering

Run this list against every candidate before it reaches the contact sheet. Every item is answerable from the file itself — none of it needs eyes.

- [ ] `viewBox="0 0 256 256"`; no `width` or `height`; `role` and `aria-label` present.
- [ ] All geometry within `16 … 240` on both axes. Two exemptions only: a container that is itself the mark, and overshoot spilling outward from a nominal edge.
- [ ] Every coordinate is a multiple of 16 — or a multiple of 8 where it is derived from a stroke weight (a centreline, or the second painted edge of a filled stroke) — or carries an `OPTICAL:` flag on the line above it.
- [ ] Every flag names the rule and shows the arithmetic.
- [ ] No coordinate has more than 2 decimal places.
- [ ] No surviving exception sits within 0.5 of its permitted grid value (16 for an edge, 8 for a stroke) — those should have been snapped.
- [ ] One stroke weight, or two in a named ratio, all multiples of 8, all within 16 … 32.
- [ ] Narrowest counter ≥ `max(stroke × 1.25, 32)`; nothing under 16; at most three counters. On a 16- or 32-unit weight, every counter edge on a full unit; on a 24-unit weight, the 32-unit target met rather than the floor.
- [ ] No `filter`, gradient, `text`, `transform`, `mask`, `clipPath`, `image`, `style`, or `vector-effect`.
- [ ] Every fill and stroke is `currentColor`, or a `var(--…, currentColor)` in a derived variant only.
- [ ] Every shape sharing an edge with a curve or a point has the overshoot applied.
- [ ] Every horizontal stroke is 4% thinner than its vertical counterpart.
- [ ] Every diagonal drawn as a filled outline uses `w / cos θ` for its offset.
- [ ] Anything inside a container is split 45:55, above:below.

A candidate that fails any item is fixed before rendering, not after. The contact sheet is for judging ideas; it is not where construction errors get caught, because at 256 px most of them are invisible and at 16 px all of them look like the same problem.

## Related references

| File | Covers |
|---|---|
| [mark-types.md](mark-types.md) | The four shippable mark types and the construction recipe for each. Every SVG in it obeys this file. |
| [reproduction.md](reproduction.md) | Minimum sizes, clearspace, mono collapse, dark inversion, the favicon redraw, path complexity ceiling. |
| [anti-slop.md](anti-slop.md) | The visual clichés that signal machine authorship regardless of how well they are constructed. |
| `docs/design/MASTER.md` | Palette and typography, when the project has a design system. |
