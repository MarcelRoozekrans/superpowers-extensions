#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { readQueue, writeQueue, checkStop } from './unattended.mjs';

try {
  const { cwd } = JSON.parse(readFileSync(0, 'utf8'));
  const dir = cwd || process.cwd();
  const result = checkStop(process.env, readQueue(dir));
  if (result.queue) writeQueue(dir, result.queue);
  if (result.block) process.stdout.write(JSON.stringify({ decision: 'block', reason: result.reason }));
} catch { /* fail open: a hook must never trap a session */ }
process.exit(0);
