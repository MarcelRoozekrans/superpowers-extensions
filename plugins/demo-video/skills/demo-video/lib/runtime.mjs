// Drives a headless Chromium through a storyboard at human pace, records video,
// writes timeline.json (version 1) and runs the post-processor.
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { postprocess } from './postprocess.mjs';
import { loadExpect, loadPlaywright } from './playwright.mjs';
import { chapterSlug } from './timeline.mjs';

export const DEFAULT_PACE = {
  mouseSteps: 25,
  beforeClick: 300,
  keyDelay: 60,
  reading: 1200,
  readingAfterWait: 2500,
  expectTimeout: 30000,
  waitTimeout: 120000,
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
      'transition:transform 120ms ease-out;transform:scale(1);display:none;';
    document.documentElement.appendChild(dot);
    window.addEventListener('mousemove', (e) => {
      // Chromium fires a synthetic move at 0,0 after layout; that is not a real cursor position.
      if (!e.clientX && !e.clientY) return;
      dot.style.display = 'block';
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

// Resolves after `frames` animation frames, or after 2 s when the tab is throttled and never
// paints. With `nudge` it also flips the root opacity by a hair first, so the screencast gets
// a changed frame even when the page painted before the recorder attached to it.
async function paint(page, frames, nudge = false) {
  const painted = page.evaluate(
    ([n, flip]) => new Promise((resolve) => {
      const root = document.documentElement;
      const before = root.style.opacity;
      if (flip) root.style.opacity = '0.99';
      const tick = (left) => requestAnimationFrame(() => {
        if (left > 1) return tick(left - 1);
        if (flip) root.style.opacity = before;
        resolve();
      });
      tick(n);
    }),
    [frames, nudge],
  );
  painted.catch(() => {});
  await Promise.race([painted, sleep(2000)]);
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

// A run that fails must not leave the videos of an earlier run next to a new raw folder.
async function clearOldOutputs(folder) {
  let names = [];
  try {
    names = await readdir(folder);
  } catch {
    // first run: the folder does not exist yet
  }
  for (const name of names) {
    if (/^\d{2}-.*\.mp4$/.test(name) || ['demo.mp4', 'demo.gif', 'timeline.json'].includes(name)) {
      await rm(path.join(folder, name));
    }
  }
  await rm(path.join(folder, 'frames'), { recursive: true, force: true });
  try {
    for (const name of await readdir(path.join(folder, 'raw'))) {
      if (name.endsWith('.webm')) await rm(path.join(folder, 'raw', name));
    }
  } catch {
    // no raw folder yet
  }
}

export async function record(spec) {
  if (!Array.isArray(spec.chapters) || spec.chapters.length === 0) {
    throw new Error('No chapters to record: fill in the storyboard steps in record.mjs first.');
  }
  for (const chapter of spec.chapters) {
    if (!Array.isArray(chapter.steps) || chapter.steps.length === 0) {
      throw new Error(`Chapter "${chapter.title}" has no steps: fill in its steps in record.mjs first.`);
    }
  }
  const pace = { ...DEFAULT_PACE, ...spec.pace };
  const folder = path.resolve(spec.folder);
  const rawDir = path.join(folder, 'raw');
  const quick = spec.mode === 'quick';

  const playwright = await loadPlaywright();
  const expectFn = await loadExpect();
  await clearOldOutputs(folder);
  await mkdir(rawDir, { recursive: true });
  const browser = await playwright.chromium.launch({ headless: true });

  const pages = [];
  const tabs = new Map();
  const state = { active: null, timeout: pace.expectTimeout };
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
      ...spec.contextOptions,
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: rawDir, size: { width: 1920, height: 1080 } },
      ...(spec.locale ? { locale: spec.locale } : {}),
      ...(spec.timezoneId ? { timezoneId: spec.timezoneId } : {}),
      ...(spec.storageState ? { storageState: path.resolve(folder, spec.storageState) } : {}),
    });
    await context.addInitScript(CURSOR_SCRIPT);
    context.on('page', register);

    const first = await context.newPage();
    register(first);
    tabs.set('main', first);
    state.active = first;

    const url = (p) => new URL(p, spec.baseUrl).href;
    const activate = async (name, page) => {
      register(page);
      tabs.set(name, page);
      state.active = page;
      await page.bringToFront();
    };
    // A fresh tab records white until it repaints, so wait for real frames.
    const settle = async (page) => {
      await paint(page, 2, true);
      await sleep(300);
    };
    const h = {
      get page() {
        return state.active;
      },
      goto: (p) => state.active.goto(url(p)),
      async click(locator) {
        // Playwright's actionability checks (visible, enabled, stable, not covered) without clicking.
        await locator.click({ trial: true, timeout: pace.expectTimeout });
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
        await activate(name, page);
        await page.goto(url(p), { waitUntil: 'load' });
        await settle(page);
      },
      // Click a link that opens a popup, for example target=_blank, and follow it into the new tab.
      async clickToTab(name, locator) {
        const opened = context.waitForEvent('page', { timeout: pace.expectTimeout });
        opened.catch(() => {});
        await h.click(locator);
        const page = await opened;
        await activate(name, page);
        await page.waitForLoadState('load');
        await settle(page);
      },
      async switchTab(name) {
        const page = tabs.get(name);
        if (!page) throw new Error(`unknown tab "${name}"`);
        await page.bringToFront();
        state.active = page;
        await paint(page, 1, true);
      },
      // Inside waitFor the default timeout is pace.waitTimeout, elsewhere pace.expectTimeout.
      async expectText(locator, text, { timeout = state.timeout } = {}) {
        if (expectFn) await expectFn(locator).toContainText(text, { timeout });
        else await pollText(locator, text, timeout);
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
      chapters.push({ id, title: chapter.title, slug: chapterSlug(chapter.title, ci + 1) });
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
            state.timeout = pace.waitTimeout;
            try {
              await step.waitFor(h);
            } finally {
              state.timeout = pace.expectTimeout;
            }
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

    const closing = context;
    context = null;
    await closing.close();
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
    } catch {
      // already closed
    }
    try {
      await browser.close();
    } catch {
      // already closed
    }
    throw err;
  }
}
