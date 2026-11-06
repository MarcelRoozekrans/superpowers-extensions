#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { prOpenedContext } from './ci-watch.mjs';

try {
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  const additionalContext = prOpenedContext(process.env, payload);
  if (additionalContext) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext } }));
  }
} catch {
  // fail open: a hook must never trap a session
}
process.exit(0);
