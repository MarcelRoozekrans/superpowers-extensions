// Usage: node make-fixture.mjs <dir>
// Builds a throwaway git repo for the groom-milestone evaluation: a tiny Node
// package, a ROADMAP with Milestone 1 active and Milestone 2 pending, and
// phases in three different states of readiness. The repo has no remote.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = process.argv[2];
if (!dir || dir.startsWith('--')) {
  console.error('usage: node make-fixture.mjs <dir>');
  process.exit(2);
}

const design = (phase, surface, status, goal, approach) => `# Phase ${phase} Design

**Date:** 2026-11-02
**Phase:** ${phase}
**Surface:** ${surface}
**Stage:** phase (one phase, implementation-ready)
${status ? `**Status:** ${status}\n` : ''}
## Goal

${goal}

## Approach

${approach}

## Definition of Done

- The behaviour above works and has a test.
`;

const files = {
  'package.json': JSON.stringify(
    { name: 'tiny-text', version: '0.1.0', type: 'module', scripts: { test: 'node --test' } },
    null,
    2,
  ) + '\n',
  'src/index.mjs': `export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
`,
  'test/index.test.mjs': `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capitalize } from '../src/index.mjs';

test('capitalize upper-cases the first letter', () => {
  assert.equal(capitalize('hello'), 'Hello');
});
`,
  'docs/planning/CONVENTIONS.md': `# Project Conventions

**Established:** 2026-11-01

## Stack

**Language / runtime:** \`node 24\`
**Package manager:** \`npm\`
**Framework:** \`none\`
**Datastore:** \`n/a\`

## Commits

**Format:** conventional
**Scopes:** free
**Scope source:** \`n/a\`
**Fallback when scope not allowed:** omit scope

## Branching

**Model:** trunk
**PR required:** no
**Protected branches:** \`none\`

## Versioning & Release

**Scheme:** none
**Released by:** none
**Milestone completion tags a release:** no
**Changelog:** none

## Deployment

**Deploy target:** \`none\`
**Environments:** \`none\`
**Deployed by:** \`none\`
`,
  'docs/planning/MILESTONE.md': `# Milestone 1: Text helpers

**Goal:** tiny-text gains slug, URL and truncation helpers.

## Definition of Done

- [ ] slugify, postUrl and truncate are exported from src/index.mjs
`,
  'docs/planning/ROADMAP.md': `# Project Roadmap

## Milestone 1: Text helpers [status: active]
**Goal:** tiny-text gains slug, URL and truncation helpers.
**Started:** 2026-11-02
**Definition of Done:**
- [ ] slugify, postUrl and truncate are exported from src/index.mjs

### Phase 1.1: Slugify [status: pending]
**Goal:** Export slugify, which turns text into a URL slug.
**Surface:** Backend
**HelpWanted:** no
**Plan:** \`docs/superpowers/plans/2026-11-02-slugify.md\`

### Phase 1.2: Post URLs [status: pending]
**Goal:** Export postUrl, which turns a post title into a URL path.
**Surface:** Backend
**HelpWanted:** no

### Phase 1.3: Truncate [status: pending]
**Goal:** Export truncate, which shortens text to a maximum length.
**Surface:** Backend
**HelpWanted:** no

## Milestone 2: Word statistics [status: pending]
**Goal:** tiny-text counts words.
**Definition of Done:**
- [ ] wordCount is exported from src/index.mjs

### Phase 2.1: Word count [status: pending]
**Goal:** Export wordCount.
**Surface:** Backend
**HelpWanted:** no
`,
  'docs/superpowers/specs/2026-11-02-slugify-design.md': design(
    '1.1', 'Backend', 'approved 2026-11-02',
    'tiny-text exports slugify(text), which returns a lower-case URL slug.',
    'Add slugify(text) to src/index.mjs: lower-case the text, turn each run of non-alphanumeric characters into one hyphen, and strip leading and trailing hyphens. A test in test/index.test.mjs covers it.',
  ),
  'docs/superpowers/plans/2026-11-02-slugify.md': `# Slugify Implementation Plan

**Goal:** Export slugify from src/index.mjs.

**Design:** docs/superpowers/specs/2026-11-02-slugify-design.md

## Task 1: slugify

- [ ] Add a failing test to test/index.test.mjs: \`slugify('Hello, World!')\` returns \`'hello-world'\`, and \`slugify('  Many   spaces ')\` returns \`'many-spaces'\`.
- [ ] Add \`export function slugify(text)\` to src/index.mjs.
- [ ] Run \`node --test\` and commit.
`,
  'docs/superpowers/specs/2026-11-02-truncate-design.md': design(
    '1.3', 'Backend', null,
    'tiny-text exports truncate(text, max), which shortens text to at most max characters.',
    'Add truncate(text, max) to src/index.mjs. Text of max characters or fewer is returned unchanged; longer text is cut to max - 1 characters followed by an ellipsis character. A test covers both cases.',
  ),
};

for (const [path, content] of Object.entries(files)) {
  const full = join(dir, path);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
}

const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
git('init', '-q', '-b', 'main');
git('config', 'user.email', 'eval@example.com');
git('config', 'user.name', 'Eval');
git('add', '-A');
git('commit', '-q', '-m', 'chore: initial fixture');
console.log(`fixture ready: ${dir}`);
