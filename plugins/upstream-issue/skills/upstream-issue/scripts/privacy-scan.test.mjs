import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { scanText, scanPaths, loadTerms, usernameTerms, main } from './privacy-scan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'privacy-scan.mjs');
const kinds = (text, opts) => scanText(text, opts).map((h) => h.kind);

test('ip-private flags private ranges only', () => {
  assert.deepEqual(kinds('host 192.168.1.20 up'), ['ip-private']);
  assert.deepEqual(kinds('host 10.1.2.3 up'), ['ip-private']);
  assert.deepEqual(kinds('host 172.20.0.1 up'), ['ip-private']);
  assert.deepEqual(kinds('host 100.64.0.1 up'), ['ip-private']);
  assert.deepEqual(kinds('host 169.254.1.1 up'), ['ip-private']);
  assert.deepEqual(kinds('Version=10.0.0.0'), []);
  assert.deepEqual(kinds('version 10.0.0.0'), []);
  assert.deepEqual(kinds('v10.0.0.0'), []);
  assert.deepEqual(kinds('host 192.0.2.10'), []);
  assert.deepEqual(kinds('host 172.32.0.1'), []);
});

test('ipv6 flags ULA and global, not documentation range', () => {
  assert.deepEqual(kinds('addr fd12:3456:789a::1'), ['ipv6']);
  assert.deepEqual(kinds('addr 2a02:1234:5678:9abc::1'), ['ipv6']);
  assert.deepEqual(kinds('addr 2001:db8::1'), []);
  assert.deepEqual(kinds('addr 2001:db8:1:2:3::1'), []);
  assert.deepEqual(kinds('addr fd00::1'), ['ipv6']);
  assert.deepEqual(kinds('addr 2a02:1234::1'), ['ipv6']);
  assert.deepEqual(kinds('addr 2a02:1234:5678:9abc'), ['ipv6']);
  assert.deepEqual(kinds('DateTimeOriginal 2026:10:31 12:30:45'), []);
  assert.deepEqual(kinds('at 12:30:45'), []);
});

test('mac flags real addresses, not placeholders', () => {
  assert.deepEqual(kinds('nic 3c:22:fb:01:02:03'), ['mac']);
  assert.deepEqual(kinds('nic 3C-22-FB-01-02-03'), ['mac']);
  assert.deepEqual(kinds('nic aa:bb:cc:dd:ee:ff'), []);
  assert.deepEqual(kinds('nic 00:00:00:00:00:00'), []);
});

test('hostname flags private domains, not files or allowlisted names', () => {
  assert.deepEqual(kinds('nas.acme-home.nl'), ['hostname']);
  assert.deepEqual(kinds('README.md package.json'), []);
  assert.deepEqual(kinds('api.github.com'), []);
  assert.deepEqual(kinds('foo.example bar.test'), []);
  assert.deepEqual(kinds('example.com'), []);
  assert.deepEqual(kinds('nas.acme-home.nl', { allow: ['acme-home.nl'] }), []);
  assert.deepEqual(kinds('acme-home.nl', { allow: ['acme-home.nl'] }), []);
  assert.deepEqual(kinds('evilacme-home.nl', { allow: ['acme-home.nl'] }), ['hostname']);
});

test('home-path flags real users, not placeholders', () => {
  assert.deepEqual(kinds('cd /home/alice/src'), ['home-path']);
  assert.deepEqual(kinds('cd /Users/alice/src'), ['home-path']);
  assert.deepEqual(kinds('cd C:\\Users\\alice\\src'), ['home-path']);
  assert.deepEqual(kinds('cd /home/<user>/src'), []);
  assert.deepEqual(kinds('cd /home/runner/work'), []);
});

test('home-path flags a user segment without a trailing slash', () => {
  assert.deepEqual(kinds('HOME=/home/alice'), ['home-path']);
  assert.deepEqual(kinds('cd /Users/alice'), ['home-path']);
  assert.deepEqual(kinds('"/home/alice"'), ['home-path']);
  assert.deepEqual(kinds('cd C:\\Users\\alice'), ['home-path']);
  assert.deepEqual(kinds('`/home/alice`; (/Users/alice)'), ['home-path', 'home-path']);
  assert.deepEqual(kinds('/home/<user>'), []);
  assert.deepEqual(kinds('HOME=/home/$USER'), []);
});

test('home-path stops at a sentence-ending dot and keeps dotted names', () => {
  assert.deepEqual(kinds('see /home/<user>.'), []);
  assert.deepEqual(kinds('HOME=/home/$USER. Then run it.'), []);
  assert.deepEqual(scanText('see /home/alice.'), [{ kind: 'home-path', match: '/home/alice', line: 1 }]);
  assert.deepEqual(scanText('cd /home/first.last/src'), [{ kind: 'home-path', match: '/home/first.last', line: 1 }]);
  assert.deepEqual(scanText('home is /Users/first.last. Done'), [{ kind: 'home-path', match: '/Users/first.last', line: 1 }]);
  assert.deepEqual(kinds('cd C:\\Users\\alice. Done'), ['home-path']);
});

test('home-path skips the shared folders and {user}', () => {
  assert.deepEqual(kinds('cp x /Users/Shared/x'), []);
  assert.deepEqual(kinds('copy x C:\\Users\\Public\\Documents'), []);
  assert.deepEqual(kinds('cd /home/{user}/x'), []);
});

test('token flags secrets, not commit SHAs', () => {
  assert.deepEqual(kinds('t ghp_' + 'a1B2c3D4e5'.repeat(3) + 'abcdef'), ['token']);
  assert.deepEqual(kinds('t github_pat_11ABCDEFG0abcdefghij'), ['token']);
  assert.deepEqual(kinds('t sk-' + 'abcdefghij'.repeat(2)), ['token']);
  assert.deepEqual(kinds('t xoxb-123456-abcdef'), ['token']);
  assert.deepEqual(kinds('t AKIA' + 'ABCDEFGH12345678'), ['token']);
  assert.deepEqual(kinds('t eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc_DEF-123'), ['token']);
  assert.deepEqual(kinds('sha 0123456789abcdef0123456789abcdef01234567'), []);
});

test('email flags private domains, not allowlisted ones', () => {
  assert.deepEqual(kinds('mail alice@acme-home.nl'), ['email']);
  assert.deepEqual(kinds('mail noreply@github.com'), []);
  assert.deepEqual(kinds('mail x@example.com'), []);
  assert.deepEqual(kinds('mail alice@acme-home.nl', { allow: ['acme-home.nl'] }), []);
});

test('term matches case-insensitively on word boundaries', () => {
  const opts = { terms: ['zolderkamer'] };
  assert.deepEqual(scanText('Zolderkamer lamp', opts), [{ kind: 'term', match: 'Zolderkamer', line: 1 }]);
  assert.deepEqual(scanText('zolderkamers', opts), []);
});

test('line numbers are right inside a fenced code block', () => {
  const text = '# t\n\n```sh\ncd /home/alice/src\n```\n';
  assert.deepEqual(scanText(text), [{ kind: 'home-path', match: '/home/alice', line: 4 }]);
});

test('scanPaths recurses and skips node_modules', () => {
  const hits = scanPaths([join(here, 'fixtures', 'repro')]);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'hostname');
  assert.ok(hits[0].file.endsWith('leaky.txt'));
});

test('scanPaths skips binary files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ps-'));
  writeFileSync(join(dir, 'b.bin'), Buffer.from('nas.acme-home.nl\0\0'));
  assert.deepEqual(scanPaths([dir]), []);
});

test('loadTerms ignores comments and blank lines', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ps-'));
  const file = join(dir, 'terms.txt');
  writeFileSync(file, '# note\n\nzolderkamer\n  acme-lab  \n');
  assert.deepEqual(loadTerms(file), ['zolderkamer', 'acme-lab']);
});

function cli(args) {
  return spawnSync('node', [script, ...args], { encoding: 'utf8' });
}

test('CLI exits 0 on clean, 1 on leaky, 2 without a path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ps-'));
  const empty = join(dir, 'terms.txt');
  writeFileSync(empty, '');
  assert.equal(cli(['--terms', empty, join(here, 'fixtures', 'clean.md')]).status, 0);
  const leaky = cli(['--terms', empty, join(here, 'fixtures', 'leaky.md')]);
  assert.equal(leaky.status, 1);
  assert.match(leaky.stdout, /leaky\.md:6: home-path:/);
  assert.equal(cli(['--terms', empty]).status, 2);
});

test('hostname ignores type and namespace names in stack traces', () => {
  assert.deepEqual(kinds('   at System.Net.Http.HttpClient.Send(x)'), []);
  assert.deepEqual(kinds('Microsoft.NETCore.App/10.0.0'), []);
  assert.deepEqual(kinds('import java.io.File'), []);
  assert.deepEqual(kinds('connect nas.acme-home.nl.'), ['hostname']);
});

test('token sk- and AKIA need a leading boundary', () => {
  assert.deepEqual(kinds('branch fix/task-queue-timeout-handling'), []);
  assert.deepEqual(kinds('id XAKIA' + 'ABCDEFGH12345678'), []);
});

test('ip exclusion applies to a standalone v only', () => {
  assert.deepEqual(kinds('host srv10.0.0.5'), ['ip-private']);
  assert.deepEqual(kinds('tag v10.0.0.5'), []);
});

test('terms are matched on every line', () => {
  const hits = scanText('zolder\nnope\nZOLDER', { terms: ['zolder'] });
  assert.deepEqual(hits.map((h) => h.line), [1, 3]);
});

test('hostname catches uppercase and mixed-case names, not type names', () => {
  assert.deepEqual(kinds('NAS.ACME-HOME.NL'), ['hostname']);
  assert.deepEqual(kinds('Nas.Acme-Home.nl'), ['hostname']);
  assert.deepEqual(kinds('DESKTOP-AB1.home'), ['hostname']);
  assert.deepEqual(kinds('API.GITHUB.COM'), []);
  assert.deepEqual(kinds('NAS.ACME-HOME.NL', { allow: ['acme-home.nl'] }), []);
  assert.deepEqual(kinds('at System.IO'), []);
  assert.deepEqual(kinds('System.Net.Http.HttpClient'), []);
  assert.deepEqual(kinds('Foo.App'), []);
});

test('usernameTerms adds the local username, not placeholders or short names', () => {
  assert.deepEqual(usernameTerms('alice'), ['alice']);
  assert.deepEqual(usernameTerms('runner'), []);
  assert.deepEqual(usernameTerms('root'), []);
  assert.deepEqual(usernameTerms('User'), []);
  assert.deepEqual(usernameTerms('ab'), []);
  assert.deepEqual(usernameTerms(''), []);
});

test('the username term matches inside a flattened scratch path', () => {
  const text = '"dep": "git+file:///tmp/claude-1000/-home-alice-Projects-x/up#v1"';
  assert.deepEqual(scanText(text, { terms: usernameTerms('alice') }), [{ kind: 'term', match: 'alice', line: 1 }]);
  assert.deepEqual(scanText('malice aforethought', { terms: usernameTerms('alice') }), []);
});

test('CLI flags the local username by default', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ps-'));
  const empty = join(dir, 'terms.txt');
  writeFileSync(empty, '');
  const file = join(dir, 'package.json');
  writeFileSync(file, '{ "dep": "git+file:///tmp/x/-home-alice-src/up#v1" }\n');
  const log = console.log;
  const lines = [];
  console.log = (line) => lines.push(line);
  try {
    assert.equal(main(['--terms', empty, file], { username: 'alice' }), 1);
    assert.match(lines.join('\n'), /package\.json:1: term: alice/);
    assert.equal(main(['--terms', empty, file], { username: 'runner' }), 0);
  } finally {
    console.log = log;
  }
});
