#!/usr/bin/env node
// Counts which directories changed most often in recent git history.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXCLUDED_BASENAMES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'packages.lock.json',
  'Cargo.lock', 'poetry.lock', 'composer.lock', 'Gemfile.lock', 'go.sum',
  'CHANGELOG.md',
]);
const EXCLUDED_SEGMENTS = new Set([
  'node_modules', 'dist', 'build', 'bin', 'obj', 'vendor', 'generated',
]);
const EXCLUDED_SUFFIXES = ['.min.js', '.g.cs', '.Designer.cs', '.snap'];

export function isExcluded(path) {
  const segments = path.split('/');
  const base = segments.pop();
  if (EXCLUDED_BASENAMES.has(base) || base.endsWith('.lock')) return true;
  if (segments[0] === 'docs') return true;
  if (segments.length === 0 && base.endsWith('.md')) return true;
  if (segments.some((s) => EXCLUDED_SEGMENTS.has(s))) return true;
  if (EXCLUDED_SUFFIXES.some((s) => base.endsWith(s))) return true;
  return base.includes('.generated.');
}

export function countHotspots(paths, { depth = 3, topN = 5, threshold = 0.3 } = {}) {
  const counts = new Map();
  let total = 0;
  for (const path of paths) {
    if (isExcluded(path)) continue;
    const dirSegments = path.split('/').slice(0, -1).slice(0, depth);
    const dir = dirSegments.length ? `${dirSegments.join('/')}/` : './';
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
    total += 1;
  }
  const dirs = [...counts]
    .map(([dir, count]) => ({ dir, count }))
    .sort((a, b) => b.count - a.count || (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
  const top = dirs.slice(0, topN).reduce((sum, d) => sum + d.count, 0);
  return { dirs, total, scattered: total === 0 || top < threshold * total };
}

function readHistory(repo, commits) {
  const r = spawnSync(
    'git',
    ['-C', repo, 'log', '-n', String(commits), '--no-renames', '--name-status', '--pretty=format:%x00'],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );
  if (r.status !== 0) return null;
  const chunks = r.stdout.split('\0').slice(1);
  const paths = [];
  for (const chunk of chunks) {
    for (const line of chunk.split('\n')) {
      const [status, ...rest] = line.split('\t');
      if ((status === 'A' || status === 'M') && rest.length) paths.push(rest.join('\t'));
    }
  }
  return { paths, commits: chunks.length };
}

function main(argv) {
  const opts = { repo: '.', commits: 200, depth: 3 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in opts)) {
      console.error(`unknown option: ${argv[i]}`);
      return 2;
    }
    opts[key] = key === 'repo' ? argv[i + 1] : Number(argv[i + 1]);
  }
  const history = readHistory(opts.repo, opts.commits);
  if (!history) {
    console.error(`not a git repo: ${opts.repo}`);
    return 2;
  }
  const result = countHotspots(history.paths, { depth: opts.depth });
  console.log(JSON.stringify({ ...result, commits: history.commits }));
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
