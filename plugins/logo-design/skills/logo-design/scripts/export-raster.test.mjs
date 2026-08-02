import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OUTPUTS,
  CONVERTERS,
  detectConverter,
  SOURCE_ARTBOARD,
  packIco,
  exportRasters,
} from './export-raster.mjs';

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

  // Every packed entry must be a real PNG at its declared offset. The unit
  // tests pack synthetic byte blobs, so they cannot catch the temp-file dance
  // feeding packIco the wrong bytes — and a malformed ICO renders as a blank
  // favicon rather than an error, which is the worst kind of bug to find late.
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  for (let i = 0; i < 3; i++) {
    const at = 6 + i * 16;
    const len = ico.readUInt32LE(at + 8);
    const off = ico.readUInt32LE(at + 12);
    assert.ok(len > 0, `ico entry ${i} is empty`);
    assert.ok(off + len <= ico.length, `ico entry ${i} runs past the end of the file`);
    assert.deepEqual(
      ico.subarray(off, off + 8),
      PNG_MAGIC,
      `ico entry ${i} is not a PNG at its declared offset`,
    );
  }
});

test('exportRasters leaves no scratch files in the target directory', { skip: !haveConverter }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'logo-raster-clean-'));
  for (const f of ['logo-mark.svg', 'logo-favicon.svg']) {
    copyFileSync(join(here, 'fixtures', f), join(dir, f));
  }
  exportRasters(dir);
  const expected = new Set([...OUTPUTS.map((o) => o.file), 'logo-mark.svg', 'logo-favicon.svg']);
  for (const entry of readdirSync(dir)) {
    assert.ok(expected.has(entry), `unexpected leftover in the target directory: ${entry}`);
  }
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

test('a mid-run converter failure reports what was already written', () => {
  const dir = mkdtempSync(join(tmpdir(), 'logo-raster-partial-'));
  for (const f of ['logo-mark.svg', 'logo-favicon.svg']) {
    copyFileSync(join(here, 'fixtures', f), join(dir, f));
  }

  // A stub "converter" that is actually node itself: it writes a real output
  // file for every row sourced from logo-favicon.svg (which sorts first in
  // OUTPUTS — the three favicon-NN.png rows plus favicon.ico's packed sizes)
  // and fails as soon as it hits the first logo-mark.svg-sourced row. That
  // makes `written` non-empty by the time the throw happens, so this exercises
  // Fix 2 for real rather than only checking the shape on an empty array.
  let calls = 0;
  const stub = {
    bin: process.execPath,
    probe: ['--version'],
    argv: (svg, out, size) => {
      calls++;
      const script = svg.includes('logo-mark')
        ? 'process.exit(7)'
        : `require('fs').writeFileSync(${JSON.stringify(out)}, Buffer.from([0,1,2,3]))`;
      return ['-e', script, String(size)];
    },
  };

  assert.throws(
    () => exportRasters(dir, { converter: stub }),
    (err) => {
      assert.ok(err.message.includes(process.execPath), 'error names the converter binary');
      assert.ok(err.message.includes('argv:'), 'error carries the argv');
      assert.ok(Array.isArray(err.written), 'error carries the written list');
      assert.ok(
        err.written.length > 0,
        'the favicon-sourced rows complete before the mark-sourced row fails, so written should be non-empty',
      );
      return true;
    },
  );
  assert.ok(calls > 0, 'the stub converter was actually invoked');

  // The scratch dir used to pack favicon.ico lives under tmpdir(), never
  // beside the target — confirm the throw did not leave anything behind in
  // the target directory itself: no `logo-ico-*` scratch dir, no stray PNGs
  // from a half-finished pack, only sources plus the rows that actually
  // completed before the failure.
  const expected = new Set([
    'logo-mark.svg',
    'logo-favicon.svg',
    'favicon-16.png',
    'favicon-32.png',
    'favicon-48.png',
    'favicon.ico',
  ]);
  for (const entry of readdirSync(dir)) {
    assert.ok(expected.has(entry), `unexpected leftover in the target directory after a mid-run failure: ${entry}`);
  }
});

test('packIco rejects a malformed image list', () => {
  assert.throws(() => packIco([{ size: 16.5, data: Buffer.from('x') }]), /size/i);
  assert.throws(() => packIco([{ size: undefined, data: Buffer.from('x') }]), /size/i);
  assert.throws(() => packIco([{ size: 16, data: 'not a buffer' }]), /buffer/i);
});
