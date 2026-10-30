import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChapterArgs, buildConcatArgs, buildGifArgs } from '../lib/ffmpeg-graph.mjs';

const seg = (over = {}) => ({
  file: 'a.webm', from: 1, to: 4, speed: 1, caption: null, marker: false, ...over,
});

function build(over = {}) {
  return buildChapterArgs({
    segments: [seg(), seg({ file: 'b.webm' })],
    titleCard: null,
    endCard: null,
    captionDir: '/tmp/caps',
    fontFile: '/fonts/x.ttf',
    out: 'out.mp4',
    ...over,
  });
}

const filterOf = (args) => args[args.indexOf('-filter_complex') + 1];
const inputsOf = (args) => args.flatMap((a, i) => (a === '-i' ? [args[i + 1]] : []));

test('two files give two inputs and concat=n=2', () => {
  const { args } = build();
  assert.deepEqual(inputsOf(args), ['a.webm', 'b.webm']);
  assert.match(filterOf(args), /concat=n=2:v=1:a=0\[out\]/);
  assert.deepEqual(args.slice(args.indexOf('-map'), args.indexOf('-map') + 2), ['-map', '[out]']);
});

test('segments sharing a file reuse one input through split', () => {
  const { args } = build({ segments: [seg(), seg({ from: 5, to: 6 })] });
  assert.deepEqual(inputsOf(args), ['a.webm']);
  assert.match(filterOf(args), /\[0:v\]split=2\[/);
  assert.match(filterOf(args), /concat=n=2/);
});

test('caption text lives in a text file, never in the filter', () => {
  const caption = "Spoed: ja — 100% 'zeker', V-nummer [V-NUMMER]";
  const { args, textFiles } = build({ segments: [seg({ caption }), seg({ file: 'b.webm' })] });
  const f = filterOf(args);
  assert.ok(textFiles.some((t) => t.text === caption && t.path.startsWith('/tmp/caps/')));
  assert.ok(!f.includes('Spoed'));
  assert.ok(!f.includes('100%'));
  assert.match(f, /drawtext=fontfile='\/fonts\/x\.ttf':textfile='\/tmp\/caps\/caption-0\.txt'/);
});

test('drawtext disables percent expansion so literal % in text survives', () => {
  const { args } = build({ segments: [seg({ caption: '100%' })], titleCard: 'T' });
  const f = filterOf(args);
  const draws = f.match(/drawtext=[^\[;]*/g);
  assert.equal(draws.length, 2);
  for (const d of draws) assert.ok(d.includes(':expansion=none'), d);
});

test('speed becomes a setpts divisor', () => {
  const { args } = build({ segments: [seg({ speed: 3.1 })] });
  assert.ok(filterOf(args).includes('setpts=(PTS-STARTPTS)/3.1'));
  assert.ok(filterOf(args).includes('trim=start=1:end=4'));
});

test('marker adds a drawtext with the factor, no marker adds none', () => {
  const on = build({ segments: [seg({ marker: true })], factor: 10 });
  assert.ok(on.textFiles.some((t) => t.text === '▶▶ 10×'));
  assert.match(filterOf(on.args), /drawtext=.*marker\.txt/);
  const off = build();
  assert.ok(!off.textFiles.some((t) => t.text.includes('▶▶')));
  assert.ok(!filterOf(off.args).includes('drawtext'));
});

test('title card adds a color source and one more concat input', () => {
  const { args, textFiles } = build({ titleCard: 'Titel' });
  const f = filterOf(args);
  assert.ok(inputsOf(args).includes('color=c=black:s=1920x1080:r=30:d=2.5'));
  assert.match(f, /concat=n=3:v=1:a=0/);
  assert.ok(textFiles.some((t) => t.text === 'Titel' && t.path === '/tmp/caps/card-title.txt'));
  assert.match(f, /^\[2:v\].*card-title\.txt.*\[v0\];/);
});

test('end card goes last and null cards add no color source', () => {
  const { args } = build({ endCard: 'Einde' });
  assert.match(filterOf(args), /concat=n=3/);
  assert.ok(filterOf(args).indexOf('[v2]') > 0);
  assert.ok(!inputsOf(build().args).some((i) => i.startsWith('color=')));
});

test('encoding flags and trailing -y out', () => {
  const { args } = build();
  for (const x of ['libx264', 'yuv420p', '+faststart']) assert.ok(args.includes(x));
  assert.deepEqual(args.slice(-2), ['-y', 'out.mp4']);
});

test('paths with colon, backslash and quote are escaped for filter syntax', () => {
  const { args } = build({
    captionDir: "/tmp/a:b\\c'd",
    segments: [seg({ caption: 'x' })],
  });
  const f = filterOf(args);
  assert.ok(f.includes("textfile='/tmp/a\\:b\\\\c\\'\\''d/caption-0.txt'"), f);
});

test('buildConcatArgs uses the demuxer with copy', () => {
  const { args, list } = buildConcatArgs(['a.mp4', "b'c.mp4"], 'list.txt', 'all.mp4');
  assert.deepEqual(args, ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', '-y', 'all.mp4']);
  assert.equal(list, "file 'a.mp4'\nfile 'b'\\''c.mp4'\n");
});

test('buildGifArgs uses a palette', () => {
  const args = buildGifArgs('in.mp4', 'out.gif');
  const f = args[args.indexOf('-vf') + 1];
  assert.ok(f.includes('fps=12') && f.includes('palettegen') && f.includes('paletteuse'));
  assert.deepEqual(args.slice(-2), ['-y', 'out.gif']);
});
