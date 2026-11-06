// Pure logic for the ci-watch hook and the Merge stage; only the CLI entry at the bottom does I/O.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
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

// Rewrites a nested "(" to "[" on one line; null when the parens do not balance.
function flattenLine(line) {
  const stack = [];
  let out = '';
  for (const ch of line) {
    if (ch === '(') {
      if (stack.length === 0) { stack.push(')'); out += '('; } else { stack.push(']'); out += '['; }
    } else if (ch === ')') {
      if (stack.length === 0) return null;
      out += stack.pop();
    } else out += ch;
  }
  return stack.length === 0 ? out : null;
}

export function sanitizeBody(text) {
  const lines = String(text).split('\n');
  const kept = [];
  let fenced = false;
  let removed = false;
  for (const line of lines) {
    // Signature lines are dropped even inside code fences: they must not reach a squash commit.
    if (/^co-authored-by:\s*claude\b/i.test(line) || line.includes('claude.ai/code/session_')) { removed = true; continue; }
    if (line.startsWith('```')) { fenced = !fenced; kept.push(line); continue; }
    kept.push(fenced ? line : (flattenLine(line) ?? line));
  }
  if (removed) while (kept.length && kept[kept.length - 1].trim() === '') kept.pop();
  return kept.join('\n');
}

// CLI: `node ci-watch.mjs sanitize < body.txt > clean.txt`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && process.argv[2] === 'sanitize') {
  process.stdout.write(sanitizeBody(readFileSync(0, 'utf8')));
}
