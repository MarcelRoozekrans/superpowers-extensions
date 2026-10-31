# Upstream-Issue Skill — Design

Date: 2026-10-31
Status: draft

## Intent

When something breaks in a project the user does not own (a library, a CLI tool, a plugin, an integration), Claude is quick to blame upstream and quick to draft an issue. The result is often wrong: the bug was in the user's own setup, already fixed in a newer release, already reported, or not reproducible by the maintainer. Each of those wastes a maintainer's time and leaves a permanent public record under the user's name.

`upstream-issue` is a new plugin with a skill that makes sure there is a real upstream bug, builds a minimal repro that has actually been run and fails, and only then drafts the issue for the user to approve.

## Goals

- Prove the problem is upstream, not in the user's code or config, before anything is drafted.
- Prove it still happens on the latest upstream release or default branch.
- Find an existing report (open or closed issue, PR, discussion) and prefer commenting on it over opening a duplicate.
- Work out a minimal, standalone repro for any ecosystem by reading the upstream project, and run it so it fails as claimed.
- Post nothing that has not passed anti-slop, the privacy rules, and the user's explicit approval.

## Non-goals

- Fixing the upstream bug or opening a fix PR. The skill may mention a suspected cause; writing the fix is a separate request.
- Feature requests and questions. The skill is for defects.
- Per-ecosystem scripted tooling (approach C, rejected).
- Reports about superpowers itself; `superpowers:diagnosing-superpowers` covers that.

## Anti-goals (failure even if it "works")

- **Posting without a run repro.** A repro that was written but not executed, or that did not fail as described, means nothing is posted.
- **"Might be a bug" reports.** If the evidence is inconclusive, the skill says so to the user and stops.
- **Duplicates.** Filing when an existing issue covers it.
- **Leaking private details.** Anything from the user's CLAUDE.md privacy list (hostnames, IPs, MACs, usernames, home paths, entity/device names, tokens, config entry ids) in the issue or the repro.
- **Posting without approval.** The user sees the final draft and the repro location, and says yes, before any public write: issue, comment, repo or gist.
- **Confirmation bias.** The agent that wants the bug to be real is not the one that decides it is real.

## Decisions (user's)

| Topic | Decision |
|-------|----------|
| Scope | Generic: any upstream project. The skill works out the repro shape itself. |
| Before posting | Repro must be built and verified first; nothing is posted until then. |
| Prose check | Draft goes through `anti-slop` before the user sees it. |
| Repro home | Decided by size: short repro (a script or a single test) inline in the issue body; multi-file repro in a new public repo under the user's account, created only after the user approves. |
| Approach | B: procedure plus independent skeptic and clean-room run, and a tested privacy scanner. |
| Existing issue found | Comment only when it adds something (a repro the issue lacks, new affected versions). That comment goes through the same phases 5–8 as a new issue: built repro, both gates, anti-slop, privacy scan, approval. No bare "+1". If it adds nothing, give the user the link and stop. |
| Forges | GitHub is searched and posted to via `gh`. For any other tracker (GitLab, Codeberg, Jira, mailing list) the skill still runs phases 1–7, searches what it can read, then hands the user the final draft and repro to post themselves. |
| Clean-run sandbox | A fresh empty directory in the session scratchpad. Installs from public package registries are allowed; no user credentials, tokens or env vars are passed. If the repro needs infrastructure the runner cannot stand up (database, cloud account, physical device), the gate reports `cannot-run-isolated` and the skill stops and tells the user rather than passing. |

## Approaches considered

- **A. Procedure only.** `SKILL.md` plus references. Rejected: the same agent that formed the hypothesis also judges it, which is exactly the bias "really make sure" is meant to remove.
- **B. Procedure plus independent gates.** Chosen. Two fresh subagents that never see the main agent's reasoning: a skeptic that tries to prove it is not an upstream bug, and a clean runner that executes the repro from nothing. Plus a small, tested `privacy-scan.mjs`. Cost: two subagent runs per report.
- **C. Scripted pipeline.** Per-ecosystem scripts for version detection, search, running and filing. Rejected: "generic" turns into an endless list of ecosystem adapters.

## Shape

```text
plugins/upstream-issue/
  .claude-plugin/plugin.json
  skills/upstream-issue/
    SKILL.md                      # trigger, phases, gates; cites references, never restates them
    skeptic-prompt.md             # brief for the skeptic subagent
    clean-runner-prompt.md        # brief for the clean-room runner subagent
    references/repro-shapes.md    # how to pick a repro shape from the upstream project
    references/issue-body.md      # what a good issue body contains when upstream has no template
    scripts/privacy-scan.mjs      # scans draft + repro files for private details
    scripts/privacy-scan.test.mjs
    scripts/fixtures/...
```

Registered in every place `npm run check:registries` checks (marketplace, package.json, release-please extra-files, cursor/codex/gemini manifests, session-start hook, opencode plugin, commitlint scope-enum), plus the README skill list and its count ("fifteen" → "sixteen").

### Trigger

Description in "Use when…" form: the user wants to report a bug upstream, file an issue against a dependency or tool, or says "this is a bug in X", "report this upstream", "open an issue on their repo", "make a repro". Skip for issues in repos the user owns where they just want a tracker entry (CLAUDE.md's "file an issue" for review findings), for feature requests, and for superpowers itself.

### Phases

Each phase has an exit condition. Failing one stops the run and tells the user why; it never falls through to drafting.

1. **Pin the symptom.** Exact error or wrong output, the expected behaviour (with a docs link if there is one), the versions of the upstream project and its runtime, the OS. Exit: a one-paragraph statement of expected versus actual.
2. **Localise.** Show the cause lies in upstream code: trace into the upstream source, reproduce outside the user's project, or remove the user's code until only upstream calls remain. Uses `superpowers:systematic-debugging` for the investigation. Exit: the upstream file/function the behaviour comes from, or a reproduction with no user code in it.
3. **Check latest.** Read the upstream changelog/releases and commits since the user's version. Re-run against the latest release, and against the default branch where that is cheap. Exit: still fails on the latest release. If fixed in a release: tell the user which version and stop. If it fails on the latest release but passes on the default branch: fixed-but-unreleased, tell the user the commit/PR and stop. If upstream has no releases, the default branch is "latest". (Claude's call.)
4. **Search for existing reports.** Open and closed issues, PRs and discussions, by error text, symbol names and symptom wording. Exit: no match, or a match. On a match, see "Existing issue found" in Decisions.
5. **Build the repro.** Pick a shape from `references/repro-shapes.md` by reading the upstream project: prefer a failing test in upstream's own test framework, then a minimal standalone project, then a script. Pin exact versions. Strip everything not needed to trigger the bug. Run it locally. Exit: it fails with the symptom from phase 1.
6. **Independent gates** (fresh subagents, parallel):
   - **Skeptic** (`skeptic-prompt.md`): gets the phase 1 statement, versions, the repro files, and links to upstream docs and the search results. Not the main agent's reasoning. Tries to show it is misuse, documented behaviour, an environment issue, already fixed, or a duplicate. Returns `upheld` or `refuted` with evidence.
   - **Clean runner** (`clean-runner-prompt.md`): gets only the repro files and run instructions, copies them to an empty scratchpad directory, installs only what the instructions say, runs it against the latest upstream release, with no user credentials or env. Returns `fails-as-claimed`, `passes`, `fails-differently` or `cannot-run-isolated`, with the output.
   - Exit: `upheld` and `fails-as-claimed`. Anything else goes back to the relevant phase, or stops and reports to the user. At most two loop-backs, then stop and report. (Claude's call.)
7. **Draft.** Use upstream's issue template if it has one (`.github/ISSUE_TEMPLATE`), otherwise `references/issue-body.md`. Pick the repro home by size (inline vs. new repo). Run `anti-slop` on the prose. Run `privacy-scan.mjs` on the draft and every repro file; every hit is fixed or, if it seems necessary, shown to the user explicitly.
8. **Approve and post.** Show the user the final draft, the target repo, and where the repro will live. Only on an explicit yes: create the repro repo (if any), then the issue or comment, via `gh`. Report the URLs. Non-GitHub upstream: hand over the draft and repro instead of posting.

### privacy-scan.mjs

Node, no dependencies, same style as `anti-slop/scripts/scan.mjs`. Input: one or more files or a directory. Detects:

- private/LAN IPv4 ranges and non-documentation IPv6, MAC addresses
- hostnames/domains not on the allowlist. Built-in allowlist: documentation domains (`example.com/.org/.net`, `*.example`, `localhost`) and common public hosts (`github.com`, `githubusercontent.com`, `gitlab.com`, `npmjs.com/.org`, `pypi.org`, `nuget.org`, `crates.io`, `pkg.go.dev`, `docs.*` of those). Extra domains via a repeatable `--allow <domain>`; the skill always passes upstream's own domains. (Claude's call.)
- absolute home paths (`/home/<user>`, `/Users/<user>`, `C:\Users\<user>`)
- token shapes (GitHub `gh?_`, `sk-`, JWTs, long hex/base64 secrets)
- email addresses
- extra literal terms from an optional user file (e.g. `~/.claude/privacy-terms.txt`) for things only the user knows, such as device or room names

Output: `file:line: kind: match`, exit code 1 on any hit. Tested with `node --test` and fixtures, so it runs in the existing `npm test` glob.

## Testing

Follow `superpowers:writing-skills` (RED → GREEN → REFACTOR):

- **RED:** without the skill, give a subagent three scenarios and record what it files: (a) a real upstream bug in a small public library, pinned to a version before the fix; (b) a "bug" that is the user's misconfiguration; (c) a bug already fixed in the latest release. Expect it to draft an issue for all three.
- **GREEN:** with the skill, (a) produces a draft with a repro that the clean runner confirms; (b) stops at phase 2 or the skeptic; (c) stops at phase 3 naming the fixing version. No scenario posts anything (test runs stop at the approval step).
- **Privacy:** a scenario whose logs contain a home path, a LAN IP and a hostname; the final draft contains none of them.
- `npm test` covers `privacy-scan.mjs`. `npm run check:registries`, `check:conventions` and markdownlint pass.

## Left to the builder

- Exact frontmatter description text, within the trigger and skip rules above.
- The size threshold between inline and separate repo (suggest: one file under ~60 lines inline).
- The list of repro shapes and ecosystem hints in `references/repro-shapes.md`.
- Choice of real library/version for the RED/GREEN scenarios.
- plugin.json keywords and marketplace category.
