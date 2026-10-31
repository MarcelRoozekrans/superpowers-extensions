import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { countHotspots, isExcluded } from './hotspots.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'hotspots.mjs');

function git(repo, args, date = '2026-01-01T00:00:00Z') {
  const r = spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
  assert.equal(r.status, 0, r.stderr);
}

function makeRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'hotspots-'));
  git(repo, ['init', '-q']);
  git(repo, ['config', 'user.name', 'Test']);
  git(repo, ['config', 'user.email', 'test@example.com']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  return repo;
}

function write(repo, rel, content) {
  mkdirSync(join(repo, dirname(rel)), { recursive: true });
  writeFileSync(join(repo, rel), content);
}

function commit(repo, message, date) {
  git(repo, ['add', '-A'], date);
  git(repo, ['commit', '-q', '-m', message], date);
}

function runCli(args) {
  const r = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

test('countHotspots cuts directories to depth and sorts by count', () => {
  const result = countHotspots(['src/a/b/c/d.js', 'src/a/b/c/e.js', 'src/x.js']);
  assert.deepEqual(result.dirs, [
    { dir: 'src/a/b/', count: 2 },
    { dir: 'src/', count: 1 },
  ]);
  assert.equal(result.total, 3);
});

test('countHotspots counts a root file under ./', () => {
  assert.deepEqual(countHotspots(['index.js']).dirs, [{ dir: './', count: 1 }]);
});

test('countHotspots drops excluded paths', () => {
  const result = countHotspots(['package-lock.json', 'src/a.js']);
  assert.equal(result.total, 1);
});

test('isExcluded matches the excluded patterns', () => {
  for (const p of [
    'package-lock.json', 'web/yarn.lock', 'CHANGELOG.md', 'docs/guide/x.md',
    'README.md', 'app/node_modules/x.js', 'src/Foo.g.cs', 'dist/app.js',
    'Foo.Designer.cs', 'a/b.min.js', 'a/b.generated.ts', 'a/b.snap', 'x/my.lock',
    'go.sum', 'src/obj/x.dll',
  ]) {
    assert.equal(isExcluded(p), true, p);
  }
  for (const p of ['src/README-parser.js', 'src/docs.js', 'src/notes.md']) {
    assert.equal(isExcluded(p), false, p);
  }
});

test('scattered is true when changes spread over many directories', () => {
  const paths = Array.from({ length: 20 }, (_, i) => `d${i}/f.js`);
  assert.equal(countHotspots(paths).scattered, true);
});

test('scattered is false when changes concentrate', () => {
  const paths = [...Array(8).fill('hot/f.js'), 'a/f.js', 'b/f.js'];
  assert.equal(countHotspots(paths).scattered, false);
});

test('scattered is false when the top counts equal threshold * total', () => {
  const paths = Array.from({ length: 10 }, (_, i) => `d${i}/f.js`);
  assert.equal(countHotspots(paths, { topN: 5, threshold: 0.5 }).scattered, false);
});

test('countHotspots honours custom depth, topN and threshold', () => {
  const paths = ['a/x/1.js', 'a/y/2.js', 'b/z.js', 'c/z.js'];
  assert.deepEqual(countHotspots(paths, { depth: 1, topN: 1, threshold: 0.6 }), {
    dirs: [
      { dir: 'a/', count: 2 },
      { dir: 'b/', count: 1 },
      { dir: 'c/', count: 1 },
    ],
    total: 4,
    scattered: true,
  });
  assert.equal(countHotspots(paths, { depth: 1, topN: 1, threshold: 0.5 }).scattered, false);
});

test('empty input is total 0 and scattered', () => {
  assert.deepEqual(countHotspots([]), { dirs: [], total: 0, scattered: true });
});

test('CLI counts A and M paths over a short history', () => {
  const repo = makeRepo();
  try {
    write(repo, 'src/a/one.js', '1');
    write(repo, 'src/b/two.js', '1');
    commit(repo, 'one', '2026-01-01T00:00:00Z');
    write(repo, 'src/a/one.js', '2');
    commit(repo, 'two', '2026-01-02T00:00:00Z');
    write(repo, 'src/a/three.js', '1');
    write(repo, 'package-lock.json', '{}');
    commit(repo, 'three', '2026-01-03T00:00:00Z');
    const r = runCli(['--repo', repo, '--commits', '200']);
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.commits, 3);
    assert.equal(out.total, 4);
    assert.deepEqual(out.dirs, [
      { dir: 'src/a/', count: 3 },
      { dir: 'src/b/', count: 1 },
    ]);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('CLI does not count the deleted side of a move', () => {
  const repo = makeRepo();
  try {
    write(repo, 'src/a/old.js', 'x');
    commit(repo, 'add', '2026-01-01T00:00:00Z');
    mkdirSync(join(repo, 'src/b'), { recursive: true });
    git(repo, ['mv', 'src/a/old.js', 'src/b/new.js']);
    commit(repo, 'move', '2026-01-02T00:00:00Z');
    const r = runCli(['--repo', repo, '--commits', '1']);
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.commits, 1);
    assert.deepEqual(out.dirs, [{ dir: 'src/b/', count: 1 }]);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('CLI exits 2 outside a git repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hotspots-norepo-'));
  try {
    const r = runCli(['--repo', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /not a git repo/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI reports non-ASCII directories unquoted', () => {
  const repo = makeRepo();
  try {
    write(repo, 'src/café/x.js', '1');
    commit(repo, 'add', '2026-01-01T00:00:00Z');
    const r = runCli(['--repo', repo]);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout).dirs, [{ dir: 'src/café/', count: 1 }]);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('CLI rejects bad option values with exit 2', () => {
  for (const args of [['--commits', 'abc'], ['--commits', '0'], ['--depth', '-1'], ['--commits'], ['--bogus', '1']]) {
    const r = runCli(args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /usage/);
  }
});
