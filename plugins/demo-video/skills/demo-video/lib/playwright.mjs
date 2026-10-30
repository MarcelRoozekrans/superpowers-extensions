// Loads the globally installed Playwright, so the plugin needs no npm dependencies.
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HINT = 'Playwright not found globally: npm i -g playwright && npx playwright install chromium';

async function globalRequire() {
  const { stdout } = await run('npm', ['root', '-g']);
  return createRequire(stdout.trim() + '/');
}

export async function loadPlaywright() {
  try {
    return (await globalRequire())('playwright');
  } catch {
    throw new Error(HINT);
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
