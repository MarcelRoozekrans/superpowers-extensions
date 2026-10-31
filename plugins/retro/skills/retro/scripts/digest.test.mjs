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
  const out = execFileSync(process.execPath, [script, fixture, '--subagents=full'], { encoding: 'utf8' });
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

// ── Fix pass after the whole-branch review ───────────────────────────────────

const assistant = (id, name, input, mid = 'm') =>
  JSON.stringify({ type: 'assistant', message: { id: mid, model: 'x', content: [{ type: 'tool_use', id, name, input }] } });
const toolResult = (id, content) =>
  JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content }] } });
const feed = (records) => {
  const g = createDigester();
  records.forEach((r, i) => g.add(r, i + 1));
  return g.result();
};

test('cli works through a symlinked path', async () => {
  const { mkdtempSync, symlinkSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, dirname } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'digest-link-'));
  try {
    symlinkSync(dirname(script), join(dir, 'retro'));
    const out = execFileSync(process.execPath, [join(dir, 'retro', 'digest.mjs'), fixture], { encoding: 'utf8' });
    assert.match(out, /## Session/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('subagents are one compact line each, labelled from meta.json', () => {
  const out = execFileSync(process.execPath, [script, fixture, '--subagents'], { encoding: 'utf8' });
  assert.match(out, /## Subagent transcripts/);
  assert.match(out, /agent-a1 — Find callers \(sonnet\): turns 1, tokens 100, failures 0, biggest result 1 chars/);
  assert.doesNotMatch(out, /# Subagent agent-a1/);
});

test('full subagent digests on request', () => {
  const out = execFileSync(process.execPath, [script, fixture, '--subagents=full'], { encoding: 'utf8' });
  assert.match(out, /# Subagent agent-a1 — Find callers/);
});

test('known bookkeeping record types are not unknown', () => {
  const types = ['tools-used', 'pr-link', 'mode', 'custom-title', 'agent-name', 'frame-link', 'ai-title', 'bridge-session', 'permission-mode', 'file-history-snapshot'];
  const d = feed(types.map((type) => JSON.stringify({ type })));
  assert.deepEqual(d.unknownTypes, {});
});

test('paged reads of one file are not repeated reads', () => {
  const d = feed([
    assistant('a', 'Read', { file_path: '/r/big.md', offset: 1, limit: 100 }),
    assistant('b', 'Read', { file_path: '/r/big.md', offset: 101, limit: 100 }),
    assistant('c', 'Read', { file_path: '/r/big.md', offset: 101, limit: 100 }),
  ]);
  assert.equal(d.repeatedReads.length, 1);
  assert.equal(d.repeatedReads[0].count, 2);
  assert.equal(d.repeatedReads[0].path, '/r/big.md (offset 101, limit 100)');
});

test('compound and git grep commands count as searches', () => {
  const d = feed([
    assistant('a', 'Bash', { command: 'cd src && grep -rn foo .' }),
    assistant('b', 'Bash', { command: 'git grep bar' }),
    assistant('c', 'Bash', { command: 'cat x | rg baz' }),
    assistant('d', 'Read', { file_path: '/r/found.md' }),
  ]);
  assert.deepEqual(d.searchChurn, [{ startLine: 1, searches: 3, thenRead: '/r/found.md' }]);
});

test('cost is rounded for display', () => {
  const g = createDigester();
  g.add(JSON.stringify({ type: 'cost-state', totalCostUSD: 45.47449420500001 }), 1);
  assert.match(formatDigest(g.result()), /cost: \$45\.47$/m);
  const small = createDigester();
  small.add(JSON.stringify({ type: 'cost-state', totalCostUSD: 0.0042137 }), 1);
  assert.match(formatDigest(small.result()), /cost: \$0\.0042$/m);
});

test('biggest results cite the line that carries the result', async () => {
  const d = await digest();
  assert.equal(d.biggest[0].resultLine, lineOf('AAAAAAAAAA'));
  assert.match(formatDigest(d), new RegExp(`result line ${lineOf('AAAAAAAAAA')}`));
});

test('array content sums text and data, ignoring tool references', () => {
  const d = feed([
    assistant('a', 'ToolSearch', { query: 'q' }),
    toolResult('a', [
      { type: 'text', text: 'abcde' },
      { type: 'tool_reference', tool_name: 'x' },
      { type: 'image', source: { type: 'base64', data: '0123456789' } },
    ]),
  ]);
  assert.equal(d.biggest[0].size, 15);
});

test('a truncated last line is malformed, not fatal', () => {
  const d = feed([assistant('a', 'Read', { file_path: '/r/a.md' }), toolResult('a', 'ok'), '{"type":"assistant","mess']);
  assert.equal(d.malformed, 1);
  assert.equal(d.biggest.length, 1);
});

test('subagent section lists the top N by tokens and counts the rest', async () => {
  const { formatSubagentSection } = await import('./digest.mjs');
  const entries = Array.from({ length: 12 }, (_, i) => {
    const g = createDigester();
    g.add(JSON.stringify({ type: 'assistant', message: { id: `m${i}`, usage: { input_tokens: i, output_tokens: 0 } } }), 1);
    return [`agent-${i}`, null, g.result()];
  });
  const out = formatSubagentSection(entries, 10);
  const listed = out.split('\n').filter((l) => l.startsWith('- agent-'));
  assert.equal(listed.length, 10);
  assert.match(listed[0], /^- agent-11:/);
  assert.match(out, /2 more subagent transcripts, fewer tokens each/);
});
