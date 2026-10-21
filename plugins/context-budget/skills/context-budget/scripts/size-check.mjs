#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename } from 'node:path';
import { readContextSize, loadConfig, decide, reminderText, loadState, saveState } from './budget.mjs';

try {
  const { session_id, transcript_path, cwd } = JSON.parse(readFileSync(0, 'utf8'));
  const size = transcript_path ? readContextSize(transcript_path) : null;
  if (size !== null && session_id) {
    const dir = process.env.CLAUDE_PLUGIN_DATA || tmpdir();
    const id = basename(String(session_id));
    const last = loadState(dir, id);
    const { level, remember } = decide(size, last, loadConfig(cwd || process.cwd()));
    if (remember !== last) saveState(dir, id, remember);
    if (level !== 'none') {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: reminderText(level, size) },
      }));
    }
  }
} catch { /* a hook must never fail a turn */ }
process.exit(0);
