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

export function parseFinding(thread) {
  const text = String(thread?.comments?.[0]?.body ?? '');
  const [firstLine, ...rest] = text.split('\n');
  const severity = severityOf(firstLine);
  const prose = (severity === 'unknown' ? text : rest.join('\n')).split('<details>')[0].trim();
  const prompt = AGENT_PROMPT.exec(text);
  return {
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
  if (input?.checkState === 'pending') state = 'reviewing';
  else if (!latest) state = 'no-review';
  else if (latest.commitOid !== input.headSha) state = 'stale';
  else if (latest.state === 'APPROVED') state = 'approved';
  else if (latest.state === 'CHANGES_REQUESTED' || findings.length) state = 'changes-requested';
  else state = 'not-approved';
  return { state, findings };
}

// CLI: `node coderabbit.mjs status < input.json`; also works through a symlink.
function isMain() {
  try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (isMain()) {
  if (process.argv[2] === 'status') process.stdout.write(JSON.stringify(coderabbitStatus(JSON.parse(readFileSync(0, 'utf8')))) + '\n');
  else { process.stderr.write('usage: coderabbit.mjs status < input.json\n'); process.exit(2); }
}
