# anti-slop publish hook design

Date: 2026-11-28. Status: approved 2026-11-28.

## Intent

`anti-slop` fires from its description. Nothing checks that it fired. A rule the model may follow is
not a check: the slop-lint plugin in Vinix24/claude-code-toolkit (MIT) reports a corpus where "no
em-dashes" was loaded in every session and the text still held 3,282 of them. Its answer is a hook.

The same comparison showed two gaps in the catalogues. slop-lint measured comma chains as the
largest family in Dutch prose (`, en` alone 1,219 times in 310,000 words), and it checks contrast
frames such as `niet X maar Y`. Neither catalogue had an entry for them.

## Decisions

- **Catalogue entries.** Dutch gets "Een komma voor `en`" and "Tegenstelling als frame". English
  gets "Contrast frame". `, dus`, `, maar` and `, want` are left out: in Dutch a comma there is
  normal punctuation, and a sample of Dutch docs showed `, dus` hits were mostly correct text.
- **Every Match line is tested.** A test checks that each entry with a **Match:** line fires on its
  **Bad:** example and not on its **Rewrite:**, and that both catalogues pass their own scan. It
  found two Dutch entries, "Gestapelde overgangen" and "Voorbehouden", whose regex missed their
  own Bad example. Both regexes are widened.
- **Hook on publishing calls, before they run.** Most published text leaves through Bash
  (`git commit`, `gh pr|issue|release`) or GitHub MCP tools, not through Write or Edit. A
  `PostToolUse` hook would see the text after it is public. The hook is `PreToolUse`.
- **Deny once.** On hits the first call is denied with the hit list. The same text in the same
  session passes on retry, keyed by a hash of the text in a per-session file under the temp
  directory. A hit Claude judges intended costs one retry and never blocks publishing.
- **Both catalogues on every text.** No language detection. The Dutch patterns rarely match
  English and the other way round, and a false hit costs one retry.
- **Fail open.** Any error lets the call through. `ANTI_SLOP_HOOK=off` turns the hook off.

## Out of scope

- A deterministic check of entries without a **Match:** line. Those still need the skill.
- The context-rotation idea of a hard tool block at a third context threshold. Declined: a block in
  the middle of a task strands work in unattended and remote runs.
