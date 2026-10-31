import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { firstPaintedFrame } from '../lib/firstpaint.mjs';
import { expectedDuration, findFont, planOutputs, postprocess } from '../lib/postprocess.mjs';
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
  const texts = readdirSync(path.join(dir, 'raw', 'text'));
  assert.ok(texts.some((n) => n.startsWith('card-')), texts.join());
  assert.ok(!texts.some((n) => n.startsWith('caption-')), texts.join());
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

test('verify flags a blank step frame', { skip }, async () => {
  const dir = folderWith(timeline());
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=white:size=1920x1080:rate=30',
    '-t', '12', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8',
    '-y', path.join(dir, 'raw', 'p0.webm'),
  ]);
  await postprocess(dir);
  const result = await verify(dir);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => /step 1\.1 frame looks blank \(uniform color\) — view it/.test(p)), result.problems.join('\n'));
});

test('quick mode verify reports a missing demo.gif', { skip }, async () => {
  const tl = timeline({
    mode: 'quick',
    chapters: [{ id: 'c1', title: 'Only', slug: 'only' }],
    steps: timeline().steps.filter((s) => s.chapter === 'c1'),
  });
  const dir = folderWith(tl);
  await postprocess(dir);
  rmSync(path.join(dir, 'demo.gif'));
  const result = await verify(dir);
  assert.ok(result.problems.some((p) => p.startsWith('demo.gif')), result.problems.join('\n'));
});

test('verify clears frames of an earlier run', { skip }, async () => {
  const dir = folderWith(timeline());
  await postprocess(dir);
  mkdirSync(path.join(dir, 'frames'));
  writeFileSync(path.join(dir, 'frames', '09-step-9.png'), 'stale');
  const result = await verify(dir);
  assert.ok(!result.frames.some((f) => f.endsWith('09-step-9.png')));
  assert.equal(existsSync(path.join(dir, 'frames', '09-step-9.png')), false);
});

test('a chapter title without latin letters gets a chapter-N file name', { skip }, async () => {
  const tl = timeline();
  tl.chapters = [
    { id: 'c1', title: '日本語', slug: '' },
    { id: 'c2', title: 'Second chapter', slug: 'second-chapter' },
  ];
  const dir = folderWith(tl);
  await postprocess(dir);
  assert.deepEqual(names(dir), ['01-chapter-1.mp4', '02-second-chapter.mp4', 'demo.mp4']);
});

test('findFont returns an existing font file that covers the speed marker', async (t) => {
  let font;
  try {
    font = await findFont();
  } catch (err) {
    t.skip(err.message);
    return;
  }
  assert.ok(existsSync(font), font);
  const covered = spawnSync('fc-list', ['-f', '%{file}\n', ':charset=25b6 d7'], { encoding: 'utf8' });
  if (covered.status === 0) assert.ok(covered.stdout.split('\n').includes(font), font);
});

test('findFont names the problem when no font can be found', async () => {
  await assert.rejects(findFont({ command: 'no-such-fc-command', macFonts: ['/nonexistent/font.ttf'] }), /No usable font found/);
});

test('findFont falls back to a macOS font when fontconfig is missing', async () => {
  const fake = path.join(root ?? tmpdir(), 'fake-font.ttf');
  writeFileSync(fake, 'x');
  assert.equal(await findFont({ command: 'no-such-fc-command', macFonts: ['/nonexistent.ttf', fake] }), fake);
});

function blankStartVideo(dir, whiteSeconds) {
  const file = path.join(dir, 'raw', 'p0.webm');
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `color=c=white:size=1920x1080:rate=30:d=${whiteSeconds}`,
    '-f', 'lavfi', '-i', 'testsrc=size=1920x1080:rate=30:d=8',
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0',
    '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8', '-y', file,
  ]);
  return file;
}

test('firstPaintedFrame finds the first non-uniform frame of a blank-start clip', { skip }, async () => {
  const dir = folderWith(timeline());
  const t = await firstPaintedFrame(blankStartVideo(dir, 1));
  assert.ok(t >= 0.9 && t <= 1.3, String(t));
  assert.equal(await firstPaintedFrame(rawVideo), 0);
});

test('postprocess starts a blank-start page at its first painted frame and verify agrees', { skip }, async () => {
  const tl = timeline({
    mode: 'quick',
    chapters: [{ id: 'c1', title: 'Only', slug: 'only' }],
    steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p0', start: 0, end: 4 }],
  });
  const dir = folderWith(tl);
  blankStartVideo(dir, 1);
  await postprocess(dir);
  const out = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, 'demo.mp4')]).toString(),
  );
  // 4 s step minus about 1 s of white
  assert.ok(out > 2.7 && out < 3.3, String(out));
  const result = await verify(dir);
  assert.deepEqual(result.problems, []);
  assert.equal(result.frames.length, 1);
});

test('a page that paints at once is not clamped', { skip }, async () => {
  const dir = folderWith(timeline());
  const { withFirstPaint } = await import('../lib/firstpaint.mjs');
  const measured = await withFirstPaint(timeline(), dir);
  assert.equal(measured.pages[0].firstPaint, 0);
  const plan = planOutputs(measured);
  assert.ok(expectedDuration(measured, plan.chapterFiles[0]) > 0);
});
