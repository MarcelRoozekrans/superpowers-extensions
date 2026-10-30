# Demo Video Skill — Design

Date: 2026-10-30
Status: approved

## Intent

When a feature or product is finished, the user wants a video of the web app that shows the new feature to an audience. The skill is generic: any web app reachable from a browser, any feature. There are two audiences: reviewers and teammates, who want a quick look in a PR or chat, and outside people at a launch or a talk, who need something polished.

Its first real use, which sets the bar for v1, is the incident-triage-demo's fallback recording (see **First use** below).

`demo-video` is a new plugin with a skill that turns a finished feature into a recorded browser walkthrough.

## Goals

- Derive what to show from the feature's plan and diff, as a storyboard of browser steps.
- Record a real browser walking that storyboard against the running app, on its real services.
- Two modes:
  - **quick**: a plain recording for a PR or chat, with no approval step.
  - **polished**: the storyboard is approved first, with a caption per step plus a title card and an end card.
- Keep the video watchable: a human pace, readable pauses, and long waits sped up.
- Make a re-record one command, with no Claude session, after a late UI fix.
- Record across several pages and tabs in one video, for example an app and a separate admin or monitoring dashboard.
- Split a video into chapters, each its own file, so a presenter can start at any part.

## Non-goals

- Voiceover or any audio. A later add-on, used when a TTS engine is installed.
- Capturing anything outside the browser: terminals, CLIs, desktop windows.
- A video editor: no manual trimming UI, transitions, music or zoom effects in v1.
- Recording login screens. Authentication happens before recording starts.
- Hosting or uploading the video anywhere.

## Anti-goals (failure even if it "works")

- **Faked results.** The video shows the real app doing real work. Waits are sped up, never cut, so the audience can see that a real call happened. Nothing is mocked for the recording.
- **Dead air.** Long unexplained pauses, whether from slow calls or from the tooling, make the video useless as a fallback someone talks over.
- **Unpaced robot clicks.** Instant teleporting clicks and full pages flashing past faster than anyone can read.
- **Leaking secrets.** API keys, tokens, dashboard login tokens or real personal data visible in a frame. Demo data must be invented, and the skill checks frames for these before it reports done.
- **Recording a broken run.** A storyboard step that failed (an error page, a missing element) silently ends up in a "finished" video.
- **Git bloat.** Videos committed as plain blobs.

## Decisions (Marcel's)

| Topic | Decision |
|-------|----------|
| Audience | Both: reviewers/teammates (quick) and outside audiences (polished) |
| What to show | Claude writes a storyboard from the plan and diff. The user approves it in polished mode. Quick mode records it straight away |
| Sound | Captions only, no voiceover in v1 |
| Output location | `docs/demo-videos/YYYY-MM-DD-<feature>/` in the project repo, videos tracked with **Git LFS** |
| Slow calls | Sped up, not cut: the spinner stays visible at high speed with a ⏩ marker |
| Approach | B: explore with Playwright MCP, then generate and run a Playwright script |
| Where it lives | A new `demo-video` plugin in this repo (Claude's proposal, not objected to) |
| Platform | Linux first, headless included (remote agent machines). macOS gets install hints in preflight |
| Splitting | One MP4 per chapter, each with its own title card, plus one combined MP4 |

### Claude's calls (not discussed; correct if wrong)

| Topic | Call | Why |
|-------|------|-----|
| Auth | Login happens before recording: either the app's own login (a pre-recording step list that is not filmed) or a `storageState` file | Covers both apps that log in silently and apps behind a login form, without filming credentials |
| Checking results | Each step checks that its result appeared. When the storyboard lists expected values for a step, a mismatch fails the run and no video is produced | A misclassified fallback is the "broken run" this design rules out. The cost is that a re-record can fail on model variance, and then you simply run it again |
| Playwright location | `record.mjs` resolves a global Playwright install, which preflight checks. The target repo gets no `package.json` | The target can be any stack (.NET, Python...). Adding Node tooling to it would widen the project's footprint |

## Approaches considered

- **A. Claude drives the browser live through Playwright MCP while the MCP server records.** Rejected. Claude's pauses between steps land in the video, vary from run to run and can't be told apart from real waits, so speed-ups and caption timing become guesswork. Every re-record needs a Claude session.
- **B. Explore with the MCP tools, then generate and run a Playwright script.** **Chosen.** The script logs a timestamp per step and per wait, so captions and speed-ups are exact. The committed script re-records in one command. Trade-off: more for the skill to generate, and the script can break after big UI changes. That's acceptable: the skill regenerates it.
- **C. A desktop screen recorder (ffmpeg/OBS) while Claude drives.** Rejected. It has A's dead-air problem, depends on the platform and needs a real display, which doesn't work in headless remote sessions. Its one advantage, capturing non-browser windows, is outside the scope: the skill records web apps.

## How it works

### 1. Preflight

Check before any work, and stop with install instructions if anything required is missing. Linux is the primary target, headless included, and preflight gives macOS install hints where they differ:
- Node with a globally installed `playwright` package resolvable, and a Chromium it can launch.
- `ffmpeg` and `ffprobe` on PATH, needed for both modes.
- `git lfs` installed, and LFS initialised in the repo.
- The app URL is reachable.

### 2. Storyboard

Claude reads the feature's plan, spec and diff, plus any demo script the project already has. It writes `storyboard.md` in the output folder:
- A title and an end-card line.
- A numbered list of steps. Each step has one browser action (navigate, click, fill or paste, switch tab, wait for a result, scroll to) and a caption line written in the storyboard's language.
- Each step that waits on a slow call marks that wait explicitly ("wait for the search results").
- A step can list expected values to check (see Claude's calls).
- Steps can be grouped into **chapters**. Each chapter becomes its own MP4 with its own title card. A storyboard without chapters is a single chapter.

In polished mode the user approves or edits the storyboard before anything runs. In quick mode Claude proceeds and shows the storyboard alongside the result.

### 3. Explore

Claude walks the storyboard live with the Playwright MCP tools (the same `.mcp.json` setup as `regression-test`). It confirms every step works on the real app, and it finds stable locators: role and name first, test ids next, CSS last. It also notes how each "wait for result" can be detected, for example which element appears. A step that cannot be made to work stops the skill, and Claude reports it. It never records around a failure.

### 4. Generate the script

Claude writes `record.mjs` in the output folder from a template that ships with the skill. The template owns the mechanics, and the generated part is only the step list:
- It launches Chromium with `recordVideo` at a fixed size (default 1920×1080), one browser context, and any extra tabs opened in that same context.
- A visible cursor overlay is injected, because headless recordings show no mouse pointer. Movement and typing are slowed to a human pace. Pasting fills the field in one go, the way a real paste looks.
- After each step there's a reading pause, longer after a result appears.
- It writes `timeline.json`: start and end times for each step and each marked wait, measured from the start of the video.
- Every step asserts its expected state. Any failed step exits non-zero, and no final video is produced.
- Login state comes from a `storageState` file prepared before recording. That file is gitignored and never committed.

Multi-tab recording: Playwright writes one video file per page. The template records the storyboard's tab switches in `timeline.json`, and post-processing cuts between the pages' videos at those times, so the result is one continuous video that follows the active tab.

### 5. Post-process (ffmpeg)

A post-process script that ships with the skill reads `timeline.json` and the raw page videos, then:
- concatenates the active-tab segments;
- speeds up each marked wait (default 10×, with a minimum on-screen time of about 1 s) and overlays a ⏩ marker during it;
- in polished mode, burns in each step's caption for that step's duration, and adds a title card and an end card. Captions can be switched off, so a fallback video the presenter talks over can carry only the cards;
- encodes an H.264 MP4 that plays anywhere (`-movflags +faststart`, yuv420p);
- in quick mode, also makes a GIF (lower frame rate, scaled to 1280 wide) for embedding in a PR.

### 6. Output and git

```text
docs/demo-videos/YYYY-MM-DD-<feature>/
  storyboard.md      # committed
  record.mjs         # committed: one-command re-record
  timeline.json      # committed (small; reproduces the post-processing)
  demo.mp4           # Git LFS
  demo.gif           # Git LFS, quick mode only
  raw/               # gitignored: Playwright's per-page videos
  .auth/             # gitignored: storageState
```

On first use in a repo, the skill adds `docs/demo-videos/**/*.mp4` and `*.gif` to `.gitattributes` as LFS-tracked, and `raw/` and `.auth/` to `.gitignore`. It shows the user these changes and does not commit them on its own.

Re-record later: `node docs/demo-videos/<folder>/record.mjs` re-runs the steps and the post-processing in one go.

### 7. Verify before announcing

In the style of `regression-test`'s hard gate, before the skill says the video is done:
- `ffprobe` confirms the MP4 exists, its duration is plausible against `timeline.json`, and it has the expected resolution.
- Claude extracts a frame from the middle of each step and looks at it: the right page is showing, no error state, no secret visible, the caption is legible.
- Only then does it report the file path, the duration and the storyboard.

## The plugin

```text
plugins/demo-video/
  .claude-plugin/plugin.json
  .mcp.json                       # playwright MCP, same as regression-test
  skills/demo-video/
    SKILL.md                      # trigger, modes, procedure, hard gate
    references/storyboard.md      # storyboard format with an example
    templates/record.template.mjs # recording mechanics; the step list is filled in
    scripts/postprocess.mjs       # timeline + raw videos → MP4/GIF via ffmpeg
    scripts/*.test.mjs            # unit tests for timeline math and the ffmpeg filter graph
```

Triggers: "record a demo", "make a demo video", "record the feature", "fallback recording", "screen recording of the app", and the end of a finished feature when the user asks for a video. It does not fire on its own after every feature.

The plugin is registered everywhere `npm run check:registries` checks, as `anti-slop` was: the marketplace (plus release-please `extra-files` for the new `plugins[14]` entry), the cursor/codex/gemini manifests, the opencode plugin, the session-start hook, the commitlint scope-enum, the INSTALL docs and the README (skill list, count "fourteen" → "fifteen", and a section of its own).

## Testing

- Unit tests (`node --test`, like `anti-slop`'s `scan.test.mjs`) for the pure parts: timeline → segment list, speed-up math with the minimum on-screen time, tab-switch cutting, and generation of the ffmpeg filter graph.
- One integration test against a small local fixture page served by the test. It covers a click, a delayed "slow call" and a second tab, runs the template end to end, and checks the MP4 with `ffprobe`. It is skipped with a clear message when ffmpeg or Chromium are missing.
- Skill behaviour is checked the way `anti-slop` was: a baseline and a green eval run in `docs/superpowers/evals/`.
- Acceptance: the first-use recording below, approved by Marcel.

## First use: incident-triage-demo (acceptance)

The skill's first real use, and its acceptance test. Nothing in this section is built into the skill; it is input to the storyboard.

- **What:** the fallback recording for the live demo at the kick-off on Monday 2 November 2026, 09:00 (the triage repo's roadmap, Phase 4.3). If the connection drops on stage, Marcel plays it and talks over it.
- **Storyboard:** three chapters, one per report in the triage repo's `docs/demo-meldingen.md` (normal, PII, injection), written in Dutch, so the captions are Dutch. The expected values listed there are the step checks.
- **Tabs:** the triage app and the AI.Sentinel dashboard. The Aspire Traces page is left out (Claude's call, Marcel had no preference), which keeps the Aspire login token out of every frame.
- **Auth:** the app's own silent login, before recording.
- **Where:** on the remote Linux agents machine, headless, with the AppHost and real services running there. ffmpeg and git-lfs get installed there.
- **Delivery (Marcel's call):** the whole skill is released through release-please before Monday: both modes, evals, registries and README. The triage recording is the last task.

## Left to the builder

- The exact human-pace timings (cursor speed, pause lengths) and the caption styling (font, size, position, background box), within "legible on a projector".
- The cursor overlay implementation.
- How the "wait for result" condition is expressed in the generated step list.
- Default speed-up factor and minimum, within roughly 8–12× and about 1 s.
- Whether `postprocess.mjs` is called from `record.mjs` or the other way around, as long as one command re-records.
