// Turns a recording folder (timeline.json plus raw page videos) into chapter
// MP4s, a combined demo.mp4 and, in quick mode, a demo.gif.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { slugify, segmentsForChapter } from './timeline.mjs';
import { buildChapterArgs, buildConcatArgs, buildGifArgs } from './ffmpeg-graph.mjs';

const run = promisify(execFile);
const MAC_FONT = '/System/Library/Fonts/Supplemental/Arial.ttf';
export const CARD_SECONDS = 2.5;

export async function findFont() {
  try {
    const { stdout } = await run('fc-match', ['-f', '%{file}', 'DejaVu Sans']);
    const file = stdout.trim();
    if (file && existsSync(file)) return file;
  } catch {
    // fc-match missing: fall through to the macOS font
  }
  if (existsSync(MAC_FONT)) return MAC_FONT;
  throw new Error(
    'No usable font found: install DejaVu Sans (fontconfig must be able to find it) or use macOS Arial.',
  );
}

// Which files a timeline produces, and which cards each one carries.
// Shared with verify.mjs so both agree on what a correct output is.
export function planOutputs(timeline, { captions } = {}) {
  const quick = timeline.mode === 'quick';
  const title = !quick && timeline.title ? timeline.title : null;
  const end = !quick && timeline.endCard ? timeline.endCard : null;
  const showCaptions = !quick && (captions ?? timeline.captions);
  const chapters = timeline.chapters.map((c, i) => ({
    ...c,
    number: String(i + 1).padStart(2, '0'),
    slug: c.slug || slugify(c.title),
  }));
  if (chapters.length === 1) {
    return {
      quick,
      captions: showCaptions,
      chapters,
      chapterFiles: [{ name: 'demo.mp4', chapter: chapters[0], titleCard: title, endCard: end }],
      combined: null,
      title,
      end,
    };
  }
  return {
    quick,
    captions: showCaptions,
    chapters,
    chapterFiles: chapters.map((c) => ({
      name: `${c.number}-${c.slug}.mp4`,
      chapter: c,
      titleCard: quick ? null : c.title,
      endCard: null,
    })),
    combined: { name: 'demo.mp4' },
    title,
    end,
  };
}

// Output duration of each step of a chapter, in order.
export function stepDurations(timeline, chapterId) {
  return timeline.steps
    .filter((s) => s.chapter === chapterId)
    .sort((a, b) => a.index - b.index)
    .map((step) => ({
      step,
      seconds: segmentsForChapter({ ...timeline, steps: [step] }, chapterId).reduce(
        (sum, s) => sum + (s.to - s.from) / s.speed,
        0,
      ),
    }));
}

export function expectedDuration(timeline, file) {
  const steps = stepDurations(timeline, file.chapter.id).reduce((a, d) => a + d.seconds, 0);
  return steps + CARD_SECONDS * ((file.titleCard != null) + (file.endCard != null));
}

async function ffmpeg(args) {
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
    maxBuffer: 64 * 1024 * 1024,
  });
}

async function render(opts, textDir) {
  const { args, textFiles } = buildChapterArgs({ ...opts, captionDir: textDir });
  await mkdir(textDir, { recursive: true });
  for (const t of textFiles) await writeFile(t.path, t.text);
  await ffmpeg(args);
}

export async function postprocess(folder, { captions } = {}) {
  folder = path.resolve(folder);
  const timeline = JSON.parse(await readFile(path.join(folder, 'timeline.json'), 'utf8'));
  const plan = planOutputs(timeline, { captions });
  const fontFile = await findFont();
  const textDir = path.join(folder, 'raw', 'text');

  for (const name of await readdir(folder)) {
    if (/^\d{2}-.*\.mp4$/.test(name) || name === 'demo.mp4' || name === 'demo.gif') {
      await rm(path.join(folder, name));
    }
  }

  const tl = {
    ...timeline,
    captions: plan.captions,
    pages: timeline.pages.map((p) => ({ ...p, file: path.resolve(folder, p.file) })),
  };
  const factor = timeline.speedFactor;
  const written = [];

  for (const file of plan.chapterFiles) {
    const out = path.join(folder, file.name);
    await render(
      {
        segments: segmentsForChapter(tl, file.chapter.id),
        titleCard: file.titleCard,
        endCard: file.endCard,
        fontFile,
        out,
        factor,
      },
      textDir,
    );
    written.push(out);
  }

  if (plan.combined) {
    const parts = [];
    const temp = [];
    const card = async (name, text) => {
      const out = path.join(folder, 'raw', name);
      await render({ segments: [], titleCard: text, fontFile, out, factor }, textDir);
      temp.push(out);
      return out;
    };
    if (plan.title) parts.push(await card('card-title.mp4', plan.title));
    parts.push(...plan.chapterFiles.map((f) => path.join(folder, f.name)));
    if (plan.end) parts.push(await card('card-end.mp4', plan.end));

    const out = path.join(folder, plan.combined.name);
    const listFile = path.join(folder, 'raw', 'concat.txt');
    const { args, list } = buildConcatArgs(parts, listFile, out);
    await writeFile(listFile, list);
    await ffmpeg(args);
    await rm(listFile);
    for (const t of temp) await rm(t);
    written.push(out);
  }

  if (plan.quick) {
    const gif = path.join(folder, 'demo.gif');
    await ffmpeg(buildGifArgs(path.join(folder, 'demo.mp4'), gif));
    written.push(gif);
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const folder = args.find((a) => !a.startsWith('--'));
  if (!folder) {
    console.error('usage: node postprocess.mjs <folder> [--no-captions]');
    process.exit(2);
  }
  try {
    const opts = args.includes('--no-captions') ? { captions: false } : {};
    for (const f of await postprocess(folder, opts)) console.log(f);
  } catch (err) {
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}
