import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isUnattended, readQueue, openItem, checkAsk, checkStop, QUEUE_PATH } from './unattended.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const askPath = join(here, 'ask-check.mjs');
const stopPath = join(here, 'stop-check.mjs');
const made = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'unattended-')); made.push(d); return d; };
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

const ON = { SUPERPOWERS_UNATTENDED: '1' };
const item = (id, status, stopBlocks = 0) => ({ id, plan: `docs/superpowers/plans/${id}.md`, status, stopBlocks, pr: null, parkedReason: null });
const spawn = (path, input, env, cwd) => spawnSync('node', [path], {
  input, cwd, encoding: 'utf8', env: { PATH: process.env.PATH, ...env },
});

test('only "1" is unattended', () => {
  assert.equal(isUnattended({ SUPERPOWERS_UNATTENDED: '1' }), true);
  for (const v of ['0', '', 'true']) assert.equal(isUnattended({ SUPERPOWERS_UNATTENDED: v }), false);
  assert.equal(isUnattended({}), false);
});

test('ask denies when unattended', () => {
  const r = checkAsk(ON);
  assert.equal(r.deny, true);
  assert.match(r.reason, /Recommended/);
  assert.match(r.reason, /unattended-calls\.md/);
});

test('ask allows when attended', () => {
  assert.deepEqual(checkAsk({}), { deny: false });
});

test('stop allows when attended', () => {
  assert.equal(checkStop({}, { goal: 'g', items: [item('a', 'running')] }).block, false);
});

test('stop allows with no queue', () => {
  assert.equal(checkStop(ON, null).block, false);
});

test('stop allows when no item is open', () => {
  assert.equal(checkStop(ON, { goal: 'g', items: [item('a', 'done'), item('b', 'parked')] }).block, false);
});

test('stop blocks three times then parks', () => {
  let queue = { goal: 'g', items: [item('a', 'running'), item('b', 'queued')] };
  for (let n = 1; n <= 3; n++) {
    const r = checkStop(ON, queue);
    assert.equal(r.block, true);
    assert.equal(r.queue.items[0].stopBlocks, n);
    assert.match(r.reason, /item a\b/);
    queue = r.queue;
  }
  const r = checkStop(ON, queue);
  assert.equal(r.block, true);
  assert.equal(r.queue.items[0].status, 'parked');
  assert.equal(r.queue.items[0].parkedReason, 'stopped 4 times without finishing');
  assert.match(r.reason, /Item a parked/);
  assert.match(r.reason, /item b\b/);
});

test('stop allows after parking the last open item', () => {
  const r = checkStop(ON, { goal: 'g', items: [item('a', 'running', 3)] });
  assert.equal(r.block, false);
  assert.equal(r.queue.items[0].status, 'parked');
});

test('stop allows on a malformed queue', () => {
  const cwd = tmp();
  mkdirSync(join(cwd, '.claude'));
  writeFileSync(join(cwd, QUEUE_PATH), '{not json');
  assert.equal(readQueue(cwd), null);
  writeFileSync(join(cwd, QUEUE_PATH), '{"goal":"x"}');
  assert.equal(readQueue(cwd), null);
});

test('ask-check entry denies on bad input when unattended', () => {
  const r = spawn(askPath, 'not json', { SUPERPOWERS_UNATTENDED: '1' });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

test('ask-check entry is silent when attended', () => {
  const r = spawn(askPath, 'not json', {});
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('stop-check entry writes the queue and blocks', () => {
  const cwd = tmp();
  mkdirSync(join(cwd, '.claude'));
  writeFileSync(join(cwd, QUEUE_PATH), JSON.stringify({ goal: 'g', items: [item('a', 'running')] }));
  const r = spawn(stopPath, JSON.stringify({ cwd }), { SUPERPOWERS_UNATTENDED: '1' }, cwd);
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).decision, 'block');
  assert.equal(JSON.parse(readFileSync(join(cwd, QUEUE_PATH), 'utf8')).items[0].stopBlocks, 1);
});

test('stop-check entry is silent on bad input', () => {
  const r = spawn(stopPath, 'not json', { SUPERPOWERS_UNATTENDED: '1' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});
