import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTPUTS } from './export-raster.mjs';

test('every output names the SVG it is rasterised from', () => {
  assert.ok(OUTPUTS.length > 0);
  for (const o of OUTPUTS) {
    assert.ok(o.source, `${o.file} has no source`);
    assert.ok(o.file, 'output has no filename');
  }
});

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

test('every declared source resolves to a real fixture file', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const source of new Set(OUTPUTS.map((o) => o.source))) {
    assert.ok(
      existsSync(join(here, 'fixtures', source)),
      `${source} is declared as a source but has no fixture`,
    );
  }
});
