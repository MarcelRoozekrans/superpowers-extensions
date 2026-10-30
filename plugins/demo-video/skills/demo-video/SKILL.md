---
name: demo-video
description: Use when the user asks to "record a demo", "make a demo video", "record the feature", "make a fallback recording", or "make a screen recording of the app" for a finished web feature. Writes a storyboard from the plan and diff, records a real headless Chromium walking it on the running app, and builds chapter MP4s (plus a GIF in quick mode) with ffmpeg. Skip for non-web apps, terminal or desktop recordings, and do not run unasked after every finished feature.
---

# Demo Video Skill

Turns a finished web feature into a recorded browser walkthrough. A storyboard is explored live, turned into `record.mjs`, and recorded at human pace on the real app. Slow waits are sped up, never cut, and the output is checked frame by frame before it is called done.

<HARD-GATE>
Do not tell the user the video is done until both of these hold:

1. `node <folder>/lib/verify.mjs <folder>` exits 0. It checks codec, size and duration of every MP4 and writes one frame per step to `<folder>/frames/`.
2. You have **viewed every frame in `frames/`** with the Read tool and checked each one for: the wrong page, an error state, a visible secret (key, token, real personal data) and an unreadable caption.

Saying "the recording succeeded" without running `verify` and reading the frames gives the user a false pass. If `verify` fails, or a frame shows a problem, return to the step that caused it, fix it and record again. Never report around it.
</HARD-GATE>

## Modes

Ask which mode if the request does not say. Both modes are unmistakable:

| | **quick** | **polished** |
|-|-----------|--------------|
| For | a PR or chat, reviewers and teammates | a launch, a talk or a fallback recording |
| Storyboard approval | none: record straight away and show the storyboard with the result | **required before anything runs** |
| Captions, title and end card | none | yes; to switch captions off, set `captions: false` in `record.mjs`, or re-encode with `node <folder>/lib/postprocess.mjs <folder> --no-captions` |
| Output | `demo.mp4` and `demo.gif` | one MP4 per chapter, plus a combined `demo.mp4` when there are several chapters |

**Polished mode approval gate:** write `storyboard.md`, show it to the user and stop. Explore, scaffold and record only after the user approves or edits it. A silent "looks fine" from yourself is not approval.

## Procedure

Paths below are relative to this skill's directory. The output folder is `docs/demo-videos/YYYY-MM-DD-<feature>/` in the user's repo, and `<folder>` stands for it.

1. **Pick the mode.** See Modes.
2. **Preflight.** Run `node scripts/preflight.mjs <app-url>`. It checks Node 20 or newer, a global `playwright` with a launchable Chromium, `ffmpeg`, `ffprobe`, `git lfs` and that the URL answers. On any `FAIL`, show the install hint and stop.
3. **Write `storyboard.md`** in `<folder>` from the feature's plan, spec and diff, plus any demo script the project already has. Follow [references/storyboard.md](references/storyboard.md) for the format. Mark every slow call with **Wait for**. Use invented demo data only.
4. **Polished mode: wait for approval.** See the gate above. Quick mode skips this step.
5. **Explore every step live** with the Playwright MCP tools, on the real app. If the Playwright MCP tools are missing or cannot launch a browser, explore the steps with a short throwaway script that uses the global Playwright, the same one `record.mjs` uses, and delete it afterwards. Confirm each step works and pick stable locators: role and name first, then test id, then CSS. Note which element shows that each slow call has finished. If a step cannot be made to work, stop and report it. **Never record around a failing step.**
6. **Scaffold.** Run `node scripts/scaffold.mjs <repoRoot> <folder>`. It copies `lib/` and a `record.mjs` template into the folder and adds the Git LFS and ignore rules to `.gitattributes` and `.gitignore`.
7. **Fill in `record.mjs`.** Set `baseUrl`, `mode`, `title` and `endCard`; set `captions: false` in the `record({...})` call for cards without captions. Then turn the storyboard into `chapters`; the mapping is in [references/storyboard.md](references/storyboard.md). Put login in `setup` or a `storageState` file, never in a step.
8. **Record.** Run `node <folder>/record.mjs`. It records, writes `timeline.json` and post-processes in one command. A failed step exits non-zero and produces no video.
9. **Verify.** Run `node <folder>/lib/verify.mjs <folder>`, then do the frame review from the gate.
10. **Report** the paths of the videos, their durations, the storyboard, and the re-record command `node <folder>/record.mjs`. Show the `.gitattributes` and `.gitignore` diff.

**Never commit.** Not the videos, not the folder, not the `.gitattributes` and `.gitignore` changes. The user reviews the diff and commits.

To switch captions off or on after a fix without recording again, `node <folder>/lib/postprocess.mjs <folder> [--no-captions]` re-encodes from the existing raw videos without recording again.

## Rules

- **Never record around a failing step.** A step that errors, a missing element or a wrong value stops the run. Fix the cause, or report it.
- **Demo data must be invented.** No real keys, tokens, names or addresses, in the app or on screen.
- **Login goes in `setup`**, or in a `storageState` file kept in the gitignored `.auth/`. Never film credentials.
- **Mark every slow call with Wait for.** Unmarked slow calls become dead air.
- **Nothing is mocked.** The video shows the real app on its real services.
- **Quick mode skips approval and captions.** It never skips preflight, exploring or the verify gate.
- **Chapters:** a storyboard with several `##` chapters yields one MP4 per chapter and a combined `demo.mp4`.

## Reference Index

| File | Contents |
|------|----------|
| [references/storyboard.md](references/storyboard.md) | The storyboard format, an example, and the mapping from each line to `record.mjs` and the `h.*` helpers |
| `scripts/preflight.mjs` | Machine and app checks |
| `scripts/scaffold.mjs` | Output folder setup and git rules |
| `templates/record.template.mjs` | The `record.mjs` skeleton |
| `lib/` | Runtime, post-processing and verify, copied into each output folder |
