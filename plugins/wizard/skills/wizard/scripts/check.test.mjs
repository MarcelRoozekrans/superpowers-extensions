import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkWizard } from './check.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const goodPath = join(here, 'fixtures', 'runtime-wizard.sh');
const repo = join(here, 'fixtures', 'repo');
const good = readFileSync(goodPath, 'utf8');

// Writes a variant of the good wizard to a temp dir, so no library copy is stored twice.
function variant(edit, mode = 0o755) {
  const text = edit(good);
  assert.notEqual(text, good, 'the edit changed nothing');
  const path = join(mkdtempSync(join(tmpdir(), 'wizard-check-')), 'wizard.sh');
  writeFileSync(path, text);
  chmodSync(path, mode);
  return path;
}

const status = (report, check) => report.results.find((r) => r.check === check && r.status !== 'warn');
const beforeFinish = (lines) => (text) => text.replace('\nfinish\n', `\n${lines}\nfinish\n`);

test('good wizard passes', () => {
  const report = checkWizard(goodPath, { repo });
  assert.equal(report.ok, true, JSON.stringify(report.results));
  assert.equal(status(report, 'secrets').status, 'ok');
  const warn = report.results.find((r) => r.check === 'secrets' && r.status === 'warn');
  assert.match(warn.detail, /DEPLOY_TOKEN/);
  assert.doesNotMatch(warn.detail, /GITHUB_TOKEN/);
});

test('stage count mismatch fails', () => {
  const report = checkWizard(variant((t) => t.replace('TOTAL_STAGES=1', 'TOTAL_STAGES=2')), { repo });
  assert.equal(report.ok, false);
  assert.equal(status(report, 'stages').status, 'fail');
  assert.match(status(report, 'stages').detail, /TOTAL_STAGES=2 but 1 stage call/);
});

test('commented and indented stage calls', () => {
  const path = variant((t) =>
    beforeFinish('# stage "x"\nif true; then\n  stage "Two"\nfi')(t).replace('TOTAL_STAGES=1', 'TOTAL_STAGES=2'),
  );
  assert.equal(status(checkWizard(path, { repo }), 'stages').status, 'ok');
});

test('edited library fails', () => {
  const path = variant((t) => t.replace(`printf '\\n'; warn "still to do by hand:"`, 'echo todo'));
  assert.equal(status(checkWizard(path, { repo }), 'library').status, 'fail');
});

test('leftover example fails', () => {
  const path = variant(beforeFinish('# ── Example stage: replace with your real steps'));
  assert.equal(status(checkWizard(path, { repo }), 'example').status, 'fail');
});

test('unknown secret fails', () => {
  const path = variant((t) => t.replace('set_secret SECRET_KEY', 'set_secret STRIPE_KEY'));
  const secrets = status(checkWizard(path, { repo }), 'secrets');
  assert.equal(secrets.status, 'fail');
  assert.match(secrets.detail, /STRIPE_KEY/);
});

test('no workflows skips', () => {
  const empty = mkdtempSync(join(tmpdir(), 'wizard-repo-'));
  assert.equal(status(checkWizard(goodPath, { repo: empty }), 'secrets').status, 'skip');
});

test('syntax error fails', () => {
  const path = variant((t) => `${t}if then\n`);
  assert.equal(status(checkWizard(path, { repo }), 'syntax').status, 'fail');
});

test('not executable fails', () => {
  const path = variant((t) => t.replace('"Test keys"', '"Keys"'), 0o644);
  assert.equal(status(checkWizard(path, { repo }), 'executable').status, 'fail');
});

test('CLI exit codes', () => {
  const cli = (...args) => spawnSync('node', [join(here, 'check.mjs'), ...args], { encoding: 'utf8' }).status;
  assert.equal(cli(goodPath, '--repo', repo), 0);
  assert.equal(cli(variant(beforeFinish('# ── Example stage: replace with your real steps')), '--repo', repo), 1);
  assert.equal(cli(), 2);
});

const hasShellcheck = spawnSync('shellcheck', ['--version']).error?.code !== 'ENOENT';

test('shellcheck finding in the stages fails', { skip: !hasShellcheck && 'shellcheck not installed' }, () => {
  const report = checkWizard(variant(beforeFinish('say $PUB_KEY')), { repo });
  assert.equal(status(report, 'shellcheck').status, 'fail');
  assert.match(status(report, 'shellcheck').detail, /SC2086/);
});

test('good wizard passes shellcheck', { skip: !hasShellcheck && 'shellcheck not installed' }, () => {
  assert.equal(status(checkWizard(goodPath, { repo }), 'shellcheck').status, 'ok');
});

test('set_secret mid-line is checked', () => {
  const path = variant(beforeFinish('if confirm "Set it?"; then set_secret OTHER_KEY "$PUB_KEY"; fi'));
  const secrets = status(checkWizard(path, { repo }), 'secrets');
  assert.equal(secrets.status, 'fail');
  assert.match(secrets.detail, /OTHER_KEY/);
});

test('shellcheck checks every line when the STAGES marker is missing', { skip: !hasShellcheck && 'shellcheck not installed' }, () => {
  const path = variant((t) => `${t.replace(/^# STAGES:.*$/m, '# stages')}\nsay $PUB_KEY\n`);
  assert.equal(status(checkWizard(path, { repo }), 'shellcheck').status, 'fail');
});

test('CLI without --repo uses the current directory', () => {
  const run = spawnSync('node', [join(here, 'check.mjs'), goodPath], { cwd: repo, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
});

test('CLI with a missing --repo directory is a usage error', () => {
  const run = spawnSync('node', [join(here, 'check.mjs'), goodPath, '--repo', join(repo, 'no-such-dir')], { encoding: 'utf8' });
  assert.equal(run.status, 2);
});

test('quoted set_secret name is checked', () => {
  for (const quoted of ['"STRIPE_KEY"', "'STRIPE_KEY'"]) {
    const path = variant((t) => t.replace('set_secret SECRET_KEY', `set_secret ${quoted}`));
    const secrets = status(checkWizard(path, { repo }), 'secrets');
    assert.equal(secrets.status, 'fail', quoted);
    assert.match(secrets.detail, /STRIPE_KEY/);
  }
});

test('set_secret with a name in a variable is a warning', () => {
  const path = variant(beforeFinish('set_secret "$NAME" "$PUB_KEY"'));
  const report = checkWizard(path, { repo });
  const warn = report.results.find((r) => r.check === 'secrets' && r.status === 'warn' && /\$NAME/.test(r.detail));
  assert.ok(warn, JSON.stringify(report.results));
});

test('stage after then or && on one line counts', () => {
  const path = variant((t) =>
    beforeFinish('if confirm "x"; then stage "Two"; fi\ntrue && stage "Three"')(t).replace('TOTAL_STAGES=1', 'TOTAL_STAGES=3'),
  );
  assert.equal(status(checkWizard(path, { repo }), 'stages').status, 'ok');
});
