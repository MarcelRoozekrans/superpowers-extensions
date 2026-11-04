#!/usr/bin/env node
// Decide from the environment alone: stdin is never read, so bad input cannot lose the deny.
// The deny is also built inline in the catch, so a missing or broken module still denies.
const FAIL_CLOSED_REASON = 'No one will answer: choose the option marked "(Recommended)", otherwise the one closest to the approved design, then the smaller change. Log the call in .claude/unattended-calls.md and continue. If the choice is on the unsafe list, park the item instead.';
const deny = (reason) => process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
}));
try {
  const { checkAsk } = await import('./unattended.mjs');
  const result = checkAsk(process.env);
  if (result.deny) deny(result.reason);
} catch {
  if (process.env.SUPERPOWERS_UNATTENDED === '1') deny(FAIL_CLOSED_REASON);
}
process.exit(0);
