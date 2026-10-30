// Prepares a demo-video output folder. CLI: node scaffold.mjs <repoRoot> <folder>
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(here, '..', 'lib');
const TEMPLATE = path.join(here, '..', 'templates', 'record.template.mjs');

const ATTRIBUTES = [
  'docs/demo-videos/**/*.mp4 filter=lfs diff=lfs merge=lfs -text',
  'docs/demo-videos/**/*.gif filter=lfs diff=lfs merge=lfs -text',
];
const IGNORES = ['docs/demo-videos/**/raw/', 'docs/demo-videos/**/.auth/', 'docs/demo-videos/**/frames/'];

function appendMissing(file, lines) {
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const have = new Set(existing.split('\n').map((l) => l.trim()));
  const added = lines.filter((l) => !have.has(l));
  if (added.length > 0) {
    const lead = existing === '' || existing.endsWith('\n') ? '' : '\n';
    appendFileSync(file, lead + added.join('\n') + '\n');
  }
  return added;
}

export function scaffold({ repoRoot, folder }) {
  const dir = path.isAbsolute(folder) ? folder : path.join(repoRoot, folder);
  const created = [];
  mkdirSync(path.join(dir, 'lib'), { recursive: true });
  for (const name of readdirSync(LIB).filter((n) => n.endsWith('.mjs')).sort()) {
    copyFileSync(path.join(LIB, name), path.join(dir, 'lib', name));
    created.push(`lib/${name}`);
  }
  const record = path.join(dir, 'record.mjs');
  if (!existsSync(record)) {
    copyFileSync(TEMPLATE, record);
    created.push('record.mjs');
  }
  return {
    created,
    gitattributesAdded: appendMissing(path.join(repoRoot, '.gitattributes'), ATTRIBUTES),
    gitignoreAdded: appendMissing(path.join(repoRoot, '.gitignore'), IGNORES),
  };
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  const [repoRoot, folder] = process.argv.slice(2);
  if (!repoRoot || !folder) {
    console.error('Usage: node scaffold.mjs <repoRoot> <folder>');
    process.exit(2);
  }
  const r = scaffold({ repoRoot: path.resolve(repoRoot), folder });
  console.log(`created: ${r.created.join(', ') || '(nothing new)'}`);
  console.log(`.gitattributes added: ${r.gitattributesAdded.length}`);
  console.log(`.gitignore added: ${r.gitignoreAdded.length}`);
}
