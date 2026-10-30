import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MATCH_LINE = /^\*\*Match:\*\*\s*`([^`]+)`/;
const HEADING = /^#{2,3}\s+(.+?)\s*$/;

export function parseCatalogue(markdown) {
  const patterns = [];
  let name = '';
  for (const line of markdown.split('\n')) {
    const heading = HEADING.exec(line);
    if (heading) {
      name = heading[1];
      continue;
    }
    const match = MATCH_LINE.exec(line);
    if (match) patterns.push({ name, regex: new RegExp(match[1], 'giu') });
  }
  return patterns;
}

function stripNonProse(text) {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return '';
      }
      if (inFence) return '';
      if (/^\s*\*\*(Bad|Match):\*\*/.test(line)) return '';
      return line.replace(/`[^`]*`/g, (span) => ' '.repeat(span.length));
    })
    .join('\n');
}

export function scanText(text, patterns) {
  const hits = [];
  stripNonProse(text)
    .split('\n')
    .forEach((line, index) => {
      for (const { name, regex } of patterns) {
        for (const m of line.matchAll(regex)) {
          hits.push({ name, match: m[0], line: index + 1 });
        }
      }
    });
  return hits;
}

function main(argv) {
  const [cataloguePath, ...files] = argv;
  if (!cataloguePath || files.length === 0) {
    console.error('usage: node scan.mjs <catalogue.md> <file...>');
    return 2;
  }
  const patterns = parseCatalogue(readFileSync(cataloguePath, 'utf8'));
  let found = false;
  for (const file of files) {
    for (const hit of scanText(readFileSync(file, 'utf8'), patterns)) {
      found = true;
      console.log(`${file}:${hit.line}  ${hit.name}  "${hit.match}"`);
    }
  }
  return found ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
