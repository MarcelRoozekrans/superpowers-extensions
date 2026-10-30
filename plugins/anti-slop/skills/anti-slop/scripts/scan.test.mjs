import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
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
  assert.equal(scanText('**Match:** `delve`', patterns).length, 0);
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
