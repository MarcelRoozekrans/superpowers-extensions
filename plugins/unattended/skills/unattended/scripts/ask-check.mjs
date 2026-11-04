#!/usr/bin/env node
import { checkAsk } from './unattended.mjs';

// Decide from the environment alone: stdin is never read, so bad input cannot lose the deny.
try {
  const result = checkAsk(process.env);
  if (result.deny) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: result.reason },
    }));
  }
} catch { /* a hook must never fail a turn */ }
process.exit(0);
