# wizard — Attribution

This skill is adapted from the `wizard` skill in [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/engineering/wizard) by Matt Pocock (MIT License), at commit `a496f5513d4a4cf889bc48e189e579f4b0bdf6aa`.

## What was adapted

- `template.sh` is upstream's template. Its library, everything above the `STAGES` marker, is shared by every wizard this skill writes.
- `SKILL.md` follows upstream's four steps: scope the procedure, map each stage's journey, author the wizard, verify and hand off.

## What is different here

- **One change to `template.sh`.** Line 114 reads `${e}[Enter keeps current]` where upstream has `$e[Enter keeps current]`. Bash expands both the same way, but shellcheck 0.10 reports the upstream form as SC1087, an error, and the check script runs shellcheck. Upstream closed the same report as a shellcheck false positive ([mattpocock/skills#1295](https://github.com/mattpocock/skills/issues/1295)), so the change stays. When the template is copied from upstream again, apply it again and update the SHA-256 below.
- **Questions go through AskUserQuestion,** with labelled options and one marked "(Recommended)", where upstream asks in prose.
- **Published text goes through `anti-slop`:** the commit message, PR text and README link, and the on-screen text of a wizard that gets committed.
- **`scripts/check.mjs`** runs upstream's verification checklist as one command.
- Upstream's `agents/openai.yaml` is left out.

Template SHA-256: `185099b8a7b4cfcaf49502b14f7a6c01b6ae7da318275a12b2db803d9a10eba3`

## License

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
