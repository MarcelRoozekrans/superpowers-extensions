# Attribution

The merge flow in the `ci-watch` skill is adapted from `merge-when-green` in
[Devleaps/tempa-config-template](https://github.com/Devleaps/tempa-config-template),
under the MIT License. The idea of checking the PR state and merging only when
CI is green comes from there. The integration with this suite is new.

## Adapted files

| File in this plugin | Upstream file |
|---------------------|---------------|
| `skills/ci-watch/SKILL.md` (Merge stage) | `merge-when-green` |

The hook, `scripts/ci-watch.mjs` and the Wait, Red CI and Release stages are new
and have no upstream counterpart.

## What changed

- No Tempa MCP calls. The skill uses `gh` locally and the GitHub MCP tools in
  cloud sessions.
- CI is awaited as an event or with `gh pr checks --watch`, never with a sleep loop.
- A red check is fixed in a bounded loop instead of being reported.
- The squash message is built by a tested script that removes signature lines
  and nested parentheses.
- `--admin` is used only to pass the review rule, after every other rule is verified.
- A hook starts the watch when a PR is opened.

## License of adapted content

The adapted content inherits the MIT license of the upstream project:

```text
MIT License

Copyright (c) Devleaps

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
