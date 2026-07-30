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

The unit is **16**. The artboard is therefore a 16 × 16 cell grid. The rule binds **painted edges** — the boundaries of ink, which are the only thing a rasteriser resolves:

> A painted edge sits on a multiple of **16**; or on a multiple of **8** when the **declared** stroke weight that produced it is not a multiple of 16. Declared stroke weights are themselves multiples of **8**.

Call any of those a **permitted value**. Everywhere else in this file the rule is referenced by that term rather than restated, so there is one definition and nothing to drift out of sync with it.

The second clause exists because 16 does not divide 24. A 24-wide stem starting at 128 ends at 152, and no 24-wide stem can put both edges on multiples of 16. The cost of that is priced in [Stroke discipline](#stroke-discipline). Neither clause is an optical exception and neither is flagged; both follow mechanically from a legal stroke weight.

**"Declared" means the weight before optical correction — the number in your stroke table, not what a correction left behind.** This distinction only bites in one place, and there it decides the outcome. Take a crossbar declared at 16 and thinned to 15.36 by correction 4, centred at 128:

```text
declared weight 16 → a multiple of 16 → edges tested against multiples of 16
  edge 120.32   nearest multiple of 16 = 128   residual 7.68   → survives, flagged
  edge 135.68   nearest multiple of 16 = 128   residual 7.68   → survives, flagged

read it as the CORRECTED weight 15.36 → not a multiple of 16 → multiples of 8 admitted
  edge 120.32   nearest multiple of 8 = 120    residual 0.32   → snapped
  edge 135.68   nearest multiple of 8 = 136    residual 0.32   → snapped
  result: a 16-unit bar. Correction 4 silently undone by the rule meant to preserve it.
```

The corrected weight is a *consequence* of the declared one and never redefines what is permitted. If it did, every correction that leaves the grid would widen the tolerance that is supposed to protect it, and precedence rule 3 would quietly reverse each one.

**A centreline is not a painted edge, and is not checked.** It paints nothing — it is bookkeeping that locates two edges. At `w = 24` a centreline sits at `edge + 12`, a multiple of 4, permitted by nothing on this page. That is fine and needs no flag. Check the two edges it implies; never the centreline itself. The same exemption covers Bézier control points (see [Curve authoring](#curve-authoring)) and any construction geometry deleted before shipping.

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

Three riders:

- When the container *is* the mark (an app-icon tile, a filled roundel), the container may run to the artboard edge and the 224 live area then applies to everything inside it.
- The live area bounds the **nominal** extents. Overshoot (correction 1 below) is measured outward from the nominal edge and is allowed to spill past the live area by its own amount — spilling is what overshoot is. Nothing else may.
- **Bound a curve by its control points, not by sampling it.** A Bézier is always contained by the convex hull of its control points, so testing the control points is conservative, always safe, and one comparison per point. Sampling can miss an extremum between samples; the hull cannot.

## Precedence when the grid and the optics disagree

The grid rule says every coordinate is a multiple of 16. The optical rules below produce values like `66.56` and `30.72`. These genuinely conflict. Resolve it in this order, every time:

1. **Optical correction wins.** A mathematically clean coordinate that looks wrong is wrong. The grid is a tool for crispness, not an aesthetic authority.
2. **Spend the deviation on curves and points, not on straight edges.** Almost every optical correction moves a curve's extremum or a shape's apex — precisely the places a rasteriser anti-aliases anyway, where leaving the grid costs nothing. When a correction must move a straight axis-aligned edge (stroke thinning is the common case), move the *free* edge and keep the edge that aligns with another form on the grid.
3. **Snap back if the residual is under 0.5 units.** Compute the corrected value exactly, then compare it to the nearest **permitted value** as defined under [The grid](#the-grid) — a multiple of 16, or a multiple of 8 for a declared stroke weight and for a painted edge produced by a **declared** weight that is not a multiple of 16. The correction you just computed never widens its own tolerance. Note that this is the distance to the nearest *permitted* value, not to the uncorrected value you started from; the two coincide only when the starting value was itself permitted. If they are within 0.5 units, use the permitted value and drop the flag. Grid alignment buys a crisp edge at every reproduction size; 0.5 units of size accuracy buys nothing.
4. **Two decimal places, never more.** `22.63`, not `22.6274`. One hundredth of a unit is 0.01 px at a 256 px render and 1/1600 px at favicon size — below any rasteriser's resolution. Trailing precision is noise that makes the file look machine-generated, which it is, and you are trying to hide that.
5. **Flag every surviving exception inline**, on the line above the geometry, in this format:

```svg
<!-- OPTICAL: r 64 → 66.56 · shared-edge overshoot · 2% of 128 = 2.56 per side -->
<circle cx="128" cy="128" r="66.56" fill="currentColor"/>
```

An unflagged non-permitted number is a bug until proven otherwise. Every flag is copied into the **Construction** section of `docs/design/LOGO.md`, so the exception list is auditable after the fact by someone who was not there when it was drawn.

**The token is `OPTICAL:` whatever the reason.** Read it as *"off the grid, for the reason stated on this line"* — not as a claim that the reason was perceptual. Two kinds of value earn it:

- an **optical correction** — a number produced by one of the nine below;
- a **derived coordinate** — a number that falls out of a construction rather than being placed, such as the cusp where two circles intersect, or an arc endpoint fixed by a radius chosen elsewhere.

Both are deliberate, both must show their arithmetic, and both are audited identically. One token, one gate, nothing to drift. The middle field of the flag carries the distinction, which is where it belongs: a reader who needs to know *why* reads the reason, not the prefix.

**Ceiling: about six surviving flags in one mark.** Past six, the form is fighting the grid rather than being corrected against it, and the audit trail stops being readable — twenty flags is not a well-documented mark, it is an undocumented one with twenty comments in it. Six is a redraw signal, not a budget to spend down. If a mark needs more, the geometry underneath is wrong.

**Count decisions, not numbers.** Several coordinates falling out of one stated construction — the two cusps of a single lens, the four endpoints of one arc system — are **one** entry against the ceiling, even though each is annotated where it appears. Six distinct *reasons* is the limit. A construction-derived mark is not penalised for being constructed.

## Optical correction

This is the section that matters. Mathematically centred is not visually centred, and mathematically equal is not visually equal. An agent left to itself produces geometry that is arithmetically perfect and optically wrong, and that mismatch is the single loudest tell that nobody looked at the result.

Nine corrections. Each states the rule, the reason it has that value, and the arithmetic on the 256 artboard.

**The nine are numbered for reference, not for sequence.** They are presented in the order that makes them easiest to understand and applied in close to the reverse order — correction 1 is first to read and last to apply, because it only touches extrema. Read the procedure below before you draw; working top-down through 1 → 9 applies overshoot to uncorrected extents and then thins the horizontals underneath it.

### Order of application

Corrections compound, and applying them out of order produces a shape that is corrected twice on one axis and not at all on another. Always:

1. Lay the composition out on the grid, uncorrected.
2. Size the shapes against each other by area (correction 2).
3. Place them: container split (correction 6 — **only if a container is actually drawn**; the artboard is not one), apex centring (correction 3), rotation (correction 8).
4. Set stroke weights, then the axis corrections (corrections 4, 5) and the joins (correction 7).
5. Apply shared-edge overshoot last (correction 1) — it only touches extrema, so nothing downstream depends on it.
6. Sidebearings, for letterforms you position yourself (correction 9).
7. Round to 2 dp, snap anything within 0.5 of its permitted value, flag what survives, and count the flags against the ceiling of six.

### 1. Overshoot at a shared edge

**Rule.** When a curved or pointed form shares an alignment edge with a flat one, the curved form must extend past it. Round forms overshoot by **2%** of the flat form's height at each end. Pointed forms (a triangle apex, a diamond vertex) overshoot by **3%**.

**The base is the corrected height, not the nominal one.** Overshoot is applied last, so by the time you reach it the flat form has already been through corrections 2–8. Take the percentage on the extent it has *then*. Taking it on the nominal extent double-counts whatever correction 4 already removed.

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

Do not confuse this with correction 1. Correction 1 is a ~2% nudge applied when two shapes **share an edge**. Correction 2 is a ~12% resize applied when two shapes must **read as equally big** in separate positions. Applying correction 1's number to correction 2's problem produces a circle that is visibly too small.

**Worked.** Matching a 128 square:

```text
diameter = 128 × 2/√π = 128 × 1.128379 = 144.43
residual against the nearest grid multiple (144 = 9 × 16) = 0.43  →  under 0.5, snap
diameter = 144, radius = 72                                        (on grid, no flag)
```

That is precedence rule 3 doing its job: the correction is large enough to matter and lands close enough to a permitted value to keep it.

Same treatment for other primitives. Every value in the last column is derived from the exact area match to a 128 square and then rounded to 2 dp — never from an already-rounded intermediate, which is how a table like this drifts:

| Shape | Area formula | Extent | Matching a 128 square |
|---|---|---|---|
| Circle | `πr²` | `1.1284 s` | d 144.43 → **snaps to 144** |
| Equilateral triangle | `(√3/4)a²` | `1.5197 s` side | side 194.52, height 168.46 |
| Diamond (square at 45°) | `a²` | `1.4142 s` diagonal | side 128, diagonal 181.02 |
| Hexagon (regular) | `(3√3/2)a²` | `1.2408 s` across corners | 158.82 across corners, 137.55 across flats |

Only the circle lands within 0.5 of a permitted value. Every other value stays as a flagged exception under precedence rule 3.

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

**Rule.** A horizontal stroke reads heavier than a vertical one of the same measured width. Thin every horizontal by **4%** of its declared weight.

**This is unconditional.** It does not require a vertical stroke anywhere in the mark to measure against. The effect is a property of how the eye resolves a horizontal edge, not of a comparison — a lone horizontal bar in a mark containing no verticals at all still reads heavier than the weight you declared for it, and thinning is what makes it look like the weight it is. A horizontal with no counterpart is thinned exactly like one with a counterpart. "There is nothing to compare it to" is not an exemption; there is nothing to compare it to and it still looks too fat.

Unconditional means it does not depend on a counterpart. It does **not** mean it reaches things that are not strokes. Correction 4 governs the *thickness of a linear element* — a stem, a bar, an arm, the wall of a ring. A square, a disc, or any form whose horizontal extent is its **size** rather than its **thickness** has no stroke weight to thin, and is sized by correction 2 instead. The filled squares in this file are not under-corrected; they are not strokes.

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

**A curved stroke is a horizontal stroke wherever its tangent is horizontal.** Two concentric circles give a ring of uniform thickness, which reads bottom-heavy for exactly the reason above — the same failure, hidden in a shape that looks symmetrical. Either thin the ring where the tangent runs horizontal by differing the vertical radii, or accept the uniform ring and record the choice:

```text
outer r 96, inner r 64          thickness 32 everywhere, uniform
thin the top and bottom:        32 × 0.96 = 30.72
inner ry = 96 − 30.72 = 65.28   (inner becomes an ellipse: rx 64, ry 65.28)
result: 30.72 thick at the horizontal tangents, 32 at the vertical ones
```

A uniform ring is a legitimate decision. An unnoticed one is not — if you keep it uniform, say so in `LOGO.md`. Declining the thinning is a **recorded deviation from an unconditional rule**, not a case the rule never covered.

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

**This binds only when a container is actually drawn.** A container is ink: a roundel, a tile, a badge, a plate that ships as part of the mark. **The artboard is not a container.** It is a coordinate space with no ink in it, so there is no frame for the eye to read the mark against and nothing for it to sag inside. A mark sitting free on the artboard is centred at 128 — exactly centred — and takes no shift. Every fragment in this file does that, which is why none of them shows a 6.4-unit offset. Read the rule the other way and every mark in the plugin acquires a shift it does not need and a flag to document it.

**Why.** The optical centre of a bounded field is above its geometric centre; we read the base of a frame as heavier and a perfectly centred object as sagging. 45:55 is the smallest split that reliably reads as centred. Do not push further: at 40:60 the mark stops reading as centred and starts reading as deliberately top-aligned, which is a different design decision and needs stating as one.

**Worked.** A 128-unit mark inside a drawn 256-unit container — a tile that bleeds to the artboard edge, which the live-area rule permits when the container is the mark:

```text
slack = 256 − 128 = 128
above = 128 × 0.45 = 57.6      (geometric centring gives 64)
below = 128 × 0.55 = 70.4
mark top = 57.6, mark base = 185.6
shift = 6.4 up, or 2.5% of the container height
```

Two riders. First, the same correction does **not** apply horizontally — there is no optical left or right, so horizontal centring is exactly centred. Second, if the mark has a descending element (a tail, a dropped counter, a stroke that breaks the baseline), measure the slack from the ink extremes, not from the nominal box.

### 7. Corners and joins

**Rule.** Where two strokes of width `w` meet, the join accumulates ink and reads heavier than either straight run. Two consequences, both checkable:

- **Rounded corners:** `inner radius = outer radius − w`. If `outer < w`, the inner corner is sharp (`r = 0`). Equal radii on both sides is the tell of a machine-drawn corner: the stroke visibly bulges at the bend.
- **Angles:** no interior join tighter than **60°**. Below that the ink build-up cannot be relieved without redrawing, and at favicon size the join fills solid and swallows whatever the angle was supposed to express.

**Worked.** A 32-unit stroke turning a corner with a 48-unit outer radius:

```text
outer radius = 48        (multiple of 16)
inner radius = 48 − 32 = 16   (multiple of 16)
```

Choosing outer radii of `w` plus a multiple of 16 puts both radii on a permitted value for free — a multiple of 16 at `w = 16` or `w = 32`, and a multiple of 8 at `w = 24`, where outer 40 gives inner 16. Prefer those values.

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

- Correction 4 follows the axis, not the shape. A stem that rotates into a bar now needs the 4% thinning; a bar that rotates into a stem needs it taken out. Rotating a corrected shape and leaving the numbers alone gives you a form that is corrected on the wrong axis — worse than no correction at all.
- Correction 1 follows the final alignment edge. A square rotated to a diamond presents vertices where it presented flats, so any shared-edge overshoot goes from 2% to 3%.

### 9. Optical sidebearings between letterforms

**Scope.** This correction applies **only where you are positioning the letterforms yourself** — a monogram, or a wordmark drawn as paths after outline conversion has happened somewhere else. A wordmark shipped as `<text>` against a declared webfont (see [Forbidden constructs](#forbidden-constructs)) takes its sidebearings from the font's own metrics, and the only lever SVG gives you is `letter-spacing`, which is global tracking and cannot fix a per-pair gap. If a mark needs this correction, it needs per-glyph placement — and that is a decision to take deliberately, not to discover halfway through.

**Rule.** Letters are spaced by the area between them, not the distance between their bounding boxes. Take a base sidebearing `s` from the flat-sided letters and scale it by shape:

| Terminal shape | Letters | Sidebearing | At `s = 32` |
|---|---|---|---|
| Flat | H I E M N | `1.00 s` | 32 |
| Round | O C G S Q | `0.94 s` | 30.08 |
| Diagonal or pointed | A V W X Y | `0.88 s` | 28.16 |

**Why.** The same logic as correction 1, applied sideways. A round letter touches its sidebearing at a single tangent and a diagonal at a vertex, so equal measured gaps produce visibly larger holes next to `O` and `A` than next to `H`. Tracking uniformly and stopping there is what makes set type look set rather than drawn.

Correct sidebearings before tracking, not after — tracking is a single global number and cannot fix a per-pair problem. The wordmark recipe itself is in [mark-types.md](mark-types.md).

These nine are applied in the sequence given under [Order of application](#order-of-application) at the top of this section, which is close to the reverse of the order they are presented in. Do not work through them 1 → 9.

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

**What counts as "the weight" for a form whose ink varies.** For a stroked path it is `stroke-width`. For a filled stem of constant thickness it is the distance between its two edges. For a form whose thickness varies by construction — a lens built from two overlapping circles, which is thin at the waist and several times thicker at the cusps — **the weight is the narrowest ink**. That single number is what you check against the 16 … 32 band and what you feed to the counter target.

The narrowest point is what disappears first at 16 px, and disappearing is the failure the band exists to prevent. Measuring at the widest point would pass a mark whose waist had already closed — a lens that reads as two separate arcs at favicon size while its arithmetic dutifully reports the thickness at the cusps. Where the widest ink is more than about twice the narrowest, say so in `LOGO.md`: the mark has a thick–thin axis, and that is a design decision worth recording rather than an accident of construction.

**What a 24-unit weight costs.** 16 and 32 are multiples of the grid unit, so both painted edges of a 16- or 32-wide filled stroke land on full units. 24 is not: a 24-wide stem starting at 128 ends at 152, putting one edge on the half-unit. Read that off the render table above — a half-unit is a whole pixel at 32, 64, 128 and 256 px, and half a pixel at 16 and 48 px. So a 24-unit weight softens one edge at exactly two reproduction sizes, one of which (16 px) is redrawn from scratch anyway — see [reproduction.md](reproduction.md).

It costs a second thing, and this is the paragraph to learn it in rather than twenty lines further down: **a 24-unit weight forfeits the counter hard floor.** The floor requires both counter edges on full units, which only weights divisible by 16 deliver. A 24-unit mark must meet the 32-unit counter target instead — which is its target anyway under `max(24 × 1.25, 32)`, so it costs nothing in practice, but it removes the fallback.

That is an acceptable price for keeping two of the three ratios available, but it is a price. **A single weight of 16 or 32 puts every painted edge on a full unit and keeps the floor available, and is the safer default.** Reach for 24 when the mark needs it, not by habit.

**Stroke or fill, not both.** Decide once per mark:

- **Filled paths** are the safer final form: no `stroke-width` to be scaled or dropped by a downstream tool, and knockouts work with `fill-rule`.
- **Stroked paths** are more auditable while drawing, because the weight is one number rather than a pair of parallel edges.

If you stroke, remember the stroke **straddles** the path. A 16-unit stroke centred on `y="64"` paints from 56 to 72 — and with `w = 16` the edges must be multiples of 16, so neither is permitted. **Place the centreline by choosing the edges you want, then solving back: `centreline = edge + w/2`.** Never place the centreline first and hope.

```svg
<!-- w 16: edges 112 and 128, both multiples of 16 → centreline 112 + 8 = 120 -->
<path d="M120 48V208" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="butt" stroke-linejoin="miter"/>
```

At `w = 24` the centreline lands on a quarter-unit, and that is not a defect — it is the case the "centreline is not a painted edge" rule exists for:

```svg
<!-- w 24: edges 112 (×16) and 136 (×8, permitted because 16 does not divide 24)
     → centreline 112 + 12 = 124, a multiple of 4. Not checked, not flagged.
     No 24-wide stroke can put both edges on multiples of 16. -->
<path d="M124 48V208" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="butt" stroke-linejoin="miter"/>
```

Declare `stroke-linecap` and `stroke-linejoin` explicitly on every stroked element. The defaults (`butt`, `miter`) are rarely what you want and never what you checked. `vector-effect="non-scaling-stroke"` is forbidden: it makes the mark a different shape at every size, which is the opposite of a logo.

## Curve authoring

**Prefer `<circle>` and `<ellipse>` when the shape is one.** They have no handles to get wrong, and they read against the grid directly. Reach for path data only when you need something a primitive cannot express — a knockout via `fill-rule`, a partial arc, a curve that is not circular.

**When you do author a curve, use kappa.** A circular arc of 90° is approximated by a cubic Bézier whose control handles sit at

```text
k = 0.5523          (4/3 × (√2 − 1), the standard circular kappa)
handle length = 0.5523 × r, measured from each endpoint along the tangent
```

At `r = 96` the handles are `0.5523 × 96 = 53.02` long. A circle is four such cubics: handles run horizontal at the vertical extrema and vertical at the horizontal extrema. Guessing handle lengths instead is what produces the lumpy not-quite-oval that passes every numeric check in this file and still looks wrong — the error is largest at 45°, exactly where the eye reads a circle's roundness.

**Handle coordinates are not painted edges.** They are not checked against permitted values and are not flagged, for the same reason a centreline is not: they locate ink without being ink. `53.02` needs no justification. The endpoints, which *are* on the ink, do.

For arcs other than 90°, subdivide into 90° segments rather than stretching one cubic — a single Bézier's error grows sharply past a quarter turn.

### Arc flags

```text
A  rx  ry  x-axis-rotation  large-arc  sweep  x  y
```

The two flags are where hand-authored arcs go wrong, and they go wrong **silently**: a mistaken flag still parses, still renders, and draws a different arc. Nothing errors. This matters more here than in most SVG work, because constructing a form from circle intersections — the geometric recipe's first move — is all arcs.

**There are always four candidates.** Given a start point, an end point, and a radius big enough to span them, two distinct circles pass through both points, and each offers two ways round — the short way and the long way. Four arcs. The flags pick one:

| `large-arc` | `sweep` | You get |
|---|---|---|
| 0 | 0 | the shorter arc (≤ 180°), travelling anti-clockwise as displayed |
| 0 | 1 | the shorter arc (≤ 180°), travelling clockwise as displayed |
| 1 | 0 | the longer arc (≥ 180°), travelling anti-clockwise as displayed |
| 1 | 1 | the longer arc (≥ 180°), travelling clockwise as displayed |

`large-arc` chooses minor or major. `sweep` chooses the direction of travel, which is also what decides **which side of the chord the arc bulges toward**. SVG's y-axis points down, so `sweep = 1` is clockwise *on screen* — the opposite of the maths convention, and the usual source of a mirrored arc.

**Choose them in this order, never by trial:**

1. Which side of the straight line between the endpoints should the arc bulge toward? That fixes `sweep`.
2. Is the arc more or less than a half turn? That fixes `large-arc`.

**Verify the centre, not the picture.** For a circular arc the implied centre must sit at exactly `r` from both endpoints. That is a two-line check and it is decisive:

```text
ring, outer subpath:  centre (128, 128), r 96
  |start − centre| = |(128,32) − (128,128)|  = 96   ✓
  |end   − centre| = |(128,224) − (128,128)| = 96   ✓
```

If the distances disagree, the arc is not the one you meant — whatever the flags say.

**Two degenerate cases worth knowing:**

- **Chord exactly `2r`.** The two candidate circles coincide, the arc is a semicircle, and `large-arc` has no effect at all. The ring in [Counter discipline](#counter-discipline) is this case, which is why its `1 0` and a `0 0` draw the same thing. Its sweep choice is likewise harmless by symmetry. **Do not generalise from it** — on any less symmetric construction both flags bite.
- **Radii too small to span the endpoints.** SVG does not error. It scales `rx` and `ry` up uniformly until they fit, handing you a valid arc of the wrong radius. In a constructed mark the radius is always load-bearing, so check `chord ≤ 2r` before you rely on it.

`sweep` also sets the winding direction of the subpath, which is what makes `fill-rule="evenodd"` necessary for knockouts — see [Counter discipline](#counter-discipline).

## Counter discipline

A counter is enclosed negative space — the hole in an `o`, the gap inside a ring, the slot between two strokes. **Counters closing is the most common way a mark dies as a favicon**, and it happens silently: the 256 px version looks fine and the 16 px version is a blob.

The rules:

- **Design target: narrowest counter ≥ `max(stroke width × 1.25, 32 units)`.** At a 16 px render, 32 units is 2 px — enough for the hole to survive anti-aliasing wherever it falls. With a 32-unit stroke the binding term is `40`.
- **Hard floor: 16 units, and grid-aligned.** 16 units is exactly one pixel at 16 px, and it only stays one *clean* pixel if both edges are on the grid; half a unit off, it splits across two pixels and greys out. This is the one place the grid is load-bearing for legibility rather than crispness. Below 16 the counter does not exist at favicon size, and no amount of care at 256 px changes that. **Build to the target; the floor is an exception with three preconditions and a price — see [When the floor is actually available](#when-the-floor-is-actually-available).**
- **The rule covers open gaps too.** Any negative space narrower than the stroke closes the same way whether or not it is enclosed.
- **At most three distinct counters** at 256. More than three and you are relying on detail that no reproduction below 64 px will carry.

**Build counters so the gap is computable.** "Measure the narrowest point of the aperture" is not a usable instruction without eyes — for a curved bowl meeting a stem it is a nontrivial minimisation, and an agent asked to eyeball it will guess, optimistically. So constrain the construction instead of the measurement. Two families:

| Family | Narrowest gap | Example |
|---|---|---|
| Concentric round | `outer r − inner r`, where both radii bound the **negative** space. Where the negative space is a plain hole rather than an annular gap, it is simply `2 × r`. | a ring's hole; the gap between two concentric rings; a bowl inside a bowl |
| Parallel straight | the coordinate difference between the two facing edges | a slot, a gap between two stems |

Measure the negative space, not the ink. For the ring below, `96 − 64 = 32` is the *thickness of the ring* — that is its stroke weight. Its counter is the hole, `2 × 64 = 128`.

Anything outside these two — an irregular aperture, a curve closing on a straight at an angle — has no closed-form narrowest point at this stage. **Rebuild it into one of the two families, or record in `LOGO.md` that the counter was not computed** and let the 16 px row of the contact sheet decide. Recording it is an acceptable outcome; guessing a number is not.

**Where edge alignment matters, and where it does not.** Alignment is a property of the floor, not of counters generally, and reading it as a blanket rule makes it unsatisfiable for any curved counter. The threshold is explicit:

| Counter width | Edges on full units? | Why |
|---|---|---|
| 16 … 31.99 | **Required** | At 16 units the counter is 1 px at favicon size, so half a unit of misalignment is half the gap and it greys out. |
| 32 and above | Not required | At 32 units the counter is 2 px, the same half-unit is a quarter of it, and anti-aliasing absorbs it. |

So a curved counter's extrema may sit wherever correction 4's curved-stroke rider puts them, provided the counter clears 32. The ring corrected under that rider has counter edges at `128 ± 65.28` = **62.72 and 193.28**, on a counter whose narrowest dimension is 128 units — far above the threshold. Those edges are off the grid and correct. They are not a violation and need no flag beyond the one correction 4 already requires.

This is also why a 24-unit weight forfeits the floor: it cannot put both counter edges on full units, so it cannot use the 16 … 32 band at all and must clear 32, where alignment stops mattering. The 32-unit boundary itself is fixed by the arithmetic above; what varies is whether the **Required** row is reachable at all, which is the next section.

### When the floor is actually available

The floor is not wrong. It is exactly one clean pixel at exactly 16 px, which is what the arithmetic says. But it assumes a pixel-aligned raster, and three independent conditions have to hold at once for that raster to exist. A mark satisfying all three is a special case, not a default:

| Condition | Fails when | Source |
|---|---|---|
| Declared weight is 16 or 32 | `w = 24` — no 24-wide stroke puts both counter edges on full units | this file, [Stroke discipline](#stroke-discipline) |
| The render size is one you control, and is an integer multiple of 16 px | a device pixel ratio of 1.25 or 1.5 turns a nominal 16 px favicon into 20 or 24 device px, and one grid unit stops landing on a whole pixel | [reproduction.md](reproduction.md), *When grid alignment actually reaches the raster* |
| The mark ships no dark variant | a 16-unit counter measures `16 − r · w` on dark — **15.52** at `r` 3% — which is under the floor | [reproduction.md](reproduction.md), *Dark inversion* |

The second condition is the one that removes the floor from most real work: any variant rendered at a size the browser chooses is out, which is every favicon on the web.

**And the floor is not free.** `reproduction.md` prices it: a mark built to the floor has a minimum render size of **32 px**, against **16 px** for one built to the target. Spending counter width down to the floor buys interior detail with a doubling of the smallest size the mark works at. That is a legitimate trade — it is also a trade, and the cost was missing from this file until `reproduction.md` computed it. Record the choice *and* the 32 px in `LOGO.md`.

**So: build to the 32-unit target.** It is the normal case. Reach for the floor only when all three conditions hold, the detail genuinely needs it, and the doubled minimum is acceptable.

Verify with arithmetic before rendering, not by looking at the 256 px preview:

```text
counter width at 16 px = units / 16
32 units → 2.0 px    24 units → 1.5 px    16 units → 1.0 px    12 units → 0.75 px (gone)
```

### The knockout, and the way it fails silently

A counter in a filled mark is a hole in a path, and there is exactly one safe way to cut one: **two subpaths in a single `<path>`, with `fill-rule="evenodd"`.**

SVG's initial fill rule is `nonzero`. Under `nonzero`, two subpaths wound in the *same* direction fill solid — so a ring becomes a disc. There is no error, no warning, and no size at which it looks different: it is simply the wrong shape, everywhere, and a mark whose counter has vanished still passes every numeric check in this file. This is the most common way a geometric mark is silently wrong.

```svg
<!-- Ring: outer r 96, inner r 64 → 32 of thickness, 128 of counter.
     Both subpaths are wound the same way (sweep-flag 0). Under the default
     nonzero rule that fills a solid disc; evenodd is what makes it a ring.
     Weight is uniform by choice — see correction 4's curved-stroke rider. -->
<path fill="currentColor" fill-rule="evenodd"
      d="M128 32A96 96 0 1 0 128 224A96 96 0 1 0 128 32Z
         M128 64A64 64 0 1 0 128 192A64 64 0 1 0 128 64Z"/>
```

Do not reach for `<mask>` or `<clipPath>` instead — those fail differently and worse, under mono collapse. See [Forbidden constructs](#forbidden-constructs).

Minimum sizes per variant and the favicon redraw rules are in [reproduction.md](reproduction.md). The counter floor here is what makes those thresholds achievable in the first place.

## Forbidden constructs

Each of these is banned for a specific failure, not on taste. If you believe you have a case for one, you have almost certainly found the case the ban was written for.

| Construct | Why it is forbidden | Instead |
|---|---|---|
| `<filter>`, `<feGaussianBlur>`, `<feDropShadow>` | Rasterises differently in every renderer, is dropped outright by PDF/X, embroidery digitisers, and most email clients, and has no meaning at all in one-colour print. A mark whose form depends on a filter has no form. | Draw the shape. If the effect is the idea, the idea is not a logo. |
| `<linearGradient>`, `<radialGradient>` | The mark must survive being flattened to a single value. A gradient carries structure that vanishes on collapse, and the flattened result is a silhouette with the interior missing. | Solid fills. A gradient may exist only in a derived colour variant that is never the master. |
| `<text>` in a geometric, monogram, or abstract mark | Resolves against whatever fonts the rendering machine has, so the same file renders correctly where it was drawn and wrong on a build server. In these three types the letterform is geometry you are drawing anyway, so there is no reason to reach for it. | Draw the letterform as paths. Wordmarks are the one exception — see below. |
| `transform` on final geometry | A coordinate that only means something after a matrix cannot be checked against the grid, and the exception flags become unverifiable. Nested `<g transform>` chains make it worse. | Use transforms while constructing; flatten every one into the path data before shipping. Every number in the final file reads directly against the grid. |
| `<mask>`, `<clipPath>` for knockouts | A mask needs two colours to exist. Under mono collapse the masked region takes the same value as the mask and the knockout disappears. | `fill-rule="evenodd"` on a single path. One element, one fill, correct in every colour mode. |
| Unrounded or sub-grid coordinates | `133.1199999` is not more accurate than `133.12`, and a straight edge at `x="70"` blurs at every size. Precision noise also makes it obvious the file was generated rather than drawn. | 2 dp; structural straight edges on the grid; exceptions flagged (see [Precedence](#precedence-when-the-grid-and-the-optics-disagree)). |
| `width` / `height` on the root `svg` | Pins the asset to one size and overrides the call site. | `viewBox` only. |
| `<image>`, embedded raster, data URIs | Not vector. Does not scale, does not collapse to mono, does not survive a redraw. | Draw it. |
| `<style>` blocks and CSS classes carrying geometry | Splits the definition of the shape across two places, one of which is stripped when the SVG is inlined. | Presentation attributes on the element. |

### The wordmark exception

A wordmark is type, and **this skill has no font engine and does not convert type to outlines.** That is an explicit non-goal, not an oversight. So:

- A wordmark master ships as `<text>` against a **declared** webfont. Record the family, the weight, and any `letter-spacing` in `LOGO.md` — a wordmark whose typeface is not written down is not reproducible.
- Outline conversion is recorded in `LOGO.md`'s **Production handoff** section as a step that was **not** performed, and that must happen before the mark is used anywhere the webfont is not guaranteed — print, embroidery, a third party's site, an email client.
- **Do not describe a `<text>`-bearing wordmark as a finished asset**, and do not attempt the conversion here. Shipping it while calling it done is the failure this section exists to prevent; so is concluding that wordmarks cannot be built.

Correction 9 does not apply to a wordmark in this form — see its scope note.

## Colour binding

**The master mark is one colour, and that colour is `currentColor`.**

```svg
<path d="M16 80H112V176H16Z" fill="currentColor"/>
```

Every geometry element carries `fill="currentColor"` (or `stroke="currentColor"`) explicitly. Omitting `fill` does not inherit — SVG's initial fill is black, which silently defeats the whole arrangement.

That single binding is what makes the mono and dark variants *derivable* rather than redrawn: `logo-mono-black` and `logo-mono-white` are the same geometry with `color` resolved.

**That promise is conditional, and the condition is a size.** A light mark on a dark ground reads optically heavier — ink grows and counters shrink by the same absolute amount `r · w`, where `r` is type practice's 2–4% reversed-weight compensation. Applying that compensation *is* a drawing difference, so the guarantee cannot hold unconditionally. [reproduction.md](reproduction.md) derives the fork threshold; take it from there rather than re-deriving it here:

```text
R ≥ 256 / (r · w)        at r = 3%:   534 px at w 16,  356 px at w 24,  267 px at w 32
```

- **Below the threshold** the compensation is under one device pixel. It cannot be seen, it is not applied, and the promise holds exactly: the dark variant is the master with `color` resolved and nothing else.
- **At or above it** the compensation is visible, and one of two things goes in `LOGO.md` — either the compensation was not taken and the dark variant is nominally heavy by `r · w`, or a **separate dark master** exists carrying its own flags against its own ceiling of six, and this guarantee does not cover that file.

Either branch is fine once it is written down. Shipping a forked geometry as though it were derived is the failure.

One consequence lands back on the stroke table. At `w = 16` and `r = 3%` the compensation is `0.48` — **below the 0.5 snap tolerance** — so precedence rule 3 rounds it away and a 16-unit mark has no expressible dark compensation at any size. It therefore never forks, and its derivability guarantee is unconditional. That is not a defect in either file; it is the tolerance doing its job, and one more reason a single 16-unit weight is the safer default. The optical effect still happens whether or not you can draw the compensation, which is why a dark variant still removes the counter floor — the third condition under [When the floor is actually available](#when-the-floor-is-actually-available).

What those variants then have to survive is [reproduction.md](reproduction.md)'s subject, not this file's.

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

Run this list against every candidate before it reaches the contact sheet. Every item is answerable from the file itself — none of it needs eyes. There is one item per rule in this document, including one per correction; a gate that checks half the rules is the wrong gate.

**Artboard and grid**

- [ ] `viewBox="0 0 256 256"`; no `width` or `height`; `role` and `aria-label` present.
- [ ] All geometry within `16 … 240` on both axes, curves bounded by their control points. Two exemptions only: a container that is itself the mark, and overshoot spilling outward from a nominal edge.
- [ ] Every painted edge is on a permitted value — a multiple of 16, or a multiple of 8 where the **declared** stroke weight producing it is not a multiple of 16 — or carries an `OPTICAL:` flag on the line above it. Centrelines and Bézier control points are not painted edges and are not checked.
- [ ] Every flag names its reason — an optical correction *or* a construction it was derived from — and shows the arithmetic.
- [ ] No coordinate has more than 2 decimal places.
- [ ] No surviving exception sits within 0.5 of its permitted value (16, or 8 for a declared stroke weight and for a painted edge produced by a **declared** weight not divisible by 16) — those should have been snapped.
- [ ] **Six or fewer surviving flags**, counting distinct reasons rather than annotated numbers. More means redraw, not more comments.

**The nine corrections**

- [ ] **1** — wherever a curved or pointed form shares an alignment edge with a flat one, the *curved or pointed* form extends past it, by 2% (round) or 3% (pointed) of the flat form's **corrected** height, per side. The flat form stays on its permitted value.
- [ ] **2** — shapes meant to read as the same size are matched by area, not bounding box (a circle standing in for side `s` has `d = 1.1284 s`).
- [ ] **3** — every triangle or single-apex form is centred on its centroid: bounding box shifted `h/6` toward the apex.
- [ ] **4** — every horizontal stroke carries the 4% thinning off its declared weight, including the horizontal tangents of a curved stroke. Unconditional: a horizontal with no vertical counterpart anywhere in the mark is thinned too. A uniform ring is a recorded deviation, not an exemption.
- [ ] **5** — every diagonal drawn as a filled outline uses `w / cos θ` for its offset.
- [ ] **6** — anything inside a *drawn* container is split 45:55, above:below. A mark free on the artboard is exactly centred; the artboard is not a container.
- [ ] **7** — no interior join tighter than 60°; on rounded corners, `inner radius = outer radius − w`.
- [ ] **8** — every rotated form holds its area, not its bounding box, and corrections 1 and 4 are re-derived from the final orientation.
- [ ] **9** — where you position letterforms yourself, sidebearings are scaled by terminal shape (1.00 / 0.94 / 0.88). Not applicable to a `<text>` wordmark.

**Strokes, counters, constructs, colour**

- [ ] One stroke weight, or two in a named ratio, all multiples of 8, all within 16 … 32, measured at the **narrowest ink** where the form's thickness varies; `stroke-linecap` and `stroke-linejoin` declared on every stroked element.
- [ ] Narrowest counter ≥ `max(stroke × 1.25, 32)`; nothing under 16; at most three counters. Counter edges on full units **only while the counter is under 32 units** — at 32 and above, alignment is not required and curved extrema may sit off the grid.
- [ ] Any counter under 32 units satisfies all three floor conditions — declared weight 16 or 32, a render size you control that is a multiple of 16 px, and no dark variant — and `LOGO.md` records the 32 px minimum it costs. Otherwise it clears the target.
- [ ] Every counter is concentric-round or parallel-straight so its gap is computable — or `LOGO.md` records that it was not computed.
- [ ] Every knockout is two subpaths in one `<path>` with `fill-rule="evenodd"` — never left to the default `nonzero`.
- [ ] No `filter`, gradient, `transform`, `mask`, `clipPath`, `image`, `style`, or `vector-effect`. No `<text>` except in a wordmark master, where the webfont is declared and the un-performed outline conversion is recorded in `LOGO.md`.
- [ ] Every fill and stroke is `currentColor`, or a `var(--…, currentColor)` in a derived variant only.
- [ ] If a dark variant ships at or above `256 / (r · w)` px, `LOGO.md` records either the un-taken compensation or a separate dark master with its own flag count. Below that size the derived variant needs nothing.
- [ ] The mark clears 3:1 against every background it is specified for.

A candidate that fails any item is fixed before rendering, not after. The contact sheet is for judging ideas; it is not where construction errors get caught, because at 256 px most of them are invisible and at 16 px all of them look like the same problem.

## Related references

| File | Covers |
|---|---|
| [mark-types.md](mark-types.md) | The four shippable mark types and the construction recipe for each. Every SVG in it obeys this file. |
| [reproduction.md](reproduction.md) | Minimum sizes, clearspace, mono collapse, dark inversion, the favicon redraw, path complexity ceiling. |
| [anti-slop.md](anti-slop.md) | The visual clichés that signal machine authorship regardless of how well they are constructed. |
| `docs/design/MASTER.md` | Palette and typography, when the project has a design system. |
