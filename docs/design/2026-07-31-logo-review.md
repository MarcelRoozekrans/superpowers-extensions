# Logo Review: SPX

**Date:** 2026-07-31
**Mark audited:** `assets/brand/logo-mark.svg`, `assets/brand/logo-wordmark.svg`, `assets/brand/logo-full.svg`, `assets/brand/logo-stacked.svg`, `assets/brand/logo-mono-black.svg`, `assets/brand/logo-mono-white.svg`, `assets/brand/logo-favicon.svg`
**Record:** `docs/design/LOGO.md`
**Render:** `docs/design/2026-07-31-logo-review-contact-sheet.html`, screenshot to `2026-07-31-logo-review-contact-sheet.png` and `2026-07-31-logo-review-readout.png`, both read back
**Artboard normalisation:** `none — already 0 0 256 256` on all five square variants. The two lockups declare `0 0 512 256` and `0 0 256 384`; no value was measured off either, so no factor was applied.
**Verdict:** PARTIAL — evidence-limited

**No finding was raised against this mark.** Every shortfall below is an `UNRUN`. Nothing was measured and found wanting.

## At a glance

| Layer | Sub-verdict | PASS | n/a | UNRUN | FAIL | The worst item |
|---|---|---|---|---|---|---|
| 1 — Reproduction hazards | PARTIAL — evidence-limited | 27 | 3 | 3 | 0 | M3, inversion identity — no instrument in this skill computes it |
| 2 — Anti-slop scan | PASS | 10 | 0 | 0 | 0 | none |
| 3 — Five-dimension critique | PARTIAL | floor 4 / average 4.25 over 4 scored of 5 | | 1 | 0 | Versatility, `UNRUN` because Layer 1 is PARTIAL |

## Layer 1 — Reproduction hazards

| Group | PASS | n/a | UNRUN | FAIL |
|---|---|---|---|---|
| Minimum sizes | 4 | 1 | 1 | 0 |
| Clearspace | 3 | 0 | 0 | 0 |
| Mono collapse | 3 | 0 | 1 | 0 |
| Dark inversion | 4 | 0 | 0 | 0 |
| Favicon | 6 | 0 | 0 | 0 |
| Path complexity | 2 | 1 | 0 | 0 |
| Extents | 2 | 1 | 1 | 0 |
| Artboard hygiene | 3 | 0 | 0 | 0 |

Passing items are not listed individually; the counts above are what make the coverage auditable. Every item that is not PASS:

| Item | Status | Measured | Held against |
|---|---|---|---|
| A floor-built mark names its size branch and that branch's minimum | `n/a — no counter is floor-built` | both counters 64, target 40.96 | `reproduction.md` § The counter floor, in aggregate |
| `φ_ink` and `φ_ctr` measured off the `logo-wordmark` variant's 256 px render, and the lockup minimums derived from them | `UNRUN — the sheet ran; the declared face did not resolve` | the harness reports `NOT AVAILABLE — "Inter" did not resolve`; its ink edge 208.08 and fit × 1.0904 describe a fallback | `reproduction.md` § Full lockup |
| M3 — black-on-white and inverted white-on-black differ by at most 2/255 per channel | `UNRUN — no instrument in this skill computes a per-pixel diff` | the sheet renders both grounds at 256 px and stops there | `reproduction.md` § Mono collapse |
| No long `C` run without a repeated radius or handle length | `n/a — the set contains no cubic and no arc command` | every segment is `H` or `V` | `reproduction.md` § Path complexity |
| Any stroked element with a miter join was widened by `w` before a containment PASS | `n/a — no stroked element in the set; every drawn variant is filled` | `paint: currentColor ×1`, `fill` only | `reproduction.md` § The miter rider |
| A `text` element's right edge is graded on `ink edge`, not `advance edge` | `UNRUN — the right edge was read off ink edge as required, but the reading describes a fallback face` | ink edge 208.08 against advance edge 216.08; the declared face did not resolve | `reproduction.md` § `text` is a third case |

**One consequence stated so it is not mistaken for a defect.** Two of the three `UNRUN`s above are structural rather than situational. M3 is unrunnable on *any* mark this plugin produces, because nothing in `logo-concept`, the contact-sheet harness or `logo-review` computes an inversion diff — so **Layer 1 can never reach PASS, and no mark this plugin draws can ever be issued a PASS verdict.** That is a finding against the plugin, not against this mark, and it is filed as one in `docs/plans/2026-07-31-logo-design-dogfood.md`.

## Layer 2 — Anti-slop scan

All ten, in `anti-slop.md`'s order, decided from the source signatures. A negative signature is a PASS that waits on nothing.

| # | Pattern | Status | Evidence |
|---|---|---|---|
| 1 | Circle with a gap, or the orbiting swoosh | PASS | signature absent — no `A` command anywhere in the set, no `stroke-dasharray`, no concentric arc pair. Nothing to derive, so the carve-out is not reached |
| 2 | Gradient mesh blob | PASS | no `linearGradient` or `radialGradient`; no `stop-color` to hue-test. The blob half: reuse 0.53 on the master and 0.36 on the favicon, against the 0.75 tracing threshold |
| 3 | Overlapping translucent circles | PASS | no `circle` or `ellipse` element; no `fill-opacity`, `opacity`, `rgba()` or eight-digit hex anywhere |
| 4 | Isometric cube, or impossible geometry | PASS | every segment is `H` or `V`, so `\|Δy/Δx\|` is 0 or undefined on every one — never 0.577 ± 0.02 or 0.500 ± 0.02. No parallelogram, no hexagonal silhouette |
| 5 | Connected-nodes network graph | PASS | no `circle`, no `line`, no two-node path; nothing for a connector endpoint to land on |
| 6 | The reflexive leaf | PASS | both clauses absent, and the geometry clause alone settles it before the brief is consulted — no two-arc closed path exists. The brief also contains none of the eight keywords, which `LOGO.md` records as `none` |
| 7 | Letterform with a chunk sliced out | PASS | no letterform is drawn as paths in any variant. The segment-angle multiset over the whole set is `{0°, 90°}`, so no angle appears exactly once, and every endpoint is shared by two segments |
| 8 | Infinity loop or Möbius strip | PASS | no `A` command, so no equal-radius pair with opposite sweep flags can exist; no subpath crosses itself |
| 9 | Hexagon container with no motivating reason | PASS | no closed path of six nodes anywhere. The outermost contour is 8 nodes at 90° and 270°, and it is not a container — nothing is enclosed by it that is not part of the same path |
| 10 | A mark that only works in the one colour it was drawn in | PASS | one distinct paint value across the whole set, `currentColor`; no literal value, no alpha, no blend mode. No fake knockout: both counters are two subpaths in one `path` with `fill-rule="evenodd"`. The mono columns of the sheet are indistinguishable from the colour columns at every size, on both grounds |

## Layer 3 — Five-dimension critique

| Dimension | Score | Evidence |
|---|---|---|
| **Distinctiveness** | 4 | `LOGO.md` § Construction's chain answers *what produced this number* for every element — the translate from the seed's own side, the shared block from the two outer boxes, both counter dimensions from the side and the one declared weight. Layer 2 is clean on all ten. Band 5 also requires that nothing else in the category looks like it, and the vision pass noted a real adjacency to the ubiquitous copy/duplicate interface glyph — two offset rectangles — which this mark does not land on but sits near. That pass sees; it does not search |
| **Simplicity** | 5 | Source only. 16 nodes against a 24 redraw signal and a 56 file ceiling; max contour 8 against 28; two counters against a ceiling of three. One seed and one rule: *a square ring, and the same ring translated by three quarters of its own side*. The sentence is shorter than the file |
| **Memorability** | 4 | The full-page shot. The silhouette alone identifies it — the two-step staircase survives at 16 px on both grounds with both counters open. Band 5 is withheld for the same adjacency Distinctiveness names: the silhouette carries the mark, but it is a silhouette a viewer has seen the neighbourhood of |
| **Appropriateness** | 4 | The brief, from `LOGO.md` § Concept & rationale. The form reads *extending an existing suite* directly: the extension is the same construction as the thing it extends, one step on, joined by exactly one shared wall. Band 5 needs it to read off *this* product specifically, and it does not distinguish a marketplace of agent skill plugins from any other extension product |
| **Versatility** | `UNRUN — Layer 1 is PARTIAL` | Layer 1 raised no FAIL, so the row's 1-and-2 bands are not reached; but its own results are this dimension's only evidence source and three of them are unrun. Layer 1 has already capped the verdict at PARTIAL, so this second cap changes no outcome |
| **Floor** | 4 | Distinctiveness, Memorability and Appropriateness, tied |
| **Average** | 4.25 | over 4 scored of 5 |

## Findings, prioritised

No FAIL in any layer. Every finding below is an `UNRUN`, and an `UNRUN`'s remediation is the evidence to obtain — never a change to the mark.

1. **Layer 1 — M3, inversion identity at 256 px.** `UNRUN`. Measured against nothing: the harness renders both grounds and computes no diff, and no other step in the plugin does either. **Remediation:** render `logo-mono-black.svg` and `logo-mono-white.svg` at 256 px, invert the second, and compare per channel against the 2/255 gate. This is not obtainable with anything the plugin ships.
2. **Layer 1 — `φ_ink`, `φ_ctr`, and every lockup minimum derived from them.** `UNRUN`. The harness reported the declared face `Inter` unavailable on the render machine and said so in a `bad` row, which is the harness working correctly. **Remediation:** install or self-host Inter 700 on the machine that runs the sheet, then re-run it. No change to any asset.
3. **Layer 1 — a `text` element's right edge.** `UNRUN`. Read off `ink edge` (208.08) rather than `advance edge` (216.08), as the item requires, but against a fallback face. **Remediation:** the same as finding 2.
4. **Layer 3 — Versatility.** `UNRUN`, consequent on Layer 1. **Remediation:** findings 1 and 2; it costs nothing until then, because Layer 1 has already set the verdict.
5. **Layer 3 — three dimensions at 4, none at 3 or below.** Not a finding under the reporting rule, which lists dimensions scoring 3. Recorded for the reader: the ceiling on all three is the same adjacency to a common interface glyph, and nothing in this skill measures that.

## Verdict rationale

`PARTIAL — evidence-limited`, and the first sentence of this report says what that means here: no finding was raised against the mark. Layer 2 is PASS in full, from source, on all ten patterns. Layer 1 raised no FAIL and carries three `UNRUN`s, two of which trace to one missing font on one machine and one of which — M3 — is unrunnable in this plugin on any mark. Layer 3's floor is 4 with one dimension unrun as a mechanical consequence of Layer 1.

The consistency check `SKILL.md` requires runs clean: this mark was produced by `logo-concept`, and `logo-concept`'s gates are exactly Layers 1 and 2, so a FAIL in either would have been a bug in that flow rather than a finding here. There is none.

## What was not audited

- **Trademark, design-mark and prior-art clearance.** **No trademark, design-mark or prior-art clearance has been performed, and nothing in this skill measures collision with an existing mark.** A vision pass over a contact sheet can notice a resemblance it happens to recognise; that is not a search, and it did not run as one here. Clearance is a step for counsel, before the mark is used commercially or filed.
- **`construction.md` conformance.** The grid, the permitted values and the nine corrections are a drawing standard, gated by `logo-concept` at its Step 3 self-check and its Step 7 structural verification. This flow does not re-grade them. Where a construction rule reaches reproduction, `reproduction.md` imports it and Layer 1 grades it through that import.
- **Brand strategy, naming, and the market the mark competes in.** Layer 3's Appropriateness grades the form against the brief; it does not grade the brief.
- **Everything recorded `UNRUN` above.** The rows are listed, not summarised: M3; `φ_ink` and `φ_ctr` and the lockup cap-height and width minimums and `k` derived from them; a `text` element's right edge; Versatility.
- **The two lockups' composition.** `reproduction.md` requires them checked for composition and clearspace, and the contact-sheet harness is built for the square artboard. Clearspace is computed and recorded. Composition is carried in `LOGO.md` § Checks recorded unrun, because the flow names no instrument that renders a non-square artboard.
