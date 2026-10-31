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

const FILES_CAP = 100;

export function countHotspots(paths, { depth = 3, topN = 5, threshold = 0.3, under = '' } = {}) {
  const prefix = under && !under.endsWith('/') ? `${under}/` : under;
  const counts = new Map();
  const fileCounts = new Map();
  let total = 0;
  for (const path of paths) {
    if (isExcluded(path) || !path.startsWith(prefix)) continue;
    const dirSegments = path.split('/').slice(0, -1).slice(0, depth);
    const dir = dirSegments.length ? `${dirSegments.join('/')}/` : './';
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
    fileCounts.set(path, (fileCounts.get(path) ?? 0) + 1);
    total += 1;
  }
  const byCountThenName = (key) => (a, b) =>
    b.count - a.count || (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0);
  const dirs = [...counts]
    .map(([dir, count]) => ({ dir, count }))
    .sort(byCountThenName('dir'));
  const topDirs = dirs.slice(0, topN);
  const inTopDirs = (path) => {
    const seg = path.split('/').slice(0, -1).slice(0, depth);
    const dir = seg.length ? `${seg.join('/')}/` : './';
    return topDirs.some((d) => d.dir === dir);
  };
  const eligible = [...fileCounts]
    .filter(([path]) => inTopDirs(path))
    .map(([path, count]) => ({ path, count }))
    .sort(byCountThenName('path'));
  const files = eligible.slice(0, FILES_CAP);
  const top = topDirs.reduce((sum, d) => sum + d.count, 0);
  return {
    dirs,
    total,
    scattered: total === 0 || top < threshold * total,
    files,
    filesTruncated: eligible.length > FILES_CAP,
  };
}

function readHistory(repo, commits) {
  const r = spawnSync(
    'git',
    ['-c', 'core.quotePath=false', '-C', repo, 'log', '-n', String(commits), '--no-renames', '--name-status', '--pretty=format:%x00'],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );
  if (r.error) return { error: `cannot run git: ${r.error.message}` };
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
  const opts = { repo: '.', commits: 200, depth: 3, under: '' };
  const usage = (msg) => {
    console.error(`${msg}. usage: hotspots.mjs [--repo <dir>] [--commits <n>] [--depth <n>] [--under <dir>]`);
    return 2;
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !(key in opts)) return usage(`unknown option: ${argv[i]}`);
    const value = argv[i + 1];
    if (value === undefined) return usage(`missing value for ${argv[i]}`);
    if (key === 'repo' || key === 'under') {
      opts[key] = value;
    } else if (/^[1-9]\d*$/.test(value)) {
      opts[key] = Number(value);
    } else {
      return usage(`${argv[i]} must be a positive integer, got ${value}`);
    }
  }
  const history = readHistory(opts.repo, opts.commits);
  if (history?.error) {
    console.error(history.error);
    return 1;
  }
  if (!history) {
    console.error(`not a git repo: ${opts.repo}`);
    return 2;
  }
  const result = countHotspots(history.paths, { depth: opts.depth, under: opts.under === '.' ? '' : opts.under.replace(/^\.\//, '') });
  console.log(JSON.stringify({ ...result, commits: history.commits }));
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
