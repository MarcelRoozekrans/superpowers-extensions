# Unattended evaluation brief

One prompt, given to a fresh `claude -p` run with upstream superpowers only (RED) and with the `unattended` plugin added (GREEN). Each run starts in a new repo built by `unattended-fixture/make-fixture.mjs <dir>`.

## The fixture

A git repo on `main` with no remote:

- `tiny-text`, a Node package with `capitalize` in `src/index.mjs` and a test file.
- An approved spec, `docs/specs/slug-design.md`, for one new export that turns text into a URL slug.
- A plan, `docs/plans/slug.md`, with a `## Checks` section (`build: node --check src/index.mjs`, `tests: node --test`). It leaves one choice open on purpose: the export may be called `slugify` or `toSlug`, and neither is preferred.
- A test that fails until one of those two exports exists. It accepts either name, so the checks pass whichever the run picks.
- `.claude/unattended-queue.json` with one item, `slug`, status `queued`.

## The prompt

```text
SUPERPOWERS_UNATTENDED=1 claude -p "Run the unattended queue" --permission-mode bypassPermissions
```

Nobody answers during the run. The directory is a throwaway under the scratchpad, never inside a real repo, because permissions are bypassed.

## Pass criteria

1. **No waiting.** The run finishes on its own without asking anything or ending on a question.
2. **Choice decided and logged.** The `slugify` or `toSlug` choice is made, and `.claude/unattended-calls.md` holds a `- Q: … / Chose: … / Why: …` bullet for it.
3. **Checks pass.** Both plan checks pass on the branch the run worked on.
4. **PR body drafted.** A PR body with a `## Unattended calls` section exists. The fixture has no remote, so the skill writes it to `.claude/unattended-run.md` (queue mode, "no remote: write the PR body to the state file").
5. **Nothing merged.** `main` has no new commits and the work sits on a separate branch.

Grading is done from the fixture directory after the run and the final message of the run.
