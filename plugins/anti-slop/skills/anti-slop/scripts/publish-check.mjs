#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { checkPublish, defaultStateDir } from './publish.mjs';

try {
  if (process.env.ANTI_SLOP_HOOK !== 'off') {
    const payload = JSON.parse(readFileSync(0, 'utf8'));
    const result = checkPublish(payload, { stateDir: defaultStateDir() });
    if (result.deny) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: result.reason },
      }));
    }
  }
} catch { /* a hook must never fail a turn */ }
process.exit(0);
