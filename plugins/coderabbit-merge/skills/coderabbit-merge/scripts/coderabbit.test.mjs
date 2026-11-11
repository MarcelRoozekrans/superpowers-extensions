import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isCodeRabbit, parseFinding, coderabbitStatus } from './coderabbit.mjs';

const SCRIPT = fileURLToPath(new URL('./coderabbit.mjs', import.meta.url));
const FENCE = '`'.repeat(3);

const body = (label, prompt) =>
  `${label}\n\n**Handle the null case.**\n\nThe value can be null here.\n\n` +
  (prompt === undefined
    ? ''
    : `<details>\n<summary>🤖 Prompt for AI Agents</summary>\n\n${FENCE}\n${prompt}\n${FENCE}\n\n</details>\n`);

const thread = (over = {}) => ({
  isResolved: false,
  path: 'src/a.mjs',
  line: 12,
  comments: [{ author: 'coderabbitai', body: body('**Major** · **Functional Correctness** · **Quick win**', 'In src/a.mjs around line 12, guard the null.') }],
  ...over,
});

const review = (over = {}) => ({
  author: 'coderabbitai',
  state: 'APPROVED',
  commitOid: 'head1',
  submittedAt: '2026-11-10T10:00:00Z',
  ...over,
});

const input = (over = {}) => ({ headSha: 'head1', checkState: 'success', reviews: [review()], threads: [], ...over });

test('isCodeRabbit accepts both login spellings', () => {
  assert.equal(isCodeRabbit('coderabbitai'), true);
  assert.equal(isCodeRabbit('coderabbitai[bot]'), true);
});

test('isCodeRabbit rejects other authors', () => {
  assert.equal(isCodeRabbit('renovate[bot]'), false);
  assert.equal(isCodeRabbit(undefined), false);
});

test('parseFinding reads a major severity label', () => {
  assert.equal(parseFinding(thread()).severity, 'major');
});

test('parseFinding reads a nitpick severity label', () => {
  const t = thread({ comments: [{ author: 'coderabbitai', body: body('**Trivial** · **Maintainability** · **Quick win**') }] });
  assert.equal(parseFinding(t).severity, 'nitpick');
});

test('parseFinding extracts path, line, text and the agent prompt', () => {
  const f = parseFinding(thread());
  assert.equal(f.path, 'src/a.mjs');
  assert.equal(f.line, 12);
  assert.equal(f.agentPrompt, 'In src/a.mjs around line 12, guard the null.');
  assert.match(f.body, /The value can be null here\./);
  assert.doesNotMatch(f.body, /Prompt for AI Agents/);
});

test('a finding with no agent prompt block has an empty agentPrompt', () => {
  const t = thread({ comments: [{ author: 'coderabbitai', body: body('**Minor** · **Functional Correctness** · **Quick win**') }] });
  const f = parseFinding(t);
  assert.equal(f.agentPrompt, '');
  assert.equal(f.severity, 'minor');
});

test('an unlabelled finding has severity unknown', () => {
  const t = thread({ comments: [{ author: 'coderabbitai', body: 'Please rename this.' }] });
  assert.equal(parseFinding(t).severity, 'unknown');
});

test('approval on the current head is approved', () => {
  assert.equal(coderabbitStatus(input()).state, 'approved');
});

test('an approval on an older commit is stale, not approved', () => {
  const r = coderabbitStatus(input({ reviews: [review({ commitOid: 'old' })] }));
  assert.equal(r.state, 'stale');
});

test('a pending CodeRabbit check wins over an approval on the same head', () => {
  assert.equal(coderabbitStatus(input({ checkState: 'pending' })).state, 'reviewing');
});

test('no CodeRabbit review is no-review, even with reviews by others', () => {
  const r = coderabbitStatus(input({ reviews: [review({ author: 'someone' })] }));
  assert.equal(r.state, 'no-review');
});

test('the latest review is chosen by submittedAt, not array order', () => {
  const reviews = [
    review({ state: 'APPROVED', submittedAt: '2026-11-10T11:00:00Z' }),
    review({ state: 'CHANGES_REQUESTED', submittedAt: '2026-11-10T09:00:00Z' }),
  ];
  assert.equal(coderabbitStatus(input({ reviews })).state, 'approved');
  assert.equal(coderabbitStatus(input({ reviews: [...reviews].reverse() })).state, 'approved');
});

test('a changes-requested review is changes-requested', () => {
  const r = coderabbitStatus(input({ reviews: [review({ state: 'CHANGES_REQUESTED' })], threads: [thread()] }));
  assert.equal(r.state, 'changes-requested');
  assert.equal(r.findings.length, 1);
});

test('a comment-only review with an open finding is changes-requested', () => {
  const r = coderabbitStatus(input({ reviews: [review({ state: 'COMMENTED' })], threads: [thread()] }));
  assert.equal(r.state, 'changes-requested');
});

test('a comment-only review with no open findings is not-approved', () => {
  const r = coderabbitStatus(input({ reviews: [review({ state: 'COMMENTED' })] }));
  assert.equal(r.state, 'not-approved');
});

test('resolved threads, and threads by humans or other bots, are not findings', () => {
  const threads = [
    thread({ isResolved: true }),
    thread({ comments: [{ author: 'marcel', body: 'a human started this' }] }),
    thread({ comments: [{ author: 'renovate[bot]', body: 'a bot started this' }] }),
  ];
  assert.deepEqual(coderabbitStatus(input({ reviews: [review({ state: 'COMMENTED' })], threads })).findings, []);
});

test('an upper-case PENDING check state is reviewing', () => {
  assert.equal(coderabbitStatus(input({ checkState: 'PENDING' })).state, 'reviewing');
});

test('requested and waiting check states are reviewing', () => {
  for (const checkState of ['REQUESTED', 'waiting']) {
    assert.equal(coderabbitStatus(input({ checkState })).state, 'reviewing', checkState);
  }
});

test('expected, queued and in_progress check states are reviewing', () => {
  for (const checkState of ['EXPECTED', 'queued', 'IN_PROGRESS']) {
    assert.equal(coderabbitStatus(input({ checkState })).state, 'reviewing', checkState);
  }
});

test('a finished check state does not block an approval', () => {
  for (const checkState of ['SUCCESS', 'failure', null]) {
    assert.equal(coderabbitStatus(input({ checkState })).state, 'approved', String(checkState));
  }
});

test('the latest CodeRabbit review body is returned, so review-body findings are not lost', () => {
  const reviews = [review({ state: 'CHANGES_REQUESTED', body: 'Outside diff range comments (1)' })];
  const r = coderabbitStatus(input({ reviews }));
  assert.equal(r.state, 'changes-requested');
  assert.deepEqual(r.findings, []);
  assert.equal(r.reviewBody, 'Outside diff range comments (1)');
});

test('reviewBody is an empty string when there is no CodeRabbit review', () => {
  assert.equal(coderabbitStatus(input({ reviews: [] })).reviewBody, '');
});

test('a finding carries the thread id and the first comment id for replying and resolving', () => {
  const t = thread({ id: 'PRRT_1' });
  t.comments[0].databaseId = 99;
  const f = parseFinding(t);
  assert.equal(f.threadId, 'PRRT_1');
  assert.equal(f.commentId, 99);
});

const realBody = (label) =>
  `<!-- coderabbit-ai-generated:v1 -->\n\n**<picture><img src="https://example.com/i.svg" width="16" alt=""></picture> ${label}** · **Functional Correctness** · **Quick win**\n\n**Handle the null case.**\n\nThe value can be null here.\n`;

test('parseFinding reads severity from the real CodeRabbit label format', () => {
  for (const [label, want] of [['Major', 'major'], ['Minor', 'minor'], ['Critical', 'critical'], ['Trivial', 'nitpick']]) {
    const t = thread({ comments: [{ author: 'coderabbitai', body: realBody(label) }] });
    assert.equal(parseFinding(t).severity, want, label);
  }
});

test('parseFinding leaves the marker comment and the label out of the body', () => {
  const t = thread({ comments: [{ author: 'coderabbitai', body: realBody('Major') }] });
  const f = parseFinding(t);
  assert.match(f.body, /^\*\*Handle the null case\.\*\*/);
  assert.doesNotMatch(f.body, /coderabbit-ai-generated|<picture>/);
});

test('an unlabelled sentence that mentions minor keeps its full body and has severity unknown', () => {
  const text = 'Minor typo in the major version string, please fix it.';
  const f = parseFinding(thread({ comments: [{ author: 'coderabbitai', body: text }] }));
  assert.equal(f.severity, 'unknown');
  assert.equal(f.body, text);
});

test('the same holds behind the marker comment', () => {
  const text = 'This is a major rewrite of the minor path.';
  const f = parseFinding(thread({ comments: [{ author: 'coderabbitai', body: `<!-- coderabbit-ai-generated:v1 -->\n\n${text}` }] }));
  assert.equal(f.severity, 'unknown');
  assert.equal(f.body, text);
});

test('parseFinding reads a severity label with an emoji prefix', () => {
  const text = '**🟠 Major** · **Functional Correctness**\n\nThe value can be null here.';
  const f = parseFinding(thread({ comments: [{ author: 'coderabbitai', body: text }] }));
  assert.equal(f.severity, 'major');
  assert.equal(f.body, 'The value can be null here.');
});

test('bold prose that is not a severity label is not parsed as one', () => {
  const text = '**Handle the null case.**\n\nThe value can be null here.';
  const f = parseFinding(thread({ comments: [{ author: 'coderabbitai', body: text }] }));
  assert.equal(f.severity, 'unknown');
  assert.equal(f.body, text);
});

test('an APPROVED current-head review with unresolved findings is changes-requested', () => {
  const r = coderabbitStatus(input({ threads: [thread()] }));
  assert.equal(r.state, 'changes-requested');
  assert.equal(r.findings.length, 1);
});

test('a missing headSha or commitOid is never approved', () => {
  assert.equal(coderabbitStatus(input({ headSha: undefined, reviews: [review({ commitOid: undefined })] })).state, 'stale');
  assert.equal(coderabbitStatus(input({ headSha: '', reviews: [review({ commitOid: '' })] })).state, 'stale');
  assert.equal(coderabbitStatus(input({ headSha: null, reviews: [review({ commitOid: null })] })).state, 'stale');
});

test('a CodeRabbit review with no submittedAt makes the order unknown, so nothing is approved', () => {
  const reviews = [review({ submittedAt: null, state: 'CHANGES_REQUESTED' }), review({ state: 'APPROVED' })];
  assert.equal(coderabbitStatus(input({ reviews })).state, 'stale');
  assert.equal(coderabbitStatus(input({ reviews: [review({ submittedAt: null })] })).state, 'stale');
});

test('the CLI prints the status as JSON', () => {
  const r = spawnSync(process.execPath, [SCRIPT, 'status'], { input: JSON.stringify(input()), encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).state, 'approved');
});

test('the CLI exits 2 on an unknown argument', () => {
  const r = spawnSync(process.execPath, [SCRIPT, 'bogus'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage/);
});
