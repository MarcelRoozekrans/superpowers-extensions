import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILTIN_ALLOW = [
  'example.com', 'example.org', 'example.net', 'localhost', 'github.com',
  'githubusercontent.com', 'gitlab.com', 'npmjs.com', 'npmjs.org', 'pypi.org',
  'nuget.org', 'crates.io', 'pkg.go.dev',
];
const SKIP_DIRS = new Set(['.git', 'node_modules', 'bin', 'obj', 'target', 'dist', '.venv']);
const HOME_PLACEHOLDERS = new Set(['<user>', '{user}', 'user', 'runner', 'root', '$USER', 'you', 'Shared']);

// A hostname match needs a lowercase TLD label or an all-uppercase name, and no
// further dotted label after the TLD, so type names such as System.Net.Http,
// System.IO or java.io.File are not flagged while NAS.ACME-HOME.NL still is.
// File extensions such as md, json, js, ts, cs, py, rs, go, sh, yml, toml, txt,
// xml, html, css, lock, sln, csproj are deliberately absent.
const TLDS = [
  'com', 'net', 'org', 'nl', 'be', 'de', 'uk', 'eu', 'io', 'dev', 'app', 'cloud',
  'me', 'info', 'biz', 'co', 'xyz', 'fr', 'es', 'it', 'ch', 'at', 'se', 'no',
  'dk', 'us', 'ca', 'au', 'online', 'site', 'tech', 'local', 'lan', 'home',
  'internal', 'arpa',
];

const IPV4 = /(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\d]|\.\d)/g;
const IPV6 = /(?<![\w:])[0-9a-f]{1,4}(?:::?[0-9a-f]{1,4})+(?:::)?(?![\w:])/gi;
const MAC = /(?<![\w:-])(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}(?![\w:-])/gi;
const EMAIL = /[\w.+-]+@((?:[a-z0-9-]+\.)+[a-z]{2,})/gi;
const HOSTNAME = new RegExp(
  `(?<![\\w.@-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:${TLDS.join('|')})(?![\\w-]|\\.\\w)`,
  'gi',
);
// The user segment ends at a path separator, whitespace, a quote or backtick,
// one of :;,), a sentence-ending dot or the end of the line, so /home/alice
// is caught without a trailing slash too. A dot inside the name, as in
// first.last, stays part of it.
const HOME_END = String.raw`(?=[/\\\s"'\`:;,)]|\.(?:\s|$)|$)`;
const HOME_USER = String.raw`((?:[^/\\\s"'\`:;,).]|\.(?!\s|$))+)`;
const HOME_PATH = [
  new RegExp(String.raw`/home/${HOME_USER}${HOME_END}`, 'g'),
  new RegExp(String.raw`/Users/${HOME_USER}${HOME_END}`, 'g'),
  new RegExp(String.raw`[A-Za-z]:\\Users\\${HOME_USER}${HOME_END}`, 'g'),
];
const TOKEN = new RegExp(
  [
    'gh[pousr]_[A-Za-z0-9]{20,}',
    'github_pat_[A-Za-z0-9_]{20,}',
    '(?<![\\w-])sk-[A-Za-z0-9_-]{20,}',
    'xox[abps]-[A-Za-z0-9-]+',
    '(?<![\\w-])AKIA[A-Z0-9]{16}',
    'eyJ[\\w-]+\\.eyJ[\\w-]+\\.[\\w-]+',
  ].join('|'),
  'g',
);

function looksLikeHostname(match) {
  const tld = match.slice(match.lastIndexOf('.') + 1);
  return tld === tld.toLowerCase() || match === match.toUpperCase();
}

function isAllowed(host, allow) {
  const name = host.toLowerCase();
  if (name.endsWith('.example') || name.endsWith('.test')) return true;
  return [...BUILTIN_ALLOW, ...allow].some((domain) => {
    const d = domain.toLowerCase();
    return name === d || name.endsWith(`.${d}`);
  });
}

function isPrivateIpv4(a, b, c, d) {
  if ([a, b, c, d].some((n) => n > 255)) return false;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254)
  );
}

// A ULA (fc00::/7) is flagged from two groups on, since a clock time never
// starts with fc or fd. A global address (2000::/3) needs a :: or more than
// three groups, so an EXIF-style date such as 2026:10:31 is not flagged.
function isFlaggedIpv6(candidate) {
  const groups = candidate.split(':').filter(Boolean);
  if (groups.length < 2) return false;
  const first = parseInt(groups[0], 16);
  const second = parseInt(groups[1], 16);
  if (first === 0x2001 && second === 0x0db8) return false;
  if (first >= 0xfc00 && first <= 0xfdff) return true;
  const inGlobal = first >= 0x2000 && first <= 0x3fff;
  return inGlobal && (candidate.includes('::') || groups.length > 3);
}

/**
 * Scan text for private details. Everything is scanned, code blocks included.
 * Returns hits as { kind, match, line }, ordered by line and position.
 */
export function scanText(text, opts = {}) {
  const allow = opts.allow ?? [];
  const terms = opts.terms ?? [];
  const found = [];
  const termRegexes = terms.map(
    (term) => new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu'),
  );
  const lines = text.split('\n');
  for (const [index, line] of lines.entries()) {
    const hits = [];
    const add = (kind, match, at) => hits.push({ kind, match, at });

    for (const m of line.matchAll(IPV4)) {
      const before = line.slice(0, m.index);
      if (/(?:Version=|version |(?<!\w)v)$/i.test(before)) continue;
      if (isPrivateIpv4(...m.slice(1, 5).map(Number))) add('ip-private', m[0], m.index);
    }
    for (const m of line.matchAll(IPV6)) {
      if (isFlaggedIpv6(m[0])) add('ipv6', m[0], m.index);
    }
    for (const m of line.matchAll(MAC)) {
      const normal = m[0].toLowerCase().replace(/-/g, ':');
      if (normal === 'aa:bb:cc:dd:ee:ff' || normal === '00:00:00:00:00:00') continue;
      add('mac', m[0], m.index);
    }

    let withoutEmails = line;
    for (const m of line.matchAll(EMAIL)) {
      withoutEmails = withoutEmails.replace(m[0], ' '.repeat(m[0].length));
      if (!isAllowed(m[1], allow)) add('email', m[0], m.index);
    }
    for (const m of withoutEmails.matchAll(HOSTNAME)) {
      if (looksLikeHostname(m[0]) && !isAllowed(m[0], allow)) add('hostname', m[0], m.index);
    }

    for (const re of HOME_PATH) {
      for (const m of line.matchAll(re)) {
        if (!HOME_PLACEHOLDERS.has(m[1])) add('home-path', m[0], m.index);
      }
    }
    for (const m of line.matchAll(TOKEN)) add('token', m[0], m.index);
    for (const re of termRegexes) {
      for (const m of line.matchAll(re)) add('term', m[0], m.index);
    }

    hits.sort((x, y) => x.at - y.at);
    for (const { kind, match } of hits) found.push({ kind, match, line: index + 1 });
  }
  return found;
}

function* walk(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      yield* walk(join(path, entry.name));
    }
  } else {
    yield path;
  }
}

/** Scan files and directories. Binary files (containing a NUL byte) are skipped. */
export function scanPaths(paths, opts = {}) {
  const results = [];
  for (const path of paths) {
    for (const file of walk(path)) {
      const buffer = readFileSync(file);
      if (buffer.includes(0)) continue;
      for (const hit of scanText(buffer.toString('utf8'), opts)) results.push({ file, ...hit });
    }
  }
  return results;
}

/** One term per line; `#` comments and blank lines are ignored. */
export function loadTerms(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

/**
 * The terms the local username adds: the name itself, unless it is a generic
 * placeholder such as runner or root, or shorter than three characters. The
 * username also shows up outside home paths, for example in a scratch path
 * such as /tmp/x/-home-<name>-src.
 */
export function usernameTerms(username) {
  if (!username || username.length < 3) return [];
  const lower = username.toLowerCase();
  if ([...HOME_PLACEHOLDERS].some((p) => p.toLowerCase() === lower)) return [];
  return [username];
}

function currentUsername() {
  try {
    return userInfo().username;
  } catch {
    return '';
  }
}

export function main(argv, { username = currentUsername() } = {}) {
  const allow = [];
  const paths = [];
  let termsFile = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--allow' || arg === '--terms') {
      const value = argv[++i];
      if (value === undefined) {
        console.error(`privacy-scan: ${arg} needs a value`);
        return 2;
      }
      if (arg === '--allow') allow.push(value);
      else termsFile = value;
    } else if (arg.startsWith('--')) {
      console.error(`privacy-scan: unknown option ${arg}`);
      return 2;
    } else {
      paths.push(arg);
    }
  }
  if (paths.length === 0) {
    console.error('usage: privacy-scan.mjs [--allow <domain>]... [--terms <file>] <path...>');
    return 2;
  }
  try {
    const defaultTerms = join(homedir(), '.claude', 'privacy-terms.txt');
    if (!termsFile && existsSync(defaultTerms)) termsFile = defaultTerms;
    const terms = [...(termsFile ? loadTerms(termsFile) : []), ...usernameTerms(username)];
    const hits = scanPaths(paths, { allow, terms });
    for (const hit of hits) console.log(`${hit.file}:${hit.line}: ${hit.kind}: ${hit.match}`);
    return hits.length ? 1 : 0;
  } catch (error) {
    console.error(`privacy-scan: ${error.message}`);
    return 2;
  }
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
