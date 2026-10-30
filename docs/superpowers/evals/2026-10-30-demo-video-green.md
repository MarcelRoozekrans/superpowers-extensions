# Demo-video GREEN results

A fresh Sonnet agent got the same brief plus "read and follow `plugins/demo-video/skills/demo-video/SKILL.md`". Three rounds ran. Each round found real defects, which were fixed in the skill source, never in the agent's copy.

## Round 1, on `50a34dc`

- **Result:** verify passed only after the agent patched its copy of `lib/runtime.mjs`.
- **Defect 1:** a step that opens or switches a tab was attributed to the tab that was active before the step. Its segment came from the wrong video.
- **Defect 2:** Playwright MCP could not launch Chromium because of a browser revision mismatch.
- **Fixes:**
  - `08e86c1`: a step's page is the active page after `run`, and `start` is retaken after a tab change.
  - `c8b6bd2`: SKILL.md tells the agent to explore with a throwaway script on the global Playwright when MCP cannot launch.

## Round 2, on `c8b6bd2`

- **Result:** verify passed with no patching.
- **Defect 1:** the new-tab step recorded a fully white segment. Headless screencast only emits frames on a repaint.
- **Defect 2:** `verify` did not flag the blank frame.
- **Defect 3:** the cursor dot sat clipped in the top-left corner before the first move.
- **Fixes:**
  - `bb358bf` and `d341044`: `openTab` waits for load and forces a paint. `switchTab` brings its tab to the front.
  - `e0f9346`: `verify` flags uniform step frames.
  - `6ed6a73`: the cursor is hidden until the first real move.

## Round 3, on `6ed6a73`

The agent followed the skill with no workarounds in `record.mjs`. Graded independently with ffprobe, freezedetect and `verify`:

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Chapter files plus a combined video | Pass: `01-analyse.mp4` 8.0 s, `02-dashboard.mp4` 4.9 s, `demo.mp4` 17.9 s, H.264 1920×1080 |
| 2 | Wait sped up, with a marker | Pass: `▶▶ 10×` shown during the wait |
| 3 | Captions verbatim per step | Pass: all four, burned in |
| 4 | No stretch of more than 3 s without change | Pass. The one 3.6 s still stretch is the deliberate reading pause on step 2's result, inside a step. The chapter files have none |
| 5 | Verified by a tool | Pass: `verify` exits 0 |
| 6 | Frames viewed | Pass: all four step frames, described |

Friction the agent reported, carried to the final review:

- The throwaway explore script needed a way to resolve the global Playwright, and the skill does not show one.
- The template needed `baseUrl` and the other fields filled in by hand.

## Trigger check

With `claude -p --plugin-dir plugins/demo-video --model sonnet`:

- "record a demo video of the new export page" invoked `demo-video:demo-video`;
- "what is a webm file?" invoked no skill.
