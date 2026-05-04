# Design Systems Catalog — Attribution

The 70 `<system>/DESIGN.md` files in this directory are vendored from
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
under the MIT License. Each file is an analysis of a real product's published
design language (CSS tokens, typography, color, component patterns) extracted
from public sources by VoltAgent's `getdesign` tool.

The selection of systems to vendor and the framing as a curated catalog inside
a Claude Code skill plugin was inspired by
[nexu-io/open-design](https://github.com/nexu-io/open-design) (Apache-2.0),
which ships a similar catalog inside a different runtime. No content was copied
from open-design; only the idea of bundling a curated catalog directly into the
skill rather than generating one on demand.

## License of vendored content

Files in this directory inherit the MIT license of the upstream project:

```text
MIT License

Copyright (c) VoltAgent

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

The `superpowers-extensions` repo as a whole is MIT-licensed; the design
systems catalog is fully license-compatible.

## Trademarks

Brand names referenced in the catalog (Stripe, Linear, Notion, Apple, etc.)
are trademarks of their respective owners. The DESIGN.md files describe public
visual conventions for educational and inspirational purposes; they are not
endorsed by or affiliated with the named companies.

## Refreshing the catalog

The upstream `awesome-design-md` repository is occasionally updated with new
systems. To refresh:

```bash
SYSTEMS=$(gh api repos/VoltAgent/awesome-design-md/contents/design-md \
  --jq '.[] | select(.type=="dir") | .name')
for sys in $SYSTEMS; do
  mkdir -p "$sys"
  gh api "repos/VoltAgent/awesome-design-md/contents/design-md/$sys/DESIGN.md" \
    --jq '.content' | base64 -d > "$sys/DESIGN.md"
done
```

Re-run from this directory to pull the latest versions.
