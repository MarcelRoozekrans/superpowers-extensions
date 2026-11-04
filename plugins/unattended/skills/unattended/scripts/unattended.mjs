import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const QUEUE_PATH = '.claude/unattended-queue.json';
export const CALLS_PATH = '.claude/unattended-calls.md';
export const MAX_STOP_BLOCKS = 3;

export const isUnattended = (env) => env.SUPERPOWERS_UNATTENDED === '1';

export function readQueue(cwd) {
  try {
    const queue = JSON.parse(readFileSync(join(cwd, QUEUE_PATH), 'utf8'));
    return queue && Array.isArray(queue.items) ? queue : null;
  } catch {
    return null;
  }
}

export function writeQueue(cwd, queue) {
  const path = join(cwd, QUEUE_PATH);
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(queue, null, 2) + '\n');
  renameSync(tmp, path);
}

export const openItem = (queue) =>
  queue.items.find((i) => i.status === 'running') ?? queue.items.find((i) => i.status === 'queued') ?? null;

const ASK_REASON =
  `Unattended run: no one will answer. Take the option marked (Recommended), or if none is marked the one closest to the approved design, then the smaller change. Append the question, your choice and why to ${CALLS_PATH}, and continue. If the choice is on the unsafe list, park the item instead.`;

export function checkAsk(env) {
  return isUnattended(env) ? { deny: true, reason: ASK_REASON } : { deny: false };
}

export function checkStop(env, queue) {
  if (!isUnattended(env) || !queue) return { block: false };
  const item = openItem(queue);
  if (!item) return { block: false };

  const blocks = Number.isInteger(item.stopBlocks) ? item.stopBlocks : 0;
  if (blocks < MAX_STOP_BLOCKS) {
    item.stopBlocks = blocks + 1;
    return {
      block: true,
      queue,
      reason: `No one will answer. Decide by the unattended policy, log the call in ${CALLS_PATH}, and continue with item ${item.id}.`,
    };
  }

  item.status = 'parked';
  item.parkedReason = `stopped ${MAX_STOP_BLOCKS + 1} times without finishing`;
  const next = openItem(queue);
  if (!next) return { block: false, queue };
  return {
    block: true,
    queue,
    reason: `Item ${item.id} parked after repeated stops; continue with item ${next.id}.`,
  };
}

export const FALLBACK_POLICY =
  `Unattended run: no one will answer questions. Never wait for input. Take the Recommended option, log every such call in ${CALLS_PATH}, park anything irreversible or outward-facing, never merge.`;

export function policyText(skillDir, queue) {
  let policy;
  try {
    policy = readFileSync(join(skillDir, 'policy.md'), 'utf8').trimEnd();
  } catch {
    policy = FALLBACK_POLICY;
  }
  const item = queue ? openItem(queue) : null;
  const entry = item
    ? `Queue mode: work the queue in ${QUEUE_PATH}; the current item is ${item.id} (${item.plan}). Invoke the unattended skill.`
    : 'Single-item mode: the session prompt is the item. Invoke the unattended skill.';
  return `${policy}\n\n${entry}`;
}
