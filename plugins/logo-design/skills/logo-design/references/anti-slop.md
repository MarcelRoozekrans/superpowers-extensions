# Anti-Slop — the ten logo tells

Ten patterns that mean a machine chose the shape. They are not bad taste and they are not failures of construction — a mark can obey every rule in [construction.md](construction.md), clear every threshold in [reproduction.md](reproduction.md), and still be the fourteen-thousandth circle with a gap in it. That is the thing this page catches.

This is the sibling of `ui-design-system`'s **Anti-Slop** section, deliberately the same shape: a numbered list, each item a pattern, each with a tell you can act on. Different subject matter — that list is about screens, this one is about marks — so the two do not overlap and neither replaces the other.

`logo-review` scores these **binary, pass or fail**, so every entry has to be testable. "Looks generic" is not a test. Each pattern below carries three things:

- **The tell** — what you are looking at when you look at the render.
- **The signature** — what it looks like in the SVG source, where there is one. Several of these have a structural fingerprint you can grep for, and those are the cheap ones.
- **Why it reads as machine-authored** — because a reviewer who does not know why will eventually grant an exception to the wrong mark.

Two of the ten describe shapes that are sometimes correct. Those are handled in [Two of these are shapes, not mistakes](#two-of-these-are-shapes-not-mistakes) rather than by banning a shape outright.

> **Every fenced fragment on this page is the pattern being detected, not an example to follow.** None of them obeys construction.md, and several are already forbidden by it. That is the point — you are learning to recognise them in a file, not to write them.

## 1. Circle with a gap, or the orbiting swoosh

**The tell.** A ring that stops short of closing, with the gap usually at the upper right. Or the same ring with a comma-shaped stroke sweeping around the outside of it, tapering at one end. It is the default output for any brief containing "growth", "momentum", "platform", or "connected".

**The signature.** Look for an arc system that sweeps most of a circle and not all of it:

```svg
<!-- DETECTED PATTERN — not an example. -->
<path d="M220.73 103.15A96 96 0 1 1 152.85 35.27" fill="none" stroke="#000" stroke-width="24"/>
```

Both endpoints sit at `r` 96.002 from (128, 128), at 345° and 285°. The arc takes the long way round: **300° of sweep, a 60° gap, centred on 315° — the up-right diagonal.** That is the shape, drawn to its own detector.

Three source tests:

- **One or more `A` commands sharing `rx` and `ry` about a common centre, whose overall start and end points are not coincident.** Sum the swept angle; **270° ≤ sweep < 360° on the outermost element is the signature.** *One* arc, not two — a single `A` with `large-arc-flag` 1 is the commoner emission, and an earlier draft of this page required two and would have missed the fragment printed above it.
- `stroke-dasharray` on a `circle` element, which is the same idea reached lazily.
- Two concentric arcs whose radii differ by exactly the stroke weight — the filled-outline version of the same ring — sharing a gap.

Then the position test, which is what separates the cliché from a derived gap: **the cliché's gap is centred within 10° of a diagonal — 45°, 135°, 225° or 315°.** Nothing produces that except a default. A gap that came out of a construction sits where the construction put it, which is almost never exactly on a diagonal.

**Why it reads as machine-authored.** It is the lowest-effort way to make a circle look like it means something. The gap carries no information — remove it and the mark loses nothing, which is the deletion test from mark-types.md's geometric failure applied to a single feature. See the tension section for when the gap is real.

## 2. Gradient mesh blob, especially purple to pink

**The tell.** An amoeba silhouette — no straight edges, no repeated radius, no axis of symmetry — filled with a soft violet-to-magenta gradient, sometimes blurred at the edges.

**The signature.** Fully source-detectable, in two halves.

The gradient half is already a construction.md violation: `linearGradient` and `radialGradient` are forbidden in the master because a gradient carries structure that vanishes on mono collapse. What this page adds is the **hue test**, for the derived colour variants where a gradient is not automatically illegal:

```svg
<!-- DETECTED PATTERN — not an example. -->
<linearGradient id="g"><stop stop-color="#A855F7"/><stop offset="1" stop-color="#EC4899"/></linearGradient>
```

Convert every `stop-color` to HSL and read the hue. **Two or more stops with hue in 235° … 340° is a fail**, whatever their lightness. That band runs indigo through violet to magenta and pink, and it is where every default lands — `#6366F1` is 239°, `#8B5CF6` is 258°, `#A855F7` is 271°, `#D946EF` is 292°, `#EC4899` is 330°. An earlier draft added "and differing lightness", which let a same-lightness violet-to-magenta pair through — the most characteristic version of the pattern, not an edge case.

The blob half is caught by reproduction.md's reuse ratio: an amoeba outline reuses no coordinate, so its ratio runs near 1.0 against the 0.75 tracing threshold. A blob and a traced logo have the same fingerprint for the same reason — neither was constructed.

**Why it reads as machine-authored.** Violet-to-pink is the house style of generative imagery, and `ui-design-system`'s anti-slop list already names it as pattern 1 for interfaces. A mark that reaches for it is inheriting a default from the tool rather than a decision from the brief. The blob compounds it: a shape with no repeated measurement cannot be described, which means it cannot be redrawn, which means it is not a logo.

## 3. Overlapping translucent circles — the Venn tech startup

**The tell.** Three circles of equal radius in a triangular arrangement, each semi-transparent, the overlaps reading as darker lens shapes. Sometimes two, sometimes five in a flower.

**The signature.** The cleanest source test on the page:

```svg
<!-- DETECTED PATTERN — not an example. -->
<circle cx="104" cy="112" r="56" fill="#4F46E5" fill-opacity="0.6"/>
<circle cx="152" cy="112" r="56" fill="#4F46E5" fill-opacity="0.6"/>
<circle cx="128" cy="152" r="56" fill="#4F46E5" fill-opacity="0.6"/>
```

**Three or more `circle` or `ellipse` elements carrying `fill-opacity` or `opacity` below 1, whose bounding boxes pairwise overlap.** Also catch the alpha spellings: `rgba()`, and eight-digit hex like `#4F46E599`.

It is also a guaranteed mono-collapse failure. reproduction.md's M1 fails on the alpha alone, and M4 fails on the flattened result. For the three `r` 56 discs above: their union is 18480.8 and the convex hull of the three — the triangle of centres, plus three `side × r` rectangles, plus one full circle's worth of corner sectors — is 18724.6. **Ink over hull is 0.987**, comfortably over the 0.85 gate. Not 1.0: the hull bulges slightly past the union at the three concavities between the discs, which is exactly the sliver M4 measures.

**The near neighbour that is correct.** mark-types.md's geometric recipe builds a lens from two intersecting circles, and that is the opposite construction: the intersection is drawn as **its own path with a solid fill**, and the two source circles never ship. The distinction is exact and mechanical — if the overlap exists because of alpha, fail; if the overlap was resolved into geometry, pass.

**Why it reads as machine-authored.** Transparency is how you get a shape without deciding what the shape is. The overlap colour is doing the design work, and it is the one part of the mark that no reproduction constraint permits — not one-colour print, not embroidery, not a favicon, not a dark ground.

## 4. Isometric cube, or impossible geometry

**The tell.** A cube seen from a corner, three faces in three tints of one colour; or a Penrose triangle, an impossible staircase, an endless knot.

**The signature.** Isometric drawing has one angle and it is exact.

- Compute `|Δy / Δx|` for every straight segment in the file. **Three or more distinct segments at 0.577 ± 0.02 (`tan 30°`, true isometric) or 0.500 ± 0.02 (the 2:1 pixel-isometric shortcut) is the signature.**
- The three faces are 4-node parallelograms sharing vertices, and the outer silhouette of the assembly is a regular hexagon — which means this pattern also trips pattern 9's detector. Two hits on one mark is not double-counting; it is the same shape being wrong twice.

It also fails mono collapse outright, and this is the sentence to remember: **an isometric cube in one colour is a hexagon with a Y in it.** The three faces are distinguished only by tint, so reproduction.md's mono collapse catches it before anyone has to argue about taste — **M3 where the tints are literal colour values, M1 where they are opacity.** Both are in reproduction.md § Mono collapse and only one of them is a render: M3's diff sees a tint that is a different colour and cannot see one that is the same colour at a lower alpha, because a half-alpha shape inverts to itself. Naming M3 alone would leave the commonest way this pattern is actually drawn ungraded.

**Why it reads as machine-authored.** It is what "three-dimensional" means to something with no renderer — a projection recited from memory rather than a form observed.

Every edge also violates construction.md's correction 5, and the axis matters: **correction 5 measures `θ` from vertical, not from horizontal.** An isometric edge sits 30° from horizontal, which is **60° from vertical**, so the horizontal offset needed for a perpendicular width `w` is `w / cos 60°` = `2w`. Offset by `w` instead — which is what emitting the parallelogram directly does — and the edge arrives at half its intended weight. That is a 50% shortfall, not the 13% a careless reading of `cos 30°` would suggest, and it is why an isometric cube's faces never match the mark they sit next to.

## 5. Connected-nodes network graph

**The tell.** Four to seven dots joined by thin lines, arranged with no symmetry, meaning "network", "AI", "platform", "integration", "data".

**The signature.** Detectable by relationship rather than by shape:

```svg
<!-- DETECTED PATTERN — not an example. -->
<circle cx="64" cy="80" r="16"/><circle cx="192" cy="64" r="16"/><circle cx="128" cy="176" r="16"/>
<line x1="64" y1="80" x2="192" y2="64" stroke="#000" stroke-width="6"/>
<line x1="192" y1="64" x2="128" y2="176" stroke="#000" stroke-width="6"/>
```

Test: collect every `circle` of equal `r`, then every `line` or two-node `path`. **If three or more connectors have both endpoints within `r` of some circle's centre, it is a network graph.**

Two supporting failures, both against rules that exist, both worth citing in the finding:

- **The connector weight.** It is invariably below construction.md's 16 … 32 band, because thin lines are what make the thing read as a diagram rather than a mark. The fragment above uses `stroke-width="6"` — under half the legal minimum, and 0.375 device px at a 16 px render.
- **The flattened result.** reproduction.md's M4 is the test: collapse it and the connectors and discs merge into scattered blobs whose convex hull is enormous relative to their ink. A network graph fails M4 from the opposite direction to the Venn circles — too little ink inside the hull rather than too much.

Do not cite a node or element budget here. reproduction.md's 56 is a **path-node** ceiling and construction.md's three is a **counter** ceiling; neither file budgets elements, and an earlier draft of this page conflated all three in one clause.

**Why it reads as machine-authored.** The mark is a diagram of the word in the brief. It illustrates the concept instead of standing for the company, which is the definitional line between an infographic and a logo.

## 6. The reflexive leaf

**The tell.** A pointed oval, tilted along a diagonal, with a stem or a centre vein. Present in roughly every mark for anything whose brief hit one of the keywords in the test below.

**The signature.** The geometry alone is not the tell, and this is the trap: mark-types.md's worked geometric fragment is a two-arc lens, and a lens is a legitimate construction. So the test is in two parts and both must hit.

1. **Geometry.** A closed path of two arcs with equal `rx` and `ry`, meeting at two cusps, whose long axis is within 10° of a diagonal — plus, usually, a line segment running along that axis from one cusp inward.
2. **Brief.** The brief contains one of these eight keywords, and this list is the whole test — not a sample of it: **sustainable, green, eco, carbon, renewable, climate, organic, planet.**

Geometry without a keyword is a vesica and passes. A keyword without the geometry passes. Both together is the reflex.

mark-types.md's vesica passes on the geometry clause alone, before the brief is consulted: its long axis runs vertical — cusps at `(128, 44.86)` and `(128, 211.14)`, x-extremes at 80 and 176 — which is 45° from the nearest diagonal, well outside the 10° gate.

**Why it reads as machine-authored.** It is the most predictable brief-to-shape mapping in the corpus, which makes it the least distinctive possible answer to the brief that produced it. It also says nothing: a leaf is what the category looks like, not what this company is. Any competitor's mark is substitutable for it, and a mark that a competitor could use is not a mark.

## 7. Letterform with a chunk arbitrarily sliced out

**The tell.** A monogram with a wedge, notch, or straight cut removed from one stroke, at an angle that has no relationship to anything else in the letter. It reads as damage rather than design.

**The signature.** Angles, counted.

Build the multiset of segment angles in the mark, rounded to the nearest degree. A construction.md-conformant letterform has a small vocabulary: 0°, 90°, and whatever diagonal the letter itself contains — an `A`, a `V`, a `K`. **An angle that appears exactly once, is not 0° or 90°, and has at least one endpoint shared by no other segment, is the slice.**

That last clause is the mechanical form of "terminates a stroke without meeting another edge system", and it is stated this way because the prose version is a judgement and this file does not get to make those. Collect every segment endpoint; a slice leaves at least one endpoint that no other segment touches, because it was cut across a stroke rather than built into the outline.

The second signature is already a construction.md failure and is the faster check: the notch is a negative space narrower than the stroke, and construction.md's counter rule covers it explicitly — "any negative space narrower than the stroke closes the same way whether or not it is enclosed." A slice thin enough to read as a slice at 256 px is a counter under the floor at 16.

**Why it reads as machine-authored.** It is "make it look designed" applied as an operation on a finished letter rather than as a decision taken while drawing it. Ask mark-types.md's question — **what produced this number?** — of the cut's angle and position. A cut with an answer is a ligature, an aperture, or a stroke ending; a cut without one is slop.

This is adjacent to but distinct from mark-types.md's wordmark failure, which is the *same* treatment applied to every letter. That one is a typeface you did not draw. This one is a single treatment with no reason.

## 8. Infinity loop or Möbius strip

**The tell.** A lemniscate — the figure-eight on its side — or a twisted band that reads as one. Produced by "continuous", "endless", "seamless", "always-on", "lifecycle", "loop".

**The signature.** Tight and reliable:

- **Two `A` commands in one subpath with identical `rx` and `ry` and opposite `sweep-flag` values, whose shared endpoint lies within 16 units of the artboard centre (128, 128).** That is a lemniscate and very little else is. Sixteen units is one grid unit — every other tolerance on this page is a number, and this one has no business being "at or near".
- Or a subpath that crosses itself. This one is worth flagging regardless of the cliché: **a self-intersecting subpath has no well-defined interior**, and `nonzero` and `evenodd` give different results for it, neither of them the one that was intended. It is a construction bug before it is a taste problem.

mark-types.md's vesica clears both clauses and it is worth saying why, since it is also two equal-radius arcs: its two arcs carry the **same** `sweep-flag` (0 in both), not opposite ones, and their shared endpoints are the cusps at `(128, 44.86)` and `(128, 211.14)` — 83.14 units from the centre, five times the tolerance. A lens and a lemniscate are built from the same primitive and differ in exactly these two respects.

The Möbius variant adds a third tell — the band changes apparent width along its length to fake the twist, which puts three or more distinct weights in one mark and fails construction.md's stroke discipline on the spot.

**Why it reads as machine-authored.** Same mechanism as the leaf: a word in the brief mapped directly to its dictionary illustration. It is also the shape most likely to collide with an existing mark — and nothing in this skill measures that. A vision pass over a contact sheet can notice a resemblance it happens to recognise; until that pass has run there is no measured collision, and after it has run there is still no trademark search. Neither belongs in this file's verdict.

## 9. Hexagon container with no motivating reason

**The tell.** A regular hexagon, usually point-up, with something else inside it. The hexagon is doing nothing except making the interior look finished.

**The signature.** Fully source-detectable:

```svg
<!-- DETECTED PATTERN — not an example. -->
<path d="M128 24L218 76V180L128 232L38 180V76Z" fill="none" stroke="#000" stroke-width="16"/>
<circle cx="128" cy="128" r="40" fill="#000"/>
```

Test: a closed path of **six nodes, six segment lengths equal within ±1%, six interior angles of 120° ± 1°**, which is the outermost painted element, and which encloses at least one other element. All four conditions, mechanically.

The tolerances are not decoration. The fragment above is as regular a hexagon as the two-decimal-place limit permits — circumradius 104, vertices on grid multiples — and its sides measure 103.942 and 104.000, its angles 119.96° and 120.02°. **A zero-tolerance reading of this test would exempt every hexagon that construction.md's rounding rule is capable of producing**, which is all of them.

The hexagon is a legitimate primitive — construction.md's correction 2 table gives its area match to a 128 square at 158.82 across corners — so detection alone is not the verdict. See the tension section.

**Why it reads as machine-authored.** It is the container you reach for when the mark inside is not strong enough to stand on its own, and mark-types.md says exactly what to do about that: *delete the container*. A hexagon in particular arrives with borrowed meaning — blockchain, honeycomb, chemistry, gaming — that the brief usually did not ask for and the mark does not earn.

## 10. A mark that only works in the one colour it was drawn in

**The tell.** Describe the mark in one sentence without naming a colour. If the sentence is empty, or if it describes a shape nobody would recognise, the colour was the idea.

**The signature.** Every route is source-detectable, and every one of them is already a failure somewhere else — which is the point. This pattern is what all of them add up to.

- More than one distinct `fill` or `stroke` value in the master. construction.md: everything is `currentColor`.
- Any literal colour value in the master at all.
- **A fake knockout** — an element filled with the background colour to punch a hole: `fill="#fff"`, `fill="white"`, or the `MASTER.md` background hex. It looks like a counter on white and is a solid block on anything else. The legal form is one `path`, two subpaths, `fill-rule="evenodd"`.
- `fill-opacity` or `opacity` below 1, `mix-blend-mode`, a gradient reference.
- Two elements distinguished only by their fills, with no boundary between them in the geometry. On collapse they merge and the mark becomes a silhouette with the interior missing.

reproduction.md's M1 through M4 are the same tests run as a render gate. Failing here and failing there is one finding, not two.

**Why it reads as machine-authored.** Colour is the cheapest way to make a flat shape look considered, and it costs nothing to emit. A mark whose structure survives collapse was drawn as structure; a mark that needs its palette was coloured in. Every hostile reproduction the brief named — one-colour print, embroidery, foil, fax, a favicon at one bit of tone — is a test of the same thing.

## Two of these are shapes, not mistakes

Pattern 1 and pattern 9 describe shapes that are sometimes exactly right. An interrupted ring is a real construction, and a hexagon is a regular polygon with a legitimate area match in construction.md's own table. Banning them outright would be dishonest, and worse, it would train reviewers to grant exceptions by feel.

So the distinction is not the shape. It is **whether the shape was derived or placed**, and the same two tests settle both.

**Test A — the derivation question.** mark-types.md's geometric failure asks it once per element: *what produced this number?* Apply it to the specific feature.

- For a gap in a ring: what fixed its angular width, and what fixed its position? A gap that is where two construction circles fail to meet, or where an abstract mark's rotation rule leaves the arms apart, has an answer. A gap that is "about 40°, at the top right" does not — and it will be sitting within 10° of a diagonal, because that is where defaults land.
- For a hexagon: what fixed its across-corners dimension? Correction 2's area match to the element inside it is an answer. "It looked right at `r` 96" is not.

`LOGO.md`'s **Construction** section must carry the answer. Not the reviewer's inference of it — the answer, written down, by whoever drew it.

**Test B — the deletion test.** Remove the feature and look at what is left.

- Remove the gap and close the ring. Is the mark worse?
- Delete the container. Is the mark worse?

If the answer is no, the feature was decoration. mark-types.md carries this in both halves: the **wordmark** failure states the diagnostic — "removing the detail leaves a wordmark that is not noticeably worse; the detail was not doing work" — and the **geometric** failure states the remedy, "delete the container." A geometric mark that needs a tile behind it to look finished is not finished.

A mark that passes both tests **passes the pattern**, even though it is a ring with a gap or a thing inside a hexagon. Record which test carried it, so the next reviewer does not re-litigate it.

### Exactly which patterns this reaches

The carve-out is bounded, and the boundary is stated here rather than left to be inferred, because in a binary file an unbounded derivation defence is the sentence every failing mark will be argued out of.

| Patterns | Exception available? |
|---|---|
| **1, 9** | Yes — Tests A and B above, both of them, with the answer written in `LOGO.md`'s Construction section. |
| **6, 8** | Yes, but **Test A only, and in its strict form**: `LOGO.md` must name the number that *produced* the geometry — the radius, the angle, the element it was derived from. A rationale for why a leaf or a loop suits the brief is not a derivation and does not qualify. Test B does not apply; there is nothing to delete, the shape is the mark. |
| **2, 3, 4, 5, 7, 10** | **No exception exists.** |

Those six have no exception because each is a **construction failure as well as a cliché**, and no derivation repairs a construction failure. No account of why three overlapping translucent circles suit the brief makes alpha compositing survive one-colour print. No rationale for an isometric cube makes its faces read in mono, or fixes the 50% weight shortfall on every edge. A sliced letterform's notch is negative space under the stroke width whatever motivated the cut. **Do not accept a derivation for these; there is nothing for a derivation to fix.**

Patterns 6 and 8 get the narrow door because a lens is a legitimate vesica until the brief says "sustainable", and equal-radius arcs are legitimate until they are wound into a lemniscate at the centre. The geometry is innocent; the pairing is not. So the defence has to be about the geometry — a number — and not about the pairing.

## What is detectable from source, and what is not

| # | Pattern | Detected from | Why |
|---|---|---|---|
| 1 | Circle with a gap | **Source**, then judgement | Arc sweep and gap angle are computable; whether the gap is derived needs `LOGO.md` |
| 2 | Gradient mesh blob | **Source** | Gradient elements plus the 235° … 340° hue band; the blob half via the reuse ratio |
| 3 | Overlapping translucent circles | **Source** | Alpha on three or more overlapping circles — no judgement needed |
| 4 | Isometric cube | **Source** | The 0.577 or 0.500 slope, repeated; and the hexagonal silhouette |
| 5 | Connected-nodes graph | **Source** | Connector endpoints landing on circle centres |
| 6 | The reflexive leaf | **Source plus the brief** | The lens is legal geometry; one of the eight keywords is what makes it a reflex |
| 7 | Sliced letterform | **Source** | The angle appearing exactly once with an unshared endpoint; and the sub-stroke negative space |
| 8 | Infinity loop | **Source** | Equal-radius arcs with opposite sweep flags meeting within 16 units of centre, or a self-intersecting subpath |
| 9 | Unmotivated hexagon | **Source**, then `LOGO.md` | Six edges equal to ±1% at 120° ± 1° as the outermost element; motivation needs `LOGO.md` |
| 10 | Colour-dependent mark | **Source** | Every route is a literal value, an alpha, or a second fill |

All ten have a source signature. **Two — 1 and 9 — cannot be decided from source alone**, because the signature detects the shape and the verdict is about the derivation, which lives in `LOGO.md` rather than in the file. Those two are the reason that section exists in the form it does. **One — 6 — needs the brief as well as the file**, because the same lens is a vesica or a leaf depending on what was asked for.

None of the ten requires eyes to *detect*. Several are confirmed on a render, and that render comes from `logo-concept`'s contact sheet — where it is absent, the confirmation is recorded as unrun, never as passed.

## Related references

| File | Covers |
|---|---|
| [construction.md](construction.md) | The grid, the nine corrections, stroke and counter discipline, forbidden constructs, colour binding. Half the signatures above are already violations of it; this page names what they add up to. |
| [mark-types.md](mark-types.md) | The four shippable types, their recipes, and the characteristic failure of each. Those failures are about following a recipe carelessly; these ten are about not having chosen at all. |
| [reproduction.md](reproduction.md) | Minimum sizes, clearspace, mono collapse, dark inversion, the favicon redraw, path complexity. Patterns 2, 3, 4 and 10 fail there too, and it is one finding, not two. |
| `SKILL.md` | The refusal gate: pictorial, mascot and illustrative-emblem marks are out of scope by name. Where it also lands the vision pass and its trademark caveat, this file does not assume — it states only that no collision is measured here. |
