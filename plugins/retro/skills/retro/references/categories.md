# Retro categories

Adapted from Matt Pocock's [retro](https://github.com/mattpocock/skills/tree/main/skills/engineering/retro) (MIT); see [NOTICE.md](../NOTICE.md).

The six categories a retro looks for, in severity order. A finding names one category, its evidence (`path:line` in the transcript, plus digest numbers where the category has them), the proposed change, its target and a recommended outcome.

## 1. Information access

A crucial fact was not available to the agent, so it guessed, asked, or worked around the gap.

- **Signal in the transcript:** the agent guesses at runtime behaviour, asks the user for something a tool could have shown, retries blind after an error with no log, or says it "cannot see" a service, log or page. Digest: *Failures* with *no retry* or repeated retries of the same command.
- **Check in the repo:** is there a log file, a dev-server log tee, a readonly CLI or MCP for the third-party service, a test report path? Is it documented anywhere the agent would look?
- **Typical fixes:** tee dev-server and test output to a known file; add a readonly MCP or CLI with credentials scoped to read; add a navigation pointer naming where the logs live.
- **Recommended outcome:** Fix now when the change is in this repo; File issue when it needs credentials or another service.

## 2. Automated checks

A mistake that a deterministic check would have caught, or a repo with no guardrail at all.

- **Signal in the transcript:** a type error, lint error, broken link, wrong file location or failing test that surfaced late (in review, in CI, or from the user). Digest: *Failures* on build or test commands.
- **Check in the repo:** read the repo's own check command first: its `package.json` or build-tool `lint`/`check`/`test` scripts and its CI workflow. A check that already exists but is unwired, skipped in CI or silently broken is the finding, not a reinvention.
- **No guardrail rule:** a repo with no pre-commit hook and no CI job running its lint/typecheck/test command is itself a finding. An un-linted repo is a standing missed opportunity, not a neutral default.
- **Typical fixes:** wire the existing command into CI; add a pre-commit hook; add a custom lint rule or a small check script with a test.
- **Recommended outcome:** Fix now.

## 3. Coding standards

The reviewer failed to catch a mistake, or a rule is missing, unclear or in the wrong place.

- **Classify the violation first.**
  - **Mechanical** (a fixed syntactic pattern, a banned API, an import shape, a file-location rule): it gets a deterministic check, full stop. A custom rule in the repo's linter, a pre-commit hook, or a CI job, whichever the repo's language and existing guardrail make cheapest. Default to building the check over writing the rule.
  - **Judgement** (cross-file consistency, "matches the surrounding style", anything no check could replace): it goes to the reviewer's rules, such as a `CODING_STANDARDS.md` read during review.
- **Signal in the transcript:** a review that passed something the user then corrected; a rule stated in `CLAUDE.md` that the implementer broke.
- **Typical fixes:** move a mechanical rule from prose to a check; add or sharpen a reviewer rule; delete a rule that no longer applies.
- **Recommended outcome:** Fix now for a check or a rule edit; File issue when the check needs a new tool.

## 4. Navigation

The agent took a long time to find the right file, or missed a hidden dependency between files.

- **Signal in the transcript:** Digest: *Search churn* runs, *Repeated reads* of the same file, many Grep/Glob calls before the first edit.
- **Check in the repo:** is there a pointer from `CLAUDE.md`/`AGENTS.md` or a docs index to the area? Do two files have to change together with nothing saying so? On .NET repos with roslyn-codelens tools, confirm the dependency with `find_references` or `get_symbol_context` before proposing a pointer.
- **Typical fixes:** a one-line navigation pointer in `CLAUDE.md` naming the file and the condition for reading it; a comment at one end of a hidden dependency naming the other end.
- **Recommended outcome:** Fix now.

## 5. Tool economy

The agent made expensive tool calls, or a tool is token-inefficient by design.

- **Signal in the transcript:** Digest: *Biggest tool results* (whole-file reads, screenshots read twice, verbose CLI output), *Repeated commands*, subagents dispatched with *model unset*.
- **Check in the repo and tooling:** does the tool have a quieter flag, a filter, a JSON mode? Is an MCP returning far more than callers use? Is the waste in one of the user's own tools?
- **Typical fixes:** a quieter script variant (`--silent`, `--reporter=dot`); a project script that wraps a noisy command; an issue on the user's own MCP server for a leaner response.
- **Recommended outcome:** Fix now for a script in this repo; File issue for a tool in another repo.

## 6. Steering size and no-ops

`CLAUDE.md`/`AGENTS.md` lines, in the repo or the user's global scope, that are too long, belong somewhere else, or change nothing.

- **Signal:** a steering file over roughly 200 lines; instructions the model already follows by default; rules that should be checks (category 2) or reviewer rules (category 3); restated facts the environment already holds (`package.json` scripts, directory layout).
- **Check:** apply the pruning tests in [writing-for-agents.md](writing-for-agents.md): no-op, cache, relevance, duplication.
- **Typical fixes:** delete the no-op; move the rule to its proper home and leave a pointer; replace a paragraph with a leading word.
- **Recommended outcome:** Fix now; the diff of a global file is shown before it is applied.
