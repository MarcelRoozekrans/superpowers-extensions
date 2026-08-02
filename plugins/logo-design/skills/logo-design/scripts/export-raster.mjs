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
