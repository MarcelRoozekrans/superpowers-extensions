import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createDigester, digestFile, formatDigest } from './digest.mjs';

const script = fileURLToPath(new URL('./digest.mjs', import.meta.url));
const fixture = fileURLToPath(new URL('./fixtures/session.jsonl', import.meta.url));
const lines = readFileSync(fixture, 'utf8').split('\n');

// 1-based line number of the first fixture line containing `needle`.
const lineOf = (needle) => lines.findIndex((l) => l.includes(needle)) + 1;

const digest = () => digestFile(fixture);

test('session summary', async () => {
  const d = await digest();
  assert.equal(d.session.costUSD, 1.25);
  assert.equal(d.session.turns, 2);
  assert.equal(d.session.firstPrompt, 'Add a retro plugin to the suite');
  assert.deepEqual(d.session.models, ['claude-test']);
  assert.equal(d.session.id, 'sess-1');
});

test('tokens are counted once per message id', async () => {
  const d = await digest();
  assert.deepEqual(d.session.tokens, { input: 20, output: 40, cacheRead: 60, cacheCreate: 80 });
});

test('missing cost and usage are unknown', () => {
  const g = createDigester();
  g.add(JSON.stringify({ type: 'user', message: { role: 'user', content: 'hi' } }), 1);
  const d = g.result();
  assert.equal(d.session.costUSD, 'unknown');
  assert.equal(d.session.tokens, 'unknown');
  assert.match(formatDigest(d), /cost: unknown/);
});

test('biggest result first', async () => {
  const d = await digest();
  assert.ok(d.biggest[0].size >= 150000);
  assert.equal(d.biggest[0].tool, 'Read');
  assert.equal(d.biggest[0].input, '/r/a.md');
});

test('long line text never printed', async () => {
  const d = await digest();
  const out = formatDigest(d);
  const long = lineOf('AAAAAAAAAA');
  assert.deepEqual(d.longLines.map((l) => l.lineNo), [long]);
  assert.ok(out.includes(String(long)));
  assert.ok(!out.includes('A'.repeat(1000)));
  assert.ok(out.split('\n').every((l) => l.length <= 300));
});

test('repeated reads', async () => {
  const d = await digest();
  assert.equal(d.repeatedReads.length, 1);
  assert.equal(d.repeatedReads[0].path, '/r/a.md');
  assert.equal(d.repeatedReads[0].count, 3);
  assert.equal(d.repeatedReads[0].lines.length, 3);
  assert.deepEqual(d.repeatedCommands, []);
});

test('failure with retry', async () => {
  const d = await digest();
  assert.equal(d.failures.length, 1);
  assert.equal(d.failures[0].tool, 'Bash');
  assert.equal(d.failures[0].input, 'npm test');
  assert.equal(d.failures[0].retriedAt, lineOf('--watch=false'));
});

test('search churn', async () => {
  const d = await digest();
  assert.equal(d.searchChurn.length, 1);
  assert.equal(d.searchChurn[0].searches, 3);
  assert.equal(d.searchChurn[0].thenRead, '/r/b.md');
  assert.equal(d.searchChurn[0].startLine, lineOf('"pattern":"retro"'));
});

test('subagent model', async () => {
  const d = await digest();
  assert.equal(d.subagents.length, 1);
  assert.equal(d.subagents[0].model, 'sonnet');
  assert.equal(d.subagents[0].description, 'Find callers');
  assert.equal(d.subagents[0].resultSize, 5000);
});

test('malformed and unknown', async () => {
  const d = await digest();
  assert.equal(d.malformed, 1);
  assert.deepEqual(d.unknownTypes, { mystery: 1 });
});

test('unanswered tool call', async () => {
  const d = await digest();
  assert.deepEqual(d.unanswered, [{ lineNo: lineOf('echo hi'), tool: 'Bash' }]);
  assert.ok(!d.failures.some((f) => f.input === 'echo hi'));
});

test('cli subagents', () => {
  const out = execFileSync(process.execPath, [script, fixture, '--subagents'], { encoding: 'utf8' });
  assert.match(out, /agent-a1/);
  assert.match(out, /claude-sub/);
});

test('cli json', () => {
  const out = execFileSync(process.execPath, [script, fixture, '--json'], { encoding: 'utf8' });
  assert.equal(JSON.parse(out).session.costUSD, 1.25);
});

test('cli usage error', () => {
  assert.equal(spawnSync(process.execPath, [script]).status, 2);
  assert.equal(spawnSync(process.execPath, [script, '/nonexistent/x.jsonl']).status, 2);
});
