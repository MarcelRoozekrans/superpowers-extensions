import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DEFAULTS } from './budget.mjs';
import { checkDispatch } from './dispatch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dispatchCheckPath = join(here, 'dispatch-check.mjs');
const made = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'ctxbudget-')); made.push(d); return d; };
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

const off = { ...DEFAULTS, enforceDispatchModel: false };
const fableOk = { ...DEFAULTS, allowFable: true };

test('denies a general-purpose dispatch with no model', () => {
  assert.equal(checkDispatch({ subagent_type: 'general-purpose' }, DEFAULTS).deny, true);
});

test('denies an empty dispatch', () => {
  assert.equal(checkDispatch({}, DEFAULTS).deny, true);
});

test('denies an empty subagent_type', () => {
  assert.equal(checkDispatch({ subagent_type: '' }, DEFAULTS).deny, true);
});

test('allows a general-purpose dispatch that names a model', () => {
  assert.deepEqual(checkDispatch({ subagent_type: 'general-purpose', model: 'sonnet' }, DEFAULTS), { deny: false });
});

test('allows a named agent type without a model', () => {
  assert.deepEqual(checkDispatch({ subagent_type: 'Explore' }, DEFAULTS), { deny: false });
});

test('allows a fork', () => {
  assert.deepEqual(checkDispatch({ subagent_type: 'fork' }, DEFAULTS), { deny: false });
});

test('denies Fable and says so', () => {
  for (const input of [{ model: 'fable' }, { subagent_type: 'Explore', model: 'claude-fable-5-1' }]) {
    const r = checkDispatch(input, DEFAULTS);
    assert.equal(r.deny, true);
    assert.match(r.reason, /fable/i);
  }
});

test('enforceDispatchModel false allows a missing model', () => {
  assert.deepEqual(checkDispatch({}, off), { deny: false });
});

test('enforceDispatchModel false still denies Fable', () => {
  assert.equal(checkDispatch({ model: 'fable' }, off).deny, true);
});

test('allowFable allows a Fable model on any agent type', () => {
  for (const input of [{ model: 'fable' }, { subagent_type: 'Explore', model: 'claude-fable-5-2' }]) {
    assert.deepEqual(checkDispatch(input, fableOk), { deny: false });
  }
});

test('allowFable still requires a model on a general-purpose dispatch', () => {
  const r = checkDispatch({ subagent_type: 'general-purpose' }, fableOk);
  assert.equal(r.deny, true);
  assert.doesNotMatch(r.reason, /never fable/i);
});

test('allowFable with enforceDispatchModel false allows everything', () => {
  const both = { ...DEFAULTS, allowFable: true, enforceDispatchModel: false };
  assert.deepEqual(checkDispatch({ model: 'fable' }, both), { deny: false });
  assert.deepEqual(checkDispatch({}, both), { deny: false });
});

test('entry script allows Fable when the project config sets allowFable', () => {
  const cwd = tmp();
  mkdirSync(join(cwd, '.claude'));
  writeFileSync(join(cwd, '.claude', 'context-budget.json'), '{"allowFable":true}');
  const input = JSON.stringify({ tool_name: 'Agent', tool_input: { model: 'fable' }, cwd });
  const r = spawnSync('node', [dispatchCheckPath], { input, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('entry script stays silent on bad input and exits 0', () => {
  const r = spawnSync('node', [dispatchCheckPath], { input: 'not json', encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('entry script denies a model-less dispatch', () => {
  const input = JSON.stringify({ tool_name: 'Agent', tool_input: {}, cwd: tmp() });
  const r = spawnSync('node', [dispatchCheckPath], { input, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

test('treats a whitespace-only model as missing', () => {
  assert.equal(checkDispatch({ subagent_type: 'general-purpose', model: '  ' }, DEFAULTS).deny, true);
});

test('general-purpose with fable gets the Fable reason, not the missing-model one', () => {
  const r = checkDispatch({ subagent_type: 'general-purpose', model: 'fable' }, DEFAULTS);
  assert.equal(r.deny, true);
  assert.match(r.reason, /fable is not used/i);
});
