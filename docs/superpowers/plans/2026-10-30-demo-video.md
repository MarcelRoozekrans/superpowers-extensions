# Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 15th plugin, `demo-video`, whose skill records a paced, captioned browser walkthrough of a finished feature, then release it and use it for the incident-triage-demo fallback recording.

**Architecture:** Claude writes a storyboard and checks it live with Playwright MCP. It then fills a thin `record.mjs` with the step list. `record.mjs` imports a tested runtime (`lib/runtime.mjs`) that records with Playwright and writes `timeline.json`. A post-processor builds an ffmpeg filter graph from that timeline: it cuts between tabs, speeds up waits, burns in captions and cards, and writes one MP4 per chapter plus a combined one. The plugin's `lib/` is copied into each output folder, so a re-record needs only Node, a global Playwright and ffmpeg, with no plugin and no Claude session.

**Tech Stack:** Node ≥ 20 ESM (`node:test`), Playwright (global install, Chromium), ffmpeg/ffprobe, Git LFS, Markdown skills, markdownlint-cli2, the existing `scripts/check-*.mjs` guards.

**Spec:** `docs/superpowers/specs/2026-10-30-demo-video-design.md`

## Global Constraints

- Plugin name and commit scope: `demo-video`. Task 6 adds the scope to commitlint, so run commitlint only after Task 6. No Claude signatures or session links in commits or PRs, and no nested parentheses in commit bodies.
- Modes: `quick` (no approval, no captions, no cards, MP4 + GIF) and `polished` (storyboard approved first, captions per step, a title card per chapter, a title and end card on the combined video, MP4 only). Captions can be switched off in polished mode.
- Waits are sped up, never cut. Defaults: factor `10`, minimum on-screen `1` s. A wait is never slowed down: output duration = `min(d, max(1, d / 10))`. A `▶▶ 10×` marker is overlaid while a wait plays. The text follows the factor.
- Video: 1920×1080, 30 fps, H.264, `yuv420p`, `-movflags +faststart`. GIF: 1280 wide, 12 fps, quick mode only.
- Output folder: `docs/demo-videos/YYYY-MM-DD-<feature>/` containing `storyboard.md`, `record.mjs`, `timeline.json`, `lib/` (committed), `*.mp4` and `*.gif` (Git LFS), and `raw/`, `.auth/`, `frames/` (gitignored).
- Chapter files: `NN-<slug>.mp4` (`01-…`) plus `demo.mp4`. A storyboard with one chapter writes only `demo.mp4`.
- Every step checks its expected state. A failed check or action exits non-zero, writes no MP4 and keeps `raw/` for debugging.
- Login and setup run before step 1 in the recorded context and are never part of any segment. `storageState` is optional.
- Playwright is resolved from the global install (`npm root -g`). The target repo gets no `package.json`.
- Linux first, headless included. Preflight gives `apt` and `brew` install hints.
- The skill never commits on its own. It shows the `.gitattributes` and `.gitignore` changes it made.

## Review Focus

- **Captions with ffmpeg-special characters.** A Dutch caption such as `Spoed: ja — 100% 'zeker', V-nummer [V-NUMMER]` must render verbatim. Owned by Task 2: captions go through `textfile=`, never inline `text=`.
- **Waits shorter than the minimum.** A 0.4 s wait must play at real speed, not be stretched to 1 s. Owned by Task 1.
- **A tab opened mid-chapter, then switched back.** The cut points must land in each page's own video time, which is offset by when that page opened. Owned by Task 1 (offset math) and Task 4 (fixture with a second tab).
- **A step fails halfway.** There must be no MP4, a non-zero exit and a message naming the step. Owned by Task 4.
- **Re-recording into an existing folder after a chapter was renamed.** The stale `02-old-name.mp4` must not survive next to the new files. Owned by Task 3: postprocess deletes only files matching `^\d{2}-.*\.mp4$`, `demo.mp4` and `demo.gif` before writing.

---

### Task 1: Timeline to segments

**Files:**

- Create: `plugins/demo-video/skills/demo-video/lib/timeline.mjs`
- Test: `plugins/demo-video/skills/demo-video/scripts/timeline.test.mjs`

**Interfaces:**

- Produces the `timeline.json` format, version 1. All times are seconds since the recorded context was created:

  ```json
  {
    "version": 1, "mode": "polished", "captions": true,
    "title": "…", "endCard": "…", "speedFactor": 10, "minWait": 1,
    "pages": [{ "id": "p0", "file": "raw/p0.webm", "openedAt": 0.0 }],
    "chapters": [{ "id": "c1", "title": "…", "slug": "gewone-melding" }],
    "steps": [{ "chapter": "c1", "index": 1, "caption": "…", "page": "p0", "start": 3.2, "end": 9.8,
                "wait": { "start": 5.0, "end": 8.1 } }]
  }
  ```

- `waitOutputDuration(d: number, factor: number, min: number) => number` returns `min(d, max(min, d / factor))`.
- `segmentsForChapter(timeline, chapterId) => Segment[]`, where `Segment = { file: string, from: number, to: number, speed: number, caption: string|null, marker: boolean }`. `from` and `to` are page-local times (`t - page.openedAt`). Each step gives up to 3 segments: pre-wait at speed 1, the wait at `speed = d / waitOutputDuration(...)` with `marker: true`, and post-wait at speed 1. All three carry the step's caption when `timeline.captions` is set, otherwise `null`. Time between steps is dropped, and so is everything before step 1.
- `slugify(title: string) => string`: lowercase, NFD with diacritics stripped, non-alphanumerics become `-`, trimmed, at most 40 chars.

- [ ] **Step 1: Write failing tests** in `timeline.test.mjs`:
  - `waitOutputDuration(15, 10, 1) === 1.5`; `waitOutputDuration(5, 10, 1) === 1`; `waitOutputDuration(0.4, 10, 1) === 0.4`.
  - A step 3.2–9.8 with a wait of 5.0–8.1 gives 3 segments: `[3.2,5.0]` at speed 1; `[5.0,8.1]` with speed `3.1 / 1 ≈ 3.1`, `marker: true`; `[8.1,9.8]` at speed 1.
  - A step without a wait gives 1 segment.
  - A step on page `p1` with `openedAt: 12` and a start of 14 gives `from: 2` and `file: 'raw/p1.webm'`.
  - With `captions: false`, every segment has `caption: null`.
  - Steps from another chapter are excluded, and segments come out in step-index order.
  - `slugify('Melding 2: persoonsgegevens!') === 'melding-2-persoonsgegevens'`; `slugify('Één') === 'een'`.
- [ ] **Step 2: Run** `node --test plugins/demo-video/skills/demo-video/scripts/timeline.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `timeline.mjs` to the interfaces (pure ESM, no dependencies).
- [ ] **Step 4: Run** `npm test`. Expected: all suites pass.
- [ ] **Step 5: Commit** `feat(demo-video): map a recording timeline to video segments`.

### Task 2: ffmpeg filter graph

**Files:**

- Create: `plugins/demo-video/skills/demo-video/lib/ffmpeg-graph.mjs`
- Test: `plugins/demo-video/skills/demo-video/scripts/ffmpeg-graph.test.mjs`

**Interfaces:**

- Consumes: `Segment` (Task 1).
- Produces:
  - `buildChapterArgs({ segments, titleCard: string|null, endCard: string|null, captionDir: string, fontFile: string, out: string, width=1920, height=1080, fps=30, factor=10 }) => { args: string[], textFiles: Array<{ path: string, text: string }> }`. It returns ffmpeg argv, without the leading `ffmpeg`, that:
    - takes each distinct segment file as an input;
    - per segment: `trim=start:end`, `setpts=(PTS-STARTPTS)/speed`, `scale` and `pad` to width×height, `fps`;
    - draws the caption with `drawtext=textfile=<file>` (bottom, centred, a semi-transparent box);
    - draws the `▶▶ <factor>×` marker top-right when `marker` is set;
    - prepends or appends a 2.5 s card from a `color=c=black` source with centred `drawtext=textfile=` when the card is non-null;
    - joins everything with `concat=n=…:v=1:a=0`;
    - encodes `-c:v libx264 -pix_fmt yuv420p -movflags +faststart -y <out>`.
    Every caption and card text goes in `textFiles`, with paths under `captionDir`. The caller writes them.
  - `buildConcatArgs(files: string[], listFile: string, out: string) => { args: string[], list: string }`, using the concat demuxer with `-c copy`.
  - `buildGifArgs(mp4: string, out: string) => string[]`: `fps=12,scale=1280:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`.

- [ ] **Step 1: Write failing tests:**
  - Two segments from different files give two `-i` inputs and `concat=n=2`.
  - A caption `Spoed: ja — 100% 'zeker', V-nummer [V-NUMMER]` appears verbatim in `textFiles[].text`, and the filter string contains neither `Spoed` nor `100%`.
  - A segment with `speed: 3.1` gives `setpts=(PTS-STARTPTS)/3.1`.
  - `marker: true` adds a drawtext whose text file contains `▶▶ 10×`. `marker: false` adds none.
  - `titleCard: 'Titel'` adds a `color=` source and `concat=n=3` for 2 segments. `null` cards add no `color=`.
  - args include `libx264`, `yuv420p`, `+faststart`, and end with `-y <out>`.
  - `buildGifArgs` includes `palettegen` and `fps=12`.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** `ffmpeg-graph.mjs` (pure, no process spawning).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(demo-video): build ffmpeg filter graphs for chapters, cards and GIFs`.

### Task 3: Post-processing and verification

**Files:**

- Create: `plugins/demo-video/skills/demo-video/lib/postprocess.mjs`
- Create: `plugins/demo-video/skills/demo-video/lib/verify.mjs`
- Test: `plugins/demo-video/skills/demo-video/scripts/postprocess.test.mjs`

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces:
  - `findFont() => string`: `fc-match -f '%{file}' 'DejaVu Sans'`, falling back to `/System/Library/Fonts/Supplemental/Arial.ttf` on macOS. It throws a clear error when no font is found.
  - `postprocess(folder: string, { captions?: boolean } = {}) => Promise<string[]>`. It reads `folder/timeline.json` and deletes stale outputs (only `^\d{2}-.*\.mp4$`, `demo.mp4`, `demo.gif`). Then:
    - with several chapters, it renders each chapter to `NN-<slug>.mp4` with the chapter title as its card, then concatenates the title card + chapters + end card into `demo.mp4`;
    - with one chapter, it renders `demo.mp4` directly;
    - in quick mode, it uses no cards, no captions and also writes `demo.gif`.

    It returns the written paths. The `captions` option overrides `timeline.captions`.
  - CLI: `node lib/postprocess.mjs <folder> [--no-captions]`.
  - `verify(folder: string) => Promise<{ ok: boolean, problems: string[], frames: string[] }>`. Using `ffprobe`, it checks that each MP4 is 1920×1080 H.264 and that its duration is within ±1 s of the sum of its segment output durations plus its cards. It extracts one PNG per step, at the middle of the step's output time in its chapter file, to `folder/frames/NN-step-M.png`. CLI: `node lib/verify.mjs <folder>`. Exit 1 when not ok.
- Environment setup, done once on this machine before Step 1:
  - `sudo apt-get install -y ffmpeg git-lfs && git lfs install`;
  - `npm i -g playwright` at the version whose Chromium revision matches `~/.cache/ms-playwright/chromium-1248`, or else run `npx playwright install chromium` afterwards;
  - check that `ffmpeg -version` and `git lfs version` print versions.

- [ ] **Step 1: Write failing tests.**
  - The tests generate their raw input with `ffmpeg -f lavfi -i testsrc=size=1920x1080:rate=30 -t 12 raw/p0.webm` into a temp folder, plus a hand-written two-chapter `timeline.json` with one wait.
  - The suite is skipped with `test.skip` and the message "ffmpeg not installed" when `ffmpeg` is missing.
  - Assertions:
    - `postprocess` writes `01-<slug>.mp4`, `02-<slug>.mp4` and `demo.mp4`;
    - a pre-existing `02-old-name.mp4` and an unrelated `notes.txt` lead to the first being deleted and the second kept;
    - a one-chapter timeline writes only `demo.mp4`;
    - quick mode writes `demo.gif`;
    - `verify` returns `ok: true` and one frame per step;
    - a truncated MP4 makes `verify` return `ok: false` with a duration problem.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** both modules. Spawn processes with `execFile`, never through a shell. Write the `textFiles` to `folder/raw/text/` before running ffmpeg.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, with this suite running, not skipped.
- [ ] **Step 5: Commit** `feat(demo-video): post-process recordings into chapter videos and verify them`.

### Task 4: Recording runtime

**Files:**

- Create: `plugins/demo-video/skills/demo-video/lib/runtime.mjs`
- Create: `plugins/demo-video/skills/demo-video/lib/playwright.mjs`
- Create: `plugins/demo-video/skills/demo-video/scripts/fixtures/app.html` and `fixtures/second.html`
- Test: `plugins/demo-video/skills/demo-video/scripts/runtime.test.mjs`

**Interfaces:**

- Consumes: `postprocess` (Task 3).
- Produces:
  - `loadPlaywright() => Promise<typeof import('playwright')>`. It uses `createRequire` rooted at `$(npm root -g)/` and throws `Playwright not found globally: npm i -g playwright && npx playwright install chromium` on failure.
  - `record(spec) => Promise<string[]>`, with:
    - `spec = { folder, baseUrl, mode: 'quick'|'polished', captions?: boolean, title?, endCard?, speedFactor?, minWait?, storageState?, setup?: async (h) => void, chapters: [{ title, steps: [{ caption, run: async (h) => void, waitFor?: async (h) => void, expect?: async (h) => void }] }] }`;
    - It launches headless Chromium with one context: viewport and `recordVideo` size 1920×1080, `dir: folder/raw`.
    - It runs `setup` (not filmed), then each step: record `start`, then `run`, then the wait window around `waitFor` (when given), then `expect`. A reading pause follows each step: 1.2 s, or 2.5 s after a `waitFor`. Then it records `end`.
    - It closes the context, renames each page's video to `raw/<pageId>.webm`, writes `timeline.json` (Task 1 format) and calls `postprocess`.
    - On any thrown error it closes the context, writes no MP4 and rethrows `Step <chapter>.<index> "<caption>" failed: <message>`.
  - The helper `h` passed to `setup`, `run`, `waitFor` and `expect`:
    - `h.page` (the active page);
    - `h.goto(path)`;
    - `h.click(locator)`: move the mouse in 25 steps to the element's centre, pause 300 ms, click;
    - `h.type(locator, text)`: 60 ms per key;
    - `h.paste(locator, text)`: focus, then `fill` in one go;
    - `h.openTab(name, path)` and `h.switchTab(name)`: tab switches set the active page for the following steps;
    - `h.expectText(locator, text)`: wraps `expect(...).toContainText` from `playwright/test` when available, else a polling check with a 30 s timeout.
  - A cursor overlay is injected with `context.addInitScript`: a 24 px dot that follows `mousemove` and pulses on `mousedown`.
- Fixture: `app.html` has a button "Analyse". Clicking it shows `Bezig…`, then after 2 s shows `Resultaat: klaar`. A link opens `second.html` in a new tab, which shows "Dashboard". The test serves both with `node:http` on a random port.

- [ ] **Step 1: Write failing tests.** Skip when `loadPlaywright()` throws or ffmpeg is missing. Cases:
  - Polished, two chapters. Chapter 1: click Analyse with `waitFor` on `Resultaat`. Chapter 2: `openTab('dash', '/second.html')`, expect `Dashboard`, then `switchTab('main')`. Expect `01-*.mp4`, `02-*.mp4` and `demo.mp4`; a `timeline.json` with 2 pages, where the `p1` `openedAt` is greater than 0; and a step-1 `wait` of about 2 s (±0.5).
  - A setup that waits 3 s: the first step's `start` is at or after 3, and `demo.mp4`'s duration is shorter than the total recording time by at least 2.5 s.
  - A step expecting `Bestaat niet` rejects with a message containing `Step 1.2` and the caption, and no `.mp4` exists in the folder.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** `playwright.mjs` and `runtime.mjs`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, with this suite running. Open one extracted frame from `verify` and check that the cursor dot and the caption are visible.
- [ ] **Step 5: Commit** `feat(demo-video): add the paced recording runtime with tabs, chapters and step checks`.

### Task 5: Preflight, scaffold and template

**Files:**

- Create: `plugins/demo-video/skills/demo-video/scripts/preflight.mjs`
- Create: `plugins/demo-video/skills/demo-video/scripts/scaffold.mjs`
- Create: `plugins/demo-video/skills/demo-video/templates/record.template.mjs`
- Test: `plugins/demo-video/skills/demo-video/scripts/scaffold.test.mjs`

**Interfaces:**

- Consumes: `loadPlaywright` (Task 4).
- Produces:
  - `preflight({ url?: string }) => Promise<{ ok: boolean, checks: Array<{ name: string, ok: boolean, hint?: string }> }>`. It checks:
    - Node ≥ 20;
    - a global Playwright that can launch Chromium;
    - `ffmpeg` and `ffprobe`;
    - `git lfs version`;
    - that `url` answers HTTP < 500 within 5 s.

    Hints use `apt-get` on Linux and `brew` on macOS. CLI: `node scripts/preflight.mjs [url]`, which prints one line per check and exits 1 when not ok.
  - `scaffold({ repoRoot: string, folder: string }) => { created: string[], gitattributesAdded: string[], gitignoreAdded: string[] }`. It creates the folder, copies `lib/*.mjs` into `folder/lib/`, and copies `templates/record.template.mjs` to `folder/record.mjs` unless that file exists. Then, idempotently, it appends:
    - to `.gitattributes`: `docs/demo-videos/**/*.mp4 filter=lfs diff=lfs merge=lfs -text` and the same line for `*.gif`;
    - to `.gitignore`: `docs/demo-videos/**/raw/`, `docs/demo-videos/**/.auth/` and `docs/demo-videos/**/frames/`.

    CLI: `node scripts/scaffold.mjs <repoRoot> <folder>`.
  - The template imports `{ record }` from `./lib/runtime.mjs`, contains one commented example chapter using every `h.*` helper, and calls `record({...})` with `folder: dirname(fileURLToPath(import.meta.url))`.

- [ ] **Step 1: Write failing tests:**
  - `scaffold` into a temp repo creates `lib/runtime.mjs`, `lib/postprocess.mjs` and `record.mjs`, and adds 2 attribute lines and 3 ignore lines.
  - A second run adds 0 lines and does not overwrite an edited `record.mjs`.
  - Existing unrelated `.gitignore` lines are preserved.
  - `preflight({ url: 'http://127.0.0.1:1' })` returns the URL check with `ok: false`.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** the three files.
- [ ] **Step 4: Run** `npm test` and `node plugins/demo-video/skills/demo-video/scripts/preflight.mjs`. Expected: tests pass, and preflight prints all checks ok on this machine except the URL check, which isn't given.
- [ ] **Step 5: Commit** `feat(demo-video): add preflight, output scaffolding and the record template`.

### Task 6: Skill, manifest and registration

**Files:**

- Create: `plugins/demo-video/.claude-plugin/plugin.json` (name `demo-video`, MIT, author, keywords `demo`, `video`, `recording`, `playwright`, `screencast`)
- Create: `plugins/demo-video/.mcp.json` (identical to `plugins/regression-test/.mcp.json`)
- Create: `plugins/demo-video/skills/demo-video/SKILL.md`
- Create: `plugins/demo-video/skills/demo-video/references/storyboard.md`
- Modify: every place `npm run check:registries` enforces, as anti-slop's Task 4 did:
  - `.claude-plugin/marketplace.json` (append an entry, category `productivity`);
  - `release-please-config.json` (`$.plugins[14].version`);
  - `package.json` `install-plugins`;
  - `hooks/session-start`;
  - `.opencode/plugins/superpowers-extensions.js`;
  - `.cursor-plugin/plugin.json` and `.codex-plugin/plugin.json` (keyword, codex "Fourteen" → "Fifteen");
  - `GEMINI.md`;
  - `.codex/INSTALL.md` and `.copilot-cli/INSTALL.md`;
  - `commitlint.config.js` scope-enum;
  - `README.md`: intro "fourteen" → "fifteen" plus a bullet, a "Demo Video Skill" section, the install lines and the plugin tree.

**Interfaces:**

- Consumes: `preflight`, `scaffold`, the template, `postprocess`, `verify` (Tasks 3–5).

- [ ] **Step 1: Run** `npm run check:registries`. Expected: FAIL (no manifest for `demo-video`).
- [ ] **Step 2: Write `references/storyboard.md`.** It holds:
  - the format: title, end-card line, `## Chapter` headings, and numbered steps with an **Action**, a **Caption**, an optional **Wait for** and an optional **Expect**;
  - the rule that captions use the storyboard's language;
  - one complete English example with two chapters and a tab switch;
  - the mapping from each line type to `h.*` calls in `record.mjs`.
- [ ] **Step 3: Write `SKILL.md`.**
  - Frontmatter `name: demo-video`. The description starts "Use when…", names the triggers from the spec ("record a demo", "make a demo video", "record the feature", "fallback recording", "screen recording of the app") and skips non-web apps, terminal recordings and "every finished feature unasked".
  - A `<HARD-GATE>` in `regression-test`'s style: no "done" before `verify` passes **and** Claude has viewed every frame in `frames/` for the wrong page, error states, visible secrets and legible captions.
  - Procedure: pick the mode → `preflight` → write `storyboard.md` from the plan, spec, diff and any existing demo script → **polished: wait for user approval** → explore every step live with Playwright MCP and pick locators (role/name, then test id, then CSS) → `scaffold` → fill `record.mjs` → `node record.mjs` → `verify` → view the frames → report the paths, durations and the re-record command, and show the `.gitattributes`/`.gitignore` diff. Never commit.
  - Rules:
    - never record around a failing step;
    - demo data must be invented;
    - login goes in `setup`;
    - mark every slow call with **Wait for**;
    - quick mode skips approval and captions.
  - Its Reference Index links `references/storyboard.md`. It cites, and never restates, the storyboard format.
- [ ] **Step 4: Write the manifest, `.mcp.json` and every registry edit.**
- [ ] **Step 5: Verify:**
  - `npm run check:registries` prints `OK` and `15 plugins`;
  - `npm run check:conventions` passes;
  - `npx markdownlint-cli2` reports 0 issues;
  - `npm test` passes;
  - `npx commitlint --from origin/master` passes;
  - the anti-slop scanner on `SKILL.md`, `references/storyboard.md` and the new README section (`node plugins/anti-slop/skills/anti-slop/scripts/scan.mjs plugins/anti-slop/skills/anti-slop/references/patterns-en.md <files>`) exits 0.
- [ ] **Step 6: Commit** `feat(demo-video): add the skill and register the plugin`.

### Task 7: RED/GREEN evaluation and trigger check

**Files:**

- Create: `docs/superpowers/evals/2026-10-30-demo-video-brief.md`, `…-baseline.md`, `…-green.md`
- Modify (only if GREEN fails): `SKILL.md`, `references/storyboard.md`

**Interfaces:**

- Consumes: the Task 4 fixture app and the skill (Task 6).

- [ ] **Step 1: Write the brief.** Serve the fixture app locally. The brief: "We just shipped the Analyse button and the dashboard tab. Make a polished demo video of it for a customer audience; the storyboard is pre-approved: …" It includes a 4-step storyboard, and the pass criteria are:
  - per-chapter MP4s exist;
  - the wait is sped up and the marker is visible;
  - the captions match the storyboard;
  - no Claude-pause dead air (no stretch over 3 s without a step change);
  - `verify` passes;
  - the frames were viewed.
- [ ] **Step 2: RED.** A fresh `sonnet` subagent gets the brief without the skill. Record its output and which criteria fail in the baseline file.
- [ ] **Step 3: GREEN.** A fresh `sonnet` subagent gets the brief plus "read and follow `plugins/demo-video/skills/demo-video/SKILL.md`". Grade it against the criteria and record the result in the green file. On a failure, tighten `SKILL.md` and rerun, up to 3 rounds. After that, stop and report instead of loosening the bar.
- [ ] **Step 4: Trigger check.** Install from the worktree (`claude plugin marketplace add .`, `claude plugin install demo-video`). Check that "record a demo video of the new export page" loads `demo-video` and that "what is a webm file?" does not. If the CLI is unavailable, record `UNRUN` with the reason.
- [ ] **Step 5: Run** the full checks from Task 6 Step 5. Expected: all pass.
- [ ] **Step 6: Commit** `test(demo-video): record RED/GREEN evaluation results`.

### Task 8: Release

- [ ] **Step 1:** Run `pre-push-review` on the branch. Fix findings in the loop, following the user's CLAUDE.md rule.
- [ ] **Step 2:** Open a PR from `feat/demo-video` to `master`, mirroring any PR template. No Claude signature, no session link, no private details.
- [ ] **Step 3:** Watch CI to green, and fix any failure at its root.
- [ ] **Step 4:** Marcel squash-merges. Afterwards, confirm that the `feat(demo-video)` entry appears in the release-please PR. A green workflow is not proof.
- [ ] **Step 5:** Marcel merges the release PR. Confirm the tag exists and that `claude plugin install demo-video` resolves the new version.

### Task 9: Acceptance — incident-triage-demo fallback

Runs in `~/Projects/Prive/incident-triage-demo` on that project's Phase 4.3 branch, after its Phase 4.1 and 4.2. That project's state files own the phase. This task only uses the released skill there.

- [ ] **Step 1:** Start the AppHost with real services on this machine. Run `preflight` against the app URL. Expected: all ok.
- [ ] **Step 2:** Invoke the skill in polished mode. The storyboard is in Dutch with three chapters, one per report in `docs/demo-meldingen.md`. The steps use their expected values as **Expect** lines, plus the AI.Sentinel dashboard tab for the injection report. Aspire Traces is not included.
- [ ] **Step 3:** Marcel approves the storyboard.
- [ ] **Step 4:** Record, verify, and view the frames. Expected:
  - `01-…`, `02-…`, `03-…` and `demo.mp4` exist;
  - every frame shows invented data only;
  - no token is visible anywhere.
- [ ] **Step 5:** Marcel approves the video. Commit the folder in the triage repo, with videos through LFS, as part of its Phase 4.3, and tick its Definition of Done item "A fallback recording exists".
