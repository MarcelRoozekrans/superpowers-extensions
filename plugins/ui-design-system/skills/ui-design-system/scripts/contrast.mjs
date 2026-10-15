#!/usr/bin/env node
// WCAG 2 contrast ratio for colour pairs, so a design system's text pairs are
// checked by arithmetic instead of by eye. Two of the five built-in directions
// shipped below 4.5:1 for white text on their accent because nobody computed it.
//
// Usage: node contrast.mjs <fg> <bg> [<fg> <bg> ...]
//   Colours: #rgb, #rrggbb, or oklch(L C h) with L as 0-1 or a percentage.
//   Prints one line per pair and exits 1 if any pair is below 4.5:1, the
//   WCAG AA minimum for body text.
//
// No dependencies: node builtins only, like the logo-design exporter.

import { fileURLToPath } from 'node:url';

export const AA_TEXT = 4.5;

const srgbToLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

// OKLab → linear sRGB, from Björn Ottosson's reference implementation.
export function oklchToLinearSrgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// Returns { linear: [r, g, b], inGamut } for a colour string.
export function parseColor(input) {
  const str = input.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(str);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    return { linear: channels.map(srgbToLinear), inGamut: true };
  }

  const ok = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*[\d.%]+\s*)?\)$/.exec(str);
  if (ok) {
    const L = Number(ok[1]) / (ok[2] ? 100 : 1);
    const linear = oklchToLinearSrgb(L, Number(ok[3]), Number(ok[4]));
    const eps = 1e-6;
    const inGamut = linear.every((v) => v >= -eps && v <= 1 + eps);
    return { linear: linear.map((v) => Math.min(1, Math.max(0, v))), inGamut };
  }

  throw new Error(`unsupported colour: ${input} (use #rgb, #rrggbb or oklch(L C h))`);
}

export function relativeLuminance(color) {
  const [r, g, b] = parseColor(color).linear;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function main(args) {
  if (args.length === 0 || args.length % 2 !== 0) {
    console.error('usage: node contrast.mjs <fg> <bg> [<fg> <bg> ...]');
    process.exit(2);
  }
  let failed = 0;
  for (let i = 0; i < args.length; i += 2) {
    const [fg, bg] = [args[i], args[i + 1]];
    const ratio = contrastRatio(fg, bg);
    const pass = ratio >= AA_TEXT;
    if (!pass) failed++;
    const gamut = [fg, bg].filter((c) => !parseColor(c).inGamut);
    const note = gamut.length ? `  (outside sRGB, browsers will remap: ${gamut.join(', ')})` : '';
    console.log(`${pass ? 'PASS' : 'FAIL'} ${ratio.toFixed(2)}:1  ${fg} on ${bg}${note}`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
