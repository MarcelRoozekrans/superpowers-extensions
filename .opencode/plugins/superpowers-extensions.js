/**
 * superpowers-extensions plugin for OpenCode.ai
 *
 * Registers every skill directory of each plugin with OpenCode's skill
 * discovery so the suite's skills load natively without symlinks. Pattern
 * adapted from obra/superpowers (MIT); content is our own.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

const PLUGINS = [
  'regression-test',
  'pre-push-review',
  'refactor-analysis',
  'decision-tracker',
  'roslyn-codelens-integration',
  'memorylens-integration',
  'project-orchestration',
  'ui-workflow',
  'ui-design-system',
  'squad',
  'compress-memory',
  'logo-design',
  'context-budget',
  'anti-slop',
  'demo-video',
  'retro',
  'architecture-scan'
];

// A plugin may carry several skills, so register each folder under skills/.
const skillPaths = PLUGINS.flatMap(name => {
  const skillsDir = path.join(repoRoot, 'plugins', name, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(skillsDir, entry.name));
});

export const SuperpowersExtensionsPlugin = async ({ client, directory }) => {
  return {
    // Inject every skill path into OpenCode's skill discovery config so
    // each skill is discoverable by description-based matching, the same as
    // OpenCode's native skills behavior. No symlinks required.
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      for (const p of skillPaths) {
        if (!config.skills.paths.includes(p)) {
          config.skills.paths.push(p);
        }
      }
    }
  };
};
