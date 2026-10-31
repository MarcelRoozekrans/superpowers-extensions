import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(
  fileURLToPath(new URL('../templates/report.template.html', import.meta.url)),
  'utf8',
);

const count = (needle) => html.split(needle).length - 1;

test('each placeholder occurs exactly once', () => {
  for (const name of ['TITLE', 'EYEBROW', 'SCOPE', 'CANDIDATES', 'TOP', 'MERMAID_SCRIPT']) {
    assert.equal(count(`{{${name}}}`), 1, `{{${name}}}`);
  }
});

const tokensIn = (block) => new Set([...block.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

test('every var(--name) is defined in the first bare :root block', () => {
  const root = html.match(/^:root \{([\s\S]*?)\n\}/m);
  assert.ok(root, 'bare :root block');
  const defined = tokensIn(root[1]);
  const used = new Set([...html.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  for (const name of used) assert.ok(defined.has(name), `${name} is not defined`);
});

test('both dark themes redefine the same token set as :root', () => {
  const root = tokensIn(html.match(/^:root \{([\s\S]*?)\n\}/m)[1]);
  const colourTokens = new Set([...root].filter((t) => !['--display', '--body', '--mono'].includes(t)));
  const media = html.match(
    /@media \(prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="light"\]\) \{([\s\S]*?)\} \}/,
  );
  assert.ok(media, 'prefers-color-scheme dark block');
  const forced = html.match(/^:root\[data-theme="dark"\] \{([\s\S]*?)\}/m);
  assert.ok(forced, 'data-theme dark block');
  for (const [label, block] of [['media', media[1]], ['forced', forced[1]]]) {
    const got = tokensIn(block);
    assert.deepEqual([...got].sort(), [...colourTokens].sort(), `${label} token set`);
  }
});

test('no external script src and no Tailwind CDN', () => {
  assert.ok(!/<script[^>]*\ssrc=/i.test(html));
  assert.ok(!html.includes('cdn.tailwindcss.com'));
});

test('.b-spec badge style is defined', () => {
  assert.match(html, /\.b-spec\s*\{/);
});
