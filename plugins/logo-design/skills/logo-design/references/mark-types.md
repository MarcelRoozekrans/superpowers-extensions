# Mark Types

Four types ship from this skill: geometric, monogram, wordmark, abstract. Everything else — pictorial, mascot, illustrative emblem — is refused in `SKILL.md`, which is where a behavioural gate belongs.

The type is not a style label applied afterwards. It decides what you place first, what the second element is derived from, and which of [construction.md](construction.md)'s corrections bind. Pick it before you draw, and draw all three candidates for one brief from the same type unless the brief is genuinely undecided — three types is a survey, not an exploration.

Every rule in [construction.md](construction.md) applies to every fragment on this page: the grid and its permitted values, the nine corrections and their order of application, the flag format, stroke and counter discipline, the forbidden constructs, `currentColor`, and the self-check. This file adds only what is specific to a type. Where a correction does not bind, that is said explicitly — an unmentioned correction is a skipped one.

Minimum sizes, clearspace and the favicon redraw are in [reproduction.md](reproduction.md). The clichés that read as machine-authored are in [anti-slop.md](anti-slop.md). The **characteristic failure** recorded under each type below is a different thing: it is how that type collapses when its own recipe is followed carelessly, and it is detectable by holding the mark against the recipe.

## Choosing the type

| Signal in the brief | Type |
|---|---|
| The mark has to work with the name removed — app icon, favicon, embroidery, a stamp | Geometric |
| The name is long, its initials are not, and the mark still has to survive without the name | Monogram |
| The name *is* the brand and no symbol has been earned yet — early stage, single product, name-led | Wordmark |
| The idea is a relationship or a process rather than an object, and no letterform carries it | Abstract |

When the user answers "you choose", the table above is still the instrument — read it with the brief's own answers as the signals. `SKILL.md`'s `logo-concept` § Step 1 states that derivation, off the length of the string to be set in type and the contexts the mark has to reproduce into, and **geometric is the default only where neither signal decides**. It has the widest reproduction range and the fewest dependencies outside the file: a monogram depends on the initials being distinctive, a wordmark on a webfont being present wherever the mark is rendered — the dependency `SKILL.md`'s Step 0 makes you check before the run rather than discover after it.

## Geometric

### What a geometric mark is

A mark built from primitives — circles, rectangles, arcs — in which every element after the first is *derived* from an element already placed. No shape appears because it looked right. Each one is the arithmetic consequence of the last, and that chain is what goes in `LOGO.md`'s Construction section.

### When it is the right choice

- The mark has to stand alone, without the name beside it.
- Reproduction is hostile: embroidery, foil, a one-colour stamp, a 16 px favicon.
- The idea is a form rather than a word.

It is the wrong choice when the product's name is the whole idea (wordmark), or when the initials are the idea (monogram).

### Recipe

1. **Place one seed primitive on the grid.** A circle or a square, centred on `(128, 128)`, sized to a grid multiple. Write the seed down as a sentence before drawing anything else — everything in the mark will hang off it.
2. **Derive the second element from the first, never from the artboard.** Three derivations carry their own arithmetic and are the ones to reach for:
   - **Circle intersection.** Two circles of radius `r` whose centres are `r` apart — each centre sitting on the other's circumference. The intersection points lie at `± r·√3/2` from the line of centres, and the lens between the two arcs has 120° cusps. The radius stays on the grid, the arcs are exact, and only the two cusps leave the grid. This is the construction to try first.
   - **Concentric offset.** `inner radius = outer radius − stroke weight`, where both radii bound **ink**. `outer r − inner r` is then the weight you just declared, restated — it is *not* the counter. The counter is the hole the inner radius encloses: `2 × inner r`. Measure the negative space, never the ring thickness. A ring at `w 16` with outer 96 and inner 80 has a counter of **160**; read it as 16 and you condemn a sound mark as sitting on the hard floor, then thin or redraw it for nothing. Two circles that are *not* concentric generalise the same subtraction to the **ink**, not to the counter: the narrowest ink is `outer r − centre distance − inner r`, and that is the number the weight band checks. The lens below is exactly that case.
   - **Half-step subdivision.** Halving a grid multiple: `128 → 64 → 32`. 16 is the floor and 8 is below the legal stroke band, so three levels is the practical depth.
3. **Draw arcs, not guessed curves.** Use `circle` and `rect` where the shape is one; use `A` in path data for a partial arc. Author a cubic only when the curve is genuinely not circular — and then put the control handles at `0.5523 × r` from each endpoint along the tangent, per construction.md's kappa note. Four cubics with guessed handles produce a visibly lumpy oval that passes every mechanical check in construction.md and still looks wrong.
4. **Cut every counter as a knockout.** Two subpaths in a single `path`, with `fill-rule="evenodd"` written out. SVG's initial fill rule is `nonzero`, under which two subpaths wound the same way fill solid: the ring becomes a disc, at every size, with no error and no warning. Never leave the fill rule to the default.
5. **Re-derive the corrections from the finished form.** For a geometric mark the ones that usually bind are correction 1 (a round form sharing an alignment edge with a flat one), correction 2 (two shapes meant to read as equally big), correction 4 (wherever the boundary tangent runs horizontal), and correction 7 (join angles). Corrections 3, 5, 8 and 9 bind only if you drew an apex, a diagonal outline, a rotation, or a letterform. Say which ones you decided did not bind.
6. **Count the flags.** A derived mark generates very few: the derivations above put the radii and the straight edges on the grid, and the only escapees are curve extrema and intersection points. Two or three surviving flags is normal here. Six means the geometry underneath was chosen rather than derived.

### Worked fragment

A lens derived from two circles whose centres sit on each other's circumference, with a concentric counter knocked out of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Vesica">
  <!-- Seed: circles r 96 at (80,128) and (176,128). Centre distance 96 = r, so each
       centre sits on the other's circumference. Both are construction geometry and are
       not in the shipped file; only their intersection is drawn.
       Lens x-extremes 80 and 176 (both ×16). Cusp interior angle 120°, clear of
       correction 7's 60° floor. Counter = the hole, 2 × 32 = 64 across, edges 96 and 160
       (both ×16), ≥ max(16 × 1.25, 32) = 32.
       Narrowest ink = 96 − 48 − 32 = 16, at y 128. This is a filled form, not a stroked
       one, so the narrowest ink is the weight: 16, inside the 16 … 32 band. The boundary
       tangent is vertical there and horizontal nowhere on the ink, so correction 4 has no
       horizontal stroke to act on here.
       Thick–thin axis: widest ink 51.14 (cusp 44.86 up to counter edge 96, on the
       centreline) against narrowest 16 is 3.2×, past the ~2× threshold — recorded in
       LOGO.md as a design decision, per stroke discipline. -->
  <!-- OPTICAL: cusp y 128 ± 83.14 → 44.86 and 211.14 · lens cusp from grid circles · 96 × √3/2 = 83.14 -->
  <path fill="currentColor" fill-rule="evenodd"
        d="M128 44.86A96 96 0 0 0 128 211.14A96 96 0 0 0 128 44.86Z
           M128 96A32 32 0 1 0 128 160A32 32 0 1 0 128 96Z"/>
</svg>
```

Both subpaths are wound the same way (`sweep-flag 0` throughout), so `fill-rule="evenodd"` is what makes the hole a hole.

Corrections 1, 2, 3, 5, 8 and 9 do not bind: nothing flat shares an edge with the curve, nothing has to read as the same size as anything else, the form is symmetric about both axes so there is no single apex to centre, there is no diagonal outline, no rotation, and no letterform.

### How a geometric mark fails

**It becomes a generic app icon: a rounded square with a shape in it.** The tells, in the file rather than in the eye:

- The outermost element is a rounded rectangle or a circle that was placed *first* and derived from nothing.
- The inner element's dimensions have no arithmetic relationship to the outer one. It is "centred, about sixty percent" — a ratio nobody can name.
- `LOGO.md`'s Construction section cannot answer, for any element after the first, which earlier element produced its dimensions.

A reviewer detects it with one question, asked once per element: **what produced this number?** "It looked balanced" is the failure.

The fix is almost always to **delete the container**. A geometric mark that needs a tile behind it to look finished is not finished; the tile is `reproduction.md`'s app-icon variant, derived after the mark is settled, and it is never the mark.

## Monogram

### What a monogram is

One or two letterforms drawn as paths. Never a `text` element — construction.md's forbidden-constructs table permits `text` in a wordmark master only, and in a monogram the letterform is geometry you are drawing anyway.

### When it is the right choice

- The name is long but its initials are short and distinctive.
- The name is short enough to *be* its initials. A three- or four-character string is already a lettermark, and the ceiling below decides how many of its characters the mark actually carries — the string's length is not the letter count.
- Nothing about the product suggests a form, so a geometric mark would have to be invented rather than derived — but the mark still has to work without the name.

Two letters is the ceiling. Three initials at a 16 px render is about five pixels per letter, which is not a letter.

**One letter is a legal monogram and the recipe below has to be read with that in mind.** `SKILL.md`'s type derivation reaches it directly — a long name whose initials are *not* short and distinctive collapses to the single most distinctive one — and it is the strongest form at favicon size, because one letter at 224 units of cap height has roughly four times the ink of each half of a pair. Every step below applies except two, and both drop out cleanly rather than needing a judgement:

| Step | Single letter |
|---|---|
| 1 — choose the letters on legibility | becomes: **choose *the* letter on structure.** Prefer one that already contains contrasting terminals — `R`, `G`, `K`, `Q` and `B` each carry a flat stem against a curve or a diagonal, which is what corrections 1, 4 and 7 have to act on. `I`, `J`, `L` and `T` alone remain what the original clause says they are: a stroke, not a mark. |
| 7 — space by area, solve `s` from the fit | **`n/a`.** There is no second letter and no gap to divide. The row is centred on 128 and the fit is the letter's own width against the live area. |
| 8 — correction 9 always applies | **`n/a` for one letter**, and it is the single exception to that clause. Correction 9's own scope note is about the gap *between* letterforms; with one there is no facing pair. Record it `n/a — single letterform` rather than leaving it to be inferred. |

Everything else binds unchanged, and correction 7 binds *harder* than it does for a pair: a lone letter carrying a diagonal has its aperture fully exposed with no neighbour to crowd it, so [construction.md](construction.md)'s split between an ink join and an aperture is the clause to read before drawing `R`, `K` or `A`.

### Recipe

1. **Choose the letters on legibility, not on the name.** An `I`, a `J` or an `L` alone is a stroke, not a mark. A pair whose terminals are both flat (`H` + `I`) gives you nothing to space against. Prefer one flat-terminal letter and one round or pointed one — the contrast is what the sidebearing rule is for.
2. **Set the writing line before the letters.** Cap height and baseline both on the grid; for flat-terminal letters both are painted edges, so they are checked. Centre the cap height on `128` vertically unless you draw a container.
3. **Decide the container — including deciding against one — and take correction 6's split immediately.** This is the step that separates a monogram from a sticker, and "no container" is a decision recorded like any other. construction.md's Order of application puts the container split at its step 3, *ahead* of the weights, the joins, the overshoot and the sidebearings, and it belongs there: the split translates the whole letterform, so every clearance measured afterwards has to be measured from where the letter actually ended up. With no container the letter is exactly centred and takes no shift — the artboard is not a container. With one:

   ```text
   roundel inner r 96  →  inner field 192;  letter 96 tall
   slack  = 192 − 96 = 96
   above  = 96 × 0.45 = 43.2        (geometric centring would give 48)
   shift  = 48 − 43.2 = 4.8 up      ( = 0.05 × slack, always)
   ```

4. **Set one stroke weight, and let the counter decide it.** At weight `w` the narrowest slot must clear `max(1.25 w, 32)`, so a two-stem letter cannot be narrower than `w + max(1.25 w, 32) + w`:

   ```text
   w 16  →  16 + 32 + 16 = 64      (already a grid multiple)
   w 24  →  24 + 32 + 24 = 80      (a grid multiple; the counter floor is forfeit at w 24)
   w 32  →  32 + 40 + 32 = 104     (not permitted at w 32; round up to 112)
   ```

5. **Run the container's clearance gate from the shifted corner, never the concentric one.** A container has to clear the letterform at the letterform's *nearest* point, which for a rectangular letter in a roundel is a corner rather than a side. Step 3 has already moved the letter up, so the binding corner is the top one and it sits closer to the ring than concentric arithmetic reports:

   ```text
   letter 64 × 96, w 16, counter target max(1.25 × 16, 32) = 32
   half-width 32, half-height 48, shift 4.8 up (step 3)
   concentric corner    √(32² + 48²)   = 57.69   clearance 96 − 57.69 = 38.31
   shifted top corner   √(32² + 52.8²) = 61.74   clearance 96 − 61.74 = 34.26   ≥ 32   affordable
   roundel outer r 112  →  ring weight 16, outer edge on the live-area boundary
   ```

   The two readings differ by 4.05 units here, and the difference grows with the letter. **A concentrically computed gate passes marks that ship under target** — the same roundel with a 64 × 104 letter:

   ```text
   shift = 0.05 × (192 − 104) = 4.4
   concentric corner    √(32² + 52²)   = 61.06   clearance 34.94   ≥ 32   gate says yes
   shifted top corner   √(32² + 56.4²) = 64.85   clearance 31.15   < 32   ships broken
   ```

   That mark violates the counter target while its own gate approved it, which is exactly the failure described at the end of this section. If the clearance comes out under the target, the container is not affordable at that letter size: enlarge the container or shrink the letter — never thin the stroke, which walks the weight below the 16-unit band.
6. **Overshoot the round and pointed letters against the flat ones** — correction 1, taken on the corrected cap height: 2% per side for `O C G S Q`, 3% for `A V W`. This is what stops the `O` in a two-letter monogram reading short.
7. **Space by area, and solve the base sidebearing from the fit.** The gap between two letters is the sum of the two facing sidebearings, scaled by terminal shape per correction 9. Do not pick `s` and multiply — fix the letter widths on the grid, fix the row centred on `128`, take the gap from the subtraction, and divide back to get `s`. Deriving the gap from an already-rounded `s` drifts by a hundredth, which is the drift construction.md's correction 2 warns about in its table note: never derive from an already-rounded intermediate.
8. **Corrections that bind for a monogram:** 1 (round against flat), 4 (every horizontal bar), 6 (only with a drawn container), 7 (stem-to-bar joins), 9 (you positioned the letterforms, so this is the one type where correction 9 always applies). Corrections 2, 3, 5 and 8 bind only if you drew a shape that has to match another by area, a single apex to centre, a diagonal outline, or a rotation.

### Worked fragment

Two letters, no container — the containerless decision taken deliberately at step 3, with step 5's gate as what it would have had to clear otherwise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="HO">
  <!-- Cap height 96 (y 80 … 176), single stroke weight 16, no drawn container:
       correction 6 does not bind and the row is centred exactly on 128.
       Row fit: 32 … 224 = 192 = H 64 + gap + O 99.84  →  gap = 28.16.
       Sidebearings 1.00 s (H, flat terminal) + 0.94 s (O, round) = 1.94 s = 28.16
       →  s = 14.52, recorded in LOGO.md. The file carries the gap, not s.
       H slot 48 … 80 = 32 wide = max(16 × 1.25, 32), the counter target exactly.
       Three counters: the two H slots and the O. -->
  <!-- OPTICAL: crossbar 16 → 15.36 · horizontal strokes read heavier · 16 × 0.96; edges 120.32 and 135.68 about the letter centre 128 -->
  <path d="M32 80H48V120.32H80V80H96V176H80V135.68H48V176H32Z" fill="currentColor"/>
  <!-- OPTICAL: O radius 48 → 49.92 · shared-edge overshoot · 2% of 96 = 1.92 per side; extremes x 124.16 / 224, y 78.08 / 177.92 -->
  <!-- OPTICAL: counter rx 33.92 (49.92 − 16), ry 34.56 (49.92 − 15.36) · horizontal strokes read heavier · 16 × 0.96 = 15.36; edges x 140.16 / 208, y 93.44 / 162.56 -->
  <path fill="currentColor" fill-rule="evenodd"
        d="M174.08 78.08A49.92 49.92 0 1 0 174.08 177.92A49.92 49.92 0 1 0 174.08 78.08Z
           M174.08 93.44A33.92 34.56 0 1 0 174.08 162.56A33.92 34.56 0 1 0 174.08 93.44Z"/>
</svg>
```

The `O` is an ellipse rather than a circle for the reason construction.md gives under correction 4's curved-stroke rider: the ring is 16 thick where its tangent is vertical and 15.36 where it is horizontal. Its counter is 67.84 across at the narrowest, well clear of the 32 target.

### How a monogram fails

**The letter becomes unreadable once the container tightens.** The tells:

- The counter target is met by the letter measured in isolation, but the gap between the letter and the container is under it. The eye does not distinguish the two apertures; it reads one closing hole.
- The letter was drawn first at a comfortable size and the container was drawn around it at whatever radius looked snug. There is no recorded clearance number.
- At a 16 px render the mark reads as a filled disc with a smudge in it.

Detect it by computing the clearance at the letter's nearest point *after* correction 6 has moved the letter — for a rectangular letterform in a roundel that is the top corner, not the side and not the concentric corner. Measuring at the side overstates the clearance by tens of units; measuring at the concentric corner overstates it by a few, which is worse, because a few units is exactly the margin the gate is deciding on. Step 5's second worked example is a mark that passes the concentric reading and fails the real one.

A second tell, specific to two letters: if the pair was tracked with a single number instead of per-terminal sidebearings, the round letter sits visibly loose. Compare the gap on either side of the `O`.

## Wordmark

### What a wordmark is

The product name set in a **declared** webfont, tracked deliberately, plus exactly one custom detail.

The master ships a `text` element. **This skill has no font engine and does not convert type to outlines** — that is an explicit non-goal, not an oversight. construction.md's wordmark exception governs: record the family, the weight and the tracking in `LOGO.md`, and record the outline conversion in `LOGO.md`'s **Production handoff** section as a step that was **not** performed and that must happen before the mark is used anywhere the webfont is not guaranteed. Do not describe a `text`-bearing wordmark as a finished asset — and do not conclude from that that wordmarks cannot be built.

### Which model this recipe assumes

**A single `text` run.** Every consequence below binds:

- **Tracking is `letter-spacing`** — one global number for the whole run. It cannot express a per-pair correction.
- **Correction 9 does not apply.** Its scope note says so directly: sidebearings come from the font's own metrics and SVG gives you no lever on them.
- **The one custom detail cannot cut ink away.** The subtractive routes (`mask`, `clipPath`) are forbidden and a single run gives no per-glyph handle to reshape a glyph with — but that rules out *subtraction* and nothing more. An **additive** detail in the same fill needs neither: a bar driven through the `O`, a stroke extending one terminal, a rule joining two letters. So the detail may sit beside a letter or be overlaid on one; it may not carve into one. An overlay usually answers this type's characteristic failure better than something sitting underneath the word — it costs one measurement, because it needs the glyph's ink position.
- **The type's painted edges are not computable here.** Cap height, sidebearings and the font's own overshoot are metrics you do not have. The grid binds what you draw and what you anchor; the type's ink extents are measured off a render and recorded, not asserted.

The alternative model — individually placed glyphs — buys the per-glyph detail and brings correction 9 back. It costs two or more `text` elements with a drawn path between them, manual kerning at every seam, and a mark with no single source of truth for its spacing. Take it deliberately, state it in `LOGO.md`, and expect the flag count to rise. It is not the default and it must not be arrived at by accident.

### Recipe

1. **Declare the font before setting anything.** Family, weight, fallback. A wordmark whose typeface is not written down is not reproducible, and the file will render correctly on the machine that drew it and wrong on a build server.
2. **Anchor the row on the grid.** `text-anchor="start"` with `x` on a grid line and the baseline `y` on a grid line. Both are choices you make, so both are checkable. `text-anchor="middle"` centres the run without knowing its width, which is genuinely useful — but it makes every subsequent position depend on a measurement, and the renderer's trailing tracking step (see step 3 — measured by the contact sheet, not assumed) puts a middle-anchored run half a step left of where you asked. Note what the anchor *is*: an origin the glyphs are laid out from, not a painted edge — the same category as a centreline. Putting it on a grid line is a checkable convention, not an alignment, because the first glyph's ink starts one left sidebearing further in.
3. **Fit on the `ink edge`, never the `advance edge`.** There are two right-hand edges and they differ by a whole tracking step. The contact sheet reports both under those labels, next to a `fit ×` multiplier, so the number is available where the recipe needs it. **Take the `ink edge`**: `construction.md` defines the grid on painted edges — "the boundaries of ink" — and the trailing `letter-spacing` step a renderer appends after the last glyph paints nothing, so fitting to the advance edge pads the mark with a tracking step of whitespace that will never show. Whether the renderer appends that step at all is measured by the harness rather than assumed. Measured in Chromium on the fragment below, at `font-size 64`:

   ```text
   ink edge      231.37   →  fitting it to 224 gives font-size 61.64
   advance edge  237.77   →  fitting it to 224 gives font-size 59.72
   ```

   Both are defensible readings of "the right-hand edge" and they are visibly different wordmarks, which is why the recipe names one.
4. **Treat `font-size` as a starting value, and record the fit as unmeasured until it has been.** Adjust `font-size` first and `letter-spacing` only after, or you are tuning two variables against one measurement. **This file has no measurement mechanism of its own** — the render is the contact-sheet pass in `logo-concept`, so until it has run there is no measured edge and `LOGO.md` records the fit as *not yet measured*, with the size recorded as what it is. Writing a starting value down as a measured result is the same failure as calling a `text`-bearing wordmark finished. Record one asymmetry rather than trying to fix it: fitting the right ink edge to 224 does not put the left ink edge on 32, because the anchor is an origin and the first glyph's ink starts a sidebearing inside it. The row's ink is not symmetric about 128, and `LOGO.md` should say so.
5. **Track deliberately, and say what the number means.** Express tracking relative to the size: `letter-spacing = font-size × t`. For a name set in caps, `t` between 0.05 and 0.12 — below 0.05 it reads as the font's default and buys nothing, above 0.12 the word stops being a word. At `font-size 64`, `t = 0.1` gives `letter-spacing = 6.4`.
6. **Draw exactly one custom detail.** Drawn geometry, on the grid, at the mark's declared stroke weight. One is the whole budget. Prefer a position that shares the run's own anchor: a detail starting at the run's `x` is the only position that needs no measurement at all — at the cost that it aligns with the *origin*, so it sits one left sidebearing outside the first glyph's ink. That is a tolerable trade for the leading detail and a bad one for a trailing detail, where the same slack is a whole tracking step. Anything keyed to a glyph further along the row — and every overlay — takes its position from the same `ink edge` family of readouts as step 3, and is recorded as unmeasured until that render has run.
7. **Corrections.** For a single-run wordmark with one drawn detail, corrections 1, 2, 3, 5, 8 and 9 do not bind — there is no drawn curve sharing an edge, no area match, no apex, no diagonal outline, no rotation, and no letterform you positioned. **Correction 4 binds unconditionally.** It is not a relational rule: a lone horizontal bar reads heavier than its measured width whether or not the mark contains a vertical to compare it against, and the 4% is what makes it look like the weight you declared. A horizontal detail at a declared 16 is drawn at 15.36. Correction 6 binds only if you draw a container. Record either decision in `LOGO.md` rather than leaving it inferred.
8. **Record what could not be checked.** The self-check items about painted edges cannot be run against the `text` element. Say so in `LOGO.md` alongside the un-performed outline conversion. An unrunnable check recorded as unrun is honest; an unrunnable check reported as passed is not. One specific limit worth writing down, because it is easy to assume otherwise: a `text` element's `getBBox()` returns the **layout** box — ascent to descent — not tight ink. So the horizontal readings above have no vertical counterpart, a wordmark's vertical extents are not comparable to a path's, and the live-area check on them belongs to [reproduction.md](reproduction.md) rather than to any arithmetic available here.

### Worked fragment

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="NOVA">
  <!-- Webfont: Inter 700, declared in LOGO.md. NOT converted to outlines — recorded as
       an un-performed step in LOGO.md's Production handoff. This file is not a finished
       asset anywhere the webfont is absent.
       text-anchor start, x 32 and baseline y 144 are on the grid because all three are
       chosen rather than measured.
       font-size 64 with letter-spacing 6.4 (t = 0.1) is a STARTING value, and the fit has
       NOT been taken here. Measured in Chromium at this size the ink edge reads 231.37
       and the advance edge 237.77; the recipe fits on the ink edge, which puts the fitted
       size at 61.64. 231.37 is inside the live area, so the fragment renders correctly —
       it simply does not land on 224 yet. Changing the family restarts that measurement.
       The type's ink extents are font metrics, so the painted-edge checks cannot be run
       against the text element; LOGO.md records them as unrun, not as passed. getBBox on
       a text element returns the layout box, so there is no vertical equivalent of the
       two readings above.
       The one custom detail is the bar. It starts at the run's own anchor, 32 — the one
       position that needs no measurement, at the cost of sitting a left sidebearing
       outside the N's ink. Correction 4 applies to it unconditionally:
       the top edge is held on 176, where it sets the 32-unit gap below the baseline, and
       the thinning is spent on the free lower edge. -->
  <text x="32" y="144" text-anchor="start" font-family="Inter, sans-serif" font-size="64"
        font-weight="700" letter-spacing="6.4" fill="currentColor">NOVA</text>
  <!-- OPTICAL: bar 16 → 15.36 · horizontal strokes read heavier · 16 × 0.96; free edge 192 → 191.36, top held on 176 -->
  <path d="M32 176H80V191.36H32Z" fill="currentColor"/>
</svg>
```

### How a wordmark fails

**The custom detail is applied to every letter instead of one.** The tells:

- The same treatment appears on two or more letters — every terminal clipped, every counter squared off, a bar under each letter. At that point it is not a detail, it is a typeface, and a bad one, because it was applied without the rest of the family that would make it coherent.
- The treatment is at a weight that appears nowhere else. A hairline rule under a bold word is decoration; the detail must sit at the mark's declared stroke weight.
- Removing the detail leaves a wordmark that is not noticeably worse. The detail was not doing work.

Detect it by counting the letters carrying the treatment. **One is a mark. Two is a pattern. Three is a font you did not draw.**

The fix is to pick the single letter with the most structure to give — usually the first, or the one whose form already has an oddity worth leaning on — and take the treatment off every other letter.

## Abstract

### What an abstract mark is

A non-representational mark generated by **a rule applied consistently**: rotation, offset, or subdivision. The rule is the concept. The shape is its output, and it is legible only to the extent that the rule is.

### When it is the right choice

- The idea is a relationship, a flow, or a transformation rather than an object.
- No letterform carries it, and any object that would represent it turns the mark pictorial, which `SKILL.md` refuses.

It is the type with the least for a viewer to hold on to, which makes it the type most likely to fail. Reach for it when the other three have been ruled out for a reason you can state.

### Recipe

1. **Write the rule as one sentence before drawing.** "Rotate the arm 90° about the centre, four times." "Inset the square by 16, then 32, alternating." "Halve the side and place the result in the next quadrant clockwise." If it takes two sentences it is two rules, and two rules read as none.
2. **Choose a rule whose output lands on the grid.**
   - **Rotation.** Multiples of 90° map the grid onto itself exactly and cost nothing. Any other angle has to be baked into the coordinates — `transform` is forbidden on final geometry — and puts an off-grid value at every vertex of every copy. **The cost is the render, not the audit.** The flag ceiling counts distinct reasons, so twenty-four vertices falling out of one stated rotation rule is one entry and no deterrent at all; what those twenty-four painted edges do is anti-alias at every reproduction size, on a grid that exists for the sole purpose of preventing that. So if the rule genuinely needs 45°, do not cut the number of copies — that trips step 6, where two applications read as a coincidence. Place the vertices so the **outermost** edges, the ones that define the silhouette, still land on the grid, and let the interior ones drift where the eye has no reference to catch them.
   - **Offset.** Constant insets on grid multiples stay on the grid indefinitely. Alternate the inset so that ink and counter each get their own number — a single repeated inset gives ink and counter the same width, and the counter is the one with the higher floor.
   - **Subdivision.** Halving stays on the grid down to 16, which is the counter floor and the bottom of the stroke band. Three levels from 128 is the practical depth.
3. **Apply the rule to the whole element, then re-derive the corrections per copy.** Correction 8 is explicit that rotation does not carry its corrections with it: a bar that rotates into a stem loses the 4% thinning, and a stem that rotates into a bar gains it. **The shipped mark is therefore not exactly symmetric, and that is correct.** A four-fold rotation whose four copies are byte-identical has skipped correction 4.
4. **Decide whether the rule produces a union or a nesting, because that decides the fill rule.**
   - A rotation rule usually produces a **union**: overlapping copies that merge into one silhouette. Flatten it to a single outline. There is no knockout and no fill rule to set.
   - Offset and subdivision rules produce **nesting**: a shape inside a shape. That is a knockout, and it needs `fill-rule="evenodd"` written on the `path` — never left to the default, for the reason construction.md's knockout section gives.

   If you cannot say which of the two your rule produced, you do not yet know what you drew.
5. **Put the counter where the rule puts it, or have none.** A rotation rule whose arms meet at the centre produces a solid block of `2w × 2w` there, and a hole cut into that block leaves a frame thinner than the stroke. Forcing a counter into a construction that does not want one is how an abstract mark acquires a detail no reproduction below 64 px will carry. A mark with no enclosed counter is fine.
6. **Count the applications.** Three or four is a rule. Two is a coincidence — a reader cannot infer a rule from two instances.

### Worked fragment

A four-arm pinwheel: one arm, rotated 90° about `(128, 128)` three times, with each copy's corrections re-derived from its final orientation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Pinwheel">
  <!-- Rule: rotate the arm 96 × 32 through 90° about (128,128), four times.
       90° maps the grid onto itself, so every rotated coordinate stays permitted and the
       rotation is baked into the path data rather than carried by a transform.
       Arms, after rotation:  right x 128 … 224  ·  down y 128 … 224
                              left  x 32 … 128   ·  up   y 32 … 128
       Correction 4 is re-derived per orientation, so the two arms that ended up
       horizontal are thinned and the two that ended up vertical are not. The mark is
       therefore 180°-symmetric, not 90°-symmetric — that asymmetry is the correction,
       not an error. Each thinned arm keeps its edge on 128, shared with the arm it
       meets, and spends the deviation on the free edge (precedence rule 2).
       Single weight 32. Union, not nesting: no knockout, no fill-rule.
       No enclosed counter — the four notches open outward. -->
  <!-- OPTICAL: horizontal arms 32 → 30.72 · horizontal strokes read heavier · 32 × 0.96; free edges 97.28 and 158.72 -->
  <path d="M96 32H128V97.28H224V128H160V224H128V158.72H32V128H96Z" fill="currentColor"/>
</svg>
```

Corrections 1, 2, 3, 5, 6 and 9 do not bind: nothing is curved or pointed, the four arms are congruent by construction rather than by area matching, there is no apex, no diagonal outline, no container, and no letterform. Correction 7 is satisfied — every join is 90° or its 270° reflex, both clear of the 60° floor.

### How an abstract mark fails

**The rule is invisible, so the mark reads as an arbitrary blob.** The tells:

- You cannot state the rule from the picture. Show the mark to someone without the brief; if they cannot say what was repeated and how, the rule is not in the mark, it is only in the notes.
- The rule was applied twice. Two instances read as a pair, and a pair is not a system.
- The rule was applied and then one copy was nudged "to look better". A single unmotivated exception destroys a rule more completely than having no rule at all — the eye finds the odd one out and stops looking for the pattern.
- The rule is present at a scale nobody can resolve. A 12-unit offset repeated four times is texture, not structure, and `reproduction.md`'s thresholds will eat it.

The check is mechanical: `LOGO.md`'s Construction section must carry the rule as one sentence, and **every element in the file must be traceable to one application of it**. Whatever is not traceable is the blob.

One deliberate exception, so it does not get mistaken for the failure: differences between copies that come from re-deriving the corrections per orientation are *not* inconsistencies. They are flagged, the flag names the rule and shows the arithmetic, and a reviewer can point at them. An **unflagged** difference between copies is the failure.

## Related references

| File | Covers |
|---|---|
| [construction.md](construction.md) | The grid, the nine corrections, stroke and counter discipline, forbidden constructs, colour binding, the self-check. Every fragment above obeys it. |
| [reproduction.md](reproduction.md) | Minimum sizes, clearspace, mono collapse, dark inversion, the favicon redraw. |
| [anti-slop.md](anti-slop.md) | The visual clichés that signal machine authorship regardless of construction quality. |
| `SKILL.md` | The refusal gate: pictorial, mascot and illustrative-emblem marks are out of scope by name. |
