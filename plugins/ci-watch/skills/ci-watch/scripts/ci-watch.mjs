// Pure logic for the ci-watch hook and the Merge stage; only the CLI entry at the bottom does I/O.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const PR_URL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/;

export function isPrCreate(toolName, toolInput) {
  if (typeof toolName !== 'string') return false;
  if (toolName === 'Bash') return /\bgh\s+pr\s+create\b/.test(String(toolInput?.command ?? ''));
  return toolName.endsWith('create_pull_request');
}

export function findPrUrl(toolResponse) {
  const text = typeof toolResponse === 'string' ? toolResponse : JSON.stringify(toolResponse ?? '');
  const m = PR_URL.exec(text);
  return m ? m[0] : null;
}

export function prOpenedContext(env, payload) {
  if (env?.SUPERPOWERS_UNATTENDED === '1') return null;
  if (!isPrCreate(payload?.tool_name, payload?.tool_input)) return null;
  const url = findPrUrl(payload?.tool_response);
  if (!url) return null;
  return `PR ${url} was opened. Invoke \`ci-watch\` and run its Wait stage for this PR.`;
}

// Pairs parens with an index stack; an unmatched ")" or "(" is a literal and is left alone.
// Matched pairs nested inside another matched pair get square brackets. Inline code spans are
// rewritten too: release-please parses the whole message, not just prose.
function flattenParagraph(text) {
  const chars = [...text];
  const stack = [];
  const pairs = [];
  chars.forEach((ch, i) => {
    if (ch === '(') stack.push(i);
    else if (ch === ')' && stack.length) pairs.push([stack.pop(), i]);
  });
  pairs.sort((a, b) => a[0] - b[0]);
  const open = [];
  for (const [start, end] of pairs) {
    while (open.length && open[open.length - 1] < start) open.pop();
    if (open.length) { chars[start] = '['; chars[end] = ']'; }
    open.push(end);
  }
  return chars.join('');
}

const TRAILER = /^\s*co-authored-by:\s*claude(?![\w-])/i;
const FENCE = /^\s*(```|~~~)/;

export function sanitizeBody(text) {
  const kept = [];
  let paragraph = [];
  let fenced = false;
  let removed = false;
  const flush = () => {
    if (paragraph.length) kept.push(...flattenParagraph(paragraph.join('\n')).split('\n'));
    paragraph = [];
  };
  for (const line of String(text).split('\n')) {
    // Signature lines are dropped even inside code fences: they must not reach a squash commit.
    if (TRAILER.test(line) || line.includes('claude.ai/code/session_')) { removed = true; continue; }
    if (FENCE.test(line)) { flush(); fenced = !fenced; kept.push(line); continue; }
    if (fenced) { kept.push(line); continue; }
    if (line.trim() === '') { flush(); kept.push(line); continue; }
    paragraph.push(line);
  }
  flush();
  if (removed) while (kept.length && kept[kept.length - 1].trim() === '') kept.pop();
  return kept.join('\n');
}

// CLI: `node ci-watch.mjs sanitize < body.txt > clean.txt`; also works through a symlink.
function isMain() {
  try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (isMain()) {
  if (process.argv[2] === 'sanitize') process.stdout.write(sanitizeBody(readFileSync(0, 'utf8')));
  else { process.stderr.write('usage: ci-watch.mjs sanitize < body.txt\n'); process.exit(2); }
}
