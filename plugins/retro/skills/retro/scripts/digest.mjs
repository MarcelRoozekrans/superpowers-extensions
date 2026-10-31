#!/usr/bin/env node
// Digest a Claude Code session transcript (JSONL) into a compact report for a
// retro: the biggest tool results, repeated reads and commands, failures and
// their retries, search churn, subagent dispatches, and session totals.
//
// One transcript record can exceed a megabyte (an embedded screenshot, a huge
// tool result). The digest streams the file line by line and only ever prints
// sizes, line numbers and truncated input summaries, never a record's text, so
// the agent reading the digest cannot flood its own context.
//
// A field the transcript does not carry is reported as `unknown`, never as 0.
//
// Run: node digest.mjs <transcript.jsonl> [--subagents] [--json] [--top N]

import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const INPUT_MAX = 120;
const PROMPT_MAX = 200;
const RETRY_WINDOW = 5;
const RETRY_PREFIX = 40;
const CHURN_MIN = 3;

// Record types that carry nothing a retro needs.
const IGNORED_TYPES = new Set(['attachment', 'queue-operation', 'last-prompt', 'atis-latch', 'system', 'summary']);
const SEARCH_COMMANDS = new Set(['find', 'grep', 'rg']);

const oneLine = (s, max) => {
  const flat = String(s).replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

function summarizeInput(tool, input) {
  if (!input || typeof input !== 'object') return '';
  const pick =
    tool === 'Bash' ? input.command
    : ['Read', 'Edit', 'Write', 'NotebookEdit'].includes(tool) ? input.file_path ?? input.notebook_path
    : ['Grep', 'Glob'].includes(tool) ? input.pattern
    : ['Agent', 'Task'].includes(tool) ? input.description
    : Object.values(input).find((v) => typeof v === 'string');
  return oneLine(pick ?? '', INPUT_MAX);
}

// Size of a tool result as the model received it: text plus embedded data.
function resultSize(content) {
  if (typeof content === 'string') return content.length;
  if (!Array.isArray(content)) return 0;
  return content.reduce(
    (n, block) => n + (typeof block?.text === 'string' ? block.text.length : 0) + (typeof block?.source?.data === 'string' ? block.source.data.length : 0),
    0
  );
}

const isSearch = (call) =>
  call.tool === 'Grep' || call.tool === 'Glob' || (call.tool === 'Bash' && SEARCH_COMMANDS.has(call.input.split(' ')[0]));

const similar = (a, b) => b.startsWith(a.slice(0, RETRY_PREFIX)) || a.startsWith(b.slice(0, RETRY_PREFIX));

function humanText(record) {
  if (record.isMeta) return null;
  const content = record.message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content) || content.some((c) => c?.type === 'tool_result')) return null;
  const text = content.find((c) => c?.type === 'text');
  return text ? text.text : null;
}

export function createDigester({ top = 10, longLine = 100000 } = {}) {
  const session = { id: 'unknown', firstPrompt: 'unknown', start: 'unknown', end: 'unknown', costUSD: 'unknown' };
  const models = new Set();
  const usageById = new Map();
  const calls = []; // every tool_use in order: { id, lineNo, tool, input, size, error }
  const byId = new Map();
  const longLines = [];
  const unknownTypes = {};
  let malformed = 0;

  function add(line, lineNo) {
    if (line.length > longLine) longLines.push({ lineNo, length: line.length });
    if (line.trim() === '') return;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      malformed += 1;
      return;
    }
    if (!record || typeof record !== 'object') {
      malformed += 1;
      return;
    }

    if (typeof record.sessionId === 'string' && session.id === 'unknown') session.id = record.sessionId;
    if (typeof record.timestamp === 'string') {
      if (session.start === 'unknown' || record.timestamp < session.start) session.start = record.timestamp;
      if (session.end === 'unknown' || record.timestamp > session.end) session.end = record.timestamp;
    }

    switch (record.type) {
      case 'assistant': {
        const msg = record.message ?? {};
        if (typeof msg.model === 'string') models.add(msg.model);
        // One API message is split over several records that repeat its usage.
        if (msg.usage) usageById.set(msg.id ?? `line-${lineNo}`, msg.usage);
        for (const block of Array.isArray(msg.content) ? msg.content : []) {
          if (block?.type !== 'tool_use') continue;
          const call = { id: block.id, lineNo, tool: block.name ?? 'unknown', input: summarizeInput(block.name, block.input), raw: block.input ?? {}, size: null, error: false };
          calls.push(call);
          if (block.id) byId.set(block.id, call);
        }
        break;
      }
      case 'user': {
        const prompt = humanText(record);
        if (prompt !== null && session.firstPrompt === 'unknown') session.firstPrompt = oneLine(prompt, PROMPT_MAX);
        const content = record.message?.content;
        for (const block of Array.isArray(content) ? content : []) {
          if (block?.type !== 'tool_result') continue;
          const call = byId.get(block.tool_use_id);
          if (!call) continue;
          call.size = resultSize(block.content);
          call.error = block.is_error === true;
        }
        break;
      }
      case 'cost-state':
        if (typeof record.totalCostUSD === 'number') session.costUSD = record.totalCostUSD;
        break;
      default:
        if (!IGNORED_TYPES.has(record.type)) {
          const t = String(record.type ?? 'untyped');
          unknownTypes[t] = (unknownTypes[t] ?? 0) + 1;
        }
    }
  }

  function repeated(filter, key) {
    const groups = new Map();
    for (const c of calls.filter(filter)) {
      const k = key(c);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(c.lineNo);
    }
    return [...groups]
      .filter(([, lines]) => lines.length >= 2)
      .map(([k, lines]) => ({ k, count: lines.length, lines }))
      .sort((a, b) => b.count - a.count)
      .slice(0, top);
  }

  function result() {
    const answered = calls.filter((c) => c.size !== null);

    const failures = calls
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.error)
      .map(({ c, i }) => {
        const retry = calls.slice(i + 1, i + 1 + RETRY_WINDOW).find((n) => n.tool === c.tool && similar(c.input, n.input));
        return { lineNo: c.lineNo, tool: c.tool, input: c.input, retriedAt: retry ? retry.lineNo : null };
      });

    const searchChurn = [];
    let run = [];
    for (const c of calls) {
      if (isSearch(c)) {
        run.push(c);
        continue;
      }
      if (c.tool === 'Read' && run.length >= CHURN_MIN) {
        searchChurn.push({ startLine: run[0].lineNo, searches: run.length, thenRead: c.input });
      }
      run = [];
    }

    let tokens = 'unknown';
    if (usageById.size > 0) {
      tokens = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
      for (const u of usageById.values()) {
        tokens.input += u.input_tokens ?? 0;
        tokens.output += u.output_tokens ?? 0;
        tokens.cacheRead += u.cache_read_input_tokens ?? 0;
        tokens.cacheCreate += u.cache_creation_input_tokens ?? 0;
      }
    }

    return {
      session: { ...session, models: [...models], turns: usageById.size, tokens },
      biggest: [...answered]
        .sort((a, b) => b.size - a.size)
        .slice(0, top)
        .map(({ lineNo, tool, input, size }) => ({ lineNo, tool, input, size })),
      repeatedReads: repeated((c) => c.tool === 'Read', (c) => c.input).map(({ k, count, lines }) => ({ path: k, count, lines })),
      repeatedCommands: repeated((c) => c.tool === 'Bash', (c) => c.input).map(({ k, count, lines }) => ({ command: k, count, lines })),
      failures,
      searchChurn: searchChurn.slice(0, top),
      subagents: calls
        .filter((c) => c.tool === 'Agent' || c.tool === 'Task')
        .map((c) => ({
          lineNo: c.lineNo,
          description: c.input,
          model: typeof c.raw.model === 'string' ? c.raw.model : 'unset',
          resultSize: c.size ?? 'unknown',
        })),
      unanswered: calls.filter((c) => c.size === null).map(({ lineNo, tool }) => ({ lineNo, tool })),
      longLines,
      malformed,
      unknownTypes,
    };
  }

  return { add, result };
}

export async function digestFile(path, opts) {
  const digester = createDigester(opts);
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  let lineNo = 0;
  for await (const line of lines) digester.add(line, ++lineNo);
  return digester.result();
}

const rows = (items, fmt) => (items.length === 0 ? ['none'] : items.map((x) => `- ${fmt(x)}`));
const lineList = (lines) => (lines.length > 8 ? `${lines.slice(0, 8).join(', ')}, …` : lines.join(', '));

export function formatDigest(d, label = 'Session digest') {
  const s = d.session;
  const t = s.tokens === 'unknown' ? 'unknown' : `input ${s.tokens.input}, output ${s.tokens.output}, cache read ${s.tokens.cacheRead}, cache create ${s.tokens.cacheCreate}`;
  const unknown = Object.entries(d.unknownTypes);
  const out = [
    `# ${label}`,
    '',
    '## Session',
    `- id: ${s.id}`,
    `- first prompt: ${s.firstPrompt}`,
    `- start: ${s.start}; end: ${s.end}`,
    `- models: ${s.models.length ? s.models.join(', ') : 'unknown'}; turns: ${s.turns}`,
    `- tokens: ${t}`,
    `- cost: ${s.costUSD === 'unknown' ? 'unknown' : `$${s.costUSD}`}`,
    `- malformed lines: ${d.malformed}; unknown record types: ${unknown.length ? unknown.map(([k, v]) => `${k} ×${v}`).join(', ') : 'none'}`,
    '',
    '## Biggest tool results',
    ...rows(d.biggest, (b) => `line ${b.lineNo}: ${b.tool} \`${b.input}\` — ${b.size} chars`),
    '',
    '## Repeated reads',
    ...rows(d.repeatedReads, (r) => `\`${r.path}\` ×${r.count} (lines ${lineList(r.lines)})`),
    '',
    '## Repeated commands',
    ...rows(d.repeatedCommands, (r) => `\`${r.command}\` ×${r.count} (lines ${lineList(r.lines)})`),
    '',
    '## Failures',
    ...rows(d.failures, (f) => `line ${f.lineNo}: ${f.tool} \`${f.input}\` — ${f.retriedAt === null ? 'no retry' : `retried at line ${f.retriedAt}`}`),
    '',
    '## Search churn',
    ...rows(d.searchChurn, (c) => `line ${c.startLine}: ${c.searches} searches before reading \`${c.thenRead}\``),
    '',
    '## Subagents',
    ...rows(d.subagents, (a) => `line ${a.lineNo}: ${a.description} — model ${a.model}, result ${a.resultSize} chars`),
    '',
    '## Unanswered tool calls',
    ...rows(d.unanswered, (u) => `line ${u.lineNo}: ${u.tool}`),
    '',
    '## Long lines',
    ...rows(d.longLines, (l) => `line ${l.lineNo}: ${l.length} chars — read fields only`),
  ];
  return out.map((l) => (l.length > 300 ? `${l.slice(0, 299)}…` : l)).join('\n');
}

function subagentFiles(transcript) {
  const dir = join(dirname(transcript), basename(transcript, '.jsonl'), 'subagents');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()
    .map((f) => join(dir, f));
}

async function main(argv) {
  const args = argv.slice(2);
  const path = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--top');
  const topIdx = args.indexOf('--top');
  const top = topIdx >= 0 ? Number(args[topIdx + 1]) : undefined;
  if (!path || !existsSync(path) || !statSync(path).isFile() || (top !== undefined && !(top > 0))) {
    console.error('usage: node digest.mjs <transcript.jsonl> [--subagents] [--json] [--top N]');
    process.exit(2);
  }
  const opts = top ? { top } : undefined;
  const digest = await digestFile(path, opts);
  const subs = [];
  if (args.includes('--subagents')) {
    for (const f of subagentFiles(path)) subs.push([basename(f, '.jsonl'), await digestFile(f, opts)]);
  }
  if (args.includes('--json')) {
    console.log(JSON.stringify(subs.length ? { ...digest, subagentTranscripts: Object.fromEntries(subs) } : digest, null, 2));
    return;
  }
  console.log([formatDigest(digest), ...subs.map(([name, d]) => formatDigest(d, `Subagent ${name}`))].join('\n\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv);
}
