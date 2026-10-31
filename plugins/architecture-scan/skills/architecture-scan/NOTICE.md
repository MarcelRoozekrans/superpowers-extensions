# Attribution

The `codebase-design` skill and parts of the `architecture-scan` skill in this
plugin are adapted from [mattpocock/skills](https://github.com/mattpocock/skills)
by Matt Pocock, under the MIT License. The vocabulary and the core method (deep
modules, the deletion test, dependency categories, design-it-twice) come from
there. The integration with this suite is new.

## Adapted files

| File in this plugin | Upstream file |
|---------------------|---------------|
| `skills/codebase-design/SKILL.md` | `skills/engineering/codebase-design/SKILL.md` |
| `skills/codebase-design/references/deepening.md` | `skills/engineering/codebase-design/DEEPENING.md` |
| `skills/codebase-design/references/design-it-twice.md` | `skills/engineering/codebase-design/DESIGN-IT-TWICE.md` |
| `skills/architecture-scan/SKILL.md` | `skills/engineering/improve-codebase-architecture/SKILL.md` |
| `skills/architecture-scan/references/report.md` | `skills/engineering/improve-codebase-architecture/HTML-REPORT.md` |

`skills/architecture-scan/scripts/hotspots.mjs` is new and has no upstream
counterpart.

## What changed

- The report is published as an Artifact instead of a temp file.
- After the user picks a candidate, the scan hands off to
  `superpowers:brainstorming` with a briefing instead of running a grilling dialogue.
- Rejected candidates are recorded in `decision-tracker` instead of ADRs.
- No `GLOSSARY.md` and no `domain-modeling` skill. An existing project glossary
  is read and used, never created.
- Findings are backed by Roslyn evidence on .NET when `roslyn-codelens`
  tools are available.
- A hot-spot script counts git changes per directory, so the scope is the same
  on every run.
- Design-it-twice subagents are dispatched with an explicit `model: sonnet`.

## License of adapted content

The adapted files inherit the MIT license of the upstream project:

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
