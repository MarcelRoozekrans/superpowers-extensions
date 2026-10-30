// Drives a headless Chromium through a storyboard at human pace, records video,
// writes timeline.json (version 1) and runs the post-processor.
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { postprocess } from './postprocess.mjs';
import { loadExpect, loadPlaywright } from './playwright.mjs';
import { slugify } from './timeline.mjs';

export const DEFAULT_PACE = {
  mouseSteps: 25,
  beforeClick: 300,
  keyDelay: 60,
  reading: 1200,
  readingAfterWait: 2500,
  expectTimeout: 30000,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CURSOR_SCRIPT = `
(() => {
  const mount = () => {
    if (document.getElementById('__demo_cursor')) return;
    const dot = document.createElement('div');
    dot.id = '__demo_cursor';
    dot.style.cssText = 'position:fixed;left:0;top:0;width:24px;height:24px;margin:-12px 0 0 -12px;' +
      'border-radius:50%;background:rgba(255,70,70,0.85);border:2px solid #fff;' +
      'box-shadow:0 0 6px rgba(0,0,0,0.6);z-index:2147483647;pointer-events:none;' +
      'transition:transform 120ms ease-out;transform:scale(1);';
    document.documentElement.appendChild(dot);
    window.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
    }, true);
    window.addEventListener('mousedown', () => { dot.style.transform = 'scale(1.8)'; }, true);
    window.addEventListener('mouseup', () => { dot.style.transform = 'scale(1)'; }, true);
  };
  if (document.documentElement) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
`;

// Resolves after `frames` animation frames. With `nudge` it also flips the root opacity by a
// hair first, so the screencast gets a changed frame even when the page painted before the
// recorder attached to it.
function paint(page, frames, nudge = false) {
  return page.evaluate(
    ([n, flip]) => new Promise((resolve) => {
      const root = document.documentElement;
      if (flip) root.style.opacity = '0.99';
      const tick = (left) => requestAnimationFrame(() => {
        if (left > 1) return tick(left - 1);
        if (flip) root.style.opacity = '';
        resolve();
      });
      tick(n);
    }),
    [frames, nudge],
  );
}

async function pollText(locator, text, timeout) {
  const deadline = Date.now() + timeout;
  let last = null;
  for (;;) {
    try {
      last = await locator.textContent({ timeout: 1000 });
      if (last != null && last.includes(text)) return;
    } catch {
      // element not there yet
    }
    if (Date.now() >= deadline) {
      throw new Error(`Expected text "${text}" not found within ${timeout} ms; last text: ${JSON.stringify(last)}`);
    }
    await sleep(250);
  }
}

export async function record(spec) {
  if (!Array.isArray(spec.chapters) || spec.chapters.length === 0) {
    throw new Error('No chapters to record: fill in the storyboard steps in record.mjs first.');
  }
  const pace = { ...DEFAULT_PACE, ...spec.pace };
  const folder = path.resolve(spec.folder);
  const rawDir = path.join(folder, 'raw');
  const quick = spec.mode === 'quick';
  await mkdir(rawDir, { recursive: true });

  const playwright = await loadPlaywright();
  const expectFn = await loadExpect();
  const browser = await playwright.chromium.launch({ headless: true });

  const pages = [];
  const tabs = new Map();
  const state = { active: null };
  let t0;
  const now = () => (performance.now() - t0) / 1000;
  const register = (page) => {
    if (pages.some((p) => p.page === page)) return pages.find((p) => p.page === page);
    const entry = { id: `p${pages.length}`, page, openedAt: now() };
    pages.push(entry);
    return entry;
  };

  let context;
  try {
    t0 = performance.now();
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: rawDir, size: { width: 1920, height: 1080 } },
      ...(spec.storageState ? { storageState: spec.storageState } : {}),
    });
    await context.addInitScript(CURSOR_SCRIPT);
    context.on('page', register);

    const first = await context.newPage();
    register(first);
    tabs.set('main', first);
    state.active = first;

    const url = (p) => new URL(p, spec.baseUrl).href;
    const h = {
      get page() {
        return state.active;
      },
      goto: (p) => state.active.goto(url(p)),
      async click(locator) {
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        if (!box) throw new Error('click target has no bounding box');
        await state.active.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
          steps: pace.mouseSteps,
        });
        await sleep(pace.beforeClick);
        await state.active.mouse.down();
        await state.active.mouse.up();
      },
      async type(locator, text) {
        await locator.focus();
        await state.active.keyboard.type(text, { delay: pace.keyDelay });
      },
      async paste(locator, text) {
        await locator.focus();
        await locator.fill(text);
      },
      async openTab(name, p) {
        const page = await context.newPage();
        register(page);
        tabs.set(name, page);
        state.active = page;
        await page.bringToFront();
        await page.goto(url(p), { waitUntil: 'load' });
        // A fresh tab records white until it repaints, so wait for real frames.
        await paint(page, 2, true);
        await sleep(300);
      },
      async switchTab(name) {
        const page = tabs.get(name);
        if (!page) throw new Error(`unknown tab "${name}"`);
        await page.bringToFront();
        state.active = page;
        await paint(page, 1, true);
      },
      async expectText(locator, text) {
        if (expectFn) await expectFn(locator, { timeout: pace.expectTimeout }).toContainText(text);
        else await pollText(locator, text, pace.expectTimeout);
      },
    };

    if (spec.setup) {
      try {
        await spec.setup(h);
      } catch (err) {
        throw new Error(`Setup failed: ${err.message}`);
      }
    }

    const chapters = [];
    const steps = [];
    for (const [ci, chapter] of spec.chapters.entries()) {
      const id = `c${ci + 1}`;
      chapters.push({ id, title: chapter.title, slug: slugify(chapter.title) });
      for (const [si, step] of chapter.steps.entries()) {
        const index = si + 1;
        const rec = { chapter: id, index, caption: step.caption };
        try {
          const before = state.active;
          rec.start = now();
          await step.run(h);
          // A step belongs to the page that is active once run has finished, because
          // waitFor, expect and the reading pause happen there. When run switched tabs,
          // start only now, so the segment holds no frames of the old tab.
          if (state.active !== before) rec.start = now();
          rec.page = pages.find((p) => p.page === state.active).id;
          if (step.waitFor) {
            const wait = { start: now() };
            await step.waitFor(h);
            wait.end = now();
            rec.wait = wait;
          }
          if (step.expect) await step.expect(h);
          await sleep(step.waitFor ? pace.readingAfterWait : pace.reading);
          rec.end = now();
        } catch (err) {
          throw new Error(`Step ${ci + 1}.${index} "${step.caption}" failed: ${err.message}`);
        }
        steps.push(rec);
      }
    }

    await context.close();
    context = null;
    const timelinePages = [];
    for (const p of pages) {
      const file = path.join('raw', `${p.id}.webm`);
      await rename(await p.page.video().path(), path.join(folder, file));
      timelinePages.push({ id: p.id, file, openedAt: p.openedAt });
    }
    const timeline = {
      version: 1,
      mode: quick ? 'quick' : 'polished',
      captions: spec.captions ?? !quick,
      title: spec.title ?? null,
      endCard: spec.endCard ?? null,
      speedFactor: spec.speedFactor ?? 10,
      minWait: spec.minWait ?? 1,
      pages: timelinePages,
      chapters,
      steps,
    };
    await writeFile(path.join(folder, 'timeline.json'), JSON.stringify(timeline, null, 2));
    await browser.close();
    return await postprocess(folder, spec.captions === undefined ? {} : { captions: spec.captions });
  } catch (err) {
    try {
      if (context) await context.close();
      await browser.close();
    } catch {
      // already closed
    }
    throw err;
  }
}
