#!/usr/bin/env node
// Builds the architecture-scan eval fixture: a small plain-JavaScript git repo
// with a scripted history and fixed commit dates.
// Usage: node make-fixture.mjs <targetDir>
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const target = process.argv[2] && resolve(process.argv[2]);
if (!target) {
  console.error('usage: node make-fixture.mjs <targetDir>');
  process.exit(2);
}
if (existsSync(target) && readdirSync(target).length > 0) {
  console.error(`${target} exists and is not empty`);
  process.exit(2);
}
mkdirSync(target, { recursive: true });

let clock = Date.parse('2026-07-01T09:00:00Z');
function git(...args) {
  const iso = new Date(clock).toISOString();
  const r = spawnSync('git', ['-C', target, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
  });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
}
function write(path, content) {
  const full = join(target, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
function commit(message, paths) {
  git('add', '-A', '--', ...paths);
  git('commit', '-q', '-m', message);
  clock += 4 * 3600 * 1000;
}

// ---------------------------------------------------------------- file bodies
// Each body takes `rev`, the 1-based number of the commit inside its area, and
// carries it in a header comment so every commit is a real content change.
const hdr = (rev) => `// rev ${rev}\n`;

const intake = {
  'src/orders/intake/handler.js': (rev) => `${hdr(rev)}import { validate } from './validator.js';

export function handleOrder(req) {
  const raw = {
    cust_nm: req.body.cust_nm,
    sku_list: req.body.sku_list,
    qty_str: req.body.qty_str,
    ship_dt: req.body.ship_dt,
  };
  return validate(raw);
}
`,
  'src/orders/intake/validator.js': (rev) => `${hdr(rev)}import { normalize } from './normalizer.js';

export function validate(raw) {
  return normalize(raw);
}
`,
  'src/orders/intake/normalizer.js': (rev) => `${hdr(rev)}import { toOrder } from './mapper.js';

export function normalize(raw) {
  return toOrder(raw);
}
`,
  'src/orders/intake/mapper.js': (rev) => `${hdr(rev)}import { saveOrder } from '../repo.js';

// Owns the raw field names: cust_nm, sku_list, qty_str, ship_dt.
export function toOrder(raw) {
  const order = {
    customerName: String(raw.cust_nm ?? '').trim(),
    skus: String(raw.sku_list ?? '').split(','),
    quantity: Number.parseInt(raw.qty_str, 10),
    shipDate: new Date(raw.ship_dt),
  };
  return saveOrder(order);
}
`,
};

const search = {
  'src/search/engine.js': (rev) => `${hdr(rev)}const STOPWORDS = new Set(['a', 'an', 'and', 'of', 'the', 'to']);

function tokenise(text) {
  return String(text)
    .toLowerCase()
    .split(/[^\\p{L}\\p{N}]+/u)
    .filter((t) => t && !STOPWORDS.has(t));
}

function termFrequencies(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function rank(queryTokens, docs, fields) {
  const indexed = docs.map((doc) => ({
    doc,
    tf: termFrequencies(tokenise(fields.map((f) => doc[f] ?? '').join(' '))),
  }));
  const idf = new Map();
  for (const q of new Set(queryTokens)) {
    const containing = indexed.filter((d) => d.tf.has(q)).length;
    idf.set(q, Math.log(1 + (indexed.length - containing + 0.5) / (containing + 0.5)));
  }
  return indexed
    .map(({ doc, tf }) => ({
      doc,
      score: queryTokens.reduce((sum, q) => sum + (tf.get(q) ?? 0) * idf.get(q), 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || String(a.doc.id).localeCompare(String(b.doc.id)));
}

export function search(query, options = {}) {
  const { documents = [], fields = ['title', 'body'], page = 1, pageSize = 10 } = options;
  const queryTokens = tokenise(query);
  if (queryTokens.length === 0) return { results: [], total: 0, page, pageSize };
  const ranked = rank(queryTokens, documents, fields);
  const start = (Math.max(page, 1) - 1) * pageSize;
  return {
    results: ranked.slice(start, start + pageSize).map((r) => ({ ...r.doc, score: r.score })),
    total: ranked.length,
    page,
    pageSize,
  };
}
`,
};

const notifications = {
  'src/notifications/dispatcher.js': (rev) => `${hdr(rev)}import { route } from './router.js';

export function dispatch(event) {
  return route(event);
}
`,
  'src/notifications/router.js': (rev) => `${hdr(rev)}import { render } from './templates.js';

export function route(event) {
  return render(event);
}
`,
  'src/notifications/templates.js': (rev) => `${hdr(rev)}import { send } from './channels.js';

export function render(event) {
  return send({ to: event.recipient, subject: event.type, body: event.text });
}
`,
  'src/notifications/channels.js': (rev) => `${hdr(rev)}import { deliver } from './smtp.js';

// Email is the only channel.
export function send(message) {
  return deliver(message);
}
`,
  'src/notifications/smtp.js': (rev) => `${hdr(rev)}export function deliver(message) {
  return { transport: 'smtp', accepted: [message.to], subject: message.subject };
}
`,
};

const WRAPPERS = [
  ['getPrice', 'GET /price'], ['getTier', 'GET /tier'], ['getDiscount', 'GET /discount'],
  ['getTax', 'GET /tax'], ['listCurrencies', 'GET /currencies'], ['getRate', 'GET /rate'],
  ['quoteBundle', 'POST /bundle'], ['quoteSubscription', 'POST /subscription'],
  ['getFloorPrice', 'GET /floor'], ['getCeilingPrice', 'GET /ceiling'],
  ['getSurcharge', 'GET /surcharge'], ['getPromotion', 'GET /promotion'],
];
const clientBody = (rev) => `${hdr(rev)}import { pricingApi } from './pricing-api.js';

${WRAPPERS.map(([fn, route]) => `export const ${fn} = (args) => pricingApi('${route}', args);`).join('\n')}
`;
// The three callers repeat the same currency, rounding and retry sequence.
const caller = (name, fnName) => (rev, n) => `${hdr(rev)}import { ${fnName}, getRate } from '${n >= 10 ? './pricing/client.js' : './pricing-client.js'}';

export async function ${name}(item, currency) {
  const rate = await getRate({ from: 'EUR', to: currency });
  let price;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      price = await ${fnName}({ item });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }
  return Math.round(price * rate * 100) / 100;
}
`;
const billingCallers = {
  'src/billing/invoice.js': caller('invoiceLine', 'getPrice'),
  'src/billing/refund.js': caller('refundAmount', 'getPrice'),
  'src/billing/quote.js': caller('quoteTotal', 'getTier'),
};

const legacyReports = {
  'src/legacy/reports/index.js': (rev) => `${hdr(rev)}import { rows } from '../source.js';

export const monthly = (month) => rows('monthly', month);
export const yearly = (year) => rows('yearly', year);
`,
};

// ------------------------------------------------------------ area schedules
// An area is a list of commits; each commit is { paths: [...] } and is applied
// by `apply(n)`, with n the 1-based commit number inside the area.
function cyclic(label, files, count) {
  const names = Object.keys(files);
  return Array.from({ length: count }, (_, i) => () => {
    const path = names[i % names.length];
    write(path, files[path](i + 1, i + 1));
    commit(`${label}: update ${path.split('/').pop()}`, [path]);
  });
}

// Expected hotspots.mjs output for the built repo: orders/intake 40, search 30,
// notifications 25, billing/ 13, billing/pricing/ 11, legacy 1, ./ 6, 122 commits,
// scattered false. Billing splits 13/11 because the client moves at commit 10:
// billing/ counts pricing-api.js, the first client file, the callers added and
// the callers touched again by the move, while billing/pricing/ counts the moved
// file as added plus its ten later edits. The scan skips deletions and renames.
function billing() {
  const steps = [];
  const clientOld = 'src/billing/pricing-client.js';
  const clientNew = 'src/billing/pricing/client.js';
  const callers = Object.keys(billingCallers);
  for (let n = 1; n <= 20; n += 1) {
    steps.push(() => {
      if (n === 1) {
        write(clientOld, clientBody(n));
        commit('billing: add pricing client', [clientOld]);
      } else if (n <= 4) {
        const p = callers[n - 2];
        write(p, billingCallers[p](n, n));
        commit(`billing: add ${p.split('/').pop()}`, [p]);
      } else if (n < 10) {
        write(clientOld, clientBody(n));
        commit('billing: update pricing client', [clientOld]);
      } else if (n === 10) {
        mkdirSync(join(target, 'src/billing/pricing'), { recursive: true });
        renameSync(join(target, clientOld), join(target, clientNew));
        write(clientNew, clientBody(n));
        for (const p of callers) write(p, billingCallers[p](n, n));
        commit('billing: move pricing client into pricing/', [clientOld, clientNew, ...callers]);
      } else {
        write(clientNew, clientBody(n));
        commit('billing: update pricing client', [clientNew]);
      }
    });
  }
  return steps;
}

const areas = [
  cyclic('orders/intake', intake, 40),
  cyclic('search', search, 30),
  cyclic('notifications', notifications, 25),
  billing(),
];

// Deterministic interleave: seeded LCG picks the next area, weighted by what
// is left in it, so each area keeps its internal order.
let seed = 20261031;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const order = [];
const left = areas.map((a) => a.length);
const cursor = areas.map(() => 0);
for (let remaining = left.reduce((a, b) => a + b, 0); remaining > 0; remaining -= 1) {
  let pick = rand() * remaining;
  let idx = 0;
  while (pick >= left[idx]) { pick -= left[idx]; idx += 1; }
  left[idx] -= 1;
  order.push(areas[idx][cursor[idx]++]);
}

// Root files are touched in a few commits; the scan excludes them.
const rootTouches = new Set([12, 31, 55, 78, 96]);

// ---------------------------------------------------------------- build repo
git('init', '-q', '-b', 'main');
git('config', 'user.name', 'Fixture Author');
git('config', 'user.email', 'fixture@example.com');

write('README.md', '# Shop service\n\nOrders, search, notifications and billing.\n');
write('package.json', '{\n  "name": "shop-service",\n  "version": "1.0.0",\n  "type": "module"\n}\n');
write('package-lock.json', '{\n  "name": "shop-service",\n  "lockfileVersion": 3\n}\n');
write('src/orders/repo.js', 'export function saveOrder(order) {\n  return { id: 1, ...order };\n}\n');
write('src/billing/pricing-api.js', "export async function pricingApi(route, args) {\n  return { route, args };\n}\n");
write('src/legacy/source.js', 'export const rows = (kind, period) => [{ kind, period }];\n');
commit('chore: initial import', ['.']);

// The cold area: one commit, one file.
write('src/legacy/reports/index.js', legacyReports['src/legacy/reports/index.js'](1));
commit('legacy: add reports', ['.']);

order.forEach((step, i) => {
  step();
  if (rootTouches.has(i + 1)) {
    const k = i + 1;
    write('README.md', `# Shop service\n\nOrders, search, notifications and billing.\n\nUpdated ${k}.\n`);
    write('package.json', `{\n  "name": "shop-service",\n  "version": "1.0.${k}",\n  "type": "module"\n}\n`);
    write('package-lock.json', `{\n  "name": "shop-service",\n  "version": "1.0.${k}",\n  "lockfileVersion": 3\n}\n`);
    commit('chore: bump version and readme', ['README.md', 'package.json', 'package-lock.json']);
  }
});

console.log(`fixture built in ${target}`);
