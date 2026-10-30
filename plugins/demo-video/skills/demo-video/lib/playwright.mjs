// Loads the globally installed Playwright, so the plugin needs no npm dependencies.
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const run = promisify(execFile);
const BROWSER_INSTALL =
  process.platform === 'linux' ? 'npx playwright install --with-deps chromium' : 'npx playwright install chromium';
export const PLAYWRIGHT_HINT = `npm i -g playwright && ${BROWSER_INSTALL}`;

let requireGlobal;
async function globalRequire() {
  requireGlobal ??= run('npm', ['root', '-g']).then(({ stdout }) => createRequire(stdout.trim() + '/'));
  return requireGlobal;
}

export async function loadPlaywright() {
  try {
    return (await globalRequire())('playwright');
  } catch (err) {
    throw new Error(`Playwright not found globally: ${PLAYWRIGHT_HINT} (${err.message.split('\n')[0]})`);
  }
}

// The test runner's expect, when it is installed; null otherwise.
export async function loadExpect() {
  for (const name of ['playwright/test', '@playwright/test']) {
    try {
      const mod = (await globalRequire())(name);
      if (typeof mod.expect === 'function') return mod.expect;
    } catch {
      // try the next candidate
    }
  }
  return null;
}
