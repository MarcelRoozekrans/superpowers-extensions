#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { loadConfig } from './budget.mjs';
import { checkDispatch } from './dispatch.mjs';

try {
  const { tool_input, cwd } = JSON.parse(readFileSync(0, 'utf8'));
  const result = checkDispatch(tool_input, loadConfig(cwd || process.cwd()));
  if (result.deny) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: result.reason },
    }));
  }
} catch { /* a hook must never fail a turn */ }
process.exit(0);
