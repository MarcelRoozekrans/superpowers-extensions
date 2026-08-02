# logo-design Delivery Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the delivery gap in the `logo-design` plugin — raster export, repo integration, and auto-gathered brief context — so a run ends with the mark wired into the host project rather than with seven SVGs and a document.

**Architecture:** Three additive changes. A new Node CLI at `plugins/logo-design/skills/logo-design/scripts/export-raster.mjs` rasterises the SVG set into the icon PNGs and `favicon.ico` that real hosts consume, detecting whatever converter is on the machine and degrading to `UNRUN` when none is — the same posture the skill already takes for a missing Playwright MCP. A new **Step 8** in `SKILL.md` replaces only the icon files a project already has. A new **Step 0 item 0** prefills the brief from `package.json` and the README instead of asking the user for facts already on disk. The four reference files (`construction.md`, `mark-types.md`, `reproduction.md`, `anti-slop.md`) are not touched — nothing here changes how a mark is drawn or graded.

**Tech Stack:** Node 24 (`node:test`, `node:child_process`, zero runtime dependencies), markdown skills, markdownlint-cli2, commitlint with a scope enum (`logo-design` already registered), the repo's existing `check:registries` and `check:conventions` guards.

**Source of the gap analysis:** comparison against [neonwatty/logo-designer-skill](https://github.com/neonwatty/logo-designer-skill), which ships `scripts/export.sh` and a repo-integration phase we do not have.

---

## Decisions taken before Task 1

These are settled. Do not relitigate them mid-execution; if one turns out to be wrong, stop and say so.

### D1 — The plugin ships an executable script, and it is the first one that does

Every plugin in `plugins/` is currently pure markdown. `find plugins -name '*.sh' -o -name '*.mjs'` returns nothing. This plan breaks that.

It is justified because **rasterisation cannot be done by arithmetic**, which is the bar the rest of this skill is built to. Every other value in the plugin is computed from geometry the model can read. A PNG is not; it needs a rasteriser, and the plugin already depends on one optionally (Playwright MCP, for the M3 diff). The script is the honest form of a dependency the skill already has.

The script is **Node, not bash.** Upstream's `export.sh` is bash-and-Homebrew-shaped and does not run on Windows without git-bash. The repo already runs Node 24 guard scripts (`scripts/check-registries.mjs`, `scripts/check-conventions.mjs`), so Node is the portable choice here.

### D2 — Which SVG feeds which PNG is a rule, not a convenience

Upstream rasterises one file at all seven sizes. **We must not**, and this is the single place our rigor actually pays off in the delivery layer.

`logo-favicon.svg` is a *redraw*, not a scale — [SKILL.md:336](../../plugins/logo-design/skills/logo-design/SKILL.md#L336) — built to satisfy F1/F2/F3 in `reproduction.md § The favicon's own spec`. `logo-mark.svg` is the master and is specified down to its own computed minimum size, which is above 16 px on essentially every mark.

So the routing is fixed:

| Output | Source SVG | Why |
|---|---|---|
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.ico` | `logo-favicon.svg` | at or below the master's minimum size; the redraw exists for exactly these |
| `apple-touch-icon.png` (180) | `logo-mark.svg` | above the master's minimum on any conformant mark |
| `icon-192.png`, `icon-512.png`, `icon-1024.png` | `logo-mark.svg` | same |

**Rasterising the master at 16 px ships a mark the skill's own reproduction layer already failed.** The script enforces the routing; it does not accept an arbitrary size list against an arbitrary file.

### D3 — Scope: icon rasters only

[SKILL.md:24](../../plugins/logo-design/skills/logo-design/SKILL.md#L24) refuses "broader brand collateral — social cards, slide templates, email signatures" as out of scope **by design, not by oversight**. An OG/social image is collateral. It is not in this plan and must not be added to the script.

An icon raster is not collateral: it is a reproduction of the mark into a container that cannot accept SVG. That distinction is what keeps this plan inside the skill's stated scope.

### D4 — Export degrades; it never blocks

Identical to Shared Protocol item 3. No converter on the machine means: the SVG set still ships, `LOGO.md` records the raster rows `UNRUN — no rasteriser on this machine; <the install line>`, and § Production handoff → *Still to do* carries the export step. **Never fail the run, never fake a PNG, never claim the icons shipped.**

### D5 — `logo-review` has to learn about rasters, or it breaks

[SKILL.md:488](../../plugins/logo-design/skills/logo-design/SKILL.md#L488) says a mark that "exists only as a raster" puts Layers 1 and 2 entirely `UNRUN`. Once we ship PNGs into `assets/brand/`, the existing-mark guard will find them and that clause will misfire on a set that has a perfectly good vector master.

Task 8 fixes this. It is not optional polish — shipping Tasks 1–7 without it makes `logo-review` wrong on every mark this skill produces from now on.

### D6 — Out of scope for this plan

Named so nobody adds them mid-flight:

- **Parallel concept generation.** Real speedup, separate PR, different risk profile — each candidate owes a derivation chain and its own `LOGO.md` rows, which a subagent has to carry back.
- **Regrading C1/C2 off true PNG rasters.** Tempting once a rasteriser exists, and probably right eventually. It changes the grading instrument, and the instrument is fixed on purpose.
- **`AskUserQuestion` for Step 1.** UX polish, no dependency on this work.
- **A packaged example / showcase.** Documentation work.

---

## Task 1: Test harness and fixture

No test runner exists in this repo. Node 24 ships `node:test`, so this adds a runner with zero new dependencies.

**Files:**

- Create: `plugins/logo-design/skills/logo-design/scripts/export-raster.mjs`
- Create: `plugins/logo-design/skills/logo-design/scripts/export-raster.test.mjs`
- Create: `plugins/logo-design/skills/logo-design/scripts/fixtures/logo-mark.svg`
- Create: `plugins/logo-design/skills/logo-design/scripts/fixtures/logo-favicon.svg`
- Modify: `package.json` (add a `test` script)

**Step 1: Write the two fixture SVGs**

They must be conformant to `construction.md` — `xmlns` present, `viewBox="0 0 256 256"`, no `width`/`height`, no `filter`, paint bound to `currentColor`. A ring and a disc are enough; this fixture is testing the exporter, not the drawing.

`plugins/logo-design/skills/logo-design/scripts/fixtures/logo-mark.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Fixture mark">
  <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-width="32"/>
  <rect x="112" y="32" width="32" height="96" fill="currentColor"/>
</svg>
```

`plugins/logo-design/skills/logo-design/scripts/fixtures/logo-favicon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Fixture favicon">
  <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-width="48"/>
</svg>
```

**Step 2: Write the failing test**

`plugins/logo-design/skills/logo-design/scripts/export-raster.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OUTPUTS } from './export-raster.mjs';

test('every output names the SVG it is rasterised from', () => {
  assert.ok(OUTPUTS.length > 0);
  for (const o of OUTPUTS) {
    assert.ok(o.source, `${o.file} has no source`);
    assert.ok(o.file, 'output has no filename');
  }
});
```

**Step 3: Create the module with just enough to import**

`plugins/logo-design/skills/logo-design/scripts/export-raster.mjs`:

```js
#!/usr/bin/env node
// Rasterise a logo-design SVG set into the icon files hosts actually consume.
// Zero dependencies at rest: detects whatever converter is on the machine.
// See SKILL.md Step 6.5. Degrades to UNRUN; never blocks a run.

export const OUTPUTS = [];
```

**Step 4: Run the test to verify it fails**

Run: `node --test "plugins/logo-design/skills/logo-design/scripts/**/*.test.mjs"`

Expected: FAIL — `assert.ok(OUTPUTS.length > 0)` on an empty array.

> **Pass a glob, never a bare directory.** `node --test <dir>` does not do recursive discovery on this setup — it resolves the path as a module and throws `Cannot find module '...\scripts'`. Verified on Node 24.10.0 and 22.22.0, with and without a trailing slash, forward and backslash, and against a throwaway directory in `%TEMP%`. Bare `node --test` (auto-discovery from cwd) works, and so does an explicit glob; a directory argument does not. A directory path here crashes the runner regardless of `OUTPUTS`, which would make Task 2's red→green transition unreachable.

**Step 5: Add the `test` script to `package.json`**

Add to `scripts`, after `check:conventions`:

```json
"test": "node --test plugins/logo-design/skills/logo-design/scripts/**/*.test.mjs"
```

**Step 6: Verify the runner is wired**

Run: `npm test`

Expected: same single failure, now via npm.

**Step 7: Commit**

```bash
git add plugins/logo-design/skills/logo-design/scripts/ package.json
git commit -m "test(logo-design): add the raster exporter test harness and fixtures"
```

---

## Task 2: The output table

Encodes D2. This is the rule the rest of the script serves.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.mjs`
- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.test.mjs`

**Step 1: Write the failing test**

Append to `export-raster.test.mjs`:

```js
test('sizes at or below the master minimum come from the favicon redraw', () => {
  for (const o of OUTPUTS.filter((x) => x.size <= 48)) {
    assert.equal(
      o.source,
      'logo-favicon.svg',
      `${o.file} at ${o.size}px must come from the favicon redraw, not the master`,
    );
  }
});

test('sizes above the master minimum come from the master', () => {
  for (const o of OUTPUTS.filter((x) => x.size > 48)) {
    assert.equal(o.source, 'logo-mark.svg', `${o.file} at ${o.size}px must come from the master`);
  }
});

test('the ico is packed from the favicon redraw at three sizes', () => {
  const ico = OUTPUTS.find((o) => o.file === 'favicon.ico');
  assert.ok(ico, 'favicon.ico is missing from the output table');
  assert.equal(ico.source, 'logo-favicon.svg');
  assert.deepEqual(ico.pack, [16, 32, 48]);
});
```

**Step 2: Run to verify it fails**

Run: `npm test`

Expected: FAIL — `favicon.ico is missing from the output table`.

**Step 3: Fill in the table**

Replace `export const OUTPUTS = [];` with:

```js
// D2 in the plan: routing is a rule, not a convenience. logo-favicon.svg is a
// redraw built for small sizes (reproduction.md § The favicon's own spec);
// logo-mark.svg is specified above its own computed minimum. Rasterising the
// master at 16px ships a mark this skill's reproduction layer already failed.
export const OUTPUTS = [
  { file: 'favicon-16.png', size: 16, source: 'logo-favicon.svg' },
  { file: 'favicon-32.png', size: 32, source: 'logo-favicon.svg' },
  { file: 'favicon-48.png', size: 48, source: 'logo-favicon.svg' },
  { file: 'favicon.ico', source: 'logo-favicon.svg', pack: [16, 32, 48] },
  { file: 'apple-touch-icon.png', size: 180, source: 'logo-mark.svg' },
  { file: 'icon-192.png', size: 192, source: 'logo-mark.svg' },
  { file: 'icon-512.png', size: 512, source: 'logo-mark.svg' },
  { file: 'icon-1024.png', size: 1024, source: 'logo-mark.svg' },
];
```

**Step 4: Run to verify it passes**

Run: `npm test`

Expected: PASS, 4 tests. Note the `size <= 48` filter skips `favicon.ico` (no `size` key, `undefined <= 48` is false) — that is why the ico has its own test.

**Step 5: Commit**

```bash
git add plugins/logo-design/skills/logo-design/scripts/
git commit -m "feat(logo-design): route each raster to the SVG its size is specified for"
```

---

## Task 3: Converter detection

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.mjs`
- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.test.mjs`

**Step 1: Write the failing test**

```js
import { detectConverter, CONVERTERS } from './export-raster.mjs';

test('every converter declares a probe and an argv builder', () => {
  for (const c of CONVERTERS) {
    assert.ok(c.bin, 'converter has no binary name');
    assert.ok(Array.isArray(c.probe), `${c.bin} has no probe args`);
    assert.equal(typeof c.argv, 'function', `${c.bin} has no argv builder`);
  }
});

test('detection returns null rather than throwing when nothing is installed', () => {
  const found = detectConverter({ only: '__definitely-not-a-real-binary__' });
  assert.equal(found, null);
});
```

**Step 2: Run to verify it fails**

Run: `npm test`

Expected: FAIL — `SyntaxError: The requested module does not provide an export named 'detectConverter'`.

**Step 3: Implement detection**

> **Never add `convert` to this list.** On Windows, `convert` is `C:\WINDOWS\system32\convert` — the NTFS filesystem conversion utility, not ImageMagick. It is on the PATH of every Windows machine, so a probe for it succeeds and the exporter then hands filesystem-conversion arguments to a disk tool. ImageMagick's portable binary is `magick`. This was verified on the development machine: `convert` resolved, every real rasteriser did not.

Append to `export-raster.mjs`:

```js
import { spawnSync } from 'node:child_process';

// Ordered by output quality for flat vector art. resvg and librsvg are the two
// that get stroke geometry right at 16px; Inkscape and ImageMagick are fallbacks
// that are far more likely to already be installed.
export const CONVERTERS = [
  {
    bin: 'resvg',
    probe: ['--version'],
    argv: (svg, out, size) => [svg, out, '--width', String(size), '--height', String(size)],
  },
  {
    bin: 'rsvg-convert',
    probe: ['--version'],
    argv: (svg, out, size) => ['-w', String(size), '-h', String(size), '-o', out, svg],
  },
  {
    bin: 'inkscape',
    probe: ['--version'],
    argv: (svg, out, size) => [
      svg,
      '--export-type=png',
      `--export-filename=${out}`,
      `--export-width=${size}`,
      `--export-height=${size}`,
    ],
  },
  {
    bin: 'magick',
    probe: ['-version'],
    argv: (svg, out, size) => [
      '-background',
      'none',
      '-density',
      String(size * 4),
      svg,
      '-resize',
      `${size}x${size}`,
      out,
    ],
  },
];

export function detectConverter({ only } = {}) {
  const list = only ? [{ bin: only, probe: ['--version'], argv: () => [] }] : CONVERTERS;
  for (const c of list) {
    // spawnSync sets .error to ENOENT rather than throwing when the binary is
    // absent, which is what makes this portable to Windows without `command -v`.
    const r = spawnSync(c.bin, c.probe, { stdio: 'ignore', shell: false });
    if (!r.error && r.status === 0) return c;
  }
  return null;
}

export const INSTALL_HINT = [
  'No SVG rasteriser found. Install one of:',
  '  resvg         cargo install resvg   (best small-size output)',
  '  librsvg       brew install librsvg | apt install librsvg2-bin',
  '  Inkscape      https://inkscape.org',
  '  ImageMagick   https://imagemagick.org',
].join('\n');
```

**Step 4: Run to verify it passes**

Run: `npm test`

Expected: PASS, 6 tests.

**Step 5: Check what is actually on this machine**

Run: `node -e "import('./plugins/logo-design/skills/logo-design/scripts/export-raster.mjs').then(m=>console.log(m.detectConverter()?.bin ?? 'none'))"`

Record the answer — Task 5's integration test is conditional on it, and if it prints `none` you will need to install one before Task 5 can go green.

**Step 6: Commit**

```bash
git add plugins/logo-design/skills/logo-design/scripts/
git commit -m "feat(logo-design): detect an available SVG rasteriser without shelling out to command -v"
```

---

## Task 4: ICO packing

`favicon.ico` is still required by hosts that ignore `favicon.svg`, and no converter above emits a multi-image ICO except ImageMagick. An ICO is a 6-byte header, a 16-byte directory entry per image, and the PNG bytes — about forty lines, and it removes an ImageMagick dependency we would otherwise have to insist on.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.mjs`
- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.test.mjs`

**Step 1: Write the failing test**

```js
import { packIco } from './export-raster.mjs';

test('packIco writes a valid ICONDIR with one entry per image', () => {
  const a = Buffer.from('AAAA');
  const b = Buffer.from('BBBBBB');
  const ico = packIco([
    { size: 16, data: a },
    { size: 32, data: b },
  ]);

  assert.equal(ico.readUInt16LE(0), 0, 'reserved must be 0');
  assert.equal(ico.readUInt16LE(2), 1, 'type must be 1 (icon)');
  assert.equal(ico.readUInt16LE(4), 2, 'count must match the image count');

  assert.equal(ico.readUInt8(6), 16, 'first entry width');
  assert.equal(ico.readUInt32LE(6 + 8), a.length, 'first entry byte length');
  assert.equal(ico.readUInt32LE(6 + 12), 6 + 32, 'first entry offset');

  assert.equal(ico.readUInt8(22), 32, 'second entry width');
  assert.equal(ico.readUInt32LE(22 + 12), 6 + 32 + a.length, 'second entry offset');

  assert.equal(ico.length, 6 + 32 + a.length + b.length);
});

test('packIco encodes 256 as 0, per the ICO spec', () => {
  const ico = packIco([{ size: 256, data: Buffer.from('X') }]);
  assert.equal(ico.readUInt8(6), 0);
  assert.equal(ico.readUInt8(7), 0);
});
```

**Step 2: Run to verify it fails**

Run: `npm test`

Expected: FAIL — no export named `packIco`.

**Step 3: Implement**

Append to `export-raster.mjs`:

```js
// ICO container: ICONDIR (6 bytes) + one ICONDIRENTRY (16 bytes) per image +
// the image blobs. PNG-in-ICO is valid on every target that matters. A byte of
// 0 in the width or height field means 256 — the field is one byte wide.
export function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;

  images.forEach((img, i) => {
    const at = i * 16;
    const dim = img.size >= 256 ? 0 : img.size;
    dir.writeUInt8(dim, at);
    dir.writeUInt8(dim, at + 1);
    dir.writeUInt8(0, at + 2); // palette size: 0 for truecolour
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(img.data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += img.data.length;
  });

  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}
```

**Step 4: Run to verify it passes**

Run: `npm test`

Expected: PASS, 8 tests.

**Step 5: Commit**

```bash
git add plugins/logo-design/skills/logo-design/scripts/
git commit -m "feat(logo-design): pack a multi-size favicon.ico without an ImageMagick dependency"
```

---

## Task 5: The CLI, end to end

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.mjs`
- Modify: `plugins/logo-design/skills/logo-design/scripts/export-raster.test.mjs`

**Step 0: Install a rasteriser in CI, so this task's integration test is not permanently skipped**

The `test` job added in Task 1 runs on bare `ubuntu-latest` with no rasteriser. The integration test below is gated `{ skip: !haveConverter }`, so **without this step it never runs in CI — not once, ever.** The whole `exportRasters` path, the ICO packing, and the converter argv builders would then have zero automated coverage, and the only guard left would be Task 2's boundary assertions on the routing table.

`librsvg2-bin` is in Ubuntu's default repositories and provides `rsvg-convert`, which is second in the detection order. Add to the `test` job in `.github/workflows/lint.yml`, before the `npm test` step:

```yaml
      # Without a rasteriser the exporter's integration test skips itself, so
      # the whole export path would have no CI coverage at all. rsvg-convert is
      # second in the detection order and is a single apt package.
      - name: Install an SVG rasteriser
        run: sudo apt-get update && sudo apt-get install -y librsvg2-bin
```

Then amend the existing comment in that job, which currently says tests requiring a rasteriser "skip themselves when none is installed, which is the case on a bare runner" — that stops being true here and a stale comment is worse than none.

**Step 1: Write the failing integration test**

It still skips itself when no converter is installed, so a contributor without one gets a green local run rather than a spurious failure. CI, after Step 0, actually runs it.

```js
import { mkdtempSync, existsSync, readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportRasters } from './export-raster.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const haveConverter = detectConverter() !== null;

test('exportRasters writes every output from its declared source', { skip: !haveConverter }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'logo-raster-'));
  mkdirSync(join(dir, 'brand'), { recursive: true });
  for (const f of ['logo-mark.svg', 'logo-favicon.svg']) {
    copyFileSync(join(here, 'fixtures', f), join(dir, 'brand', f));
  }

  const result = exportRasters(join(dir, 'brand'));

  assert.equal(result.status, 'ok');
  for (const o of OUTPUTS) {
    const p = join(dir, 'brand', o.file);
    assert.ok(existsSync(p), `${o.file} was not written`);
    assert.ok(readFileSync(p).length > 0, `${o.file} is empty`);
  }

  const ico = readFileSync(join(dir, 'brand', 'favicon.ico'));
  assert.equal(ico.readUInt16LE(2), 1, 'favicon.ico is not an ICO');
  assert.equal(ico.readUInt16LE(4), 3, 'favicon.ico should carry three images');
});

test('a missing source SVG is reported, not thrown', () => {
  const dir = mkdtempSync(join(tmpdir(), 'logo-raster-empty-'));
  const result = exportRasters(dir);
  assert.equal(result.status, 'missing-source');
  assert.ok(result.missing.includes('logo-mark.svg'));
});

test('no converter reports unrun rather than failing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'logo-raster-nc-'));
  mkdirSync(dir, { recursive: true });
  for (const f of ['logo-mark.svg', 'logo-favicon.svg']) {
    copyFileSync(join(here, 'fixtures', f), join(dir, f));
  }
  const result = exportRasters(dir, { converter: null, forceNoConverter: true });
  assert.equal(result.status, 'unrun');
  assert.match(result.reason, /rasteriser/i);
});
```

**Step 2: Run to verify it fails**

Run: `npm test`

Expected: FAIL — no export named `exportRasters`.

**Step 3: Implement**

Append to `export-raster.mjs`:

```js
import { readFileSync as read, writeFileSync, existsSync as exists, unlinkSync } from 'node:fs';
import { join as path } from 'node:path';

export function exportRasters(dir, opts = {}) {
  const sources = [...new Set(OUTPUTS.map((o) => o.source))];
  const missing = sources.filter((s) => !exists(path(dir, s)));
  if (missing.length) return { status: 'missing-source', missing };

  const converter = opts.forceNoConverter ? null : (opts.converter ?? detectConverter());
  if (!converter) return { status: 'unrun', reason: INSTALL_HINT, written: [] };

  const written = [];

  const raster = (source, out, size) => {
    const r = spawnSync(converter.bin, converter.argv(path(dir, source), out, size), {
      stdio: 'ignore',
      shell: false,
    });
    if (r.error || r.status !== 0) {
      throw new Error(`${converter.bin} failed on ${source} at ${size}px`);
    }
  };

  for (const o of OUTPUTS) {
    const out = path(dir, o.file);
    if (o.pack) {
      // Rasterise each packed size to a temp PNG, pack, then clean up.
      const images = o.pack.map((size) => {
        const tmp = path(dir, `.ico-${size}.png`);
        raster(o.source, tmp, size);
        const data = read(tmp);
        unlinkSync(tmp);
        return { size, data };
      });
      writeFileSync(out, packIco(images));
    } else {
      raster(o.source, out, o.size);
    }
    written.push({ file: o.file, source: o.source, size: o.size ?? o.pack.join('/') });
  }

  return { status: 'ok', converter: converter.bin, written };
}

// CLI: node export-raster.mjs <brand-dir>
if (process.argv[1] && process.argv[1].endsWith('export-raster.mjs')) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node export-raster.mjs <brand-dir>');
    process.exit(2);
  }
  const result = exportRasters(dir);
  if (result.status === 'missing-source') {
    console.error(`Missing source SVG(s): ${result.missing.join(', ')}`);
    process.exit(2);
  }
  if (result.status === 'unrun') {
    console.error(result.reason);
    process.exit(3); // 3 means UNRUN, not failure — SKILL.md Step 6.5 reads this.
  }
  console.log(`Using: ${result.converter}\n`);
  for (const w of result.written) console.log(`  ${w.file}  (${w.size}) <- ${w.source}`);
  console.log(`\nDone. ${result.written.length} files in ${dir}`);
}
```

**Step 4: Run to verify it passes**

Run: `npm test`

Expected: PASS, 11 tests — or 10 with one skipped if no converter is installed.

**Step 5: Run the CLI against this repo's own brand directory**

Run: `node plugins/logo-design/skills/logo-design/scripts/export-raster.mjs assets/brand`

Expected: either the eight-file listing, or the install hint at exit code 3. **Do not commit the generated PNGs in this step** — that happens deliberately in Task 10.

Run: `git status --short assets/brand` and `git checkout -- assets/brand 2>/dev/null; git clean -f assets/brand` to reset if files were produced.

**Step 6: Commit**

```bash
git add plugins/logo-design/skills/logo-design/scripts/
git commit -m "feat(logo-design): export the icon raster set and degrade to unrun without a converter"
```

---

## Task 6: Wire the export into `SKILL.md` as Step 6.5

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md` — insert after Step 6, before Step 7
- Modify: `plugins/logo-design/skills/logo-design/SKILL.md:359-370` — the structural self-verification
- Modify: `plugins/logo-design/skills/logo-design/SKILL.md:386-405` — the slot map

**Step 1: Insert the new step after Step 6's final paragraph**

````markdown
### Step 6.5 — the raster set

Seven SVGs are not a shipped identity. A `favicon.ico`, an `apple-touch-icon.png` and the PWA icon sizes are what hosts, app stores and older browsers actually read, and none of them accepts SVG.

Run the bundled exporter against the directory Step 0 detected:

```bash
node <skill-dir>/scripts/export-raster.mjs <brand-dir>
```

It writes eight files and **routes each one to the SVG whose reproduction spec covers its size** — 16, 32, 48 and the `.ico` from `logo-favicon.svg`, and 180, 192, 512 and 1024 from `logo-mark.svg`. That routing is not configurable, and the reason is `reproduction.md § The favicon's own spec`: the favicon is a redraw for exactly those sizes, and the master is specified above its own computed minimum. **Never rasterise the master at 16 px** — it ships a mark this skill's own binary layer already failed.

**Exit code 3 is `UNRUN`, not a failure.** No rasteriser on the machine degrades exactly as a missing Playwright MCP does — [Shared Protocol](#shared-protocol) item 3. Ship the SVG set, record every raster row `UNRUN — no rasteriser on this machine; <the install line the script printed>` in § Variants → *Raster set*, put the install step into § Production handoff → *Still to do*, and say so in the first sentence at Step 7. **Do not fake a PNG, do not substitute a screenshot, and do not report the icons as shipped.**

Exit code 2 is a real failure — a source SVG is missing, which means Step 6 did not complete. Fix Step 6.

**Record every written file** in § Variants → *Raster set* and in § Asset manifest, each row naming the SVG it came from. A raster whose source is not recorded cannot be regenerated when the mark changes, and a raster nobody can regenerate is the file that goes stale first.

**No raster is graded.** The exporter is a converter, not an instrument: `reproduction.md`'s checklist is graded on the vector source, and a PNG adds no evidence about a mark whose geometry was already measured. This step ships files; it does not decide anything.
````

**Step 2: Fix the structural self-verification block**

It currently reads "Five checks:" above six checkboxes — a pre-existing off-by-one. Change the lead-in to **"Eight checks:"** and add two items after the `currentColor` item:

```markdown
- [ ] Every file the exporter reported written exists at its recorded path and appears in § Asset manifest with the SVG it was rasterised from. Where the exporter returned `UNRUN`, every raster row says so and no raster file is on disk.
- [ ] No raster file in the asset directory lacks a manifest row. A stray PNG is the same finding as a stray SVG.
```

Then change **"Fix it and re-run all five"** to **"Fix it and re-run all eight"**, and update the paragraph that begins "None of the five is render-dependent" to "None of the eight is render-dependent" — the raster checks read the filesystem, not a render, so the claim still holds.

**Step 3: Add the slot-map rows**

In the *Where each `LOGO.md` slot is filled* table, after the `Variants — table, lockup measurements, favicon, print minimums` row:

```markdown
| Variants — raster set | Step 6.5 |
```

And amend the `Asset manifest` row to `Step 7, from Step 6 and Step 6.5, verified by the structural self-verification`.

**Step 4: Verify the markdown lints**

Run: `npm run lint:md`

Expected: no errors.

**Step 5: Verify no commit literal was introduced**

Run: `npm run check:conventions`

Expected: PASS. The new step delegates nothing to the commit protocol, so it must not mention a message format.

**Step 6: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "feat(logo-design): ship the raster icon set at a new Step 6.5"
```

---

## Task 7: Template slots for the raster set

`logo.template.md` has no home for a PNG. Without this, Step 6.5 has nowhere to record and Step 7's empty-cell sweep cannot see the gap.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/templates/logo.template.md` — after `### Favicon`, before `### Print minimums`
- Modify: `plugins/logo-design/skills/logo-design/templates/logo.template.md` — § Production handoff → *Still to do*

**Step 1: Insert the raster section**

```markdown
### Raster set

The files hosts read when they cannot read SVG. Every row names the SVG it was rasterised from — a raster whose source is not recorded cannot be regenerated when the mark changes.

**Nothing here is graded.** `reproduction.md`'s checklist is graded on the vector source; these are conversions of an already-measured geometry.

| File | px | Rasterised from | Intended slot |
|---|---|---|---|
| `favicon-16.png` | 16 | `logo-favicon.svg` | `<link rel="icon" sizes="16x16">` |
| `favicon-32.png` | 32 | `logo-favicon.svg` | `<link rel="icon" sizes="32x32">` |
| `favicon-48.png` | 48 | `logo-favicon.svg` | legacy browser tab |
| `favicon.ico` | 16/32/48 | `logo-favicon.svg` | site root, for hosts that ignore `favicon.svg` |
| `apple-touch-icon.png` | 180 | `logo-mark.svg` | iOS home screen |
| `icon-192.png` | 192 | `logo-mark.svg` | web app manifest |
| `icon-512.png` | 512 | `logo-mark.svg` | web app manifest, splash |
| `icon-1024.png` | 1024 | `logo-mark.svg` | app store listing |

| Field | Record |
|---|---|
| Rasteriser used | `<name and version>`, or `UNRUN — no rasteriser on this machine; <the install line>` |
| Sizes at or below 48 px come from the favicon redraw | `<yes>` — never the master; see `reproduction.md § The favicon's own spec` |
| Files written | `<n of 8>`, or `0 — UNRUN` |

Where the exporter returned `UNRUN`, every row above carries that token, no raster file is on disk, and the install step is in [Still to do](#still-to-do).
```

**Step 2: Add the *Still to do* row**

After the `Declared face installed where the sheet renders` row:

```markdown
| Icon raster set exported | `<yes — n files, rasteriser <name>>`, or `not performed — no rasteriser on the machine that ran this; <the install line>. The SVG set ships; the eight raster rows in [Raster set](#raster-set) stay UNRUN until it is` |
```

**Step 3: Add the manifest field**

In § Asset manifest's second table:

```markdown
| Every raster names the SVG it was rasterised from | `<yes>`, or `n/a — UNRUN, no raster shipped` |
```

**Step 4: Lint**

Run: `npm run lint:md`

Expected: no errors.

**Step 5: Commit**

```bash
git add plugins/logo-design/skills/logo-design/templates/logo.template.md
git commit -m "feat(logo-design): give the raster set a slot in the LOGO.md template"
```

---

## Task 8: Teach `logo-review` about rasters

**This is not optional.** D5: without it, the existing-mark guard finds the PNGs we now ship and [SKILL.md:488](../../plugins/logo-design/skills/logo-design/SKILL.md#L488) puts Layers 1 and 2 entirely `UNRUN` on a set that has a perfectly good vector master.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md` — `logo-review` Step 1 item 2
- Modify: `plugins/logo-design/skills/logo-design/SKILL.md` — `logo-review` Step 3, after the context-dependent items paragraph

**Step 1: Rewrite Step 1 item 2**

Current text puts both layers `UNRUN` for any raster. Replace with:

```markdown
2. **Vector source, or nothing — but a raster *beside* a vector is not a raster-only mark.** Layers 1 and 2 read the SVG. Two cases, and conflating them is how a sound set gets audited as though it had no source:

   - **A raster with a vector master in the same set** — the icon PNGs `logo-concept` § Step 6.5 ships, or any equivalent. Grade the **vector**. The rasters are conversions of a geometry that is already being measured and add no evidence; they are checked only by the raster provenance item in Layer 1 below.
   - **A raster with no vector anywhere** — a PNG, an ICO or a screenshot and nothing else. **Both layers are entirely `UNRUN`**, that is the first sentence of the report, and the single remediation is the vector master.

   In neither case is a stand-in derived from a bitmap. A source-derived stand-in is a different check wearing this one's name.
```

**Step 2: Add the provenance item to Step 3**

After the *Context-dependent items* paragraph:

```markdown
**Raster provenance.** Where the set carries rasters alongside a vector master, one item, graded from the files and the record: **every raster is accounted for by a manifest row naming the SVG it was rasterised from, and every size at or below 48 px names the favicon redraw rather than the master.** A raster with no row is an undocumented asset — the same finding as an undocumented SVG. A 16 px raster naming the master is a **FAIL**: it ships the master at a size its own recorded minimum excludes, which is the one thing `logo-concept` § Step 6.5's routing exists to prevent. Where there is no `LOGO.md`, this is `UNRUN — no record; LOGO.md § Variants → Raster set`, like every other pure-record item.
```

**Step 3: Lint and check conventions**

Run: `npm run lint:md && npm run check:conventions`

Expected: both PASS.

**Step 4: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "fix(logo-design): stop logo-review reading a shipped raster set as a vectorless mark"
```

---

## Task 9: Step 8 — repo integration

Wires the mark into the host project. **Replaces only files that already exist** — adding icon files a project does not reference produces dead assets and a diff nobody asked for.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md` — insert after Step 7, before *Where each `LOGO.md` slot is filled*

**Step 1: Insert the step**

````markdown
### Step 8 — wire it into the project

Optional, and **asked for rather than assumed**: Step 7 committed the asset set, and replacing a project's live icons is a separate decision. Offer it, name every file that would change, and wait.

> "The set is committed. I can also replace the icons this project already ships — I found `<paths>`. Nothing else would change, and I would not add any icon file the project does not already reference. Want me to?"

**1. Find the slots that already exist.** Only these, and only where the file is already there:

```text
public/favicon.ico          public/favicon.svg          public/apple-touch-icon.png
public/icon-192.png         public/icon-512.png         public/pwa-192x192.png
public/pwa-512x512.png      static/favicon.ico          wwwroot/favicon.ico
src/app/favicon.ico         app/favicon.ico
**/AppIcon.appiconset/*.png
```

**2. Replace, never add.** A slot that does not exist is not created. The project's own build config decides which icons it ships, and this flow does not have that config in view — inventing a file the manifest never references leaves an orphan that outlives the reason for it. Where the project plainly wants an icon it has no file for, **say so and stop**; that is a change to the project's configuration, not to its assets.

**3. Match the source by size, per Step 6.5's routing.** A 16, 32 or 48 px slot takes the favicon redraw's raster; everything larger takes the master's. **A slot whose pixel size you cannot determine from its name is not filled** — record it and ask.

**4. Update a manifest only where one already lists the file being replaced.** `manifest.json`, `site.webmanifest`, and `<link rel="icon">` tags in an existing `index.html`. Change the *file* the entry points at only where the filename itself changed; never add an entry, and never change an entry's `sizes` or `type` to suit our filenames. **Where our filename differs from the project's, keep the project's** — the host's build depends on its own names, and renaming its assets to match ours is a breaking change dressed as a logo update.

**5. Record what changed** in § Asset manifest, one row per replaced file, each naming the file it was replaced with and the slot it fills. A replaced file is a shipped file: the manifest that omits it is wrong about what this project now contains.

**6. Verify before committing.** Every replaced path still exists, is non-empty, and — for a raster — carries the PNG or ICO magic bytes it did before. A replacement that truncated a file is worse than no replacement, because the previous asset is now gone.

**The commit.** [Shared Protocol](#shared-protocol) item 7. Supply the triple to `project-orchestration`'s **Commit & Release Protocol**:

- **`type`** — `chore`
- **`scope`** — resolved by the protocol from the host project's `Scope source`; where no allowed scope matches, its `Fallback when scope not allowed` decides. Do not invent one.
- **`subject`** — `replace project icons with the new brand mark`

Stage by explicit pathspec — every replaced file and `docs/design/LOGO.md`, and nothing else. **Separate from Step 7's commit**: that one added the asset set, this one changes what the project ships, and a reviewer has to be able to revert the second without losing the first.

**Render nothing locally.** No message literal, no message format, no tag scheme, anywhere in this flow.
````

**Step 2: Add the slot-map row**

In the *Where each `LOGO.md` slot is filled* table, amend the `Asset manifest` row to end `, and Step 8 where project icons were replaced`.

**Step 3: Check the conventions guard hard**

Run: `npm run check:conventions`

Expected: PASS. This step names the Commit & Release Protocol, so `check-conventions.mjs` will apply its literal checks to it — the subject line above is a *triple supplied to the protocol*, not a rendered message, which is the same shape Steps 7 already use. If the guard flags it, match the exact phrasing of the existing commit blocks rather than inventing new wording.

**Step 4: Lint**

Run: `npm run lint:md`

**Step 5: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "feat(logo-design): add Step 8 to replace a project's existing icon files"
```

---

## Task 10: Step 0 item 0 — gather the brief before asking for it

Questions 1 and 2 ask for the product's name and what it does. Both are usually sitting in `package.json` and the README, and we make the user type them anyway.

**Files:**

- Modify: `plugins/logo-design/skills/logo-design/SKILL.md` — Step 0, renumber items so this is first
- Modify: `plugins/logo-design/skills/logo-design/SKILL.md` — Step 1's question table, questions 1 and 2

**Step 1: Insert as Step 0 item 1, renumbering the existing seven to 2–8**

```markdown
1. **Read what the project already says about itself, before asking the user for it.** Questions 1 and 2 at [Step 1](#step-1--the-five-questions) ask for the product's name and what it does, and both are usually on disk. Read whichever of these exist — `package.json`, `pyproject.toml`, `*.csproj`, `Cargo.toml`, `README.md`, `index.html`'s `<title>` — and take the name and the one-line description from them.

   **What is found is *proposed*, never assumed.** Show the user what was read and where it came from, in one message, and let them correct it: *"`package.json` says the name is `<x>` and the description is `<y>` — is that the string you want set in type, and is that what it does?"* A `package.json` name is a package identifier and is frequently not the brand string — capitalisation and spacing are design decisions per question 1, and a slug is neither.

   **The verbatim capture is of what the user confirms**, per [Shared Protocol](#shared-protocol) item 1 — not of what the file said. A description lifted from `package.json` and never confirmed is the project's words about itself, which is a different thing from the brief, and the pattern-6 keyword scan run over it is scanning the wrong text.

   **Never block on this and never infer question 4 from it.** A repository says nothing about where the mark has to survive; that answer comes from the user and from nowhere else — see [Question 4's consequences](#question-4s-consequences).
```

**Step 2: Amend Step 1's question table**

Change question 1's *In quick mode* cell to:

```markdown
asked if the one-liner does not carry it; where Step 0 item 1 found a name, proposed for confirmation rather than asked cold
```

And question 2's:

```markdown
asked if absent; where Step 0 item 1 found a description, proposed for confirmation rather than asked cold
```

**Step 3: Fix every cross-reference to a renumbered Step 0 item**

Step 0's items shift by one. Search and update:

Run: `grep -n "Step 0 item [0-9]" plugins/logo-design/skills/logo-design/SKILL.md`

Every hit currently naming item 7 (the typeface check) must become item 8. Check the Prerequisites section, Step 6 item 2, Step 7's *Still to do* bullet, and the slot map's *Typeface* row.

**Step 4: Verify no stale reference survives**

Run: `grep -n "item 7" plugins/logo-design/skills/logo-design/SKILL.md`

Expected: no hit refers to the typeface check. (Shared Protocol item 7 is the commit protocol and is unrelated — do not renumber it.)

**Step 5: Lint and check**

Run: `npm run lint:md && npm run check:conventions && npm run check:registries`

Expected: all PASS.

**Step 6: Commit**

```bash
git add plugins/logo-design/skills/logo-design/SKILL.md
git commit -m "feat(logo-design): prefill the brief from the project before asking for it"
```

---

## Task 11: Docs, metadata, and the dogfood

**Files:**

- Modify: `plugins/logo-design/.claude-plugin/plugin.json`
- Modify: `README.md`
- Modify: `GEMINI.md`
- Create: raster files in `assets/brand/`
- Modify: `docs/design/LOGO.md`

**Step 1: Add the metadata upstream carries and we do not**

`plugins/logo-design/.claude-plugin/plugin.json` — add alongside the existing keys:

```json
"license": "MIT",
"keywords": ["logo", "brand", "svg", "favicon", "identity", "design"]
```

Do **not** add a `version` key. Version lives in `.claude-plugin/marketplace.json` and is bumped by release-please via `release-please-config.json`'s indexed `extra-files` entry; a second copy would drift immediately.

**Step 2: Verify the registries guard still passes**

Run: `npm run check:registries`

Expected: PASS. If it fails on the new keys, the guard asserts an exact manifest shape — read the failure and follow it rather than reverting.

**Step 3: Update the prose**

`README.md` and `GEMINI.md` both describe `logo-design` as producing an SVG set. Add the raster set and Step 8 to both descriptions. Neither is machine-checked, so read each one fully rather than grepping.

**Step 4: Run the exporter against this repo's own mark**

Run: `node plugins/logo-design/skills/logo-design/scripts/export-raster.mjs assets/brand`

Expected: eight files. If it exits 3, install a converter first — this repo dogfoods its own plugin, and shipping the delivery layer without using it is exactly the gap this plan is closing.

**Step 5: Record them in this repo's own `LOGO.md`**

Add the § Variants → *Raster set* section from Task 7's template to `docs/design/LOGO.md`, filled with real values — the rasteriser name and version, and one row per written file. Add the eight rows to § Asset manifest. Add the *Icon raster set exported* row to § Still to do.

**Step 6: Run the structural self-verification by hand**

All eight checks from Task 6 against `assets/brand/`. The two new ones matter most here: every written raster has a manifest row, and no raster in the directory lacks one.

**Step 7: Full guard sweep**

Run: `npm test && npm run lint:md && npm run check:registries && npm run check:conventions`

Expected: all PASS.

**Step 8: Commit**

```bash
git add plugins/logo-design/.claude-plugin/plugin.json README.md GEMINI.md assets/brand docs/design/LOGO.md
git commit -m "feat(logo-design): dogfood the raster export and document the delivery layer"
```

---

## Done when

- [ ] `npm test` passes — 11 tests, or 10 with the integration test skipped on a machine with no converter
- [ ] `npm run lint:md`, `npm run check:registries`, `npm run check:conventions` all pass
- [ ] `node .../export-raster.mjs assets/brand` writes eight files, and the ICO opens in a browser tab
- [ ] `grep -n "Five checks" plugins/logo-design/skills/logo-design/SKILL.md` returns nothing — the off-by-one is gone
- [ ] `logo-review`'s Step 1 no longer puts both layers `UNRUN` on a set carrying rasters beside a vector master
- [ ] `docs/design/LOGO.md` § Raster set carries real values, and `grep UNRUN docs/design/LOGO.md` lists nothing that the export actually ran

## Deliberately not in this plan

Per D6: parallel concept generation, regrading C1/C2 off true PNG rasters, `AskUserQuestion` for Step 1, and a packaged showcase example. Each is a separate PR. None of them blocks this one.
