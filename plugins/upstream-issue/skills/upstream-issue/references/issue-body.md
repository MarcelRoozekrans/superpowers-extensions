# Issue body

Used in phase 7. Use upstream's own issue template when it has one, under `.github/ISSUE_TEMPLATE` or the equivalent for other trackers. Fill every field of it and drop none. When upstream has no template, use the sections below.

Write plain facts. Run `anti-slop` over the prose, and the privacy scan over the draft and every repro file, before the user sees it.

## New issue

1. **Summary.** One or two sentences: what fails, in which component.
2. **Versions and environment.** The upstream version, which must be the latest release or the default branch commit, the runtime version and the OS. Name the version you first saw it on if it differs.
3. **Repro.** The code and the run command inline when it fits the threshold in `repro-shapes.md`, otherwise a link to the repro repo. Say that it was run from an empty directory.
4. **Expected.** What should happen, with a link to the docs when they say so.
5. **Actual.** The exact output, in a code block. Do not paraphrase errors.
6. **What was checked.** The latest release or commit tested. The searches run, with links, and the result. Related issues or pull requests that are close but not the same, and why they differ.
7. **Suspected cause.** Optional. Only with evidence, such as a file and line in upstream source. Mark it as suspected. Leave it out otherwise.

Use documentation values for anything that looks like a host, address or id. No home paths, usernames, device names or tokens.

## Comment on an existing issue

Post a comment only when it adds something the thread lacks. Typical cases are a repro the issue does not have, or newly affected versions. A comment that only agrees is not posted; give the user the link and stop.

A comment goes through the same repro, gates, anti-slop, privacy scan and approval as a new issue.

Shape:

1. **What this adds.** One sentence, for example "A standalone repro and a second affected version."
2. **Versions.** What was tested, including the latest release.
3. **Repro.** Inline or linked, with the run command.
4. **Actual.** The exact output.

Do not restate the thread. No thanks, no "+1".
