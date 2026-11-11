// Pure logic for the coderabbit-merge skill; only the CLI entry at the bottom does I/O.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isCodeRabbit(login) {
  return login === 'coderabbitai' || login === 'coderabbitai[bot]';
}

// CodeRabbit opens a comment with a marker comment, then a label line such as
// "**<picture>...</picture> Major** · **Functional Correctness** · **Quick win**"; an emoji can
// stand in for the picture, as in "**🟠 Major**". Bold prose without a severity word is no label.
const MARKER = /^\s*<!--[\s\S]*?-->\s*/;
const LABEL_LINE = /^\*\*(?:<picture>[\s\S]*?<\/picture>\s*|[^\w\s*<]+\s*)?(critical|major|minor|nitpick|trivial)\*\*(?:\s*[·|]\s*\*\*[^*\n]+\*\*)*(.*)(?:\n|$)/i;
const SEVERITY = { critical: 'critical', major: 'major', minor: 'minor', nitpick: 'nitpick', trivial: 'nitpick' };

// The fix prompt sits in a code fence under a "Prompt for AI Agents" summary.
const AGENT_PROMPT = /Prompt for AI Agents[\s\S]*?```[^\n]*\n([\s\S]*?)\n```/;

// These commit status and check run states mean the review is not finished. GitHub reports them
// in upper case.
const RUNNING = new Set(['pending', 'expected', 'queued', 'in_progress', 'requested', 'waiting']);

// Drops the balanced <details> block at the start of the text, nested blocks included.
function skipDetails(text) {
  const tag = /<details[\s>]|<\/details>/g;
  let depth = 0;
  for (let m = tag.exec(text); m; m = tag.exec(text)) {
    depth += m[0] === '</details>' ? -1 : 1;
    if (depth === 0) return text.slice(m.index + m[0].length);
  }
  return '';
}

// The finding prose is what stands before the first details block once leading blocks are skipped.
function proseOf(text) {
  let rest = text.trimStart();
  while (rest.startsWith('<details')) rest = skipDetails(rest).trimStart();
  return rest.split('<details>')[0].trim();
}

export function parseFinding(thread) {
  const text = String(thread?.comments?.[0]?.body ?? '');
  const unmarked = text.replace(MARKER, '');
  const cut = unmarked.indexOf('\n\n');
  const first = cut < 0 ? unmarked : unmarked.slice(0, cut);
  const after = cut < 0 ? '' : unmarked.slice(cut + 2);
  const match = LABEL_LINE.exec(first);
  const severity = match ? SEVERITY[match[1].toLowerCase()] : 'unknown';
  const head = match ? [match[2].replace(/^[\s:\u2013\u2014-]+/, ''), first.slice(match[0].length)].filter(Boolean).join('\n') : first;
  const prose = proseOf([head, after].filter(Boolean).join('\n\n'));
  const prompt = AGENT_PROMPT.exec(text);
  return {
    threadId: thread?.id ?? null,
    commentId: thread?.comments?.[0]?.databaseId ?? null,
    path: thread?.path ?? null,
    line: thread?.line ?? null,
    severity,
    body: prose,
    agentPrompt: prompt ? prompt[1].trim() : '',
  };
}

export function coderabbitStatus(input) {
  const findings = (input?.threads ?? [])
    .filter((t) => !t.isResolved && isCodeRabbit(t.comments?.[0]?.author))
    .map(parseFinding);
  const own = (input?.reviews ?? []).filter((r) => isCodeRabbit(r.author));
  // Without a valid time on every CodeRabbit review there is no telling which is the latest.
  const orderKnown = own.every((r) => Number.isFinite(Date.parse(r.submittedAt)));
  const latest = [...own].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];

  let state;
  if (RUNNING.has(String(input?.checkState ?? '').toLowerCase())) state = 'reviewing';
  else if (!latest) state = 'no-review';
  else if (!orderKnown || !input?.headSha || !latest.commitOid || latest.commitOid !== input.headSha) state = 'stale';
  else if (latest.state === 'CHANGES_REQUESTED' || findings.length) state = 'changes-requested';
  else if (latest.state === 'APPROVED') state = 'approved';
  else state = 'not-approved';
  return { state, findings, reviewBody: latest?.body ?? '' };
}

// CLI: `node coderabbit.mjs status < input.json`; also works through a symlink.
function isMain() {
  try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (isMain()) {
  if (process.argv[2] === 'status') process.stdout.write(JSON.stringify(coderabbitStatus(JSON.parse(readFileSync(0, 'utf8')))) + '\n');
  else { process.stderr.write('usage: coderabbit.mjs status < input.json\n'); process.exit(2); }
}
