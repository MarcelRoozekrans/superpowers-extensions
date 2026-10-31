// Checks that this machine can record a demo video.
// CLI: node preflight.mjs [url] [--repo <root>]
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { fontCheckArgs } from '../lib/ffmpeg-graph.mjs';
import { findFont } from '../lib/postprocess.mjs';
import { PLAYWRIGHT_HINT, loadPlaywright } from '../lib/playwright.mjs';

const run = promisify(execFile);

const INSTALL =
  process.platform === 'darwin' ? 'brew install ffmpeg git-lfs' : 'sudo apt-get install -y ffmpeg git-lfs';
const FONT_HINT = 'Install DejaVu Sans (fontconfig must find it), or use macOS with Arial Unicode';

// Runs `fn`; a failure becomes { ok: false, hint } with the hint followed by the real error.
async function check(name, fn, hint) {
  try {
    await fn();
    return { name, ok: true };
  } catch (err) {
    const message = String(err.message).split('\n')[0];
    return { name, ok: false, hint: hint && !message.includes(hint) ? `${hint} (${message})` : message };
  }
}

export const checkNode = () =>
  check(
    'node',
    () => {
      const major = Number(process.versions.node.split('.')[0]);
      if (major < 20) throw new Error(`Node ${process.versions.node} found`);
    },
    'Install Node 20 or newer',
  );

export const checkPlaywright = () =>
  check(
    'playwright',
    async () => {
      const playwright = await loadPlaywright();
      const browser = await playwright.chromium.launch({ headless: true, timeout: 20000 });
      await browser.close();
    },
    PLAYWRIGHT_HINT,
  );

export const checkFfmpeg = () => check('ffmpeg', () => run('ffmpeg', ['-version']), INSTALL);
export const checkFfprobe = () => check('ffprobe', () => run('ffprobe', ['-version']), INSTALL);

// `git lfs install` writes the filter into the git config; without it the MP4s are committed
// as plain files even though .gitattributes names the lfs filter.
export const checkGitLfs = async ({ repo, env } = {}) => {
  const installed = await check('git-lfs', () => run('git', ['lfs', 'version']), INSTALL);
  if (!installed.ok) return installed;
  const where = repo ? ['-C', repo] : [];
  return check(
    'git-lfs',
    async () => {
      for (const key of ['filter.lfs.process', 'filter.lfs.clean']) {
        try {
          const { stdout } = await run('git', [...where, 'config', '--get', key], { env });
          if (stdout.trim()) return;
        } catch {
          // key not set: try the next one
        }
      }
      throw new Error('the lfs filter is not configured');
    },
    'Run: git lfs install',
  );
};

// Finds a font that covers the speed marker and renders one drawtext frame with it.
export const checkFonts = ({ command, macFonts } = {}) =>
  check(
    'fonts',
    async () => {
      const font = await findFont({ command, macFonts });
      await run('ffmpeg', fontCheckArgs(font));
    },
    FONT_HINT,
  );

async function reachable(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (res.status >= 500) throw new Error(`${url} answered HTTP ${res.status}`);
}

export const checkUrl = (url) => check('url', () => reachable(url), `Start the app so ${url} answers`);

export async function preflight({ url, repo } = {}) {
  const checks = [
    await checkNode(),
    await checkPlaywright(),
    await checkFfmpeg(),
    await checkFfprobe(),
    await checkGitLfs({ repo }),
    await checkFonts(),
  ];
  if (url) checks.push(await checkUrl(url));
  return { ok: checks.every((c) => c.ok), checks };
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--repo');
  const repo = at >= 0 ? args.splice(at, 2)[1] : undefined;
  const result = await preflight({ url: args[0], repo });
  for (const c of result.checks) {
    console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.ok ? '' : `: ${c.hint}`}`);
  }
  process.exit(result.ok ? 0 : 1);
}
