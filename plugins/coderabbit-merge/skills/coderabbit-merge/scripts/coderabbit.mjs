// Pure logic for the coderabbit-merge skill; only the CLI entry at the bottom does I/O.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isCodeRabbit(login) {
  return login === 'coderabbitai' || login === 'coderabbitai[bot]';
}

// CodeRabbit opens a comment with a label such as "_⚠️ Potential issue_ | _🟠 Major_".
const SEVERITIES = [
  ['critical', /critical/i],
  ['major', /major/i],
  ['minor', /minor/i],
  ['nitpick', /nitpick|trivial/i],
];

function severityOf(label) {
  for (const [name, re] of SEVERITIES) if (re.test(label)) return name;
  return 'unknown';
}

// The fix prompt sits in a code fence under a "Prompt for AI Agents" summary.
const AGENT_PROMPT = /Prompt for AI Agents[\s\S]*?```[^\n]*\n([\s\S]*?)\n```/;

// GitHub reports the CodeRabbit commit status in upper case (PENDING, EXPECTED) and a check run
// as queued or in_progress; any of these means the review is not finished.
const RUNNING = new Set(['pending', 'expected', 'queued', 'in_progress']);

export function parseFinding(thread) {
  const text = String(thread?.comments?.[0]?.body ?? '');
  const [firstLine, ...rest] = text.split('\n');
  const severity = severityOf(firstLine);
  const prose = (severity === 'unknown' ? text : rest.join('\n')).split('<details>')[0].trim();
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
  const latest = (input?.reviews ?? [])
    .filter((r) => isCodeRabbit(r.author))
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];

  let state;
  if (RUNNING.has(String(input?.checkState ?? '').toLowerCase())) state = 'reviewing';
  else if (!latest) state = 'no-review';
  else if (latest.commitOid !== input.headSha) state = 'stale';
  else if (latest.state === 'APPROVED') state = 'approved';
  else if (latest.state === 'CHANGES_REQUESTED' || findings.length) state = 'changes-requested';
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
