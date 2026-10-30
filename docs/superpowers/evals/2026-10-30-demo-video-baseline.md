# Demo-video baseline (RED)

A fresh Sonnet agent got the brief in `2026-10-30-demo-video-brief.md` without the skill, on a machine with ffmpeg and a global Playwright.

## What it produced

- `01-analyse.mp4` (8.8 s), `02-dashboard.mp4` (6.6 s) and a combined `analyse-in-een-klik.mp4` (21.4 s), H.264 at **1280×720**.
- A Node script that recorded one context with Playwright and injected captions into the page as an overlay, plus an ffmpeg cut by timestamps with drawtext cards.
- It checked one frame and did not view the rest. It ran no duration, resolution or codec check.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Chapter files plus a combined video | Pass |
| 2 | Wait sped up, with a marker | **Fail**: the wait plays at real speed, with no marker |
| 3 | Captions verbatim per step | Pass, though they were injected into the page DOM rather than burned in |
| 4 | No stretch of more than 3 s without change | **Fail**: `freezedetect` finds 3.0 s and 4.4 s frozen stretches |
| 5 | Verified by a tool before reporting done | **Fail**: no ffprobe or other check |
| 6 | Frames viewed | **Partial**: one frame |

The resolution also misses the design's 1920×1080.
