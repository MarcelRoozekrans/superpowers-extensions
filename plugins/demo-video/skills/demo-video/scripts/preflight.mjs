// Checks that this machine can record a demo video. CLI: node preflight.mjs [url]
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { loadPlaywright } from '../lib/playwright.mjs';

const run = promisify(execFile);

const INSTALL =
  process.platform === 'darwin' ? 'brew install ffmpeg git-lfs' : 'sudo apt-get install -y ffmpeg git-lfs';
const PLAYWRIGHT_HINT = 'npm i -g playwright && npx playwright install chromium';

async function check(name, fn, hint) {
  try {
    await fn();
    return { name, ok: true };
  } catch (err) {
    return { name, ok: false, hint: hint ?? err.message };
  }
}

async function chromium() {
  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true, timeout: 20000 });
  await browser.close();
}

async function reachable(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (res.status >= 500) throw new Error(`${url} answered HTTP ${res.status}`);
}

export async function preflight({ url } = {}) {
  const major = Number(process.versions.node.split('.')[0]);
  const checks = [
    await check('node', () => {
      if (major < 20) throw new Error(`Node ${process.versions.node} found`);
    }, 'Install Node 20 or newer'),
    await check('playwright', chromium, PLAYWRIGHT_HINT),
    await check('ffmpeg', () => run('ffmpeg', ['-version']), INSTALL),
    await check('ffprobe', () => run('ffprobe', ['-version']), INSTALL),
    await check('git-lfs', () => run('git', ['lfs', 'version']), INSTALL),
  ];
  if (url) {
    checks.push(await check('url', () => reachable(url), `Start the app so ${url} answers`));
  }
  return { ok: checks.every((c) => c.ok), checks };
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  const result = await preflight({ url: process.argv[2] });
  for (const c of result.checks) {
    console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.ok ? '' : `: ${c.hint}`}`);
  }
  process.exit(result.ok ? 0 : 1);
}
