// Pure mapping from a recorded timeline (version 1) to video segments.

export function waitOutputDuration(d, factor, min) {
  return Math.min(d, Math.max(min, d / factor));
}

export function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

// The file-name slug of chapter `number` (1-based); a title with no latin letters or digits
// has an empty slug, so such a chapter is called chapter-N.
export function chapterSlug(title, number) {
  return slugify(title) || `chapter-${number}`;
}

export function segmentsForChapter(timeline, chapterId) {
  const pages = new Map(timeline.pages.map((p) => [p.id, p]));
  const steps = timeline.steps
    .filter((s) => s.chapter === chapterId)
    .sort((a, b) => a.index - b.index);

  const segments = [];
  for (const step of steps) {
    const page = pages.get(step.page);
    if (!page) {
      throw new Error(`Step ${step.chapter}.${step.index} refers to unknown page "${step.page}"`);
    }
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

    const { start: ws, end: we } = step.wait ?? {};
    const d = we - ws;
    if (d < 0) {
      throw new Error(`Step ${step.chapter}.${step.index} has a wait that ends before it starts`);
    }
    // A wait that took no time has nothing to speed up, so the step is one normal segment.
    if (!step.wait || d === 0) {
      push(step.start, step.end, 1, false);
      continue;
    }
    const out = waitOutputDuration(d, timeline.speedFactor, timeline.minWait);
    if (ws > step.start) push(step.start, ws, 1, false);
    push(ws, we, d / out, true);
    if (step.end > we) push(we, step.end, 1, false);
  }
  return segments;
}
