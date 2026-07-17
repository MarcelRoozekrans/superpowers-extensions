#!/usr/bin/env node
// Assert that every plugin under plugins/ is registered everywhere it has to be,
// and that the counts we publish match what is actually on disk.
//
// A plugin must be hand-added to nine registries. Nothing enforced that, so
// compress-memory shipped missing from three of them and sat a release behind,
// and two design systems became unreachable because INDEX.md was never updated.
// Every check here exists because that failure already happened.
//
// Run: npm run check:registries

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const failures = [];
const fail = (registry, msg) => failures.push({ registry, msg });

const readText = (p) => readFileSync(join(root, p), 'utf8');
const readJson = (p) => JSON.parse(readText(p));
const dirsIn = (p) =>
  readdirSync(join(root, p)).filter((d) => statSync(join(root, p, d)).isDirectory());

// ── Sources ──────────────────────────────────────────────────────────────────
const plugins = dirsIn('plugins').sort();
const marketplace = readJson('.claude-plugin/marketplace.json');
const pkg = readJson('package.json');
const releasePlease = readJson('release-please-config.json');
const cursor = readJson('.cursor-plugin/plugin.json');
const codex = readJson('.codex-plugin/plugin.json');
const gemini = readJson('gemini-extension.json');
const sessionStart = readText('hooks/session-start');
const opencode = readText('.opencode/plugins/superpowers-extensions.js');
const commitlint = require(join(root, 'commitlint.config.js'));
const commitlintScopes = commitlint.rules['scope-enum'][2];

// ── 1. Every plugin is registered in every registry ───────────────────────────
for (const name of plugins) {
  const manifestPath = `plugins/${name}/.claude-plugin/plugin.json`;
  if (!existsSync(join(root, manifestPath))) {
    fail(manifestPath, `${name}: missing plugin manifest`);
  } else {
    const manifest = readJson(manifestPath);
    if (manifest.name !== name) {
      fail(manifestPath, `${name}: manifest name is "${manifest.name}", expected "${name}"`);
    }
  }

  const skillPath = `plugins/${name}/skills/${name}/SKILL.md`;
  if (!existsSync(join(root, skillPath))) {
    fail(skillPath, `${name}: missing SKILL.md`);
  } else {
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readText(skillPath));
    const declared = fm && /^name:\s*(\S+)/m.exec(fm[1]);
    if (!declared) {
      fail(skillPath, `${name}: SKILL.md frontmatter has no name field`);
    } else if (declared[1] !== name) {
      fail(skillPath, `${name}: SKILL.md declares name "${declared[1]}", expected "${name}"`);
    }
  }

  const entry = marketplace.plugins.find((p) => p.name === name);
  if (!entry) {
    fail('.claude-plugin/marketplace.json', `${name}: not listed in plugins[]`);
  } else if (entry.source !== `./plugins/${name}`) {
    fail('.claude-plugin/marketplace.json', `${name}: source is "${entry.source}", expected "./plugins/${name}"`);
  }

  if (!pkg.scripts['install-plugins'].includes(`claude plugin install ${name}`)) {
    fail('package.json', `${name}: missing from the install-plugins script`);
  }
  if (!sessionStart.includes(name)) {
    fail('hooks/session-start', `${name}: missing from the SessionStart skill listing`);
  }
  if (!new RegExp(`['"]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(opencode)) {
    fail('.opencode/plugins/superpowers-extensions.js', `${name}: missing from the PLUGINS array`);
  }
  // Keywords are a search surface, not a registration. The two -integration
  // plugins are deliberately keyed by their MCP server name ("roslyn-codelens",
  // "memorylens") rather than the plugin name, so accept a keyword that matches
  // on a segment boundary. Still catches a plugin with no keyword at all.
  const keyed = (keywords) => keywords.some((k) => k === name || name.startsWith(`${k}-`));
  if (!keyed(cursor.keywords)) {
    fail('.cursor-plugin/plugin.json', `${name}: no keyword matches it`);
  }
  if (!keyed(codex.keywords)) {
    fail('.codex-plugin/plugin.json', `${name}: no keyword matches it`);
  }
  if (!commitlintScopes.includes(name)) {
    fail('commitlint.config.js', `${name}: missing from scope-enum — commits scoped to it will be rejected`);
  }
}

// ── 2. No registry lists a plugin that does not exist ─────────────────────────
for (const entry of marketplace.plugins) {
  if (!plugins.includes(entry.name)) {
    fail('.claude-plugin/marketplace.json', `${entry.name}: listed but plugins/${entry.name}/ does not exist`);
  }
}

// ── 3. release-please bumps every plugin's version ────────────────────────────
// extra-files is index-based, so appending a plugin silently leaves it unbumped.
const bumped = new Set(
  (releasePlease.packages['.']['extra-files'] ?? [])
    .map((e) => /^\$\.plugins\[(\d+)\]\.version$/.exec(e.jsonpath ?? ''))
    .filter(Boolean)
    .map((m) => Number(m[1]))
);
marketplace.plugins.forEach((p, i) => {
  if (!bumped.has(i)) {
    fail(
      'release-please-config.json',
      `${p.name}: no extra-files entry for $.plugins[${i}].version — it will never be version-bumped`
    );
  }
});

// ── 4. Versions agree everywhere ──────────────────────────────────────────────
const version = pkg.version;
const versioned = [
  ['.claude-plugin/marketplace.json ($.version)', marketplace.version],
  ['.cursor-plugin/plugin.json', cursor.version],
  ['.codex-plugin/plugin.json', codex.version],
  ['gemini-extension.json', gemini.version],
  ...marketplace.plugins.map((p) => [`.claude-plugin/marketplace.json (${p.name})`, p.version]),
];
for (const [where, v] of versioned) {
  if (v !== version) {
    fail(where, `version is ${v}, expected ${version} (package.json)`);
  }
}

// ── 5. The design-system catalog matches its index ────────────────────────────
// Curated mode gates on INDEX.md, so a system absent from it is unreachable
// even when its DESIGN.md is on disk. The weekly refresh workflow adds
// directories without touching INDEX.md.
const dsDir = 'plugins/ui-design-system/skills/ui-design-system/design-systems';
const onDisk = dirsIn(dsDir).sort();
const indexText = readText(`${dsDir}/INDEX.md`);
const indexed = [...indexText.matchAll(/\]\(([^)]+)\/DESIGN\.md\)/g)].map((m) => m[1]).sort();

for (const name of onDisk) {
  if (!indexed.includes(name)) {
    fail(`${dsDir}/INDEX.md`, `${name}: on disk but not indexed — curated mode cannot reach it`);
  }
  if (!existsSync(join(root, dsDir, name, 'DESIGN.md'))) {
    fail(dsDir, `${name}: directory has no DESIGN.md`);
  }
}
for (const name of indexed) {
  if (!onDisk.includes(name)) {
    fail(`${dsDir}/INDEX.md`, `${name}: indexed but no directory on disk — the link is dead`);
  }
}

const claimed = /^(\d+) vendored design systems/m.exec(indexText);
if (!claimed) {
  fail(`${dsDir}/INDEX.md`, 'cannot find the "<N> vendored design systems" count line');
} else if (Number(claimed[1]) !== onDisk.length) {
  fail(`${dsDir}/INDEX.md`, `claims ${claimed[1]} design systems, ${onDisk.length} are on disk`);
}

// ── Report ────────────────────────────────────────────────────────────────────
if (failures.length === 0) {
  console.log(
    `check:registries — OK\n` +
      `  ${plugins.length} plugins registered across 9 registries, all at v${version}\n` +
      `  ${onDisk.length} design systems, all indexed`
  );
  process.exit(0);
}

console.error(`check:registries — ${failures.length} problem(s)\n`);
const byRegistry = new Map();
for (const { registry, msg } of failures) {
  if (!byRegistry.has(registry)) byRegistry.set(registry, []);
  byRegistry.get(registry).push(msg);
}
for (const [registry, msgs] of byRegistry) {
  console.error(`${registry}`);
  for (const m of msgs) console.error(`  - ${m}`);
  console.error('');
}
process.exit(1);
