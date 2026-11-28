import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { publishedText, checkPublish, loadPatterns } from './publish.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const hookPath = join(here, 'publish-check.mjs');
const made = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'antislop-')); made.push(d); return d; };
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

const patterns = loadPatterns();
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });

test('ignores Bash commands that publish nothing', () => {
  assert.equal(publishedText(bash('grep -n "we delve into it" README.md')), null);
  assert.equal(publishedText(bash('git status')), null);
  assert.equal(publishedText(bash('gh pr view 12 --json body')), null);
});

test('takes the quoted message of git commit -m', () => {
  const text = publishedText(bash('git add -A && git commit -m "fix: trim name" -m "We delve into it."'));
  assert.match(text, /fix: trim name/);
  assert.match(text, /We delve into it\./);
  assert.doesNotMatch(text, /git add/);
});

test('takes a heredoc body', () => {
  const command = "git commit -F - <<'EOF'\nfix: trim name\n\nHet werkt, en het is snel.\nEOF\n";
  assert.match(publishedText(bash(command)), /Het werkt, en het is snel\./);
});

test('takes a heredoc inside command substitution', () => {
  const command = 'git commit -m "$(cat <<\'EOF\'\nfix: x\n\nThis isn\'t just a fix, it\'s a rewrite.\nEOF\n)"';
  assert.match(publishedText(bash(command)), /isn't just a fix/);
});

test('takes gh pr create title and body, and single quotes', () => {
  const text = publishedText(bash("gh pr create --title 'feat: x' --body \"Robust and seamless.\""));
  assert.match(text, /feat: x/);
  assert.match(text, /Robust and seamless\./);
});

test('handles escaped double quotes', () => {
  const text = publishedText(bash('gh issue comment 4 --body "He said \\"delve\\" twice"'));
  assert.match(text, /He said "delve" twice/);
});

test('reads --body-file and git commit -F relative to cwd', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'body.md'), 'From the file, en meer.\n');
  writeFileSync(join(dir, 'msg.txt'), 'fix: y\n\nIt is not just X, but Y.\n');
  const a = publishedText({ ...bash('gh pr create --title t --body-file body.md'), cwd: dir });
  assert.match(a, /From the file, en meer\./);
  const b = publishedText({ ...bash('git commit -F msg.txt'), cwd: dir });
  assert.match(b, /not just X, but Y/);
  const c = publishedText({ ...bash(`git commit --file=${join(dir, 'msg.txt')}`), cwd: '/' });
  assert.match(c, /not just X, but Y/);
});

test('covers gh pr|issue create|comment|edit|review and gh release', () => {
  for (const cmd of ['gh pr comment 1 --body "a"', 'gh issue create -t a -b "b"', 'gh pr edit 2 --body "c"',
    'gh pr review 3 --comment -b "d"', 'gh issue edit 4 --body "e"', 'gh release create v1 --notes "f"']) {
    assert.notEqual(publishedText(bash(cmd)), null, cmd);
  }
});

test('takes title and body of GitHub MCP tools', () => {
  const text = publishedText({ tool_name: 'mcp__plugin_github_github__create_pull_request', tool_input: { title: 'T', body: 'B', head: 'x' } });
  assert.match(text, /T/);
  assert.match(text, /B/);
  assert.doesNotMatch(text, /x/);
});

test('ignores other tools', () => {
  assert.equal(publishedText({ tool_name: 'Write', tool_input: { content: 'we delve' } }), null);
});

test('checkPublish denies the first call with hits and lets the same text through on retry', () => {
  const state = tmp();
  const payload = { ...bash('git commit -m "fix: x" -m "Dit is geen kleine opschoning maar een herziening."'), session_id: 's1' };
  const first = checkPublish(payload, { patterns, stateDir: state });
  assert.equal(first.deny, true);
  assert.match(first.reason, /Tegenstelling als frame/);
  assert.match(first.reason, /retry the same call unchanged/);
  assert.equal(checkPublish(payload, { patterns, stateDir: state }).deny, false);
});

test('checkPublish denies again when the text changed but still has a hit', () => {
  const state = tmp();
  const base = { session_id: 's2' };
  assert.equal(checkPublish({ ...base, ...bash('gh pr comment 1 --body "Werkt, en snel."') }, { patterns, stateDir: state }).deny, true);
  assert.equal(checkPublish({ ...base, ...bash('gh pr comment 1 --body "Klaar, en snel genoeg."') }, { patterns, stateDir: state }).deny, true);
});

test('checkPublish keeps sessions apart', () => {
  const state = tmp();
  const call = bash('gh pr comment 1 --body "Werkt, en snel."');
  assert.equal(checkPublish({ ...call, session_id: 'a' }, { patterns, stateDir: state }).deny, true);
  assert.equal(checkPublish({ ...call, session_id: 'b' }, { patterns, stateDir: state }).deny, true);
});

test('checkPublish passes clean text and non-publishing calls', () => {
  const state = tmp();
  assert.equal(checkPublish({ ...bash('git commit -m "fix: trim the name before the split"'), session_id: 's' }, { patterns, stateDir: state }).deny, false);
  assert.equal(checkPublish({ ...bash('echo "we delve"'), session_id: 's' }, { patterns, stateDir: state }).deny, false);
});

test('checkPublish skips fenced code in the published text', () => {
  const state = tmp();
  const body = 'Repro:\n\n```\nwe delve, en dus\n```\n';
  const payload = { tool_name: 'mcp__github__add_issue_comment', tool_input: { body }, session_id: 's' };
  assert.equal(checkPublish(payload, { patterns, stateDir: state }).deny, false);
});

test('loadPatterns reads both catalogues', () => {
  const names = new Set(patterns.map((p) => p.name));
  assert.ok(names.has('Contrast frame'));
  assert.ok(names.has('Tegenstelling als frame'));
});

function runHook(payload, env = {}) {
  return spawnSync('node', [hookPath], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ...env } });
}

test('hook prints a PreToolUse deny on a hit and nothing on retry', () => {
  const state = tmp();
  const payload = { ...bash('git commit -m "fix: x" -m "Werkt, en snel."'), session_id: 'h1' };
  const first = runHook(payload, { ANTI_SLOP_STATE_DIR: state });
  assert.equal(first.status, 0);
  const out = JSON.parse(first.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /, en/);
  const second = runHook(payload, { ANTI_SLOP_STATE_DIR: state });
  assert.equal(second.status, 0);
  assert.equal(second.stdout, '');
});

test('hook is off with ANTI_SLOP_HOOK=off', () => {
  const r = runHook({ ...bash('git commit -m "Werkt, en snel."'), session_id: 'h2' }, { ANTI_SLOP_HOOK: 'off', ANTI_SLOP_STATE_DIR: tmp() });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('hook fails open on bad input', () => {
  const r = spawnSync('node', [hookPath], { input: 'not json', encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});
