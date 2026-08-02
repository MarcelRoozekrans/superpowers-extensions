import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTPUTS, CONVERTERS, detectConverter, SOURCE_ARTBOARD, packIco } from './export-raster.mjs';

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
  assert.equal(ico.source, 'logo-favicon.svg', 'favicon.ico must come from the favicon redraw');
  assert.deepEqual(ico.pack, [16, 32, 48]);
});

test('every non-packed output declares a numeric size', () => {
  for (const o of OUTPUTS.filter((x) => !x.pack)) {
    assert.equal(typeof o.size, 'number', `${o.file} has no numeric size`);
  }
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

test('the ImageMagick entry is magick, never convert', () => {
  const names = CONVERTERS.map((c) => c.bin);
  assert.ok(
    !names.includes('convert'),
    'convert is the NTFS filesystem utility on Windows, not ImageMagick — use magick',
  );
  assert.ok(names.includes('magick'), 'ImageMagick should be reachable via its portable name');
});

test('the magick density never renders beyond a 2048px intermediate', () => {
  const magick = CONVERTERS.find((c) => c.bin === 'magick');
  for (const size of [16, 32, 48, 180, 192, 512, 1024]) {
    const argv = magick.argv('in.svg', 'out.png', size);
    const density = Number(argv[argv.indexOf('-density') + 1]);
    assert.ok(Number.isFinite(density), `density for ${size} is not a number`);
    assert.ok(
      (SOURCE_ARTBOARD * density) / 72 <= 2048,
      `size ${size} renders a ${(SOURCE_ARTBOARD * density) / 72}px intermediate`,
    );
  }
});

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

test('every packed image is recoverable at its declared offset and length', () => {
  const images = [
    { size: 16, data: Buffer.from('sixteen') },
    { size: 32, data: Buffer.from('thirty-two') },
    { size: 48, data: Buffer.from('forty-eight!') },
  ];
  const ico = packIco(images);

  assert.equal(ico.readUInt16LE(4), 3, 'count');
  images.forEach((img, i) => {
    const at = 6 + i * 16;
    const len = ico.readUInt32LE(at + 8);
    const off = ico.readUInt32LE(at + 12);
    assert.equal(len, img.data.length, `image ${i} length`);
    assert.deepEqual(
      ico.subarray(off, off + len),
      img.data,
      `image ${i} does not round-trip at its declared offset`,
    );
  });
});
