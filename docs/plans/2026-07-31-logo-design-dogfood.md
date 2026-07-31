# logo-design dogfood — running the plugin on this repository

**Date:** 2026-07-31
**Branch:** `feat/logo-design`
**Flow run:** `logo-concept`, full new-mark path, Steps 0 → 7, then `logo-review` on its own output
**Result:** a shipped mark at `assets/brand/`, a record at `docs/design/LOGO.md`, and a `PARTIAL — evidence-limited` review verdict
**Precedent:** `6f14c86` — `docs(project-orchestration): dogfood record — the acceptance test passes`

This is the acceptance test the design doc set: *would the maintainer actually ship this mark?* The answer is yes, and the more useful half of this document is everything the run found on the way there. A record saying "it worked" with no observations means the test was not really run.

## What was run

| Step | What happened |
|---|---|
| 0 | `docs/design/MASTER.md` absent → `currentColor` only, `ui-design-system` suggested, absence recorded. Existing-mark guard scanned all five paths, found nothing → `logo-concept`, full flow, row 1 of the three-way table. Stack detection: no React/Next/Astro/Vue/Blazor → `assets/brand/`. Brief captured verbatim; pattern 6 keyword scan returned `none` |
| 1 | The five answers were supplied with the task. Q3 was "you choose" |
| 2 | Three directions written before anything was drawn, all geometric, each with a seed and a stated giving-up |
| 3 | All three drawn on the 16-unit grid, `construction.md` § Order of application, self-check run against each |
| 4 | Contact sheet written from the template by placeholder substitution, screenshot twice, both PNGs read back, nine-item checklist graded, one fix, one re-render. Cap spent |
| 5 | B presented and taken; A and C presented with their findings |
| 6 | Seven files written; favicon redrawn to `reproduction.md`'s own spec; print minimums computed from this mark's `u_ink` and `u_ctr` |
| 7 | `LOGO.md` closed out, sheet regenerated against the final assets and re-rendered, five structural checks run, commit |
| review | `logo-review` run on the output: Layer 1 PARTIAL, Layer 2 PASS, Layer 3 floor 4 / average 4.25 over 4 of 5 → `PARTIAL — evidence-limited` |

Playwright MCP was not connected. Chromium was driven directly through the `playwright` driver from a throwaway script in the system temp directory, which is the same render the MCP would have produced. The flow's degradation path was therefore **not** exercised; that remains untested.

## The three directions, and what the render did to two of them

- **A — "Through."** A square ring (the suite) with a bar of the mark's own weight driven straight through it, entering and leaving past it. Extension as *continuation past a boundary*.
- **B — "One step on."** Two identical frames, the second the first translated by three quarters of its own side, overlapping on exactly one wall block. Extension as *the same construction, one step on, sharing one wall with what it extends*.
- **C — "The seat."** A solid block with a slot cut in from one edge and a bar seated in the slot, reaching past the block. Extension as *docking into the core and reaching beyond it*.

**Two of the three died on C8, the vision pass, and neither death was visible in the arithmetic.** Every readout row on the first render was clean — no `warn`, no `bad`, node counts and reuse ratios matching the analytic figures to the digit. The defects were:

- **A read as the CJK character U+4E2D at every size.** A centred vertical bar through a rectangular frame with two equal counters *is* that glyph's construction. The fix — a 16-unit bar at the second declared weight, placed off the centreline so the counters read 64 and 48 — removes the reading at 48 px and above and cannot remove it at 16, 20 or 24 px, where a 16-unit bar is one device pixel and the asymmetry is not expressible. Presented with the finding, not taken.
- **C read as a capital `E` at every size.** A spine with two arms and a longer middle bar is the letter. No change inside the direction removes it. The brief's string is `SPX`; a geometric mark that reads as a different letter of the alphabet than the name is worse than an abstract one.

**This is the strongest single result of the test.** The whole numeric apparatus — grid, corrections, counters, reuse ratio, node ceilings, ten anti-slop signatures — passed all three candidates. What killed two of them was reading a picture. The flow is right to put C8 where it does, and it is right that the harness returns no verdict.

## What failed, or was ambiguous, or is wrong as written

Ordered by how much it costs.

### 1. `logo-review` can never return PASS, for anyone, on any mark

`reproduction.md`'s **M3** — render at 256 px black-on-white, render white-on-black, invert the second, diff per channel against 2/255 — is on the binary checklist, applies to every mark, and **nothing in the plugin computes it**. The contact-sheet harness renders both grounds and stops; `logo-concept` Step 4 has no diff step; `logo-review` Step 2 has none either. M3 can never be `n/a` and can never be PASS, so Layer 1 is permanently PARTIAL, so the final verdict — the worst of three — is permanently capped at PARTIAL.

This is not the documented "no render, so PARTIAL — evidence-limited" case. The render ran, twice, on both grounds, and M3 is still unrun. Either the harness grows a diff (it already has the two renders; it needs a canvas and a loop) or M3 moves out of the binary layer.

### 2. The declared webfont is a hidden machine dependency, and nothing warns about it

`mark-types.md`'s wordmark recipe requires a **declared** webfont. `reproduction.md` requires `φ_ink` and `φ_ctr` measured off the wordmark variant's 256 px render. The harness correctly detects that the declared face did not resolve and raises a `bad` alert. Nothing anywhere tells the agent that the face has to be installed on the machine running the sheet, or offers self-hosting it beside the sheet as a step.

The cost is not one row. It cascaded to **seven** `UNRUN`s in `LOGO.md`: `φ_ink`, `φ_ctr`, `k`, both lockups' cap-height minimums, the lockup width minimum, and the wordmark's fit — plus a `text` right-edge row in the review. On a machine with the face, all seven are values. As it stands, any project whose brand face is not a system font gets that cascade and no advice about it.

`Still to do` should carry an install-or-self-host step, and Step 6 should say so before the wordmark is drawn rather than after.

### 3. Step 7 destroys Step 4's evidence, and `logo-review` is explicitly forbidden from doing the same thing

`logo-concept` Step 4 writes the candidate sheet to `docs/design/logo-contact-sheet.html`. Step 7 regenerates **the same path** against the final assets. The sheet the three candidates were compared on — the only artefact showing why B was taken and A and C were not — is overwritten before the commit.

`logo-review` Step 2 forbids exactly this, in exactly these words: *"Never overwrite `docs/design/logo-contact-sheet.html` — that file is `logo-concept`'s record of what the mark was signed off against, and an audit that overwrites it has destroyed the evidence it exists to weigh."* `logo-concept` destroys it itself, one step later, and the flow does not notice.

This run preserved the candidate sheet by hand at `docs/design/logo-contact-sheet-candidates.{html,png}` and `-candidates-readout.png`. That is not the flow's doing; those three paths are outside the manifest and outside the flow, and Step 7's structural check does not know about them. Step 4 should write a distinct path, or Step 7 should copy before it regenerates.

### 4. The two prescribed screenshots cannot answer C1 or C2

The harness's own `HOW TO SCREENSHOT IT` comment prescribes two shots and explains why: the full page for the marks, `#readout` scoped for the numbers, *"a number too small to read in the PNG does not exist as far as the reading agent is concerned."* The same argument defeats the marks. The full page is 1360 × 3043; a 16 px mark occupies 16 native pixels; anything that downscales the PNG for a reading agent leaves ~10 px, in which a 4-device-pixel counter is not resolvable.

C1 ("counters open in the smallest column") and C2 ("the two device-pixel-ratio columns") are precisely the items that need those pixels. **I could not grade either from the two prescribed shots.** Grading them required a third shot the flow does not describe: `#band-small` at device scale 1, re-photographed through `image-rendering: pixelated` at 5×. Upscaling the *PNG* is essential — re-rendering the SVG larger would be a different measurement wearing C1's name.

The comment should prescribe three shots, and the third should be specified, because an agent left to invent it will invent the wrong one.

### 5. C6 is not judgeable by eye at all

C6 grades the 4% horizontal thinning on the sheet's two largest columns. At 256 px that is 1.28 device px on a 30.72 px wall. I could not see it in any screenshot I can read, and I recorded it `UNRUN` rather than assert it. The correction is confirmed present from the source and from the readout's coordinates — but that is the *source* half, and C6 is defined as the eyes half. Either C6 needs a prescribed side-by-side crop, or it should be honest that it is a source check.

### 6. The commit step cannot run in this repository

`logo-concept` § The commit delegates to `project-orchestration`'s Commit & Release Protocol, whose Step 1 reads `docs/planning/CONVENTIONS.md`. **This repository does not have that file.** The protocol then says run `init-conventions`, which is an interactive Propose/VERIFY sub-skill, and if the file still does not exist, **STOP**.

So the flow's own commit is unreachable here, in the repository that ships the plugin, in a non-interactive session. This run used the commit the task supplied verbatim — `docs(logo-design): dogfood record — a real mark for this repo` — which is **not** what the flow's triple renders. The triple is `feat` / scope resolved from `Scope source` / `add brand mark — SPX, geometric`; with `commitlint.config.js` as the scope source and `logo-design` in its `scope-enum`, that would have rendered `feat(logo-design): add brand mark — SPX, geometric`. The branch guard would have passed: `feat/logo-design` is not protected.

Two things follow. `init-conventions` should be runnable non-interactively with defaults, or the protocol needs a documented non-interactive fallback. And this repository should have a `CONVENTIONS.md` if it wants its own plugins to be runnable on it.

### 7. `logo-review`'s staging rule and the single-commit instruction collide

`logo-review` § The review's commit says *"The audited files are not staged: this flow did not change them, and a review that appears in a diff alongside the mark it graded is indistinguishable from a review that edited it."* This run committed the review report in the same commit as the assets it graded, because that is what the task's staging pathspec did. The rule is right and it was broken; it is recorded here so the diff is not read as the review having edited the mark. It did not — the assets were byte-final before `logo-review` started.

### 8. `mark-types.md`'s geometric recipe assumes the seed is the mark's centre

Step 1: *"Place one seed primitive on the grid. A circle or a square, **centred on (128, 128)**."* That is false for any derivation that translates. Centring this mark's seed would put its translate's outer box at 272, off the artboard. The seed sits at (80, 80) so the **pair** is centred on (128, 128). Recorded in `LOGO.md` as a stated deviation, which is the right outcome, but the recipe should say "placed so the rule's output is centred" rather than pinning the seed.

### 9. `reproduction.md`'s "the counter is the binding term in every case" is false

§ Minimum sizes says *"The counter is the binding term in every case, which is why `construction.md` spends its arithmetic there."* For this mark it is not: narrowest counter 64 gives `256 × 2 / 64 = 8.00 px`, narrowest ink 30.72 gives `256 × 1 / 30.72 = 8.33 px`, and the **ink** binds. It binds harder still on candidate A, whose 16-unit bar at the second declared weight demands 16 px on its own. The sentence is true of the *worst legal construction* the section tabulates — counter exactly at target — and false of any mark whose counters are built over target, which is every mark that ships a dark variant, because the dark increment pushes them over.

### 10. Clearspace punishes an elongated counter very hard

The rule takes the largest enclosed counter *on the axis where it is widest*. Candidate A's counter is 48 × 130.56, giving 144 units — **56.25%** of the mark's rendered size on all four sides. B's is 64 × 66.56, giving 80 units, 31.25%. A 2.7× swing in clearspace between two marks of the same weight on the same grid, decided by the aspect of one hole. The file states and defends the choice, so this is not a bug; it is a consequence worth knowing before drawing a tall counter.

### 11. Smaller things

- **Step 6's favicon critique pass and Step 7's verification render are the same render.** Step 6 says write the sheet with the favicon in a candidate slot and grade C1, C2, C3, C9; Step 7 says regenerate with `logo-mark`, `logo-favicon` and `logo-wordmark` in the three slots and run the checklist once. Same file, same three slots, same numbers. Ran once, used for both, and the flow reads as though it prescribes two.
- **Step 6 says a wordmark variant is drawn "per `mark-types.md` § Wordmark"**, whose recipe budgets exactly one custom detail. For the wordmark *variant of a geometric mark* that would be a second mark. Recorded as `declined` with the reason; the step should say which parts of the recipe reach a variant.
- **The lockups have no instrument.** `reproduction.md` requires them checked for composition and clearspace and states that the harness cannot render a non-square artboard. Clearspace is computable and was computed; composition is `UNRUN`, and nothing in the flow would ever change that.
- **Artboard hygiene's "every variant's ink sits inside 16 … 240"** is stated in square-master units and has no meaning on a declared non-square lockup. `logo-review` Step 1's normalisation factor makes it worse, not better: scaling a 512-wide lockup by 0.5 puts the mark's ink at 8 … 120 and fails a rule it was never under.
- **`n/a` on a correction row is doing two different jobs.** "There is no triangle in this mark" (correction 3) and "no container was drawn, which was a decision" (correction 6) are not the same kind of not-applicable, and `logo.template.md`'s four tokens have no way to say so. The reason after the dash carries it, which works, but a reader scanning the Status column sees one word for both.
- **The template's Contrast table has four columns and its own shape invites three.** The natural row for a `currentColor` master — file, ground, "n/a, it specifies no ground" — is three cells and trips `MD056` in any repository that lints markdown. Worth a fourth-cell example in the template.

## What would be changed

In rough order of value:

1. Give the harness an M3 diff. It already has both renders; it needs a canvas, an invert and a max-per-channel loop. Without it the plugin's own verdict vocabulary has an unreachable top state.
2. Prescribe the third screenshot, and specify it as a device-scale-1 shot of `#band-small` re-photographed through `image-rendering: pixelated`. C1 and C2 are ungradeable otherwise.
3. Move Step 4's sheet to its own path, or copy before Step 7 regenerates.
4. Add the webfont-availability step to Step 6 and to `Still to do`, before the wordmark is drawn.
5. Give this repository a `docs/planning/CONVENTIONS.md`, or give `init-conventions` a non-interactive mode. A plugin whose commit step cannot run on the repository that ships it is a gap the next dogfood will hit too.
6. Fix the two false sentences: `mark-types.md`'s seed centring and `reproduction.md`'s "the counter is the binding term in every case".

## What the mark is

`SPX`, geometric. Two square frames of one weight, the second the first translated by three quarters of its own side, meeting on a single shared wall block. One declared weight of 32, two counters at 64 against a target of 40.96, 16 nodes, one surviving `OPTICAL:` reason against a ceiling of six, ink over convex hull 0.567, clearspace 80 units. Seven files at `assets/brand/`, record at `docs/design/LOGO.md`, review verdict `PARTIAL — evidence-limited` with no finding raised against the mark.

Would the maintainer ship it? Yes. It survives 16 px on both grounds with both counters open, it is one sentence long, it says the thing the product does, and every number in it came from another number. The honest reservation is that its silhouette lives one street over from the copy/duplicate glyph every interface has — which the vision pass noted, which Distinctiveness and Memorability are both scored 4 rather than 5 for, and which nothing in this plugin measures.
