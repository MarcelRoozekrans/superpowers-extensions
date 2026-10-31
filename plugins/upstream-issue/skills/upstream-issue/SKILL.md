---
name: upstream-issue
description: Use when the user wants to report a bug upstream or file an issue against a dependency, tool, library or plugin they do not own, or says "report this upstream", "this is a bug in X", "open an issue on their repo" or "make a repro". Skip for feature requests and questions, for tracker entries in the user's own repos, and for superpowers itself, which superpowers:diagnosing-superpowers covers.
---

# Upstream Issue

A public issue stays under the user's name for good. Many "upstream bugs" turn out to be the user's own setup, a bug already fixed in a newer release, or an existing report. This skill proves the bug is upstream, builds a minimal repro that has been run and fails, has two fresh subagents check both independently, and only then drafts the issue for the user to approve.

<HARD-GATE>
Nothing public is written (issue, comment, repo or gist) until all of these hold:

1. The repro was run and failed with the phase 1 symptom.
2. Both gates passed: the skeptic answered `VERDICT: upheld` and the clean runner answered `RESULT: fails-as-claimed`.
3. The prose went through `anti-slop`, and `privacy-scan.mjs` ran over the draft and every repro file, with each hit fixed or shown to the user.
4. The user saw the final draft, the target repo and the repro location, and said yes to posting it.

If the evidence is inconclusive, tell the user so and stop. A "might be a bug" report is never drafted.
</HARD-GATE>

## When to Use

- A library, CLI tool, plugin or integration the user does not own misbehaves, and the user wants to report it
- The user says "this is a bug in X", "report this upstream", "open an issue on their repo" or "make a repro"
- The user wants to add a repro or newly affected versions to an existing upstream issue

Do NOT use when:

- The request is a feature or a question. This skill is for defects.
- The issue goes in a repo the user owns, as a plain tracker entry such as a review finding
- The problem is in superpowers itself. Use `superpowers:diagnosing-superpowers`.
- The user wants the upstream bug fixed or a fix PR opened. That is a separate request; this skill may only name a suspected cause.

## Phases

Each phase ends with an exit condition. When a phase fails, give the user its stop message with the evidence and end the run. Every stop message carries the URLs behind its evidence: the docs page, the release or commit, the existing issue. Naming a README section or an option without its link is not enough. A failed phase never falls through to drafting.

Paths below are relative to this skill's directory. Work in the session scratchpad, never in the user's project.

### 1. Pin the symptom

Record the exact error or wrong output, the versions of the upstream project and its runtime, and the OS. Read upstream's docs for the expected behaviour.

**Exit:** a one-paragraph statement of expected versus actual. The expected half carries a docs link, or says "no docs found" and names where you looked. Never call behaviour documented or undocumented without having read the docs.

**Stop:** "I cannot pin down what should happen", with what is missing.

### 2. Localise

Show the cause lies in upstream code. Trace into the upstream source, reproduce outside the user's project, or remove the user's code until only upstream calls remain. Use `superpowers:systematic-debugging` for the investigation.

**Exit:** the upstream file and function the behaviour comes from, linked, or a reproduction with no user code in it.

**Stop:** "This looks like it comes from your code or config, not from upstream", with the evidence and the upstream docs URL from phase 1 that documents the behaviour. When phase 1 found no docs, say so and link the places you looked.

### 3. Check latest

"Latest" is the latest release. When upstream has no releases, it is the default branch. Do these checks yourself; the version the user has installed proves nothing about latest.

- Read the changelog or releases, and the commits since the user's version.
- Re-run against the latest release, and against the default branch where that is cheap.

**Exit:** it still fails on the latest release. Name the release or commit tested.

**Stop:**

- Fixed in a release: "Fixed in version X", with the release link.
- Fails on the latest release but passes on the default branch: "Fixed but not released yet", with the commit or pull request.

### 4. Search for existing reports

Search open and closed issues, pull requests and discussions by error text, symbol names and the symptom in plain words. An open pull request that fixes the bug counts as an existing report. On GitHub, use `gh search issues` and `gh search prs` against the upstream repo. For any other tracker, search what you can read.

**Exit:** a list of every query, where it ran and what it returned, plus what could not be searched, such as an unreachable mailing-list archive. Then one of:

- **No match:** go on to phase 5.
- **A match,** including an open fix pull request: read the whole thread. A comment is drafted only when it adds something the thread lacks, such as a repro the issue does not have or newly affected versions. Name what the thread lacks and quote where you checked. That comment then goes through phases 5 to 8 like a new issue.

**Stop:** a match where a comment would add nothing: give the user the link and stop. Never draft a bare "+1".

### 5. Build the repro

Pick the shape and pin versions as [references/repro-shapes.md](references/repro-shapes.md) says, by reading the upstream project. Build it in a new directory in the session scratchpad, minimise it, and run it.

**Exit:** the repro fails with the phase 1 symptom on the latest version from phase 3. Keep the exact output and the run commands as written for a stranger.

**Stop:** "I could not build a repro that fails", with what you tried.

### 6. Independent gates

See [Gates](#gates).

**Exit:** `VERDICT: upheld` and `RESULT: fails-as-claimed`.

**Stop:** see the outcome table under Gates.

### 7. Draft

See [Drafting](#drafting).

**Exit:** a draft that passed `anti-slop`, and a privacy scan with no unresolved hit.

**Stop:** "I cannot finish the draft", naming what is missing: a field the upstream template requires that the evidence does not cover, or a privacy hit that can be neither replaced nor kept with a reason the user can judge.

### 8. Approve and post

See [Approve and post](#approve-and-post).

**Exit:** the user said yes and the URLs are reported, or the draft and repro were handed over for a non-GitHub tracker.

**Stop:** without an explicit yes nothing is posted.

## Gates

Phase 6 dispatches two fresh subagents **in parallel, both on `sonnet`**:

- the skeptic, with [skeptic-prompt.md](skeptic-prompt.md)
- the clean runner, with [clean-runner-prompt.md](clean-runner-prompt.md)

Fill only the placeholders each brief lists and send its fenced text. The skeptic's `{REPORT_TARGET}` says whether this is a new issue or a comment on the phase 4 match and what the comment adds, so its duplicate check does not refute a comment for finding the issue it comments on. The skeptic gets no reasoning from you: not your suspected cause, not your reading of the docs, not your view of the search results beyond the facts the placeholders ask for. The agent that wants the bug to be real is not the one that decides it is real.

Read the first line of each reply. That line is the verdict. Check the rows top to bottom and take the first that matches.

| Skeptic | Clean runner | Next step |
|---------|--------------|-----------|
| any | `cannot-run-isolated` | **Stop,** whatever the skeptic said. Tell the user what the runner could not stand up. Do not run it yourself instead. |
| no valid first line | any | Dispatch that brief again, once, with the same input. A second malformed reply stops the run. |
| any | no valid first line | Same as the row above, for the clean runner. |
| `upheld` | `fails-as-claimed` | Go on to phase 7. |
| `refuted` | any | Go back to the phase the strongest reason points at: misuse to 2, documented behaviour to 1, environment to 2, already fixed to 3, duplicate to 4. When the clean runner failed too, this target wins; carry the runner's output into that phase. |
| `upheld` | `passes` or `fails-differently` | Go back to phase 5, or to 2 when the clean output points away from upstream. |

Rules:

- **Verdicts are final.** Do not argue past a verdict, explain it away, or dispatch again to get a different answer. A loop-back means fixing what the verdict found and then dispatching both gates afresh.
- **At most two loop-backs.** A failed gate round uses one loop-back. When the third round fails, with both loop-backs used, stop and report every verdict from all three rounds, with its evidence, to the user.
- **Keep the skeptic's Gaps section.** It lists the angles the skeptic could not fully check. Show it to the user at the approval step, next to the draft.

## Drafting

1. **Template.** Use upstream's issue template under `.github/ISSUE_TEMPLATE`, or the tracker's own equivalent, and fill every field. When there is none, follow [references/issue-body.md](references/issue-body.md), for a new issue or for a comment.
2. **Repro home.** Decide inline or separate repo by the size threshold in [references/repro-shapes.md](references/repro-shapes.md). A separate repo is only planned at this point; it is created in phase 8.
3. **Prose.** Run the `anti-slop` skill over the draft.
4. **Privacy.** Run the scanner over the draft and every repro file, allowing upstream's own domains:

   ```bash
   node <this skill's directory>/scripts/privacy-scan.mjs --allow <upstream-domain> [--allow <docs-domain>]... <draft> <repro-dir>
   ```

   Exit 1 lists the hits. Fix every hit with a documentation value such as `example.com`, `192.0.2.1` or `<entry_id>`. When a hit seems necessary for the report, keep it only by showing it to the user explicitly at the approval step. Re-run until it exits 0 or only shown hits remain.

Never repeat a private detail from the user's logs in chat either.

## Approve and post

Show the user, in one message:

- the final draft
- the target repo, and whether this is a new issue or a comment on an existing one, with its link
- where the repro will live: inline, or the name of the new public repo under their account, with the noreply author address its commits will carry
- the skeptic's Gaps
- any privacy hit you kept, and why

Then stop and wait. Only on an explicit yes, on GitHub:

1. When the repro is a separate repo, commit it with the user's GitHub noreply address as author, never the local `git config user.email`, which may be a private address the privacy scan never saw. Get the id and login from `gh api user --jq '.id, .login'` and commit with `git -c user.name=<login> -c user.email=<id>+<login>@users.noreply.github.com commit`. Then create the repo with `gh repo create <name> --public`, push, and put its URL into the draft.
2. Write the final body to a file and always name the target repo, since a bare `gh issue` call inside the user's own checkout would target that repo. For a new issue, run `gh issue create --repo <owner/repo> --title <title> --body-file <file>`. For a comment, run `gh issue comment <number> --repo <owner/repo> --body-file <file>`.
3. Report every URL created.

Any change the user asks for goes back through `anti-slop`, the privacy scan and this approval step.

For a tracker other than GitHub, such as GitLab, Codeberg, Jira or a mailing list, post nothing. Hand the user the final draft and the repro to post themselves.

## Reference Index

| File | Contents |
|------|----------|
| [skeptic-prompt.md](skeptic-prompt.md) | Phase 6 brief for the skeptic: placeholders, the five angles, reply format |
| [clean-runner-prompt.md](clean-runner-prompt.md) | Phase 6 brief for the clean runner: placeholders, isolation rules, reply format |
| [references/repro-shapes.md](references/repro-shapes.md) | Phase 5: repro shapes in order, version pinning, minimisation, inline threshold, ecosystem hints |
| [references/issue-body.md](references/issue-body.md) | Phase 7: issue and comment body when upstream has no template |
| `scripts/privacy-scan.mjs` | Phase 7: scans the draft and repro for private details |
