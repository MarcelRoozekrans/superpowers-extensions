import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChapterArgs, buildConcatArgs, buildGifArgs, fontCheckArgs, wrapCaption } from '../lib/ffmpeg-graph.mjs';

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

test('marker shows the real rounded speed, no marker adds none', () => {
  const on = build({ segments: [seg({ marker: true, speed: 6.4 })] });
  assert.ok(on.textFiles.some((t) => t.text === '▶▶ 6×'));
  assert.match(filterOf(on.args), /drawtext=.*marker-6\.txt/);
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

test('each distinct marker speed gets its own text file', () => {
  const { textFiles } = build({
    segments: [seg({ marker: true, speed: 3.1 }), seg({ marker: true, speed: 10 }), seg({ marker: true, speed: 3.2 })],
  });
  assert.deepEqual(
    textFiles.map((t) => t.text),
    ['▶▶ 3×', '▶▶ 10×'],
  );
});

test('a wait that is hardly sped up shows no marker', () => {
  const { args, textFiles } = build({ segments: [seg({ marker: true, speed: 1.2 })] });
  assert.equal(textFiles.length, 0);
  assert.ok(!filterOf(args).includes('drawtext'));
});

test('long captions are wrapped on word boundaries', () => {
  const caption = 'Open het dashboard in een tweede tabblad en kijk naar de resultaten van de analyse';
  const wrapped = wrapCaption(caption);
  assert.ok(wrapped.includes('\n'));
  for (const line of wrapped.split('\n')) assert.ok(line.length <= 60, line);
  assert.equal(wrapped.replace(/\n/g, ' '), caption);
  assert.equal(wrapCaption('kort'), 'kort');
  assert.equal(wrapCaption('x'.repeat(80)), 'x'.repeat(80));
  const { textFiles } = build({ segments: [seg({ caption })] });
  assert.ok(textFiles.some((t) => t.text === wrapped));
});

test('no segments and no cards is a clear error, not concat=n=0', () => {
  assert.throws(() => build({ segments: [] }), /Nothing to render/);
});

test('an empty string card is no card', () => {
  const { args } = build({ titleCard: '', endCard: '' });
  assert.match(filterOf(args), /concat=n=2/);
  assert.ok(!inputsOf(args).some((i) => i.startsWith('color=')));
});

test('title and end card get consecutive inputs after the video files', () => {
  const { args } = build({ titleCard: 'A', endCard: 'B' });
  const f = filterOf(args);
  assert.match(f, /\[2:v\]drawtext=[^;]*card-title\.txt[^;]*\[v0\]/);
  assert.match(f, /\[3:v\]drawtext=[^;]*card-end\.txt[^;]*\[v3\]/);
});

test('fontCheckArgs renders the marker glyphs with the given font', () => {
  const args = fontCheckArgs('/fonts/x.ttf');
  const vf = args[args.indexOf('-vf') + 1];
  assert.ok(vf.includes("fontfile='/fonts/x.ttf'") && vf.includes('▶') && vf.includes('×'));
  assert.deepEqual(args.slice(-3), ['-f', 'null', '-']);
});
