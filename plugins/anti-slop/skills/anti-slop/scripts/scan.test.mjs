import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseCatalogue, scanText } from './scan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cataloguePath = join(here, 'fixtures', 'catalogue.md');
const patterns = parseCatalogue(readFileSync(cataloguePath, 'utf8'));

test('parseCatalogue returns named patterns', () => {
  assert.equal(patterns.length, 2);
  assert.deepEqual(patterns.map((p) => p.name), ['Delve', 'Worth noting']);
});

test('scanText reports match and line', () => {
  assert.deepEqual(scanText("Let's delve in.\nFine.", patterns), [
    { name: 'Delve', match: 'delve', line: 1 },
  ]);
});

test('scanText is case-insensitive', () => {
  assert.equal(scanText('Delving deeper', patterns).length, 1);
});

test('scanText respects word boundaries', () => {
  assert.equal(scanText('the delver', patterns).length, 0);
});

test('scanText ignores inline code', () => {
  assert.equal(scanText('run `delve` now', patterns).length, 0);
});

test('scanText ignores fenced code and keeps line numbers', () => {
  const text = 'intro\n```\nwe delve\n```\nthen delve here';
  assert.deepEqual(scanText(text, patterns), [
    { name: 'Delve', match: 'delve', line: 5 },
  ]);
});

test('scanText ignores Bad and Match lines', () => {
  assert.equal(scanText('**Bad:** we delve', patterns).length, 0);
  assert.equal(scanText('**Match:** delve here', patterns).length, 0);
});

test('scanText matches curly apostrophes', () => {
  assert.equal(scanText('It’s worth noting that', patterns).length, 1);
});

test('CLI exits 0 on clean file and 1 on dirty file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  const clean = join(dir, 'clean.md');
  const dirty = join(dir, 'dirty.md');
  writeFileSync(clean, 'All good here.\n');
  writeFileSync(dirty, 'We delve deep.\n');
  const script = join(here, 'scan.mjs');
  const ok = spawnSync('node', [script, cataloguePath, clean], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  const bad = spawnSync('node', [script, cataloguePath, dirty], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /Delve/);
  assert.match(bad.stdout, /dirty\.md:1/);
});

test('CLI runs through a symlinked path and still exits 1 on a dirty file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scan-link-'));
  const dirty = join(dir, 'dirty.md');
  const link = join(dir, 'scan-link.mjs');
  writeFileSync(dirty, 'We delve deep.\n');
  symlinkSync(join(here, 'scan.mjs'), link);
  const bad = spawnSync('node', [link, cataloguePath, dirty], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /Delve/);
});

test('longer fence is not closed by a shorter fence line', () => {
  const text = '````\n```\nwe delve\n```\n````\nthen delve here';
  assert.deepEqual(scanText(text, patterns), [
    { name: 'Delve', match: 'delve', line: 6 },
  ]);
});

test('lookaround patterns handle non-ASCII words', () => {
  const [p] = parseCatalogue(
    '### Een\n\n**Match:** `(?<![\\p{L}\\p{N}])één(?![\\p{L}\\p{N}])`\n',
  );
  assert.equal(scanText('één keer', [p]).length, 1);
  assert.equal(scanText('geéén', [p]).length, 0);
});

test('parseCatalogue throws on Match line before any heading', () => {
  assert.throws(() => parseCatalogue('intro\n**Match:** `x`'), /line 2/);
});

test('parseCatalogue throws on invalid regex', () => {
  assert.throws(() => parseCatalogue('### A\n**Match:** `(`'), /line 2.*invalid regex/);
});

test('CLI exits 2 on missing catalogue and on bad catalogue', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  const file = join(dir, 'a.md');
  const bad = join(dir, 'bad.md');
  writeFileSync(file, 'text\n');
  writeFileSync(bad, '**Match:** `x`\n');
  const script = join(here, 'scan.mjs');
  const missing = spawnSync('node', [script, join(dir, 'nope.md'), file], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /scan:/);
  assert.equal(spawnSync('node', [script, bad, file], { encoding: 'utf8' }).status, 2);
});

const references = join(here, '..', 'references');

function entries(markdown) {
  const out = [];
  let current = null;
  for (const line of markdown.split('\n')) {
    const heading = /^###\s+(.+?)\s*$/.exec(line);
    if (heading) { current = { name: heading[1], bad: [], rewrite: [] }; out.push(current); continue; }
    if (!current) continue;
    const bad = /^\*\*Bad:\*\*\s*(.+)$/.exec(line);
    if (bad) current.bad.push(bad[1]);
    const rewrite = /^\*\*Rewrite:\*\*\s*(.+)$/.exec(line);
    if (rewrite) current.rewrite.push(rewrite[1]);
  }
  return out;
}

for (const file of ['patterns-en.md', 'patterns-nl.md']) {
  const markdown = readFileSync(join(references, file), 'utf8');
  const catalogue = parseCatalogue(markdown);

  test(`${file} passes its own scan`, () => {
    assert.deepEqual(scanText(markdown, catalogue), []);
  });

  for (const entry of entries(markdown)) {
    const own = catalogue.filter((p) => p.name === entry.name);
    if (own.length === 0) continue;
    test(`${file}: "${entry.name}" fires on its Bad line and not on its Rewrite`, () => {
      assert.ok(entry.bad.some((text) => scanText(text, own).length > 0), 'no hit on Bad');
      for (const text of entry.rewrite) assert.deepEqual(scanText(text, own), []);
    });
  }
}
