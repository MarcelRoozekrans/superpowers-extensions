import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from '../lib/playwright.mjs';
import { record } from '../lib/runtime.mjs';
import { verify } from '../lib/verify.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const SPEEDY = { mouseSteps: 5, beforeClick: 50, keyDelay: 10, reading: 300, readingAfterWait: 300 };
const FAST = { ...SPEEDY, expectTimeout: 2000 };

let skip = spawnSync('ffmpeg', ['-version']).status === 0 ? false : 'ffmpeg not installed';
if (!skip) {
  try {
    await loadPlaywright();
  } catch (err) {
    skip = err.message;
  }
}
if (!skip) {
  const pw = await loadPlaywright();
  if (!existsSync(pw.chromium.executablePath())) skip = 'Chromium is not installed';
}

let server;
let baseUrl;
let root;

before(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'demo-runtime-'));
  server = createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://x');
    const name = pathname === '/' ? 'app.html' : pathname.slice(1);
    const file = path.join(fixtures, path.basename(name));
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  rmSync(root, { recursive: true, force: true });
});

const mp4s = (dir) => readdirSync(dir).filter((n) => n.endsWith('.mp4')).sort();
const duration = (f) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

test('polished recording with two chapters, a second tab and a wait', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'polished');
  await record({
    folder,
    baseUrl,
    mode: 'polished',
    title: 'Demo',
    endCard: 'Klaar',
    pace: FAST,
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'Analyse starten',
        steps: [
          {
            caption: 'Klik op Analyse',
            run: (h) => h.click(h.page.getByRole('button', { name: 'Analyse' })),
            waitFor: (h) => h.expectText(h.page.locator('#out'), 'Resultaat'),
          },
        ],
      },
      {
        title: 'Dashboard',
        steps: [
          {
            caption: 'Open het dashboard',
            run: (h) => h.openTab('dash', '/second.html'),
            expect: (h) => h.expectText(h.page.locator('h1'), 'Dashboard'),
          },
          { caption: 'Terug', run: (h) => h.switchTab('main') },
        ],
      },
    ],
  });
  const names = mp4s(folder);
  assert.ok(names.some((n) => n.startsWith('01-')), names.join());
  assert.ok(names.some((n) => n.startsWith('02-')), names.join());
  assert.ok(names.includes('demo.mp4'));
  assert.ok(existsSync(path.join(folder, 'raw', 'p0.webm')));
  assert.ok(existsSync(path.join(folder, 'raw', 'p1.webm')));

  const tl = JSON.parse(readFileSync(path.join(folder, 'timeline.json'), 'utf8'));
  assert.equal(tl.version, 1);
  assert.equal(tl.pages.length, 2);
  assert.ok(tl.pages[1].openedAt > 0);
  assert.ok(tl.steps[1].start >= tl.pages[1].openedAt);
  const s1 = tl.steps[0];
  assert.equal(s1.chapter, 'c1');
  assert.equal(s1.page, 'p0');
  assert.ok(Math.abs(s1.wait.end - s1.wait.start - 2) <= 0.5, JSON.stringify(s1.wait));
  // A step's page is the one active once its run has finished.
  assert.equal(tl.steps[1].page, 'p1');
  assert.equal(tl.steps[2].page, 'p0');
  // The new tab has painted by the time its step starts: no frame of the step is uniform.
  const open = tl.steps[1];
  const lumaRange = (t) => {
    const out = spawnSync('ffmpeg', [
      '-hide_banner', '-ss', String(t), '-i', path.join(folder, 'raw', 'p1.webm'),
      '-frames:v', '1', '-vf', 'signalstats,metadata=print', '-f', 'null', '-',
    ], { encoding: 'utf8' }).stderr;
    return Number(/YMAX=(\d+)/.exec(out)?.[1]) - Number(/YMIN=(\d+)/.exec(out)?.[1]);
  };
  for (const f of [0, 0.25, 0.5, 0.75]) {
    const t = open.start + (open.end - open.start) * f - tl.pages[1].openedAt;
    assert.ok(lumaRange(t) > 20, `new tab frame at step fraction ${f} is uniform`);
  }
  const result = await verify(folder);
  assert.equal(result.ok, true, JSON.stringify(result));
});

test('setup time is not part of the output', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'setup');
  const started = Date.now();
  await record({
    folder,
    baseUrl,
    mode: 'quick',
    pace: FAST,
    setup: async (h) => {
      await h.goto('/');
      await new Promise((r) => setTimeout(r, 3000));
    },
    chapters: [{ title: 'Eén', steps: [{ caption: 'Wacht', run: async () => {} }] }],
  });
  const total = (Date.now() - started) / 1000;
  const tl = JSON.parse(readFileSync(path.join(folder, 'timeline.json'), 'utf8'));
  assert.ok(tl.steps[0].start >= 3, `start ${tl.steps[0].start}`);
  const out = duration(path.join(folder, 'demo.mp4'));
  assert.ok(out <= total - 2.5, `demo ${out}s vs total ${total}s`);
});

test('a failing step rejects, writes no MP4 and keeps raw', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'fail');
  await assert.rejects(
    record({
      folder,
      baseUrl,
      mode: 'polished',
      pace: FAST,
      setup: (h) => h.goto('/'),
      chapters: [
        {
          title: 'Eén',
          steps: [
            { caption: 'Eerste', run: async () => {} },
            {
              caption: 'Verwacht iets',
              run: async () => {},
              expect: (h) => h.expectText(h.page.locator('h1'), 'Bestaat niet'),
            },
          ],
        },
      ],
    }),
    (err) => err.message.includes('Step 1.2') && err.message.includes('Verwacht iets'),
  );
  assert.deepEqual(mp4s(folder), []);
  assert.ok(existsSync(path.join(folder, 'raw')));
});

test('an empty storyboard throws before launching a browser', async () => {
  await assert.rejects(
    record({ folder: path.join(root, 'empty'), baseUrl: 'http://localhost:3000', mode: 'polished', chapters: [] }),
    /fill in the storyboard steps/i,
  );
  assert.ok(!existsSync(path.join(root, 'empty')));
});

test('the cursor overlay stays hidden until the first mouse move', { skip, timeout: 180000 }, async () => {
  const seen = [];
  const display = (h) => h.page.evaluate(() => document.getElementById('__demo_cursor')?.style.display);
  await record({
    folder: path.join(root, 'cursor'),
    baseUrl,
    mode: 'polished',
    title: 'Demo',
    endCard: 'Klaar',
    pace: FAST,
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'Cursor',
        steps: [
          { caption: 'Wacht', run: async (h) => { seen.push(await display(h)); } },
          {
            caption: 'Klik',
            run: async (h) => {
              await h.click(h.page.getByRole('button', { name: 'Analyse' }));
              seen.push(await display(h));
            },
          },
        ],
      },
    ],
  });
  assert.notEqual(seen[0], 'block');
  assert.equal(seen[1], 'block');
});

const analyse = (h) => h.click(h.page.getByRole('button', { name: 'Analyse' }));

test('expectText honours the expectTimeout of the pace', { skip, timeout: 180000 }, async () => {
  await assert.rejects(
    record({
      folder: path.join(root, 'expect-timeout'),
      baseUrl,
      mode: 'quick',
      pace: { ...SPEEDY, expectTimeout: 1000 },
      setup: (h) => h.goto('/'),
      chapters: [
        {
          title: 'T',
          steps: [{ caption: 'x', run: analyse, expect: (h) => h.expectText(h.page.locator('#out'), 'Resultaat') }],
        },
      ],
    }),
    /Step 1\.1/,
  );
});

test('expectText takes a per-call timeout', { skip, timeout: 180000 }, async () => {
  await record({
    folder: path.join(root, 'expect-call'),
    baseUrl,
    mode: 'quick',
    pace: { ...SPEEDY, expectTimeout: 1000 },
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'T',
        steps: [
          {
            caption: 'x',
            run: analyse,
            expect: (h) => h.expectText(h.page.locator('#out'), 'Resultaat', { timeout: 5000 }),
          },
        ],
      },
    ],
  });
});

test('waitFor uses the long wait timeout, so a 7 s call passes with the default pace', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'long-wait');
  await record({
    folder,
    baseUrl,
    mode: 'quick',
    pace: SPEEDY,
    setup: (h) => h.goto('/?delay=7000'),
    chapters: [
      {
        title: 'T',
        steps: [{ caption: 'x', run: analyse, waitFor: (h) => h.expectText(h.page.locator('#out'), 'Resultaat') }],
      },
    ],
  });
  const tl = JSON.parse(readFileSync(path.join(folder, 'timeline.json'), 'utf8'));
  assert.ok(tl.steps[0].wait.end - tl.steps[0].wait.start >= 6, JSON.stringify(tl.steps[0].wait));
});

test('a click on a disabled button rejects instead of clicking blindly', { skip, timeout: 180000 }, async () => {
  await assert.rejects(
    record({
      folder: path.join(root, 'disabled'),
      baseUrl,
      mode: 'quick',
      pace: { ...SPEEDY, expectTimeout: 1000 },
      setup: (h) => h.goto('/'),
      chapters: [{ title: 'T', steps: [{ caption: 'x', run: (h) => h.click(h.page.locator('#off')) }] }],
    }),
    /Step 1\.1/,
  );
});

test('a failed re-record leaves no output of the earlier run', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'rerecord');
  const spec = (expected) => ({
    folder,
    baseUrl,
    mode: 'quick',
    pace: FAST,
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'T',
        steps: [{ caption: 'x', run: async () => {}, expect: (h) => h.expectText(h.page.locator('h1'), expected) }],
      },
    ],
  });
  await record(spec('Demo app'));
  assert.ok(existsSync(path.join(folder, 'demo.mp4')));
  assert.ok(existsSync(path.join(folder, 'demo.gif')));
  await assert.rejects(record(spec('Bestaat niet')));
  assert.deepEqual(mp4s(folder), []);
  assert.ok(!existsSync(path.join(folder, 'demo.gif')));
  assert.ok(!existsSync(path.join(folder, 'timeline.json')));
});

test('locale, timezoneId and contextOptions reach the browser context', { skip, timeout: 180000 }, async () => {
  const seen = {};
  await record({
    folder: path.join(root, 'locale'),
    baseUrl,
    mode: 'quick',
    pace: FAST,
    locale: 'nl-NL',
    timezoneId: 'Asia/Tokyo',
    contextOptions: { colorScheme: 'dark' },
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'T',
        steps: [
          {
            caption: 'x',
            run: async (h) => {
              seen.value = await h.page.evaluate(() => ({
                lang: navigator.language,
                tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
                dark: matchMedia('(prefers-color-scheme: dark)').matches,
              }));
            },
          },
        ],
      },
    ],
  });
  assert.deepEqual(seen.value, { lang: 'nl-NL', tz: 'Asia/Tokyo', dark: true });
});

test('a relative storageState is resolved against the folder', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'storage');
  mkdirSync(path.join(folder, '.auth'), { recursive: true });
  writeFileSync(
    path.join(folder, '.auth', 'state.json'),
    JSON.stringify({ cookies: [], origins: [{ origin: baseUrl, localStorage: [{ name: 'k', value: 'v' }] }] }),
  );
  const seen = {};
  await record({
    folder,
    baseUrl,
    mode: 'quick',
    pace: FAST,
    storageState: '.auth/state.json',
    setup: (h) => h.goto('/'),
    chapters: [
      { title: 'T', steps: [{ caption: 'x', run: async (h) => { seen.k = await h.page.evaluate(() => localStorage.getItem('k')); } }] },
    ],
  });
  assert.equal(seen.k, 'v');
});

test('a chapter without steps throws before launching a browser', async () => {
  await assert.rejects(
    record({ folder: path.join(root, 'nosteps'), baseUrl, mode: 'quick', chapters: [{ title: 'Leeg', steps: [] }] }),
    /chapter "Leeg" has no steps/i,
  );
  assert.ok(!existsSync(path.join(root, 'nosteps')));
});

test('type and paste fill an input', { skip, timeout: 180000 }, async () => {
  const seen = [];
  const value = (h) => h.page.locator('#name').inputValue();
  await record({
    folder: path.join(root, 'typing'),
    baseUrl,
    mode: 'quick',
    pace: FAST,
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'T',
        steps: [
          { caption: 'type', run: async (h) => { await h.type(h.page.locator('#name'), 'Ada'); seen.push(await value(h)); } },
          { caption: 'paste', run: async (h) => { await h.paste(h.page.locator('#name'), 'Een lange tekst'); seen.push(await value(h)); } },
        ],
      },
    ],
  });
  assert.deepEqual(seen, ['Ada', 'Een lange tekst']);
});

test('clickToTab follows a target blank link into a new tab', { skip, timeout: 180000 }, async () => {
  const folder = path.join(root, 'popup');
  await record({
    folder,
    baseUrl,
    mode: 'quick',
    pace: FAST,
    setup: (h) => h.goto('/'),
    chapters: [
      {
        title: 'T',
        steps: [
          {
            caption: 'open',
            run: (h) => h.clickToTab('dash', h.page.getByRole('link', { name: 'Dashboard openen' })),
            expect: (h) => h.expectText(h.page.locator('h1'), 'Dashboard'),
          },
          { caption: 'back', run: (h) => h.switchTab('main') },
        ],
      },
    ],
  });
  const tl = JSON.parse(readFileSync(path.join(folder, 'timeline.json'), 'utf8'));
  assert.equal(tl.pages.length, 2);
  assert.equal(tl.steps[0].page, 'p1');
  assert.ok(tl.steps[0].start >= tl.pages[1].openedAt);
  assert.equal(tl.steps[1].page, 'p0');
});
