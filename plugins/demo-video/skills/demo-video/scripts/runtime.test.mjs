import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from '../lib/playwright.mjs';
import { record } from '../lib/runtime.mjs';
import { verify } from '../lib/verify.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const FAST = { mouseSteps: 5, beforeClick: 50, keyDelay: 10, reading: 300, readingAfterWait: 300, expectTimeout: 2000 };

let skip = spawnSync('ffmpeg', ['-version']).status === 0 ? false : 'ffmpeg not installed';
if (!skip) {
  try {
    await loadPlaywright();
  } catch (err) {
    skip = err.message;
  }
}

let server;
let baseUrl;
let root;

before(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'demo-runtime-'));
  server = createServer((req, res) => {
    const name = req.url === '/' ? 'app.html' : req.url.slice(1);
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
