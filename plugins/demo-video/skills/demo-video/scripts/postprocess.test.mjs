import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { postprocess } from '../lib/postprocess.mjs';
import { verify } from '../lib/verify.mjs';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
const skip = hasFfmpeg ? false : 'ffmpeg not installed';

let root;
let rawVideo;
const folders = [];

function timeline(over = {}) {
  return {
    version: 1,
    mode: 'polished',
    captions: true,
    title: 'Demo title',
    endCard: 'The end',
    speedFactor: 10,
    minWait: 1,
    pages: [{ id: 'p0', file: 'raw/p0.webm', openedAt: 0 }],
    chapters: [
      { id: 'c1', title: 'First chapter', slug: 'first-chapter' },
      { id: 'c2', title: 'Second chapter', slug: 'second-chapter' },
    ],
    steps: [
      { chapter: 'c1', index: 1, caption: 'Open it', page: 'p0', start: 0, end: 3 },
      { chapter: 'c1', index: 2, caption: '100% done', page: 'p0', start: 3, end: 8, wait: { start: 4, end: 7 } },
      { chapter: 'c2', index: 1, caption: 'Second', page: 'p0', start: 8, end: 11 },
    ],
    ...over,
  };
}

function folderWith(tl) {
  const dir = mkdtempSync(path.join(root, 'rec-'));
  mkdirSync(path.join(dir, 'raw'));
  execFileSync('cp', [rawVideo, path.join(dir, 'raw', 'p0.webm')]);
  writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(tl));
  folders.push(dir);
  return dir;
}

const names = (dir) => readdirSync(dir).filter((n) => /\.(mp4|gif)$/.test(n)).sort();

before(() => {
  if (!hasFfmpeg) return;
  root = mkdtempSync(path.join(tmpdir(), 'demo-video-test-'));
  rawVideo = path.join(root, 'source.webm');
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc=size=1920x1080:rate=30',
    '-t', '12', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8',
    '-y', rawVideo,
  ]);
});

after(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

test('two chapters write chapter files and demo.mp4', { skip }, async () => {
  const dir = folderWith(timeline());
  const written = await postprocess(dir);
  assert.deepEqual(names(dir), ['01-first-chapter.mp4', '02-second-chapter.mp4', 'demo.mp4']);
  assert.equal(written.length, 3);
  assert.ok(written.every((p) => existsSync(p)));
  assert.equal(existsSync(path.join(dir, 'demo.gif')), false);
});

test('stale chapter files are deleted and unrelated files kept', { skip }, async () => {
  const dir = folderWith(timeline());
  writeFileSync(path.join(dir, '02-old-name.mp4'), 'stale');
  writeFileSync(path.join(dir, 'notes.txt'), 'keep me');
  await postprocess(dir);
  assert.equal(existsSync(path.join(dir, '02-old-name.mp4')), false);
  assert.ok(existsSync(path.join(dir, 'notes.txt')));
});

test('one chapter writes only demo.mp4', { skip }, async () => {
  const tl = timeline({
    chapters: [{ id: 'c1', title: 'Only', slug: 'only' }],
    steps: timeline().steps.filter((s) => s.chapter === 'c1'),
  });
  const dir = folderWith(tl);
  await postprocess(dir);
  assert.deepEqual(names(dir), ['demo.mp4']);
  const result = await verify(dir);
  assert.deepEqual(result.problems, []);
});

test('quick mode writes demo.gif and no cards', { skip }, async () => {
  const tl = timeline({
    mode: 'quick',
    chapters: [{ id: 'c1', title: 'Only', slug: 'only' }],
    steps: timeline().steps.filter((s) => s.chapter === 'c1'),
  });
  const dir = folderWith(tl);
  await postprocess(dir);
  assert.deepEqual(names(dir), ['demo.gif', 'demo.mp4']);
  const result = await verify(dir);
  assert.deepEqual(result.problems, []);
});

test('captions option false still renders cards', { skip }, async () => {
  const dir = folderWith(timeline());
  await postprocess(dir, { captions: false });
  const result = await verify(dir);
  assert.deepEqual(result.problems, []);
});

test('verify passes for a good run and extracts one frame per step', { skip }, async () => {
  const dir = folderWith(timeline());
  await postprocess(dir);
  const result = await verify(dir);
  assert.deepEqual(result.problems, []);
  assert.equal(result.ok, true);
  assert.equal(result.frames.length, 3);
  for (const f of result.frames) assert.ok(existsSync(f), f);
  assert.deepEqual(
    result.frames.map((f) => path.basename(f)).sort(),
    ['01-step-1.png', '01-step-2.png', '02-step-1.png'],
  );
});

test('verify reports a truncated chapter video', { skip }, async () => {
  const dir = folderWith(timeline());
  await postprocess(dir);
  const target = path.join(dir, '01-first-chapter.mp4');
  const short = path.join(dir, 'short.mp4');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', target, '-t', '1', '-c', 'copy', '-y', short]);
  execFileSync('mv', [short, target]);
  const result = await verify(dir);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('01-first-chapter.mp4') && /duration/.test(p)), result.problems.join('\n'));
});
