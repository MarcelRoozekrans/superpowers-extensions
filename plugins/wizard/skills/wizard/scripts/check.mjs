#!/usr/bin/env node
// Check a generated wizard before handing it off: the static checks the
// wizard skill's step 4 lists, as one command that passes or fails.
//
// Run: node check.mjs <wizard.sh> [--repo <dir>]
//
// Prints one line per check (ok, FAIL, skip or warn) and exits 1 when any
// check fails, 2 on bad usage. --repo is the repository whose
// .github/workflows the secret names are checked against (default: cwd).

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const MARKER = /^# STAGES:/m;
const EXAMPLE = 'Example stage: replace with your real steps';

// Everything above the line starting `# STAGES:`.
const library = (text) => {
  const m = MARKER.exec(text);
  return m ? text.slice(0, m.index) : null;
};

// The 1-based line number of the STAGES marker.
const markerLine = (text) => {
  const m = MARKER.exec(text);
  return m ? text.slice(0, m.index).split('\n').length : Infinity;
};

const runWizardBody = (text) => {
  const start = text.indexOf('run_wizard() {');
  const end = text.indexOf('run_wizard "$@"');
  return start === -1 || end === -1 ? '' : text.slice(start, end);
};

function checkSyntax(path) {
  const run = spawnSync('bash', ['-n', path], { encoding: 'utf8' });
  return run.status === 0
    ? { status: 'ok', detail: 'bash -n passes' }
    : { status: 'fail', detail: run.stderr.trim() };
}

function checkShellcheck(path, text) {
  const run = spawnSync('shellcheck', ['-f', 'json', path], { encoding: 'utf8' });
  if (run.error?.code === 'ENOENT') return { status: 'skip', detail: 'shellcheck is not installed' };
  const from = markerLine(text);
  const findings = JSON.parse(run.stdout || '[]').filter((f) => f.line >= from);
  return findings.length === 0
    ? { status: 'ok', detail: 'no findings in the stages section' }
    : { status: 'fail', detail: findings.map((f) => `line ${f.line} SC${f.code}: ${f.message}`).join('; ') };
}

function checkLibrary(text, templatePath) {
  const mine = library(text);
  if (mine === null) return { status: 'fail', detail: 'no "# STAGES:" marker line' };
  return mine === library(readFileSync(templatePath, 'utf8'))
    ? { status: 'ok', detail: 'library matches template.sh' }
    : { status: 'fail', detail: 'the text above the STAGES marker differs from template.sh' };
}

function checkStages(text) {
  const body = runWizardBody(text);
  const total = /^\s*TOTAL_STAGES=(\d+)/m.exec(body);
  const calls = body.split('\n').filter((l) => /^\s*stage\s+["']/.test(l)).length;
  if (!total) return { status: 'fail', detail: 'no TOTAL_STAGES= inside run_wizard' };
  return Number(total[1]) === calls
    ? { status: 'ok', detail: `${calls} stage call${calls === 1 ? '' : 's'}` }
    : { status: 'fail', detail: `TOTAL_STAGES=${total[1]} but ${calls} stage call${calls === 1 ? '' : 's'}` };
}

function checkExample(text) {
  return text.includes(EXAMPLE)
    ? { status: 'fail', detail: "the template's example stage is still present" }
    : { status: 'ok', detail: 'example stage removed' };
}

function workflowSecrets(repo) {
  const dir = join(repo, '.github', 'workflows');
  if (!existsSync(dir)) return null;
  const names = new Set();
  for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    for (const m of readFileSync(join(dir, file), 'utf8').matchAll(/secrets\.([A-Za-z_][A-Za-z0-9_]*)/g)) names.add(m[1]);
  }
  return names;
}

function checkSecrets(text, repo) {
  const read = workflowSecrets(repo);
  if (read === null) return [{ status: 'skip', detail: `no .github/workflows in ${repo}` }];
  const code = runWizardBody(text).split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  const set = new Set([...code.matchAll(/\bset_secret\s+([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]));
  const unknown = [...set].filter((n) => !read.has(n));
  const results = [
    unknown.length === 0
      ? { status: 'ok', detail: `${set.size} set_secret name${set.size === 1 ? '' : 's'} read by the workflows` }
      : { status: 'fail', detail: `set but never read by a workflow: ${unknown.join(', ')}` },
  ];
  const unset = [...read].filter((n) => n !== 'GITHUB_TOKEN' && !set.has(n));
  if (unset.length) results.push({ status: 'warn', detail: `read by a workflow but not set by this wizard: ${unset.join(', ')}` });
  return results;
}

function checkExecutable(path) {
  return statSync(path).mode & 0o111
    ? { status: 'ok', detail: 'executable' }
    : { status: 'fail', detail: `not executable; run chmod +x ${path}` };
}

export function checkWizard(wizardPath, { repo = process.cwd(), templatePath = join(here, '..', 'template.sh') } = {}) {
  const text = readFileSync(wizardPath, 'utf8');
  const results = [
    { check: 'syntax', ...checkSyntax(wizardPath) },
    { check: 'shellcheck', ...checkShellcheck(wizardPath, text) },
    { check: 'library', ...checkLibrary(text, templatePath) },
    { check: 'stages', ...checkStages(text) },
    { check: 'example', ...checkExample(text) },
    ...checkSecrets(text, repo).map((r) => ({ check: 'secrets', ...r })),
    { check: 'executable', ...checkExecutable(wizardPath) },
  ];
  return { ok: results.every((r) => r.status !== 'fail'), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const repoAt = args.indexOf('--repo');
  const repo = repoAt === -1 ? process.cwd() : args[repoAt + 1];
  const positional = args.filter((_, i) => i !== repoAt && i !== repoAt + 1);
  if (positional.length !== 1 || !repo || !existsSync(positional[0])) {
    console.error('usage: node check.mjs <wizard.sh> [--repo <dir>]');
    process.exit(2);
  }
  const report = checkWizard(positional[0], { repo });
  for (const r of report.results) {
    const label = r.status === 'fail' ? 'FAIL' : r.status;
    console.log(`${label.padEnd(4)} ${r.check}: ${r.detail}`);
  }
  process.exit(report.ok ? 0 : 1);
}
