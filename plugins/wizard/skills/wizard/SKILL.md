---
name: wizard
description: Use when a person has to do setup steps that Claude cannot do itself, such as provisioning infrastructure, getting API keys or credentials, setting CI secrets or variables, clicking through a third-party dashboard, or running a one-off migration or cutover. Triggers on "make a setup wizard", "walk me through setting up", "script the onboarding steps", "I need to fill .env and the GitHub secrets". Writes an interactive bash script from a shared template and checks it. Skip for steps Claude can run itself.
---

# Wizard

A **wizard** is a bash script that walks a person through a manual procedure, one stage at a time. It opens each URL, says what to click and copy, reads the values back, writes them where they belong (`.env`, GitHub secrets and variables), asks before irreversible actions and shows how many stages are left. It can configure third-party services, run a one-off migration or move a project from one state to another.

The UX lives in [template.sh](template.sh): stage progress, confirmation gates, URL opening on Linux, macOS and WSL, hidden secret entry, idempotent `.env` upserts, `gh secret` and `gh variable` writes, and a closing summary. **Claude's job is to scope the procedure and write its stages.** The library above the `STAGES` marker is the same in every wizard. Never edit it; `scripts/check.mjs` fails a wizard whose library differs from the template.

A wizard is throwaway by default: written for one run and deleted after. Commit it only when it is a setup path people will run again.

Adapted from Matt Pocock's `wizard` skill (MIT). See [NOTICE.md](NOTICE.md).

## Asking the user

Every question in this skill goes through AskUserQuestion, with labelled options and one marked "(Recommended)". Never ask "A or B?" as a sentence in chat. Name the stages or values the question is about, so it reads on its own in the dialog.

## Process

### 1. Scope the procedure

Find every manual step and every value captured along the way. Read the repo before asking anything:

- For setup: `.env`, `.env.example`, `.env.*`, `README`, `docker-compose*`, framework config and `.github/workflows/*`. Every `secrets.*` or `vars.*` reference is a value the wizard has to produce.
- For a migration or cutover: the current state, the target state and the irreversible actions between them.

Then put the ordered stage list, with the values each stage produces, to the user:

- **Stage list.** Options: "Use these N stages (Recommended)", "Add or change stages", "Drop stages".
- **Where a value goes.** Options: `.env` only, GitHub secret, both, nowhere. Start from who runs the wizard. A GitHub secret is shared by the whole repo, so a wizard that every new developer runs must not write their personal values (a dev database, a personal API key) over the secrets the deploy uses. Recommend `.env` only for per-developer setup. Recommend a GitHub secret only when the person running the wizard owns CI, such as when they set up a new repo or environment, and then put `set_secret` behind a `confirm`. Ask this even when a workflow reads the value: the workflow says which name CI needs, not who should set it.

**Done when:** every stage is named in order, and for each captured value you know (a) where the person gets it, (b) where it is written (`.env`, a GitHub secret, both or nowhere; some stages are pure actions) and (c) whether it is secret (hidden entry) or public.

### 2. Map each stage's journey

For each stage, write the exact path a person follows: which URL to open, what to do there, where the value is shown and which variable it fills. For example: "Dashboard → Developers → API keys → Reveal test key → copy".

When you do not know the current UI or the exact command, do not guess. A step that sends someone to a menu that does not exist is worse than no wizard. Ask:

- **Unknown UI or command.** Options: "Check the provider's docs (Recommended)", "I'll describe the path". With the first, fetch the docs page and cite it in a `note` line in the stage. When the docs cannot be fetched, the stage says so to the person running it, with a `warn` line such as `warn "Menu names unverified; if they differ, follow <docs URL>"`, and your hand-off says the same.

**Done when:** every stage traces to instructions a stranger could follow.

### 3. Write the wizard

Copy [template.sh](template.sh) to the target path. Replace the example stage with one `stage` per step, in dependency order. Use the library helpers: `stage`, `say`, `step`, `note`, `warn`, `open_url`, `ask`, `ask_secret`, `write_env`, `set_secret`, `set_var`, `pause`, `confirm`. Set `TOTAL_STAGES` to the number of stages.

The bar the template sets:

- Open the URL before asking for its value.
- Use `ask_secret` for anything secret.
- `write_env` every value that must persist.
- `set_secret` only the values CI reads, under the exact name the workflow uses, and only in a wizard run by whoever owns CI.
- `confirm` before any irreversible action.
- Keep a stage to one task. Each `stage` clears the screen, so what the person needs must fit on it.

### 4. Verify and hand off

Run the check script:

```bash
node <this skill's directory>/scripts/check.mjs <wizard.sh> --repo <repo root>
```

It checks syntax (`bash -n`), shellcheck on the stages section when shellcheck is installed, the library against the template, `TOTAL_STAGES` against the `stage` calls, that the example stage is gone, that every `set_secret` name is read by a workflow, and the executable bit (`chmod +x`). Fix every `FAIL` and run it again. Read each `warn`: a secret a workflow reads but the wizard does not set is either missing from the wizard or set some other way, for example by the CI owner. Say which.

The script cannot see where each value lands. Trace that yourself: every value from step 1 is captured and written where step 1 said.

Don't run the wizard end to end. It opens browsers and waits for a person.

Then ask:

- **Keep or throw away.** Options: "Commit under `scripts/` and link it from the README", "Save to the scratchpad and delete after the run". Recommend committing when the procedure is a setup path that will run again (onboarding, a new environment), and throwing it away for a one-off migration or cutover.

Tell the user how to run it.

## Anti-slop

Run `anti-slop` on every text that gets published:

- the commit message, PR title and body, and the README line that links the wizard;
- for a committed wizard, the strings passed to `banner`, `stage`, `say`, `step`, `note`, `warn`, `pause` and `confirm`.

URLs, menu labels, key names and commands stay exactly as the provider writes them. A throwaway wizard skips this step.
