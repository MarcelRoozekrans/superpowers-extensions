import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import {
  DEFAULTS, readContextSize, loadConfig, decide, reminderText, loadState, saveState,
} from './budget.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sizeCheckPath = join(here, 'size-check.mjs');
const made = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'ctxbudget-')); made.push(d); return d; };
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

const entry = (usage, extra = {}) =>
  JSON.stringify({ type: 'assistant', isSidechain: false, message: { id: 'm', usage, content: [] }, ...extra });
const usage250k = { input_tokens: 10, cache_creation_input_tokens: 49990, cache_read_input_tokens: 200000, output_tokens: 5 };

function transcript(lines) {
  const p = join(tmp(), 't.jsonl');
  writeFileSync(p, lines.join('\n') + '\n');
  return p;
}

test('readContextSize sums the input-side tokens of the newest assistant usage', () => {
  const p = transcript([
    entry({ input_tokens: 1, cache_creation_input_tokens: 1, cache_read_input_tokens: 1 }),
    JSON.stringify({ type: 'user', message: { content: 'hi' } }),
    entry(usage250k),
  ]);
  assert.equal(readContextSize(p), 250000);
});

const boundary = (postTokens) => JSON.stringify({
  type: 'system', subtype: 'compact_boundary',
  compactMetadata: { trigger: 'auto', preTokens: 958000, ...(postTokens === undefined ? {} : { postTokens }) },
});

test('readContextSize returns postTokens for a compact_boundary after a high-usage entry', () => {
  assert.equal(readContextSize(transcript([entry(usage250k), boundary(11000)])), 11000);
});

test('readContextSize returns null for a compact_boundary without a usable postTokens', () => {
  assert.equal(readContextSize(transcript([entry(usage250k), boundary()])), null);
});

test('readContextSize uses an assistant entry written after a compact_boundary', () => {
  const small = { input_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 15000 };
  assert.equal(readContextSize(transcript([entry(usage250k), boundary(11000), entry(small)])), 15005);
});

test('readContextSize ignores sidechain entries', () => {
  const p = transcript([
    entry(usage250k),
    entry({ input_tokens: 999999, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, { isSidechain: true }),
  ]);
  assert.equal(readContextSize(p), 250000);
});

test('readContextSize skips zero-usage synthetic entries', () => {
  const p = transcript([
    entry(usage250k),
    entry({ input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, { isSidechain: false }),
  ]);
  assert.equal(readContextSize(p), 250000);
});

test('readContextSize ignores a truncated last line', () => {
  const p = transcript([entry(usage250k), '{"type":"assistant","mess']);
  assert.equal(readContextSize(p), 250000);
});

test('readContextSize returns null for a missing file or no usage', () => {
  assert.equal(readContextSize(join(tmp(), 'nope.jsonl')), null);
  assert.equal(readContextSize(transcript([JSON.stringify({ type: 'user' })])), null);
});

test('readContextSize stays fast on a very large transcript', (t) => {
  const dir = tmp();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const p = join(dir, 'big.jsonl');
  const filler = JSON.stringify({ type: 'user', message: { content: 'x'.repeat(1000) } }) + '\n';
  const chunk = filler.repeat(1000); // about 1 MB
  for (let i = 0; i < 60; i++) appendFileSync(p, chunk);
  appendFileSync(p, entry(usage250k) + '\n');
  const t0 = performance.now();
  const size = readContextSize(p);
  const ms = performance.now() - t0;
  assert.equal(size, 250000);
  assert.ok(ms < 500, `took ${ms}ms`);
});

function cwdWith(content) {
  const cwd = tmp();
  if (content !== undefined) {
    mkdirSync(join(cwd, '.claude'));
    writeFileSync(join(cwd, '.claude', 'context-budget.json'), content);
  }
  return cwd;
}

test('loadConfig defaults and validation', () => {
  assert.deepEqual(loadConfig(cwdWith()), DEFAULTS);
  const ok = loadConfig(cwdWith('{"nudge":100000,"firm":300000}'));
  assert.equal(ok.nudge, 100000);
  assert.equal(ok.firm, 300000);
  assert.deepEqual(loadConfig(cwdWith('{"nudge":300000,"firm":200000}')), DEFAULTS);
  assert.deepEqual(loadConfig(cwdWith('{"nudge":"x"}')), DEFAULTS);
  assert.deepEqual(loadConfig(cwdWith('{broken')), DEFAULTS);
  assert.equal(loadConfig(cwdWith('{"enforceDispatchModel":false}')).enforceDispatchModel, false);
});

test('decide', () => {
  const d = (s, l) => decide(s, l, DEFAULTS);
  assert.deepEqual(d(150000, null), { level: 'none', remember: null });
  assert.deepEqual(d(210000, null), { level: 'nudge', remember: 210000 });
  assert.deepEqual(d(230000, 210000), { level: 'none', remember: 210000 });
  assert.deepEqual(d(260000, 210000), { level: 'nudge', remember: 260000 });
  assert.deepEqual(d(420000, 360000), { level: 'firm', remember: 420000 });
  assert.deepEqual(d(220000, 300000), { level: 'nudge', remember: 220000 });
  assert.deepEqual(d(280000, 300000), { level: 'none', remember: 300000 });
  assert.deepEqual(d(120000, 300000), { level: 'none', remember: null });
});

test('reminderText', () => {
  assert.match(reminderText('firm', 420000), /420k/);
  assert.match(reminderText('nudge', 250000), /250k/);
  assert.match(reminderText('firm', 420000), /costly/);
  assert.doesNotMatch(reminderText('nudge', 250000), /costly/);
  assert.doesNotMatch(reminderText('firm', 420000), /stop/i);
  assert.doesNotMatch(reminderText('nudge', 250000), /stop/i);
});

test('state round-trip', () => {
  const dir = tmp();
  assert.equal(loadState(dir, 's1'), null);
  saveState(dir, 's1', 123456);
  assert.equal(loadState(dir, 's1'), 123456);
  saveState(dir, 's1', null);
  assert.equal(loadState(dir, 's1'), null);
});

test('entry script', () => {
  const bad = spawnSync('node', [sizeCheckPath], { input: 'not json', encoding: 'utf8' });
  assert.equal(bad.status, 0);
  assert.equal(bad.stdout, '');

  const p = transcript([entry(usage250k)]);
  const env = { ...process.env, CLAUDE_PLUGIN_DATA: tmp() };
  const input = JSON.stringify({ session_id: 'abc', transcript_path: p, cwd: tmp() });
  const first = spawnSync('node', [sizeCheckPath], { input, encoding: 'utf8', env });
  assert.equal(first.status, 0);
  const out = JSON.parse(first.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /250k/);
  const second = spawnSync('node', [sizeCheckPath], { input, encoding: 'utf8', env });
  assert.equal(second.status, 0);
  assert.equal(second.stdout, '');

  const low = transcript([entry({ input_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 })]);
  const lowEnv = { ...process.env, CLAUDE_PLUGIN_DATA: tmp() };
  const lowIn = JSON.stringify({ session_id: 'low', transcript_path: low, cwd: tmp() });
  const r = spawnSync('node', [sizeCheckPath], { input: lowIn, encoding: 'utf8', env: lowEnv });
  assert.equal(r.stdout, '');
  assert.equal(existsSync(join(lowEnv.CLAUDE_PLUGIN_DATA, 'context-budget', 'low.json')), false);
});
