import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCatalogue, scanText } from './scan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CATALOGUES = ['patterns-en.md', 'patterns-nl.md'].map((f) => join(here, '..', 'references', f));

// A Bash call publishes text when it runs one of these. The command must start the line or follow a
// shell separator, so `grep "git commit"` does not count.
const PUBLISH_COMMAND = /(?:^|[\s;&|()])(?:git\s+(?:-C\s+\S+\s+)?commit\b|gh\s+(?:pr|issue)\s+(?:create|comment|edit|review)\b|gh\s+release\s+(?:create|edit)\b)/;
const PUBLISH_MCP = /^mcp__.+__(?:create_pull_request|update_pull_request|issue_write|add_issue_comment|update_issue_comment|add_comment_to_pending_review|pull_request_review_write|add_reply_to_pull_request_comment)$/;
const HEREDOC = /<<-?[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$|\))/g;
const FILE_FLAG = /(?:^|\s)(?:-F|--file|--body-file|--notes-file)(?:=|\s+)(['"]?)([^\s'"]+)\1/g;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_LISTED_HITS = 15;
const MAX_REMEMBERED = 500;

function quotedStrings(command) {
  const out = [];
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (ch === '\\') { i++; continue; }
    if (ch === "'" && command[i - 1] === '$') {
      let s = '';
      for (i++; i < command.length && command[i] !== "'"; i++) {
        if (command[i] === '\\' && i + 1 < command.length) {
          const next = command[++i];
          s += next === 'n' ? '\n' : next === 't' ? '\t' : next;
        } else s += command[i];
      }
      out.push(s);
    } else if (ch === "'") {
      const end = command.indexOf("'", i + 1);
      if (end < 0) { out.push(command.slice(i + 1)); break; }
      out.push(command.slice(i + 1, end));
      i = end;
    } else if (ch === '"') {
      let s = '';
      for (i++; i < command.length && command[i] !== '"'; i++) {
        if (command[i] === '\\' && '"\\$`'.includes(command[i + 1] ?? '')) s += command[++i];
        else s += command[i];
      }
      out.push(s);
    }
  }
  return out;
}

function readSmallFile(path, cwd) {
  if (path === '-') return null;
  const full = resolve(cwd || process.cwd(), path);
  try {
    if (!existsSync(full) || statSync(full).size > MAX_FILE_BYTES) return null;
    return readFileSync(full, 'utf8');
  } catch {
    return null;
  }
}

/**
 * The prose a tool call is about to publish, or null when the call publishes nothing.
 * For Bash: heredoc bodies, quoted strings and the files named by -F, --file, --body-file and
 * --notes-file of a git commit or gh pr|issue|release call. For GitHub MCP tools: title and body.
 */
export function publishedText(payload) {
  const name = payload?.tool_name ?? '';
  const input = payload?.tool_input ?? {};
  if (name === 'Bash') {
    const command = typeof input.command === 'string' ? input.command : '';
    if (!PUBLISH_COMMAND.test(command)) return null;
    const parts = [];
    const rest = command.replace(HEREDOC, (_m, _q, _tag, body) => { parts.push(body); return ''; });
    parts.push(...quotedStrings(rest));
    for (const m of rest.matchAll(FILE_FLAG)) {
      const content = readSmallFile(m[2], payload.cwd);
      if (content) parts.push(content);
    }
    return parts.join('\n');
  }
  if (PUBLISH_MCP.test(name)) {
    const parts = [input.title, input.body].filter((v) => typeof v === 'string' && v.trim());
    return parts.length ? parts.join('\n') : null;
  }
  return null;
}

export function loadPatterns() {
  return CATALOGUES.flatMap((path) => parseCatalogue(readFileSync(path, 'utf8')));
}

const sha = (s) => createHash('sha256').update(s).digest('hex');

function remember(stateDir, sessionId, key) {
  const file = join(stateDir, `${sha(sessionId || 'no-session').slice(0, 16)}.json`);
  let seen = [];
  try { seen = JSON.parse(readFileSync(file, 'utf8')); } catch { seen = []; }
  if (!Array.isArray(seen)) seen = [];
  if (seen.includes(key)) return true;
  seen.push(key);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(file, JSON.stringify(seen.slice(-MAX_REMEMBERED)));
  return false;
}

function denyReason(text, hits) {
  const lines = text.split('\n');
  const listed = hits.slice(0, MAX_LISTED_HITS).map(({ name, match, line }) => {
    const context = (lines[line - 1] ?? '').trim().slice(0, 120);
    return `- ${name}: "${match.trim()}" in "${context}"`;
  });
  if (hits.length > MAX_LISTED_HITS) listed.push(`- and ${hits.length - MAX_LISTED_HITS} more`);
  return [
    `anti-slop: the text this call publishes has ${hits.length} catalogue hit(s):`,
    ...listed,
    'Rewrite those sentences following the anti-slop skill, then make the call again.',
    'If you judge every remaining hit intended, retry the same call unchanged and it passes.',
  ].join('\n');
}

/**
 * Deny once: the first call whose published text has catalogue hits is denied with the hit list.
 * The same text in the same session passes on retry, so a hit judged intended never loops.
 */
export function checkPublish(payload, { patterns = loadPatterns(), stateDir = defaultStateDir() } = {}) {
  const text = publishedText(payload);
  if (!text) return { deny: false };
  const hits = scanText(text, patterns);
  if (hits.length === 0) return { deny: false };
  if (remember(stateDir, payload.session_id, sha(text))) return { deny: false };
  return { deny: true, reason: denyReason(text, hits) };
}

export function defaultStateDir(env = process.env) {
  return env.ANTI_SLOP_STATE_DIR || join(tmpdir(), 'anti-slop-publish');
}
