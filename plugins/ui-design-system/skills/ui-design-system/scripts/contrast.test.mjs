import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio, parseColor, AA_TEXT } from './contrast.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('black on white is 21:1 and the pair order does not matter', () => {
  assert.equal(contrastRatio('#000', '#fff').toFixed(2), '21.00');
  assert.equal(contrastRatio('#ffffff', '#000000').toFixed(2), '21.00');
});

test('#767676 on white is the classic just-passing grey', () => {
  const r = contrastRatio('#767676', '#ffffff');
  assert.ok(r >= 4.5 && r < 4.6, `got ${r}`);
});

test('oklch white and black match their hex equivalents', () => {
  assert.equal(contrastRatio('oklch(1 0 0)', 'oklch(0 0 0)').toFixed(2), '21.00');
  assert.equal(contrastRatio('oklch(100% 0 0)', '#000').toFixed(2), '21.00');
});

test('an out-of-gamut oklch colour is reported as such', () => {
  assert.equal(parseColor('oklch(0.65 0.27 30)').inGamut, false);
  assert.equal(parseColor('oklch(0.57 0.17 40)').inGamut, true);
});

test('unsupported colour syntax throws instead of guessing', () => {
  assert.throws(() => parseColor('rgb(0 0 0)'), /unsupported colour/);
});

// The five Design Directions in SKILL.md are copied into real design systems,
// so every text pair in them must pass AA and every token must be displayable.
test('every Design Direction in SKILL.md passes AA for its text pairs', () => {
  const skill = readFileSync(join(here, '..', 'SKILL.md'), 'utf8');
  const blocks = [...skill.matchAll(/### Direction \d+ — ([^\n]+)[\s\S]*?```text\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 5, 'expected five Design Direction token blocks');

  for (const [, name, body] of blocks) {
    const tokens = Object.fromEntries(
      [...body.matchAll(/^--([\w-]+)\s+(oklch\([^)]*\))/gm)].map((m) => [m[1], m[2]])
    );
    for (const [token, value] of Object.entries(tokens)) {
      assert.ok(parseColor(value).inGamut, `${name}: --${token} ${value} is outside sRGB`);
    }
    for (const [fg, bg] of [['fg', 'bg'], ['muted', 'bg'], ['muted', 'surface'], ['accent-fg', 'accent']]) {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      assert.ok(ratio >= AA_TEXT, `${name}: --${fg} on --${bg} is ${ratio.toFixed(2)}:1, below ${AA_TEXT}:1`);
    }
  }
});
