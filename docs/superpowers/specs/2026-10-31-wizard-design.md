# Wizard Skill — Design

Date: 2026-10-31
Status: draft

## Intent

Some setup steps only a person can do: clicking through a third-party dashboard, copying an API key, filling `.env`, setting a `gh secret`, running a one-off migration. Explaining those steps again in every session is slow, and a wall of instructions in chat is easy to get wrong.

`wizard` is a new plugin that ports Matt Pocock's MIT-licensed `wizard` skill ([mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/engineering/wizard), commit `a496f5513d4a4cf889bc48e189e579f4b0bdf6aa`). Claude scopes the manual procedure from the repo and writes a bash script. The person runs the script. It opens each URL, says what to click and copy, reads values back (secrets hidden), writes them to `.env` and GitHub, shows `Stage n/N` progress, asks before irreversible actions and ends with a summary.

## Goals

- Keep upstream's behaviour: scope → map each stage's journey → author from the template → verify and hand off.
- Two changes from upstream:
  1. Every point where upstream asks the user goes through AskUserQuestion with labelled options and one marked "(Recommended)".
  2. Text that gets published goes through `anti-slop` (see [Anti-slop scope](#anti-slop-scope)).
- Turn upstream's step-4 checklist into one deterministic command, `scripts/check.mjs`, with tests.
- Credit Matt Pocock under MIT: a `NOTICE.md` with the licence text, plus a README line.

## Non-goals

- Running the wizard end to end from Claude. It opens browsers and blocks on human input; upstream rules this out and so does this port.
- Changing the template's library. It is vendored byte for byte.
- Tracking upstream automatically. `NOTICE.md` records the upstream commit, so a manual re-vendor can be diffed. No CI watch.
- Native Windows. The script is bash; WSL works through `open_url`'s `wslview`/`explorer.exe` branch.
- Upstream's `agents/openai.yaml`. It is Codex UI metadata this suite does not use.

## Anti-goals

- **Invented steps.** A stage that tells the person to click a menu that does not exist is worse than no wizard. Unknown UI is asked about or looked up, never guessed (upstream rule, kept).
- **Leaked secrets.** A secret value read with visible input, echoed, or written somewhere other than the target named in scoping.
- **A drifted library.** A wizard whose library differs from the template loses the consistency upstream relies on.
- **A secret name CI never reads.** `set_secret FOO` while the workflow reads `secrets.FOO_KEY` gives a green wizard and a broken pipeline.

## Decisions (user's)

| Topic | Decision |
|-------|----------|
| Source | Port of upstream `SKILL.md` and `template.sh`, MIT, credited |
| Asking | AskUserQuestion with a recommended option, at every upstream ask point |
| Anti-slop scope | Always: commit message, PR title and body, README link. Also the on-screen prose of a wizard that gets committed. Throwaway wizards skip it. |
| Approach | B: port plus a check script |
| Flow | brainstorming → spec → plan → implement on a new branch → PR. No pushes to `master`. |

## Approaches considered

- **A. Straight port.** Adapted `SKILL.md`, vendored template, `NOTICE.md`. Verification stays a manual checklist, as upstream. Smallest change, but every check depends on Claude remembering it.
- **B. Port plus a check script.** Chosen. Same as A, plus `scripts/check.mjs` that runs upstream's step-4 checks as one pass/fail command, with `node --test` tests in the suite's existing pattern (demo-video, anti-slop).
- **C. Fetch the template from upstream at run time.** Rejected. It needs network access, and an upstream change could break the skill unseen.

## Shape

```text
plugins/wizard/
  .claude-plugin/plugin.json
  skills/wizard/
    SKILL.md              # adapted from upstream
    NOTICE.md             # attribution, upstream commit, MIT licence text
    template.sh           # upstream template.sh, byte for byte
    scripts/
      check.mjs           # verify a generated wizard
      check.test.mjs
      fixtures/           # sample wizards and a sample repo with workflows
```

Registered in every place `npm run check:registries` checks: marketplace (with a matching `release-please-config.json` extra-files entry, `plugins[15]`), `package.json` install script, cursor/codex/gemini manifests, `hooks/session-start`, the opencode plugin, `GEMINI.md`, `.codex/INSTALL.md` and `.copilot-cli/INSTALL.md` where the others are listed, and the commitlint `scope-enum`. README: a skill-list entry, the count "fifteen" → "sixteen", a short section, and the credit line.

### SKILL.md

Follows upstream's four steps and its "Done when" bars. Changes:

- **Frontmatter description** in the suite's "Use when…" form: provisioning, credentials or CI secrets, a third-party dashboard walk-through, a one-off migration or cutover. Skip for steps Claude can do itself.
- **Ask points as AskUserQuestion** (the question names the stages or values it is about, so it stands alone):
  1. *Stage list* (step 1): "Use these N stages (Recommended)" / "Add or change stages" / "Drop stages".
  2. *Unknown UI or command* (step 2): "Check the provider's docs (Recommended)" / "I'll describe the path".
  3. *Where a value goes*, when the repo does not settle it: `.env` only / GitHub secret / both / nowhere, with the recommendation taken from what CI reads.
  4. *Keep or throw away* (step 4): commit under `scripts/` and link from the README, or save to the scratchpad and delete after the run. Recommended: commit when the procedure is a repeatable setup path (onboarding, new environment); throwaway for a one-off migration or cutover.
- **Verify** (step 4) runs `node <skill dir>/scripts/check.mjs <wizard> --repo <repo root>` and fixes every failure before hand-off. The static trace upstream describes stays for what the script cannot see (each value lands where scoping said).
- **Anti-slop** is invoked on the commit message, PR text and README link, and, for a committed wizard, on the strings passed to `banner`, `stage`, `say`, `step`, `note`, `warn`, `pause` and `confirm`. Anti-slop's own guardrails apply: URLs, key names, menu labels and commands stay exact.
- Library rule kept: never hand-edit above the `STAGES` marker.

### check.mjs

`node check.mjs <wizard.sh> [--repo <dir>]`. Prints one line per check (`ok`, `FAIL` or `skip` with reason) and exits non-zero on any failure.

| Check | Fails when |
|-------|-----------|
| Syntax | `bash -n` fails |
| Shellcheck | `shellcheck` is installed and reports a finding; `skip` when it is not installed |
| Library intact | the text above the `STAGES` marker differs from the vendored `template.sh` |
| Stage count | `TOTAL_STAGES=` differs from the number of `stage` calls inside `run_wizard` |
| Example removed | the template's example stage (`Stripe: API keys` banner/stage) is still present |
| Secret names | a `set_secret NAME` has no `secrets.NAME` in `<repo>/.github/workflows/*.yml|yaml`; `skip` when there is no workflows directory |
| Executable | the file is not executable |

It also prints, as a warning that does not fail, every `secrets.*` in the workflows (except `GITHUB_TOKEN`) that the wizard never sets. A workflow may read secrets set some other way, so this is a prompt to look, not a failure.

### Tests

`check.test.mjs` runs under the existing `npm test` glob:

- The vendored `template.sh` matches the SHA-256 recorded in `NOTICE.md`, so an accidental edit fails CI.
- `check.mjs` on a good fixture passes; on fixtures with a stage-count mismatch, an edited library, a leftover example stage, an unknown secret name and a syntax error, it fails with the matching line.
- A fixture wizard runs with piped stdin and `ENV_FILE` in a temp directory, with `gh` absent from `PATH`. The test asserts the `.env` content and mode 0600, that a re-run keeps an existing value on Enter, and that the summary lists the skipped secret. This guards the library on a future re-vendor.

### Evaluation

RED/GREEN in `docs/superpowers/evals/`, as for demo-video and anti-slop: a brief, a baseline without the skill and a run with it. The brief points a fresh agent at a fixture repo with a `.env.example` and a workflow reading two secrets, and asks for a setup wizard. Pass criteria include: secrets read with hidden input, every `set_secret` name matching the workflow, a stage count that matches, library intact, a stage list confirmed with the user before writing, and no invented dashboard paths. The builder settles the exact fixture and criteria.

## Claude's calls

Not discussed with the user; open to correction:

- The four ask points and their recommended options, including "commit when the setup is repeatable, throw away a one-off".
- `check.mjs` also fails on a leftover example stage and on a non-executable file.
- Workflow secrets the wizard never sets are a warning, not a failure.
- The template's SHA-256 lives in `NOTICE.md` and a test pins it.
- No CI watch on upstream; a manual re-vendor is diffed against the recorded commit.

## Left to the builder

- Wording of `SKILL.md` and the README section (run through anti-slop).
- Exact fixture contents and test file layout.
- How `check.mjs` finds `stage` calls (a line-anchored regex inside `run_wizard` is enough; no bash parser).
- Plugin keywords and description wording.
