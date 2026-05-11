# compress-memory — Attribution

The compression-rules approach in this skill is inspired by the `caveman-compress` sub-skill from [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (MIT License).

## What was adapted

The rule set is adapted from caveman:

- Drop articles / filler / pleasantries / hedging / connective fluff
- Replace verbose phrasing with shorter equivalents
- Preserve code blocks, URLs, file paths, commands, env vars, frontmatter byte-exact
- Preserve markdown structure (headings, tables, lists)
- Back up original to `<file>.original.md` before overwrite

## What is different here

- **No Python toolchain.** caveman drives a separate Python implementation (`compress.py`, `detect.py`, `validate.py`, `cli.py`) that calls the Claude API itself. This skill runs in the active Claude Code conversation as pure markdown — no Python dependency, no second API key, no extra runtime.
- **Denylist for downstream-consumed artifacts.** caveman has no per-file denylist; this skill refuses to operate on `docs/plans/**`, UI contracts, impact analyses, design documents, and review reports because those files are contracts between skills in the superpowers-extensions suite. Compressing them would break downstream consumers.
- **project-orchestration integration.** This skill is opt-in via a `compress_memory` frontmatter flag on `ROADMAP.md` set during `plan-roadmap`, and auto-invoked by `pause-work` after writing `STATE.md`. caveman has no comparable lifecycle integration.

No source files were copied from caveman. The rule set is reimplemented as markdown content that codifies the same compression patterns.

## License

caveman is licensed under the MIT License. superpowers-extensions is also MIT-licensed. The two licenses are fully compatible.

```text
MIT License

Copyright (c) 2026 Julius Brussee

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

## See also

caveman ships a related component, `caveman-shrink` — an MCP middleware that compresses tool descriptions on startup. It is intentionally NOT bundled in superpowers-extensions because it is runtime infrastructure (an MCP server), not a Claude Code skill. Users who want it can install it directly from npm: `npm install -g caveman-shrink`. The README links to it under the Ecosystem section.
