// Checks the MP4s next to a timeline.json and extracts one frame per step.
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { CARD_SECONDS, expectedDuration, planOutputs, stepDurations } from './postprocess.mjs';

const run = promisify(execFile);
const TOLERANCE = 1;

async function probe(file) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height:format=duration',
    '-of', 'json',
    file,
  ]);
  const json = JSON.parse(stdout);
  const stream = json.streams?.[0];
  if (!stream) throw new Error('no video stream');
  return { ...stream, duration: Number(json.format?.duration) };
}

const BLANK_LUMA_RANGE = 8;

// The crop leaves out the caption band at the bottom and the speed marker at the top right,
// which are drawn over blank recordings too.
async function lumaRange(image) {
  const { stderr } = await run('ffmpeg', [
    '-hide_banner', '-i', image, '-vf', 'crop=iw*0.8:ih*0.85:0:0,signalstats,metadata=print', '-f', 'null', '-',
  ]);
  const min = Number(/YMIN=(\d+)/.exec(stderr)?.[1]);
  const max = Number(/YMAX=(\d+)/.exec(stderr)?.[1]);
  return Number.isFinite(min) && Number.isFinite(max) ? max - min : Infinity;
}

export async function verify(folder) {
  folder = path.resolve(folder);
  const timeline = JSON.parse(await readFile(path.join(folder, 'timeline.json'), 'utf8'));
  const plan = planOutputs(timeline);
  const problems = [];
  const frames = [];

  const check = async (name, expected) => {
    let info;
    try {
      info = await probe(path.join(folder, name));
    } catch (err) {
      problems.push(`${name}: cannot read video (${(err.stderr || err.message).toString().trim()})`);
      return;
    }
    if (info.codec_name !== 'h264') problems.push(`${name}: codec is ${info.codec_name}, expected h264`);
    if (info.width !== 1920 || info.height !== 1080) {
      problems.push(`${name}: size is ${info.width}x${info.height}, expected 1920x1080`);
    }
    if (!(Math.abs(info.duration - expected) <= TOLERANCE)) {
      problems.push(
        `${name}: duration ${info.duration.toFixed(2)}s differs from expected ${expected.toFixed(2)}s by more than ${TOLERANCE}s`,
      );
    }
  };

  let combinedExpected = (plan.title ? CARD_SECONDS : 0) + (plan.end ? CARD_SECONDS : 0);
  for (const file of plan.chapterFiles) {
    const expected = expectedDuration(timeline, file);
    combinedExpected += expected;
    await check(file.name, expected);
  }
  if (plan.combined) await check(plan.combined.name, combinedExpected);

  const framesDir = path.join(folder, 'frames');
  await mkdir(framesDir, { recursive: true });
  for (const file of plan.chapterFiles) {
    let at = file.titleCard != null ? CARD_SECONDS : 0;
    for (const { step, seconds } of stepDurations(timeline, file.chapter.id)) {
      const out = path.join(framesDir, `${file.chapter.number}-step-${step.index}.png`);
      try {
        await run('ffmpeg', [
          '-hide_banner', '-loglevel', 'error',
          '-ss', String(at + seconds / 2),
          '-i', path.join(folder, file.name),
          '-frames:v', '1', '-y', out,
        ]);
        if ((await readdir(framesDir)).includes(path.basename(out))) {
          frames.push(out);
          if ((await lumaRange(out)) < BLANK_LUMA_RANGE) {
            problems.push(`step ${Number(file.chapter.number)}.${step.index} frame is blank (uniform color)`);
          }
        } else problems.push(`${path.basename(out)}: no frame at ${(at + seconds / 2).toFixed(2)}s`);
      } catch (err) {
        problems.push(`${path.basename(out)}: frame extraction failed (${(err.stderr || err.message).toString().trim()})`);
      }
      at += seconds;
    }
  }
  return { ok: problems.length === 0, problems, frames };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const folder = process.argv[2];
  if (!folder) {
    console.error('usage: node verify.mjs <folder>');
    process.exit(2);
  }
  try {
    const result = await verify(folder);
    for (const f of result.frames) console.log(f);
    for (const p of result.problems) console.error(`PROBLEM ${p}`);
    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
