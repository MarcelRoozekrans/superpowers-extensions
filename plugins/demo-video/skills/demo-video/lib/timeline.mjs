// Pure mapping from a recorded timeline (version 1) to video segments.

export function waitOutputDuration(d, factor, min) {
  return Math.min(d, Math.max(min, d / factor));
}

export function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function segmentsForChapter(timeline, chapterId) {
  const pages = new Map(timeline.pages.map((p) => [p.id, p]));
  const steps = timeline.steps
    .filter((s) => s.chapter === chapterId)
    .sort((a, b) => a.index - b.index);

  const segments = [];
  for (const step of steps) {
    const page = pages.get(step.page);
    const caption = timeline.captions ? step.caption : null;
    const push = (from, to, speed, marker) => {
      segments.push({
        file: page.file,
        from: from - page.openedAt,
        to: to - page.openedAt,
        speed,
        caption,
        marker,
      });
    };

    if (!step.wait) {
      push(step.start, step.end, 1, false);
      continue;
    }
    const { start: ws, end: we } = step.wait;
    const d = we - ws;
    const out = waitOutputDuration(d, timeline.speedFactor, timeline.minWait);
    if (ws > step.start) push(step.start, ws, 1, false);
    push(ws, we, d / out, true);
    if (step.end > we) push(we, step.end, 1, false);
  }
  return segments;
}
