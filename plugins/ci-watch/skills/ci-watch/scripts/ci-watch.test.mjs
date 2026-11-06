import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isPrCreate, findPrUrl, prOpenedContext, sanitizeBody } from './ci-watch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const prOpenedPath = join(here, 'pr-opened.mjs');
const URL12 = 'https://github.com/o/r/pull/12';
const MSG = `PR ${URL12} was opened. Invoke \`ci-watch\` and run its Wait stage for this PR.`;
const created = { tool_name: 'Bash', tool_input: { command: 'gh pr create --fill' }, tool_response: { stdout: URL12 + '\n' } };
const spawn = (input, env = {}) => spawnSync('node', [prOpenedPath], { input, encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });

test('isPrCreate', () => {
  assert.equal(isPrCreate('Bash', { command: 'gh pr create --fill' }), true);
  assert.equal(isPrCreate('Bash', { command: 'gh pr view 3' }), false);
  assert.equal(isPrCreate('mcp__plugin_github_github__create_pull_request', {}), true);
  assert.equal(isPrCreate('Read', {}), false);
});

test('findPrUrl', () => {
  assert.equal(findPrUrl({ stdout: URL12 + '\n' }), URL12);
  assert.equal(findPrUrl(URL12), URL12);
  const mcp = { content: [{ type: 'text', text: '{"url":"https://github.com/o/r/pull/7","user":{"html_url":"https://github.com/u"}}' }] };
  assert.equal(findPrUrl(mcp), 'https://github.com/o/r/pull/7');
  assert.equal(findPrUrl({ stdout: '', stderr: 'GraphQL: ...' }), null);
});

test('prOpenedContext', () => {
  assert.equal(prOpenedContext({}, created), MSG);
  assert.equal(prOpenedContext({ SUPERPOWERS_UNATTENDED: '1' }, created), null);
  assert.equal(prOpenedContext({}, { ...created, tool_response: { stdout: '', stderr: 'failed' } }), null);
  assert.equal(prOpenedContext({}, { ...created, tool_input: { command: 'ls' } }), null);
});

test('sanitizeBody drops trailers and session links', () => {
  const t = 'Body\nco-authored-by: Claude Opus 5.5 <noreply@anthropic.com>\nCo-Authored-By: Jane <j@example.com>\nsee https://claude.ai/code/session_abc\nEnd';
  assert.equal(sanitizeBody(t), 'Body\nCo-Authored-By: Jane <j@example.com>\nEnd');
});

test('sanitizeBody rewrites nested parens', () => {
  assert.equal(sanitizeBody('[Singleton(As = typeof(IDetector), AllowMultiple = true)]'), '[Singleton(As = typeof[IDetector], AllowMultiple = true)]');
  assert.equal(sanitizeBody('a (b (c (d)))'), 'a (b [c [d]])');
});

test('sanitizeBody leaves unbalanced parens and fences alone', () => {
  assert.equal(sanitizeBody('smile :)'), 'smile :)');
  assert.equal(sanitizeBody('open ( only'), 'open ( only');
  assert.equal(sanitizeBody('open (a (b only'), 'open (a (b only');
  const fenced = 'x\n```\nf(g(h))\n```\ny';
  assert.equal(sanitizeBody(fenced), fenced);
  assert.equal(sanitizeBody('plain text'), 'plain text');
});

test('sanitizeBody trims trailing blank lines left by removals', () => {
  assert.equal(sanitizeBody('Body\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n'), 'Body');
});

test('hook prints PostToolUse context for a PR creation', () => {
  const r = spawn(JSON.stringify(created));
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.equal(out.hookSpecificOutput.additionalContext, MSG);
});

test('hook stays silent on bad input, failed creation and unattended', () => {
  for (const input of ['not json', '']) {
    const r = spawn(input);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
  }
  const failed = { ...created, tool_response: { stdout: '', stderr: 'GraphQL: nope' } };
  assert.equal(spawn(JSON.stringify(failed)).stdout, '');
  const r = spawn(JSON.stringify(created), { SUPERPOWERS_UNATTENDED: '1' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});
