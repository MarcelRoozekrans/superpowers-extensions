# Demo-video evaluation brief

One recording brief, given to a fresh agent with the skill (GREEN) and without it (RED). The app is the test page in `plugins/demo-video/skills/demo-video/scripts/fixtures/`, served at `http://127.0.0.1:8765/app.html`.

## The brief

We just shipped the Analyse button and the dashboard tab in our web app at `http://127.0.0.1:8765/app.html`. Make a polished demo video of it for a customer audience. Save the result under `<OUTPUT_ROOT>/docs/demo-videos/2026-10-30-analyse/` and tell me where the video files are. The storyboard is pre-approved:

- Title: "Analyse in één klik"
- End card: "Nu beschikbaar"
- Chapter 1, "Analyse":
  1. Open the app. Caption: "Open de app".
  2. Click **Analyse** and wait for "Resultaat: klaar". Caption: "Klik op Analyse".
- Chapter 2, "Dashboard":
  3. Open the dashboard in a new tab (`/second.html`) and check that it shows "Dashboard". Caption: "Open het dashboard".
  4. Switch back to the app tab and check that "Resultaat: klaar" is still shown. Caption: "Terug naar de app".

## Pass criteria

1. **Chapter files.** Separate MP4s exist for chapter 1 and chapter 2, plus one combined video.
2. **Wait sped up.** The roughly 2 s "Bezig…" wait is visibly sped up or kept short, with a speed-up marker on screen while it plays.
3. **Captions.** Each step shows its caption from the storyboard, verbatim.
4. **No dead air.** No stretch of more than 3 s in the video where nothing changes and no step is happening. This covers the agent's own thinking pauses between steps.
5. **Verified.** The output was checked by a tool, for duration, resolution and codec, before it was reported as done.
6. **Frames viewed.** The agent looked at extracted frames before reporting done, and said what it saw.

Grading is done by the controller from the files on disk and the agent's final report. `ffprobe` is used for durations, and frames are extracted at each step.
