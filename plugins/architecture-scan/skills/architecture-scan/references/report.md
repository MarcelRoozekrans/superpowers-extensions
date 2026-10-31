# Report

The scan ends in one HTML report. Build it from `templates/report.template.html`: the template holds the whole stylesheet and the page frame, so this file never repeats CSS. Open the template to see the class definitions.

The report shows the before/after shape of each candidate, never a proposed new interface. The interface is designed after the user picks, in brainstorming. After-side labels show the shape only: one deep module, what it owns, which seams remain. No method names, parameter lists or method counts.

## Fill the template

Replace each placeholder exactly once.

| Placeholder | Content |
| --- | --- |
| `{{EYEBROW}}` | `architecture-scan · <repo> · <date>` |
| `{{TITLE}}` | `Deepening candidates for <repo>` |
| `{{SCOPE}}` | The scope section body, see below |
| `{{CANDIDATES}}` | One `<article>` per candidate, in ranked order |
| `{{TOP}}` | The top-recommendation block, see below |
| `{{MERMAID_SCRIPT}}` | Empty string in an Artifact; the script tag below in the temp-file fallback |

Escape `&`, `<` and `>` in text as `&amp;`, `&lt;` and `&gt;`. Keep Mermaid source inside `<pre class="mermaid">` unescaped except for `<br/>` line breaks, which Mermaid reads as written.

### Artifact or temp file

Publish as an Artifact when the Artifact tool is available. The Artifact viewer renders Mermaid natively, so `{{MERMAID_SCRIPT}}` becomes an empty string.

Publish with:

- `title`: `Architecture scan <repo>`
- `icon`: `"diagram"`
- `description`: one sentence, for example "Three deepening candidates for acme-shop, ranked, with the top pick first."

When no Artifact tool exists, write the filled template to a file in the OS temp directory and open it in the browser. Replace `{{MERMAID_SCRIPT}}` with this line, which pins the Mermaid version:

```html
<script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"; mermaid.initialize({ startOnLoad: true, theme: "neutral" });</script>
```

The template carries no other script and no Tailwind. The report is static apart from Mermaid's own rendering.

## Scope section

`{{SCOPE}}` holds a one-line `.meta` paragraph naming the history window, one `.hot` grid with a row per hot-spot directory, and a `.recalled` line when rejections were skipped.

Each row is three cells: the directory, a `.bar` and the count. The bar width is a percentage of the top count, so the top directory is `100%`:

```html
<p class="meta">Hot spots from the last 300 commits; files touched most often pull attention first.</p>
<div class="hot mono">
  <span>src/orders/intake/</span><span class="bar" style="width:100%"></span><span class="n">64</span>
  <span>src/pricing/</span><span class="bar" style="width:72%"></span><span class="n">46</span>
</div>
<p class="recalled">Skipped because decision-tracker holds a rejection: <b>merge the Pricing and Tax modules</b> (rejected 2026-09-02: tax rules ship on a separate legal release cycle).</p>
```

List every skipped rejection in the `.recalled` line, each with its date and reason. Leave the line out when nothing was skipped.

## Candidate card

One `<article id="cN">` per candidate. The field order is fixed:

1. Title in `<h3>`, inside `.head`: `N · <short name of the deepening>`, for example "1 · Collapse the Order intake pipeline".
2. Badges in `.badges`, also inside `.head`: strength (`b-strong` for Strong, `b-explore` for Worth exploring, `b-spec` for Speculative) and a plain `.badge` for the dependency category (`in-process`, `local-substitutable`, `ports &amp; adapters`, `mock`).
3. Files as `<ul class="files mono">`.
4. The before/after pair: `.pair` holding a `.panel` and a `.panel.after`, each opened by `<span class="eyebrow">`.
5. Problem, Solution and Wins as a `.fields` list. Problem and Solution are one sentence each. Wins are bullets of six words or fewer, in `.wins`.
6. The ADR or decision callout, `<p class="adr">`, only when the candidate conflicts with a recorded decision.

```html
<article id="c1">
  <div class="head">
    <h3>1 · Collapse the Order intake pipeline</h3>
    <div class="badges"><span class="badge b-strong">Strong</span><span class="badge">in-process</span></div>
  </div>
  <ul class="files mono"><li>orders/intake/handler.ts</li><li>orders/repo.ts</li></ul>
  <div class="pair">
    <div class="panel"><span class="eyebrow">Before</span> ... </div>
    <div class="panel after"><span class="eyebrow">After</span> ... </div>
  </div>
  <dl class="fields">
    <dt>Problem</dt><dd>Four shallow modules; the handler reaches past the seam into the mapper.</dd>
    <dt>Solution</dt><dd>One Order intake module; the four steps become its implementation.</dd>
    <dt>Wins</dt><dd><ul class="wins"><li>Locality: intake bugs in one module</li><li>Tests hit one interface</li></ul></dd>
  </dl>
  <p class="adr">Touches the recorded decision "channels are pluggable", but only one channel exists: a hypothetical seam.</p>
</article>
```

The diagrams carry the weight. If a diagram needs a paragraph to be understood, redraw the diagram.

## Diagram patterns

Pick the pattern that fits each candidate and vary them across the cards: a report where every diagram looks the same reads as generic. Keep a diagram near 320px tall so the pair sits side by side. Module labels inside diagrams are short and uppercase-styled by the template.

### Mermaid graph

The workhorse for call flow and dependencies: "X calls Y calls Z, and look at the mess". Sequence diagrams suit "before: 6 round-trips; after: 1". The after diagram shows the single deep module as one node. Colour the leak edge with `linkStyle`; this is the one place a literal colour is allowed, because Mermaid cannot read the CSS tokens. Use the leak red `#c2372d`. The index in `linkStyle` counts edges from 0 in source order.

```html
<div class="panel"><span class="eyebrow">Before</span>
<pre class="mermaid">
flowchart LR
  H[Handler] --> V[Validator]
  V --> N[Normalizer]
  N --> M[Mapper]
  M --> R[OrderRepo]
  H -. reads raw fields .-> M
  linkStyle 4 stroke:#c2372d,stroke-width:2px
</pre>
</div>
<div class="panel after"><span class="eyebrow">After</span>
<pre class="mermaid">
flowchart LR
  H[Handler] --> I[[Order intake<br/>owns validation and mapping]]
  I --> R[OrderRepo]
</pre>
</div>
```

### Hand-built boxes

Use modules as bordered `<div>`s when Mermaid's layout fights the point, for example when the after diagram should be one thick-bordered deep module with its internals faded inside. Compose them from `.band.thick` for the deep module and plain borders for the rest.

```html
<div class="panel after"><span class="eyebrow">After · one deep module</span>
  <div class="band thick">Order intake · owns validation and mapping</div>
  <div style="border:1px solid var(--rule);border-radius:4px;padding:8px;text-align:center">OrderRepo</div>
</div>
```

### Cross-section

For layered pass-throughs: stack `.band` rows in a `.stack`, one per module a call passes through. Before is many thin bands each forwarding a call; after is one `.band.thick` carrying the merged responsibility, plus the adapter beneath it.

```html
<div class="panel"><span class="eyebrow">Before · a send passes 5 modules</span>
  <div class="stack">
    <div class="band">Dispatcher</div><div class="band">Router</div><div class="band">Template resolver</div><div class="band">Channel picker</div><div class="band">SMTP adapter</div>
  </div>
</div>
<div class="panel after"><span class="eyebrow">After · one module, one adapter swap</span>
  <div class="stack">
    <div class="band thick">Notifications · owns routing and templates</div><div class="band">SMTP adapter / fake mailbox</div>
  </div>
</div>
```

### Mass diagram

For an interface as wide as its implementation. Each module is two rectangles: `.if` for interface surface, `.impl` for implementation, heights in pixels. Before, the interface rectangle is nearly as tall as the implementation (shallow). After, the interface is short and the implementation tall (deep). The Before caption may give the current method count as evidence. The After caption names the module and what it owns, never a method count: the new interface is designed after the pick.

```html
<div class="mass">
  <div class="mod"><div class="if" style="height:96px"></div><div class="impl" style="height:70px"></div><small>Pricing client<br>14 methods</small></div>
</div>
<div class="mass">
  <div class="mod"><div class="if" style="height:22px"></div><div class="impl" style="height:150px"></div><small>Pricing<br>owns rates and rounding</small></div>
</div>
```

### Call-graph collapse

Before: a tree of function calls as nested bordered boxes inside a `.panel`. After: the same tree collapsed into one `.band.thick` box labelled with the module's name, with the now-internal calls shown faded inside it in `var(--muted)`. No dedicated classes.

```html
<div class="panel"><span class="eyebrow">Before</span>
  <div style="border:1px solid var(--rule);border-radius:4px;padding:8px">handle()
    <div style="border:1px solid var(--rule);border-radius:4px;padding:6px;margin-top:6px">validate()</div>
    <div style="border:1px solid var(--rule);border-radius:4px;padding:6px;margin-top:6px">normalize()</div>
  </div>
</div>
<div class="panel after"><span class="eyebrow">After</span>
  <div class="band thick">Order intake<br><span style="color:var(--muted)">validate() · normalize()</span></div>
</div>
```

## Top recommendation

`{{TOP}}` holds a heading with an anchor link to the chosen card and one sentence on why. Nothing else.

```html
<h2 id="top-h"><a href="#c1">Collapse the Order intake pipeline</a></h2>
<p style="margin:0">Most-changed area in the history, in-process dependencies only, so it deepens without a new adapter.</p>
```

## Tone

Plain English, concise. The architectural nouns and verbs come straight from the `codebase-design` skill. Concision is not an excuse to drift.

**Use exactly:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Never substitute:** component, service, unit (for module) · API, signature (for interface) · boundary (for seam) · layer, wrapper (for module or adapter).

Phrasings that fit:

- "Order intake module is shallow: interface nearly matches the implementation."
- "Pricing leaks across the seam."
- "Deepen: one interface, one place to test."
- "Two adapters justify the seam: HTTP in prod, in-memory in tests."

Wins bullets name the gain in glossary terms: "locality: bugs concentrate in one module", "leverage: one interface, N call sites", "interface shrinks; implementation absorbs the pass-through modules". Do not write "easier to maintain" or "cleaner code".

No hedging, no throat-clearing, no "it's worth noting that". If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it. If a term is not in the `codebase-design` glossary, reach for one that is before inventing a new one.
