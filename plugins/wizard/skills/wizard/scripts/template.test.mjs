import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, copyFileSync, symlinkSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = join(here, '..');
const templatePath = join(skillDir, 'template.sh');
const fixturePath = join(here, 'fixtures', 'runtime-wizard.sh');

const hasShellcheck = spawnSync('shellcheck', ['--version']).error?.code !== 'ENOENT';

test('template matches the SHA-256 in NOTICE.md', () => {
  const notice = readFileSync(join(skillDir, 'NOTICE.md'), 'utf8');
  const pinned = /Template SHA-256: `([0-9a-f]{64})`/.exec(notice);
  assert.ok(pinned, 'NOTICE.md has no Template SHA-256 line');
  const actual = createHash('sha256').update(readFileSync(templatePath)).digest('hex');
  assert.equal(actual, pinned[1]);
});

test('template differs from upstream only at line 114', () => {
  const lines = readFileSync(templatePath, 'utf8').split('\n');
  assert.match(lines[113], /\$\{e\}\[Enter keeps current\]/);
  assert.ok(!lines.some((l) => l.includes('$e[')), 'a line still contains $e[');
});

// A library helper a wizard does not call is reported as never invoked:
// SC2317 up to shellcheck 0.10, SC2329 from 0.11. That is by design.
const UNUSED_HELPER = new Set([2317, 2329]);

test('template has no shellcheck finding other than an unused helper', { skip: !hasShellcheck && 'shellcheck not installed' }, () => {
  const run = spawnSync('shellcheck', ['-f', 'json', templatePath], { encoding: 'utf8' });
  const codes = JSON.parse(run.stdout).map((f) => f.code);
  assert.deepEqual(codes.filter((c) => !UNUSED_HELPER.has(c)), []);
});

// A PATH with only the tools the library needs, so gh and tput are absent.
function minimalPath() {
  const bin = mkdtempSync(join(tmpdir(), 'wizard-bin-'));
  for (const tool of ['bash', 'grep', 'tail', 'mktemp', 'cat', 'rm']) {
    const found = spawnSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
    symlinkSync(found, join(bin, tool));
  }
  return bin;
}

function runWizard(dir, input) {
  return spawnSync(join(dir, 'runtime-wizard.sh'), [], {
    cwd: dir,
    input,
    encoding: 'utf8',
    env: { PATH: minimalPath(), ENV_FILE: join(dir, '.env'), HOME: dir },
  });
}

function wizardDir() {
  const dir = mkdtempSync(join(tmpdir(), 'wizard-run-'));
  copyFileSync(fixturePath, join(dir, 'runtime-wizard.sh'));
  spawnSync('chmod', ['755', join(dir, 'runtime-wizard.sh')]);
  return dir;
}

const expectedEnv = "PUB_KEY='pk_1'\nSECRET_KEY='it'\\''s $HOME'\n";

test('runtime wizard writes .env and lists the skipped secret', () => {
  const dir = wizardDir();
  const run = runWizard(dir, "\npk_1\nit's $HOME\n");
  assert.equal(run.status, 0, run.stderr);
  assert.equal(readFileSync(join(dir, '.env'), 'utf8'), expectedEnv);
  assert.equal(statSync(join(dir, '.env')).mode & 0o777, 0o600);
  assert.match(run.stdout, /still to do by hand:[\s\S]*GitHub secret SECRET_KEY/);
  assert.ok(!run.stdout.includes("it's $HOME"), 'the secret was echoed');
});

test('re-run keeps existing values on Enter', () => {
  const dir = wizardDir();
  runWizard(dir, "\npk_1\nit's $HOME\n");
  const run = runWizard(dir, '\n\n\n');
  assert.equal(run.status, 0, run.stderr);
  assert.equal(readFileSync(join(dir, '.env'), 'utf8'), expectedEnv);
});
