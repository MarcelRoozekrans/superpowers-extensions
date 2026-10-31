// Measures when a recorded page first shows content. A tab opened during recording can
// start with a blank video, and nothing before the first painted frame may reach the output.
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const BLANK_LUMA_RANGE = 8;
const SEARCH_SECONDS = 3;
const PROBE_FPS = 10;

// The crop leaves out the caption band at the bottom and the speed marker at the top right,
// which are drawn over blank recordings too.
export const CONTENT_CROP = 'crop=iw*0.8:ih*0.85:0:0';

// Luma range of every frame, as [{ time, range }], read from signalstats metadata.
function parseFrames(text) {
  const frames = [];
  let time = null;
  let min = null;
  for (const line of text.split('\n')) {
    const t = /pts_time:([\d.]+)/.exec(line);
    if (t) {
      time = Number(t[1]);
      min = null;
    }
    const lo = /YMIN=(\d+)/.exec(line);
    if (lo) min = Number(lo[1]);
    const hi = /YMAX=(\d+)/.exec(line);
    if (hi && time != null && min != null) frames.push({ time, range: Number(hi[1]) - min });
  }
  return frames;
}

export async function lumaRange(image) {
  const { stderr } = await run('ffmpeg', [
    '-hide_banner', '-i', image, '-vf', `${CONTENT_CROP},signalstats,metadata=print`, '-f', 'null', '-',
  ]);
  const min = Number(/YMIN=(\d+)/.exec(stderr)?.[1]);
  const max = Number(/YMAX=(\d+)/.exec(stderr)?.[1]);
  return Number.isFinite(min) && Number.isFinite(max) ? max - min : Infinity;
}

// Time in seconds of the first frame whose luma range reaches the blank threshold, searched in
// the first few seconds. 0 when the video paints at once, or never within the search window.
export async function firstPaintedFrame(file) {
  const { stdout } = await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-t', String(SEARCH_SECONDS), '-i', file,
    '-vf', `fps=${PROBE_FPS},${CONTENT_CROP},signalstats,metadata=print:file=-`, '-f', 'null', '-',
  ], { maxBuffer: 16 * 1024 * 1024 });
  const first = parseFrames(stdout).find((f) => f.range >= BLANK_LUMA_RANGE);
  return first ? first.time : 0;
}

// The timeline with `firstPaint` (page-local seconds) on every page.
export async function withFirstPaint(timeline, folder) {
  const pages = [];
  for (const p of timeline.pages) {
    pages.push({ ...p, firstPaint: await firstPaintedFrame(path.resolve(folder, p.file)) });
  }
  return { ...timeline, pages };
}
