#!/usr/bin/env node
// Assert that the obra/superpowers release this suite is pinned to still has
// every skill and every piece of skill text the suite builds on.
//
// The suite chains into upstream skills by name (`superpowers:writing-plans`),
// reads the files they write (`docs/superpowers/specs/`), and quotes their
// hand-offs. None of that is checked by upstream, so when upstream moved specs
// and plans out of `docs/plans/` and rewrote brainstorming in v7, half the
// suite kept pointing at the old layout and CI stayed green. This guard turns
// that drift into a failure.
//
// It checks two things:
//   1. Every `superpowers:<skill>` named anywhere in the suite exists upstream.
//   2. Every ANCHOR below is still present in the upstream skill it quotes.
//
// The pin lives in .github/upstream-superpowers.json. The upstream-watch
// workflow runs this against each new upstream release before bumping it.
//
// Run: npm run check:upstream                     (clones the pinned ref)
//      node scripts/check-upstream.mjs --upstream <checkout>

import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pin = JSON.parse(readFileSync(join(root, '.github/upstream-superpowers.json'), 'utf8'));

// Upstream text the suite depends on. Each entry names who relies on it, so a
// failure says which plugins to revisit rather than only what disappeared.
const ANCHORS = [
  {
    file: 'skills/brainstorming/SKILL.md',
    text: 'docs/superpowers/specs/',
    users: 'project-orchestration, ui-workflow, refactor-analysis, pre-push-review, compress-memory read and protect design specs here',
  },
  {
    file: 'skills/writing-plans/SKILL.md',
    text: 'docs/superpowers/plans/',
    users: 'project-orchestration, pre-push-review, compress-memory read and protect plans here',
  },
  {
    file: 'skills/brainstorming/SKILL.md',
    text: 'invoke superpowers:writing-plans and no other skill',
    users: 'project-orchestration, refactor-analysis, ui-workflow, decision-tracker quote this hand-off and route around it',
  },
  {
    file: 'skills/brainstorming/SKILL.md',
    text: 'Builder check',
    users: 'squad answers builder-check questions from project knowledge',
  },
  {
    file: 'skills/writing-plans/SKILL.md',
    text: '## Self-Review',
    users: 'squad runs its plan review after this step',
  },
  {
    file: 'skills/writing-plans/SKILL.md',
    text: '## Execution Handoff',
    users: 'squad runs its plan review before this step',
  },
  ...['skills/subagent-driven-development/SKILL.md', 'skills/executing-plans/SKILL.md'].flatMap((file) => [
    {
      file,
      text: 'Ruling: <what you decided> — <why> — <what it costs if wrong>',
      users: 'decision-tracker parses this ledger line format when it harvests rulings',
    },
    {
      file,
      text: 'Rulings I made',
      users: 'decision-tracker harvests rulings at this Finish step, before the workspace is deleted',
    },
    {
      file,
      text: '# SDD ledger — plan: <plan file path>',
      users: 'decision-tracker reads the plan path from this ledger header',
    },
  ]),
  {
    file: 'skills/subagent-driven-development/scripts/sdd-workspace',
    text: '.superpowers/sdd',
    users: 'decision-tracker globs .superpowers/sdd/*/progress.md for leftover ledgers',
  },
];

// Vendored third-party content is not ours to keep in step with upstream.
const SKIP_DIRS = new Set(['node_modules', '.git', 'design-systems', 'fixtures']);
const SCAN_ROOTS = ['plugins', 'hooks', 'README.md', 'GEMINI.md'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--upstream') args.upstream = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return args;
}

function* walk(path) {
  const full = join(root, path);
  if (!existsSync(full)) return;
  let entries;
  try {
    entries = readdirSync(full, { withFileTypes: true });
  } catch {
    yield path;
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(join(path, e.name));
    } else if (/\.(md|json|js|mjs)$|^session-start$/.test(e.name)) {
      yield join(path, e.name);
    }
  }
}

const args = parseArgs(process.argv.slice(2));
let upstream = args.upstream;
let cleanup = null;
if (!upstream) {
  upstream = mkdtempSync(join(tmpdir(), 'superpowers-upstream-'));
  cleanup = upstream;
  execFileSync('git', ['clone', '--quiet', '--depth', '1', '--branch', pin.ref,
    `https://github.com/${pin.repo}.git`, upstream], { stdio: 'inherit' });
}

const failures = [];

// ── 1. Every referenced upstream skill exists ────────────────────────────────
const refs = new Map();
for (const scanRoot of SCAN_ROOTS) {
  for (const file of walk(scanRoot)) {
    readFileSync(join(root, file), 'utf8').split(/\r?\n/).forEach((line, i) => {
      for (const m of line.matchAll(/superpowers:([a-z0-9-]+)/g)) {
        if (!refs.has(m[1])) refs.set(m[1], []);
        refs.get(m[1]).push(`${relative(root, join(root, file))}:${i + 1}`);
      }
    });
  }
}
for (const [skill, sites] of [...refs].sort()) {
  if (!existsSync(join(upstream, 'skills', skill, 'SKILL.md'))) {
    failures.push(`superpowers:${skill} does not exist upstream, but is referenced at:\n` +
      sites.map((s) => `      ${s}`).join('\n'));
  }
}

// ── 2. Every anchor is still in the upstream skill it quotes ─────────────────
for (const a of ANCHORS) {
  const path = join(upstream, a.file);
  if (!existsSync(path)) {
    failures.push(`${a.file} is gone upstream (${a.users})`);
  } else if (!readFileSync(path, 'utf8').includes(a.text)) {
    failures.push(`${a.file} no longer contains "${a.text}" (${a.users})`);
  }
}

if (cleanup) rmSync(cleanup, { recursive: true, force: true });

const where = args.upstream ? args.upstream : `${pin.repo}@${pin.ref}`;
if (failures.length) {
  console.error(`check-upstream: ${failures.length} incompatibilit${failures.length === 1 ? 'y' : 'ies'} with ${where}\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`check-upstream: OK — ${refs.size} referenced skills and ${ANCHORS.length} anchors present in ${where}`);
