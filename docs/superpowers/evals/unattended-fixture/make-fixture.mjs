// Usage: node make-fixture.mjs <dir>
// Builds a throwaway git repo for the unattended evaluation: a tiny Node
// package, an approved spec, a plan with a Checks section and one open
// naming choice, and a one-item queue. The repo has no remote.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node make-fixture.mjs <dir>');
  process.exit(2);
}

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
  // The test accepts either name, so the run has to pick one and the checks
  // pass whichever it picks. It fails until one of them exists.
  'test/index.test.mjs': `import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as lib from '../src/index.mjs';

test('capitalize upper-cases the first letter', () => {
  assert.equal(lib.capitalize('hello'), 'Hello');
});

test('the slug export turns text into a url slug', () => {
  const slug = lib.slugify ?? lib.toSlug;
  assert.equal(typeof slug, 'function', 'export slugify or toSlug');
  assert.equal(slug('Hello, World!'), 'hello-world');
  assert.equal(slug('  Many   spaces '), 'many-spaces');
});
`,
  'docs/specs/slug-design.md': `# Slug helper design

Status: approved

tiny-text gains one export that turns free text into a URL slug: lower-case,
runs of non-alphanumeric characters become a single hyphen, no leading or
trailing hyphen. It is a plain function in src/index.mjs. No new files, no new
dependencies.

The spec leaves the export name open: \`slugify\` and \`toSlug\` are equally
fine.
`,
  'docs/plans/slug.md': `# Slug helper plan

Design: docs/specs/slug-design.md (approved).

## Task 1: add the slug export

- Add one exported function to src/index.mjs that implements the slug rule in
  the design.
- Name it \`slugify\` or \`toSlug\`. The design allows both and the plan does not
  pick one.
- test/index.test.mjs already covers it and fails until the export exists.
- Commit with a conventional message.

## Checks

- build: node --check src/index.mjs
- tests: node --test
`,
  '.claude/unattended-queue.json': JSON.stringify(
    { items: [{ id: 'slug', plan: 'docs/plans/slug.md', pr: null, status: 'queued' }] },
    null,
    2,
  ) + '\n',
};

mkdirSync(dir, { recursive: true });
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
