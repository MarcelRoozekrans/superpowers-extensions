/**
 * superpowers-extensions plugin for OpenCode.ai
 *
 * Registers each plugin's skill directory with OpenCode's skill discovery so
 * the suite's ten skills load natively without symlinks. Pattern adapted
 * from obra/superpowers (MIT); content is our own.
 */

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
  'squad'
];

const skillPaths = PLUGINS.map(name =>
  path.join(repoRoot, 'plugins', name, 'skills', name)
);

export const SuperpowersExtensionsPlugin = async ({ client, directory }) => {
  return {
    // Inject all ten skill paths into OpenCode's skill discovery config so
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
