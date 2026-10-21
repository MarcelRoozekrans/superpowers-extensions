import { openSync, readSync, fstatSync, closeSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const DEFAULTS = { nudge: 200000, firm: 400000, step: 50000, enforceDispatchModel: true };

const TAIL_BYTES = 2 * 1024 * 1024;

export function readContextSize(transcriptPath) {
  let fd;
  try {
    fd = openSync(transcriptPath, 'r');
    const total = fstatSync(fd).size;
    const len = Math.min(total, TAIL_BYTES);
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, total - len);
    let lines = buf.toString('utf8').split('\n');
    if (total > len) lines = lines.slice(1); // first line is probably partial
    for (let i = lines.length - 1; i >= 0; i--) {
      let e;
      try { e = JSON.parse(lines[i]); } catch { continue; }
      if (e && e.type === 'system' && e.subtype === 'compact_boundary') {
        // Earlier assistant usage predates the compaction, so stop here.
        const post = e.compactMetadata && e.compactMetadata.postTokens;
        return Number.isFinite(post) && post > 0 ? post : null;
      }
      if (!e || e.type !== 'assistant' || e.isSidechain === true) continue;
      const u = e.message && e.message.usage;
      if (!u) continue;
      const sum = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
      if (sum > 0) return sum; // synthetic API-error entries carry zero usage
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) try { closeSync(fd); } catch { /* ignore */ }
  }
}

const isPosInt = (n) => Number.isInteger(n) && n > 0;

export function loadConfig(cwd) {
  const config = { ...DEFAULTS };
  try {
    const raw = JSON.parse(readFileSync(join(cwd, '.claude', 'context-budget.json'), 'utf8'));
    if (isPosInt(raw.nudge) && isPosInt(raw.firm) && raw.firm > raw.nudge) {
      config.nudge = raw.nudge;
      config.firm = raw.firm;
    }
    if (typeof raw.enforceDispatchModel === 'boolean') config.enforceDispatchModel = raw.enforceDispatchModel;
  } catch { /* defaults */ }
  return config;
}

export function decide(size, last, config) {
  if (size < config.nudge) return { level: 'none', remember: null };
  if (last === null || last === undefined || size <= last - config.step || size >= last + config.step) {
    return { level: size >= config.firm ? 'firm' : 'nudge', remember: size };
  }
  return { level: 'none', remember: last };
}

export function reminderText(level, size) {
  const k = Math.round(size / 1000);
  const base = `This session's context is about ${k}k tokens. At a natural break, if the next work needs nothing from this context, offer the user a fresh session; otherwise carry on silently.`;
  return level === 'firm' ? `${base} Every turn is now costly at this size.` : base;
}

const stateFile = (dir, sessionId) => join(dir, 'context-budget', `${sessionId}.json`);

export function loadState(dir, sessionId) {
  try {
    const v = JSON.parse(readFileSync(stateFile(dir, sessionId), 'utf8')).last;
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveState(dir, sessionId, value) {
  try {
    mkdirSync(join(dir, 'context-budget'), { recursive: true });
    writeFileSync(stateFile(dir, sessionId), JSON.stringify({ last: value }));
  } catch { /* never throw */ }
}
