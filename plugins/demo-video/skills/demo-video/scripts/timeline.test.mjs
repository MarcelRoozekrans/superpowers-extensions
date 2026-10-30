import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapterSlug, waitOutputDuration, segmentsForChapter, slugify } from '../lib/timeline.mjs';

const near = (a, b) => Math.abs(a - b) < 1e-9;

function timeline(overrides = {}) {
  return {
    version: 1,
    mode: 'polished',
    captions: true,
    title: 'Demo',
    endCard: 'Done',
    speedFactor: 10,
    minWait: 1,
    pages: [
      { id: 'p0', file: 'raw/p0.webm', openedAt: 0 },
      { id: 'p1', file: 'raw/p1.webm', openedAt: 12 },
    ],
    chapters: [
      { id: 'c1', title: 'One', slug: 'one' },
      { id: 'c2', title: 'Two', slug: 'two' },
    ],
    steps: [
      { chapter: 'c1', index: 1, caption: 'First', page: 'p0', start: 3.2, end: 9.8, wait: { start: 5.0, end: 8.1 } },
    ],
    ...overrides,
  };
}

test('waitOutputDuration compresses long waits', () => {
  assert.equal(waitOutputDuration(15, 10, 1), 1.5);
});

test('waitOutputDuration applies the minimum', () => {
  assert.equal(waitOutputDuration(5, 10, 1), 1);
});

test('waitOutputDuration never exceeds the input duration', () => {
  assert.equal(waitOutputDuration(0.4, 10, 1), 0.4);
});

test('a step with a wait gives three segments', () => {
  const segs = segmentsForChapter(timeline(), 'c1');
  assert.equal(segs.length, 3);
  assert.deepEqual(segs[0], { file: 'raw/p0.webm', from: 3.2, to: 5.0, speed: 1, caption: 'First', marker: false });
  assert.equal(segs[1].from, 5.0);
  assert.equal(segs[1].to, 8.1);
  assert.ok(near(segs[1].speed, 3.1));
  assert.equal(segs[1].marker, true);
  assert.deepEqual(segs[2], { file: 'raw/p0.webm', from: 8.1, to: 9.8, speed: 1, caption: 'First', marker: false });
});

test('a step without a wait gives one segment', () => {
  const t = timeline({ steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p0', start: 1, end: 4 }] });
  assert.deepEqual(segmentsForChapter(t, 'c1'), [
    { file: 'raw/p0.webm', from: 1, to: 4, speed: 1, caption: 'A', marker: false },
  ]);
});

test('times are page-local', () => {
  const t = timeline({ steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p1', start: 14, end: 16 }] });
  const [seg] = segmentsForChapter(t, 'c1');
  assert.equal(seg.from, 2);
  assert.equal(seg.to, 4);
  assert.equal(seg.file, 'raw/p1.webm');
});

test('captions false nulls every caption', () => {
  const segs = segmentsForChapter(timeline({ captions: false }), 'c1');
  assert.equal(segs.length, 3);
  assert.ok(segs.every((s) => s.caption === null));
});

test('other chapters are excluded and steps ordered by index', () => {
  const t = timeline({
    steps: [
      { chapter: 'c1', index: 2, caption: 'B', page: 'p0', start: 20, end: 22 },
      { chapter: 'c2', index: 1, caption: 'X', page: 'p0', start: 10, end: 11 },
      { chapter: 'c1', index: 1, caption: 'A', page: 'p0', start: 1, end: 2 },
    ],
  });
  assert.deepEqual(segmentsForChapter(t, 'c1').map((s) => s.caption), ['A', 'B']);
});

test('slugify', () => {
  assert.equal(slugify('Melding 2: persoonsgegevens!'), 'melding-2-persoonsgegevens');
  assert.equal(slugify('Één'), 'een');
  assert.equal(slugify('a'.repeat(50)).length, 40);
});

test('chapterSlug falls back to chapter-N when the title has no slug', () => {
  assert.equal(slugify('日本語'), '');
  assert.equal(chapterSlug('日本語', 3), 'chapter-3');
  assert.equal(chapterSlug('Één', 1), 'een');
});

test('a wait with no length gives one normal segment, not NaN', () => {
  const t = timeline({
    steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p0', start: 1, end: 4, wait: { start: 2, end: 2 } }],
  });
  const segs = segmentsForChapter(t, 'c1');
  assert.equal(segs.length, 1);
  assert.equal(segs[0].speed, 1);
  assert.equal(segs[0].marker, false);
});

test('a wait that ends before it starts is an error', () => {
  const t = timeline({
    steps: [{ chapter: 'c1', index: 2, caption: 'A', page: 'p0', start: 1, end: 4, wait: { start: 3, end: 2 } }],
  });
  assert.throws(() => segmentsForChapter(t, 'c1'), /Step c1\.2 has a wait that ends before it starts/);
});

test('an unknown page id is a clear error', () => {
  const t = timeline({ steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p9', start: 1, end: 4 }] });
  assert.throws(() => segmentsForChapter(t, 'c1'), /Step c1\.1 refers to unknown page "p9"/);
});

test('a wait on the step boundaries gives only the sped-up segment', () => {
  const t = timeline({
    steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p0', start: 2, end: 12, wait: { start: 2, end: 12 } }],
  });
  const segs = segmentsForChapter(t, 'c1');
  assert.equal(segs.length, 1);
  assert.equal(segs[0].marker, true);
  assert.ok(near(segs[0].speed, 10 / 1.0));
});

test('a wait that starts at the step start or ends at the step end drops that side', () => {
  const at = (wait) =>
    segmentsForChapter(
      timeline({ steps: [{ chapter: 'c1', index: 1, caption: 'A', page: 'p0', start: 2, end: 12, wait }] }),
      'c1',
    );
  assert.deepEqual(at({ start: 2, end: 8 }).map((s) => s.marker), [true, false]);
  assert.deepEqual(at({ start: 6, end: 12 }).map((s) => s.marker), [false, true]);
});
