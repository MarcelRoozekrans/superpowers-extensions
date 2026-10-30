import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MATCH_LINE = /^\*\*Match:\*\*\s*`([^`]+)`/;
const HEADING = /^#{2,3}\s+(.+?)\s*$/;

/**
 * Collect every `**Match:** `<regex>`` line, named after the nearest preceding
 * level-2 or level-3 heading. Regexes compile with flags `giu`.
 *
 * JS `\b` is ASCII-only even with the `u` flag. Regexes for non-ASCII words
 * should use `(?<![\p{L}\p{N}])` and `(?![\p{L}\p{N}])` lookarounds instead.
 *
 * Throws when a Match line precedes any heading or holds an invalid regex.
 */
export function parseCatalogue(markdown) {
  const patterns = [];
  let name = '';
  const lines = markdown.split('\n');
  for (const [index, line] of lines.entries()) {
    const heading = HEADING.exec(line);
    if (heading) {
      name = heading[1];
      continue;
    }
    const match = MATCH_LINE.exec(line);
    if (!match) continue;
    if (!name) throw new Error(`line ${index + 1}: Match line before any heading`);
    try {
      patterns.push({ name, regex: new RegExp(match[1], 'giu') });
    } catch (error) {
      throw new Error(`line ${index + 1}: invalid regex (${error.message})`);
    }
  }
  return patterns;
}

// Limits: inline code spans are stripped per line only (a span crossing a line
// break is not recognised), and indented code blocks are not stripped.
function stripNonProse(text) {
  let fence = null; // { char, length } of the open fence
  return text
    .split('\n')
    .map((line) => {
      const marker = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
      if (fence) {
        if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) {
          fence = null;
        }
        return '';
      }
      if (marker) {
        fence = { char: marker[1][0], length: marker[1].length };
        return '';
      }
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
  let found = false;
  try {
    const patterns = parseCatalogue(readFileSync(cataloguePath, 'utf8'));
    for (const file of files) {
      for (const hit of scanText(readFileSync(file, 'utf8'), patterns)) {
        found = true;
        console.log(`${file}:${hit.line}  ${hit.name}  "${hit.match}"`);
      }
    }
  } catch (error) {
    console.error(`scan: ${error.message}`);
    return 2;
  }
  return found ? 1 : 0;
}

function isEntryPoint() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  process.exit(main(process.argv.slice(2)));
}
