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
<path d="M188 68A96 96 0 1 1 68 188" fill="none" stroke="#000" stroke-width="24"/>
```

Three source tests:

- One `path` containing two `A` commands with the same `rx` and `ry`, whose endpoints are not coincident. Compute the swept angle from the endpoints and the centre; **270° ≤ sweep < 360° on the outermost element is the signature.**
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

Convert every `stop-color` to HSL and read the hue. **Two or more stops with hue in 235° … 340° and differing lightness is a fail.** That band runs indigo through violet to magenta and pink, and it is where every default lands — `#6366F1` is 239°, `#8B5CF6` is 258°, `#A855F7` is 271°, `#D946EF` is 292°, `#EC4899` is 330°.

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

It is also a guaranteed mono-collapse failure. reproduction.md's M1 fails on the alpha alone, and M4 fails on the flattened result — three overlapping discs at one value are a single convex silhouette with no interior, so ink over convex hull is 1.0.

**The near neighbour that is correct.** mark-types.md's geometric recipe builds a lens from two intersecting circles, and that is the opposite construction: the intersection is drawn as **its own path with a solid fill**, and the two source circles never ship. The distinction is exact and mechanical — if the overlap exists because of alpha, fail; if the overlap was resolved into geometry, pass.

**Why it reads as machine-authored.** Transparency is how you get a shape without deciding what the shape is. The overlap colour is doing the design work, and it is the one part of the mark that no reproduction constraint permits — not one-colour print, not embroidery, not a favicon, not a dark ground.

## 4. Isometric cube, or impossible geometry

**The tell.** A cube seen from a corner, three faces in three tints of one colour; or a Penrose triangle, an impossible staircase, an endless knot.

**The signature.** Isometric drawing has one angle and it is exact.

- Compute `|Δy / Δx|` for every straight segment in the file. **Three or more distinct segments at 0.577 ± 0.02 (`tan 30°`, true isometric) or 0.500 ± 0.02 (the 2:1 pixel-isometric shortcut) is the signature.**
- The three faces are 4-node parallelograms sharing vertices, and the outer silhouette of the assembly is a regular hexagon — which means this pattern also trips pattern 9's detector. Two hits on one mark is not double-counting; it is the same shape being wrong twice.

It also fails mono collapse outright, and this is the sentence to remember: **an isometric cube in one colour is a hexagon with a Y in it.** The three faces are distinguished only by tint, so reproduction.md's M3 catches it before anyone has to argue about taste.

**Why it reads as machine-authored.** It is what "three-dimensional" means to something with no renderer — a projection recited from memory rather than a form observed. Every edge also violates construction.md's correction 5, because a bar offset horizontally at 30° is thinner than its numbers claim by `cos 30°`, and nothing in an emitted isometric cube corrects for that.

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

Two supporting failures, both already covered elsewhere and both worth citing in the finding: the connector weight is invariably below construction.md's 16-unit band because thin lines are what make it read as a diagram; and the node count blows reproduction.md's budget before the silhouette exists — five nodes and six edges is eleven elements, and construction.md permits three counters total.

**Why it reads as machine-authored.** The mark is a diagram of the word in the brief. It illustrates the concept instead of standing for the company, which is the definitional line between an infographic and a logo. It also has no silhouette: flatten it and you get scattered dots, which is what reproduction.md's M4 measures.

## 6. The reflexive leaf

**The tell.** A pointed oval, tilted along a diagonal, with a stem or a centre vein. Present in roughly every mark for anything that said "sustainable", "green", "eco", "carbon", "renewable", or "organic".

**The signature.** The geometry alone is not the tell, and this is the trap: mark-types.md's worked geometric fragment is a two-arc lens, and a lens is a legitimate construction. So the test is in two parts and both must hit.

1. **Geometry.** A closed path of two arcs with equal `rx` and `ry`, meeting at two cusps, whose long axis is within 10° of a diagonal — plus, usually, a line segment running along that axis from one cusp inward.
2. **Brief.** The brief contains a sustainability keyword: sustainable, green, eco, carbon, renewable, climate, organic, planet.

Geometry without the keyword is a vesica and passes. The keyword without the geometry passes. Both together is the reflex.

**Why it reads as machine-authored.** It is the most predictable brief-to-shape mapping in the corpus, which makes it the least distinctive possible answer to the brief that produced it. It also says nothing: a leaf is what the category looks like, not what this company is. Any competitor's mark is substitutable for it, and a mark that a competitor could use is not a mark.

## 7. Letterform with a chunk arbitrarily sliced out

**The tell.** A monogram with a wedge, notch, or straight cut removed from one stroke, at an angle that has no relationship to anything else in the letter. It reads as damage rather than design.

**The signature.** Angles, counted.

Build the multiset of segment angles in the mark, rounded to the nearest degree. A construction.md-conformant letterform has a small vocabulary: 0°, 90°, and whatever diagonal the letter itself contains — an `A`, a `V`, a `K`. **An angle that appears exactly once, is not 0° or 90°, and terminates a stroke without meeting another edge system, is the slice.**

The second signature is already a construction.md failure and is the faster check: the notch is a negative space narrower than the stroke, and construction.md's counter rule covers it explicitly — "any negative space narrower than the stroke closes the same way whether or not it is enclosed." A slice thin enough to read as a slice at 256 px is a counter under the floor at 16.

**Why it reads as machine-authored.** It is "make it look designed" applied as an operation on a finished letter rather than as a decision taken while drawing it. Ask mark-types.md's question — **what produced this number?** — of the cut's angle and position. A cut with an answer is a ligature, an aperture, or a stroke ending; a cut without one is slop.

This is adjacent to but distinct from mark-types.md's wordmark failure, which is the *same* treatment applied to every letter. That one is a typeface you did not draw. This one is a single treatment with no reason.

## 8. Infinity loop or Möbius strip

**The tell.** A lemniscate — the figure-eight on its side — or a twisted band that reads as one. Produced by "continuous", "endless", "seamless", "always-on", "lifecycle", "loop".

**The signature.** Tight and reliable:

- **Two `A` commands in one subpath with identical `rx` and `ry` and opposite `sweep-flag` values, whose shared endpoint is at or near the artboard centre.** That is a lemniscate and very little else is.
- Or a subpath that crosses itself. This one is worth flagging regardless of the cliché: **a self-intersecting subpath has no well-defined interior**, and `nonzero` and `evenodd` give different results for it, neither of them the one that was intended. It is a construction bug before it is a taste problem.

The Möbius variant adds a third tell — the band changes apparent width along its length to fake the twist, which puts three or more distinct weights in one mark and fails construction.md's stroke discipline on the spot.

**Why it reads as machine-authored.** Same mechanism as the leaf: a word in the brief mapped directly to its dictionary illustration. It is also the shape most likely to collide with an existing mark, and the visual collision check `SKILL.md` runs is not a trademark search.

## 9. Hexagon container with no motivating reason

**The tell.** A regular hexagon, usually point-up, with something else inside it. The hexagon is doing nothing except making the interior look finished.

**The signature.** Fully source-detectable:

```svg
<!-- DETECTED PATTERN — not an example. -->
<path d="M128 24L218 76V180L128 232L38 180V76Z" fill="none" stroke="#000" stroke-width="16"/>
<circle cx="128" cy="128" r="40" fill="#000"/>
```

Test: a closed path of **six nodes, six equal segment lengths, six 120° interior angles**, which is the outermost painted element, and which encloses at least one other element. All four conditions, mechanically.

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

If the answer is no, the feature was decoration and mark-types.md's fix applies verbatim: delete it. A geometric mark that needs a tile behind it to look finished is not finished.

A mark that passes both tests **passes the pattern**, even though it is a ring with a gap or a thing inside a hexagon. Record which test carried it, so the next reviewer does not re-litigate it.

The same logic reaches pattern 6 and pattern 8 in weaker form — a lens is a legitimate vesica until the brief says "sustainable", and a self-crossing path is a construction bug whatever it depicts. Neither gets the full carve-out, because neither has a construction that produces it as a *consequence*. If you believe yours does, write the derivation down and it will be judged on that.

## What is detectable from source, and what is not

| # | Pattern | Detected from | Why |
|---|---|---|---|
| 1 | Circle with a gap | **Source**, then judgement | Arc sweep and gap angle are computable; whether the gap is derived needs `LOGO.md` |
| 2 | Gradient mesh blob | **Source** | Gradient elements plus the 235° … 340° hue band; the blob half via the reuse ratio |
| 3 | Overlapping translucent circles | **Source** | Alpha on three or more overlapping circles — no judgement needed |
| 4 | Isometric cube | **Source** | The 0.577 or 0.500 slope, repeated; and the hexagonal silhouette |
| 5 | Connected-nodes graph | **Source** | Connector endpoints landing on circle centres |
| 6 | The reflexive leaf | **Source plus the brief** | The lens is legal geometry; the sustainability keyword is what makes it a reflex |
| 7 | Sliced letterform | **Source** | The angle appearing exactly once; and the sub-stroke negative space |
| 8 | Infinity loop | **Source** | Equal-radius arcs with opposite sweep flags, or a self-intersecting subpath |
| 9 | Unmotivated hexagon | **Source**, then judgement | Six equal edges at 120° as the outermost element; motivation needs `LOGO.md` |
| 10 | Colour-dependent mark | **Source** | Every route is a literal value, an alpha, or a second fill |

All ten have a source signature. **Two — 1 and 9 — cannot be decided from source alone**, because the signature detects the shape and the verdict is about the derivation. Those two are the reason `LOGO.md`'s Construction section exists in the form it does. **One — 6 — needs the brief as well as the file**, because the same lens is a vesica or a leaf depending on what was asked for.

None of the ten requires eyes to *detect*. Several require the render to confirm, and the contact sheet is where that happens.

## Related references

| File | Covers |
|---|---|
| [construction.md](construction.md) | The grid, the nine corrections, stroke and counter discipline, forbidden constructs, colour binding. Half the signatures above are already violations of it; this page names what they add up to. |
| [mark-types.md](mark-types.md) | The four shippable types, their recipes, and the characteristic failure of each. Those failures are about following a recipe carelessly; these ten are about not having chosen at all. |
| [reproduction.md](reproduction.md) | Minimum sizes, clearspace, mono collapse, dark inversion, the favicon redraw, path complexity. Patterns 2, 3, 4 and 10 fail there too, and it is one finding, not two. |
| `SKILL.md` | The refusal gate, and the visual collision check — which is not a trademark search and says so. |
