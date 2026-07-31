#!/usr/bin/env node
// Assert that no plugin hardcodes a commit message or a release tag outside the
// Commit & Release Protocol, and that the protocol and the conventions template
// cannot drift apart.
//
// project-orchestration OWNS the protocol and gets every check. Any other plugin
// whose SKILL.md names the protocol is DELEGATING to it, and gets the literal
// checks — discovered by walking plugins/, never by a hardcoded path.
//
// Every check here exists because the failure already happened, three times:
//
//   - A gate grepping `git commit -m` reported "no literals" while a commit
//     message sat hardcoded in *prose* two lines away.
//   - A gate grepping `git tag -a` reported clean while a tag was promised in
//     prose ("Tagged as vN.0").
//   - This guard itself scanned one hardcoded path. `logo-design` shipped making
//     the same delegation promise in its own SKILL.md, and a commit literal
//     there would have passed CI green.
//
// Grepping the shape of the bug misses the bug, and guarding one file misses
// every other file making the same promise. So this guard asserts the *claims*
// too, and follows the promise rather than a path.
//
// Run: npm run check:conventions

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];
const fail = (where, msg) => failures.push({ where, msg });

const SKILL = 'plugins/project-orchestration/skills/project-orchestration/SKILL.md';
const TEMPLATE =
  'plugins/project-orchestration/skills/project-orchestration/templates/conventions.template.md';

const readText = (p) => readFileSync(join(root, p), 'utf8');

// The link every call site must delegate through. A line carrying this is
// pointing AT the protocol rather than duplicating it, which is the whole
// point — so it exempts that line from the prose-claim checks below.
const POINTER = 'Commit & Release Protocol](#commit--release-protocol)';

if (!existsSync(join(root, SKILL))) {
  fail(SKILL, 'file does not exist — nothing to guard');
  report();
}

const lines = readText(SKILL).split(/\r?\n/);
const lineNo = (i) => i + 1;

// ── 0. Structural markers ────────────────────────────────────────────────────
// The region math below is "everything outside the protocol section". If the
// markers that bound that section go missing, the region silently becomes empty
// and every check downstream passes while seeing nothing. That is precisely the
// failure this guard exists to catch, so the markers are asserted first and the
// region falls back to scanning the WHOLE file (fail closed, never fail open).
const protoStart = lines.findIndex((l) => /^## Commit & Release Protocol\s*$/.test(l));
const protoEnd = lines.findIndex((l) => /^## Sub-Skills\s*$/.test(l));

if (protoStart === -1) {
  fail(SKILL, 'no `## Commit & Release Protocol` section — the section every commit site delegates to does not exist');
}
if (protoEnd === -1) {
  fail(SKILL, 'no `## Sub-Skills` heading — it terminates the protocol section, and without it the guard cannot tell where the protocol ends');
}
if (protoStart !== -1 && protoEnd !== -1 && protoStart > protoEnd) {
  fail(SKILL, '`## Commit & Release Protocol` appears after `## Sub-Skills` — it governs the sub-skills, so it must precede them');
}

// Only a well-formed, correctly ordered pair carves out an exempt region.
// Anything else means every line is scanned.
const haveRegion = protoStart !== -1 && protoEnd !== -1 && protoStart < protoEnd;
const inProtocol = (i) => haveRegion && i >= protoStart && i < protoEnd;

// ── 1. No literal git write-commands outside the protocol ────────────────────
// `git tag -l` is a read and stays allowed; only `-a` creates a tag.
const LITERALS = [
  [/git commit -m/, 'git commit -m'],
  [/git tag -a/, 'git tag -a'],
];

// ── 2. No hardcoded commit-message claims outside the protocol ───────────────
// The message shape itself, carrying no git command. This is the check that
// would have caught the `chore(sync): reconcile github state` buried in prose.
const MESSAGE_SHAPE =
  /\b(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\([a-z][a-z-]*\):/;

// ── 3. No prose promising a tag outside the protocol ─────────────────────────
// Claim phrases, not shapes. A bare `vN.0` grep does NOT work: the shape
// legitimately appears where `init-conventions` *detects* it (`vN.0` →
// milestone) and where `audit-milestone` *prohibits* assuming it ("do not
// assume `vN.0`"). Matching the claim instead of the shape sidesteps both.
//
// `tags a release,` keeps its comma deliberately: `tags a release:` is the
// CONVENTIONS.md field (`Milestone completion tags a release: no`) and must not
// match, while master's "marks the WHOLE milestone complete, tags a release,"
// must.
//
// Lines carrying POINTER are exempt — "Tag the release per [the protocol]" is
// the fix, not the bug.
const TAG_CLAIMS = [
  /tagged as/i,
  /tag the release/i,
  /tags a release,/i,
  /release tagged/i,
  /release tagging/i,
];

// Applied to the protocol's owner (where `exempt` carves out the protocol
// section itself) and to every plugin that delegates to it (where nothing is
// exempt, because a delegating file has no protocol section to write in).
function scanLiterals(file, fileLines, exempt) {
  for (const [i, line] of fileLines.entries()) {
    if (exempt(i)) continue;

    for (const [re, label] of LITERALS) {
      if (re.test(line)) {
        fail(file, `L${lineNo(i)}: literal \`${label}\` outside the protocol — call sites pass type/scope/subject, the protocol renders it`);
      }
    }

    const shape = MESSAGE_SHAPE.exec(line);
    if (shape) {
      fail(file, `L${lineNo(i)}: hardcoded commit message \`${shape[0]}\` outside the protocol — the host project's config decides the format, not this file`);
    }

    if (line.includes(POINTER)) continue; // delegating, not claiming

    for (const re of TAG_CLAIMS) {
      const m = re.exec(line);
      if (m) {
        fail(file, `L${lineNo(i)}: prose promises a tag ("${m[0]}") without delegating to the protocol — whether a tag is created at all is the protocol's decision`);
        break;
      }
    }
  }
}

scanLiterals(SKILL, lines, inProtocol);

// ── 3b. Every plugin that delegates gets the same literal checks ─────────────
// This guard used to scan exactly one hardcoded path. `logo-design` shipped
// making the same delegation promise in its own SKILL.md, and nothing enforced
// it — a `git commit -m` literal there passed CI green. The promise is what is
// being guarded, so the guard follows the promise rather than a path.
//
// A delegating file has no protocol section of its own, so NOTHING is exempt in
// it. That is the point: the owner may write a commit literal inside the
// protocol because that is where rendering is defined; a delegator may not write
// one anywhere.
const PROTOCOL_NAME = 'Commit & Release Protocol';

const skillFiles = [];
for (const plugin of readdirSync(join(root, 'plugins'))) {
  const skillsDir = join(root, 'plugins', plugin, 'skills');
  if (!existsSync(skillsDir)) continue;
  for (const skill of readdirSync(skillsDir)) {
    const rel = `plugins/${plugin}/skills/${skill}/SKILL.md`;
    if (existsSync(join(root, rel))) skillFiles.push(rel);
  }
}

const mentionsProtocol = skillFiles.filter((p) => readText(p).includes(PROTOCOL_NAME));

// Anti-vacuous, in the same spirit as the KNOWN_READS pin below: if discovery
// silently matched nothing it would scan zero delegators and report success.
// The owner names the protocol by definition, so failing to find it means the
// walk or the marker is broken, not that nobody delegates.
if (!mentionsProtocol.includes(SKILL)) {
  fail(
    'scripts/check-conventions.mjs',
    `delegation discovery did not find the protocol's own owner (${SKILL}) — the plugins walk or the \`${PROTOCOL_NAME}\` marker is broken, so the delegator scan below proved nothing`
  );
}

const delegators = mentionsProtocol.filter((p) => p !== SKILL);
for (const file of delegators) {
  scanLiterals(file, readText(file).split(/\r?\n/), () => false);
}

// ── 4. Every sub-skill that stages files points at the protocol ──────────────
// Structural, not a count. A count assertion passes when one sub-skill loses
// its pointer and an unrelated prose mention appears elsewhere; this cannot.
const sections = [];
for (const [i, line] of lines.entries()) {
  const h = /^## (.+?)\s*$/.exec(line);
  if (h) sections.push({ name: h[1], start: i, body: [] });
  else if (sections.length) sections.at(-1).body.push(line);
}

let stagingSites = 0;
for (const s of sections) {
  if (s.name === 'Commit & Release Protocol') continue;
  const body = s.body.join('\n');
  if (!/git add /.test(body)) continue;
  stagingSites += 1;
  if (!body.includes(POINTER)) {
    fail(SKILL, `L${lineNo(s.start)}: sub-skill \`${s.name}\` stages files but never references the Commit & Release Protocol`);
  }
}
if (stagingSites === 0) {
  fail(SKILL, 'found no sub-skill that stages files — the staging check matched nothing, so it proved nothing (is `git add` still the staging idiom?)');
}

// ── 5. The template produces every field the protocol reads ──────────────────
// This is the coupling check, and the reason it derives the field list from the
// protocol rather than hardcoding it: a hardcoded list ties the GUARD to the
// template, not the protocol to the template. A field read added to the
// protocol tomorrow would sail past a hardcoded list — the exact #112 drift
// this check exists to prevent.
if (!existsSync(join(root, TEMPLATE))) {
  fail(TEMPLATE, 'conventions template does not exist — `init-conventions` has nothing to write CONVENTIONS.md from');
} else {
  const template = readText(TEMPLATE);

  for (const heading of ['## Stack', '## Commits', '## Branching', '## Versioning & Release', '## Deployment']) {
    if (!template.includes(heading)) {
      fail(TEMPLATE, `missing \`${heading}\` section`);
    }
  }

  if (haveRegion) {
    const proto = lines.slice(protoStart, protoEnd).join('\n');

    // Field references in the protocol are backticked, Capitalized, and made of
    // words: `Scheme`, `PR required`, `Milestone completion tags a release`.
    //
    // A field is also referenced as `<Field>` when the protocol interpolates its
    // VALUE into an announce — `Release handled by <Released by>`. That is still
    // a read, and stripping the brackets is what makes `Released by` visible
    // here at all. It is the only capitalized `<...>` token in the section; the
    // rest (`<branch>`, `<scope>`, `<subject>`) are lowercase and filtered out.
    const candidates = new Set(
      [...proto.matchAll(/`([^`\n]+)`/g)]
        .map((m) => m[1].replace(/^<(.+)>$/, '$1'))
        .filter((t) => /^[A-Z][A-Za-z]*( [a-z][A-Za-z]*)*$/.test(t))
    );

    // Backticked Capitalized tokens in the protocol that are NOT CONVENTIONS.md
    // fields: two `init-conventions` step names and one example value quoted by
    // the branch guard's catch-all row. Kept explicit and short so it stays a
    // reviewable exception list rather than a hiding place.
    for (const notAField of ['Propose', 'VERIFY', 'Yes']) candidates.delete(notAField);

    // Anti-vacuous: an extraction that silently matches nothing would make
    // every assertion below pass while checking zero fields. Pin the fields the
    // protocol is known to read, so a reformat that breaks extraction fails
    // loudly instead of going quiet.
    const KNOWN_READS = [
      'Format',
      'Scopes',
      'Scope source',
      'Fallback when scope not allowed',
      'PR required',
      'Protected branches',
      'Scheme',
      'Released by',
      'Milestone completion tags a release',
    ];
    for (const f of KNOWN_READS) {
      if (!candidates.has(f)) {
        fail(SKILL, `the protocol no longer references the field \`${f}\`, or field extraction broke — this check cannot verify the template without it`);
      }
    }

    for (const field of [...candidates].sort()) {
      if (!new RegExp(`^\\*\\*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\*\\*`, 'm').test(template)) {
        fail(TEMPLATE, `the protocol reads \`${field}\` but the template never produces a \`**${field}:**\` line — CONVENTIONS.md will not contain it and the protocol will read nothing`);
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
function report() {
  if (failures.length === 0) {
    console.log(
      `check:conventions — OK\n` +
        `  no commit/tag literals or hardcoded claims outside the Commit & Release Protocol\n` +
        `  ${stagingSites} staging sub-skills all delegate to the protocol\n` +
        `  every protocol-read field is produced by the conventions template\n` +
        `  ${delegators.length} delegating plugin(s) scanned, no literals: ${delegators
          .map((p) => p.split('/')[1])
          .join(', ') || 'none found'}`
    );
    process.exit(0);
  }

  console.error(`check:conventions — ${failures.length} problem(s)\n`);
  const byFile = new Map();
  for (const { where, msg } of failures) {
    if (!byFile.has(where)) byFile.set(where, []);
    byFile.get(where).push(msg);
  }
  for (const [where, msgs] of byFile) {
    console.error(`${where}`);
    for (const m of msgs) console.error(`  - ${m}`);
    console.error('');
  }
  process.exit(1);
}

report();
