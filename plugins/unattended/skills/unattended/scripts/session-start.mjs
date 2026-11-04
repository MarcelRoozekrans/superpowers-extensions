#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isUnattended, readQueue, policyText } from './unattended.mjs';

try {
  if (isUnattended(process.env)) {
    const { cwd } = JSON.parse(readFileSync(0, 'utf8'));
    const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..');
    const additionalContext = policyText(skillDir, readQueue(cwd || process.cwd()));
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext } }));
  }
} catch { /* fail open: a hook must never trap a session */ }
process.exit(0);
