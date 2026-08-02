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
