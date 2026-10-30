import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkFonts, checkGitLfs, checkNode, preflight } from './preflight.mjs';
import { scaffold } from './scaffold.mjs';

const tmp = () => mkdtempSync(path.join(tmpdir(), 'demo-scaffold-'));
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
const FOLDER = 'docs/demo-videos/login';
const read = (...p) => readFileSync(path.join(...p), 'utf8');

test('scaffold creates the folder, lib, template and ignore rules', () => {
  const repo = tmp();
  try {
    const r = scaffold({ repoRoot: repo, folder: FOLDER });
    const dir = path.join(repo, FOLDER);
    for (const f of ['lib/runtime.mjs', 'lib/postprocess.mjs', 'record.mjs']) {
      assert.ok(existsSync(path.join(dir, f)), f);
    }
    assert.ok(r.created.includes('record.mjs'));
    assert.equal(r.gitattributesAdded.length, 2);
    assert.equal(r.gitignoreAdded.length, 3);
    assert.match(read(repo, '.gitattributes'), /docs\/demo-videos\/\*\*\/\*\.mp4 filter=lfs diff=lfs merge=lfs -text/);
    assert.match(read(repo, '.gitignore'), /docs\/demo-videos\/\*\*\/\.auth\//);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('a second run adds nothing and keeps an edited record.mjs', () => {
  const repo = tmp();
  try {
    scaffold({ repoRoot: repo, folder: FOLDER });
    const rec = path.join(repo, FOLDER, 'record.mjs');
    writeFileSync(rec, '// mine\n');
    const r = scaffold({ repoRoot: repo, folder: FOLDER });
    assert.equal(r.gitattributesAdded.length, 0);
    assert.equal(r.gitignoreAdded.length, 0);
    assert.ok(!r.created.includes('record.mjs'));
    assert.equal(read(rec), '// mine\n');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('existing unrelated ignore lines are kept, even without a trailing newline', () => {
  const repo = tmp();
  try {
    writeFileSync(path.join(repo, '.gitignore'), 'node_modules/');
    scaffold({ repoRoot: repo, folder: FOLDER });
    const lines = read(repo, '.gitignore').split('\n');
    assert.equal(lines[0], 'node_modules/');
    assert.ok(lines.includes('docs/demo-videos/**/raw/'));
    assert.ok(lines.includes('docs/demo-videos/**/frames/'));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('an absolute folder is used as given', () => {
  const repo = tmp();
  const abs = path.join(repo, 'elsewhere');
  try {
    scaffold({ repoRoot: repo, folder: abs });
    assert.ok(existsSync(path.join(abs, 'record.mjs')));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('the scaffold CLI prints a summary', () => {
  const repo = tmp();
  try {
    const cli = path.join(path.dirname(new URL(import.meta.url).pathname), 'scaffold.mjs');
    const r = spawnSync('node', [cli, repo, FOLDER], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /record\.mjs/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('preflight reports an unreachable url as a failed check', async () => {
  const r = await preflight({ url: 'http://127.0.0.1:1' });
  const check = r.checks.find((c) => c.name === 'url');
  assert.equal(check.ok, false);
  assert.equal(r.ok, false);
});

test('preflight omits the url check when no url is given', async () => {
  const r = await preflight({});
  assert.ok(!r.checks.some((c) => c.name === 'url'));
});

test('preflight finds ffmpeg on this machine', { skip: hasFfmpeg ? false : 'ffmpeg not installed' }, async () => {
  const r = await preflight({});
  for (const name of ['ffmpeg', 'ffprobe']) {
    assert.equal(r.checks.find((c) => c.name === name).ok, true, name);
  }
});

test('appended lines follow the CRLF line ending of the file', () => {
  const repo = tmp();
  try {
    writeFileSync(path.join(repo, '.gitignore'), 'node_modules/\r\ndist/');
    scaffold({ repoRoot: repo, folder: FOLDER });
    const text = read(repo, '.gitignore');
    assert.ok(text.includes('dist/\r\ndocs/demo-videos/**/raw/\r\n'), JSON.stringify(text));
    assert.ok(!/[^\r]\n/.test(text), JSON.stringify(text));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('appended lines use LF when the file uses LF', () => {
  const repo = tmp();
  try {
    writeFileSync(path.join(repo, '.gitignore'), 'node_modules/\n');
    scaffold({ repoRoot: repo, folder: FOLDER });
    assert.ok(!read(repo, '.gitignore').includes('\r'));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('a second scaffold refreshes lib but keeps record.mjs', () => {
  const repo = tmp();
  try {
    scaffold({ repoRoot: repo, folder: FOLDER });
    const lib = path.join(repo, FOLDER, 'lib', 'runtime.mjs');
    writeFileSync(lib, '// stale copy\n');
    scaffold({ repoRoot: repo, folder: FOLDER });
    assert.notEqual(read(lib), '// stale copy\n');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

const hasGit = spawnSync('git', ['--version']).status === 0;
const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
const hasLfs = spawnSync('git', ['lfs', 'version']).status === 0;

test('the git-lfs check reports an uninitialised repo, then passes once the filter is set', { skip: hasGit && hasLfs ? false : 'git lfs not installed' }, async () => {
  const repo = tmp();
  try {
    spawnSync('git', ['init', '-q', repo], { env: gitEnv });
    const before = await checkGitLfs({ repo, env: gitEnv });
    assert.equal(before.ok, false);
    assert.match(before.hint, /git lfs install/);
    spawnSync('git', ['-C', repo, 'config', 'filter.lfs.clean', 'git-lfs clean -- %f'], { env: gitEnv });
    assert.equal((await checkGitLfs({ repo, env: gitEnv })).ok, true);
    spawnSync('git', ['-C', repo, 'config', '--unset', 'filter.lfs.clean'], { env: gitEnv });
    spawnSync('git', ['-C', repo, 'config', 'filter.lfs.process', 'git-lfs filter-process'], { env: gitEnv });
    assert.equal((await checkGitLfs({ repo, env: gitEnv })).ok, true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('the node check passes here without launching anything', async () => {
  assert.deepEqual(await checkNode(), { name: 'node', ok: true });
});

test('the fonts check fails with a hint when no font is found', async () => {
  const r = await checkFonts({ command: 'no-such-fc-command', macFonts: [] });
  assert.equal(r.ok, false);
  assert.match(r.hint, /DejaVu Sans/);
  assert.match(r.hint, /No usable font found/);
});

test('the fonts check renders one drawtext frame with a real font', { skip: hasFfmpeg ? false : 'ffmpeg not installed' }, async () => {
  const r = await checkFonts();
  assert.equal(r.ok, true, r.hint);
});
