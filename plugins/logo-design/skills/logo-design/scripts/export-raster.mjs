#!/usr/bin/env node
// Rasterise a logo-design SVG set into the icon files hosts actually consume.
// Zero dependencies at rest: detects whatever converter is on the machine.
// See SKILL.md Step 6.5. Degrades to UNRUN; never blocks a run.

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

import { spawnSync } from 'node:child_process';

// Ordered by output quality for flat vector art. resvg and librsvg are the two
// that get stroke geometry right at 16px; Inkscape and ImageMagick are fallbacks
// that are far more likely to already be installed.
//
// NEVER add `convert` here. On Windows that is C:\WINDOWS\system32\convert, the
// NTFS filesystem conversion utility, present on every machine — a probe for it
// succeeds and we would hand image arguments to a disk tool. ImageMagick's
// portable binary is `magick`.

// The artboard every mark this skill draws is built on — construction.md pins
// it. The magick density derivation below reads off it; a source on a different
// artboard rasterises at a different scale and then downsamples, which costs
// time but not correctness.
export const SOURCE_ARTBOARD = 256;

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
    // Density is derived, not guessed. A viewBox-only SVG renders at
    // 256 * density/72 px, so a 2x supersample of the target is
    // density = 72 * 2 * size / 256. Floored at 72 so tiny icons still
    // render at 256px and downsample cleanly rather than being rasterised
    // at 9dpi. Ceiling is therefore 2048px at size 1024 — an unbounded
    // `size * 4` would have rendered 14,563px square for that same output.
    argv: (svg, out, size) => [
      '-background',
      'none',
      '-density',
      String(Math.max(72, Math.ceil((size * 2 * 72) / SOURCE_ARTBOARD))),
      svg,
      '-resize',
      `${size}x${size}`,
      out,
    ],
  },
];

export function detectConverter({ only } = {}) {
  const list = only
    ? [CONVERTERS.find((c) => c.bin === only) ?? { bin: only, probe: ['--version'], argv: () => [] }]
    : CONVERTERS;
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
  '  resvg         prebuilt binaries: https://github.com/linebender/resvg/releases',
  '                or `cargo install resvg` if you already have Rust',
  '                (best small-size output)',
  '  librsvg       brew install librsvg | apt install librsvg2-bin',
  '  Inkscape      https://inkscape.org — version 1.0 or newer',
  '  ImageMagick   https://imagemagick.org',
].join('\n');

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
