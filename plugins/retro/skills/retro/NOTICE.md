# retro — Attribution

This skill is adapted from Matt Pocock's [skills](https://github.com/mattpocock/skills) repository (MIT License), read at commit `a496f55`.

## What was adapted

- [`skills/engineering/retro/SKILL.md`](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/engineering/retro/SKILL.md): the improvement categories (navigation, automated checks, coding standards, steering files, tool economy, no-ops, information access), the rule that a repo with no guardrail is itself a finding, the mechanical-versus-judgement split for coding standards, and the implementation-versus-review reasoning. These live in `SKILL.md` and `references/categories.md`.
- [`skills/productivity/writing-for-agents/SKILL.md`](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/productivity/writing-for-agents/SKILL.md) and the invocation section of [`SKILL-MECHANICS.md`](https://github.com/mattpocock/skills/blob/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa/skills/productivity/writing-for-agents/SKILL-MECHANICS.md): context pointers, the two loads, the information hierarchy, completion criteria, splitting, leading words and pruning. These live in `references/writing-for-agents.md`, trimmed and reworded where this suite's conventions differ.

## What is different here

- **Digest script.** `scripts/digest.mjs` streams a Claude Code transcript into sizes, counts and line numbers, so tool-economy findings carry real numbers and no megabyte transcript line reaches the context. Upstream reads the session directly.
- **Every finding gets an outcome.** Each finding is fixed now, filed as one grouped GitHub issue, or dropped, chosen per finding through AskUserQuestion with a recommended option. Upstream presents the candidates and stops.
- **Decision-tracker instead of ADRs.** A dropped finding whose reason a future retro needs is stored in `decision-tracker`, so it is not suggested again.
- **Split with `superpowers:diagnosing-superpowers`.** When an `obra/superpowers` skill caused the problem, retro routes to that skill instead of diagnosing it.
- **`writing-for-agents` is a reference, not a skill.** Only retro needs it in this suite, so it carries no always-loaded description.
- **Offered at natural breaks.** Model-invoked and offered once after a merged PR, a finished phase or a resumed handoff, where upstream is user-invoked only.

## License

The upstream repository and superpowers-extensions are both MIT-licensed.

```text
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
