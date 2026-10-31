'use strict';

const assert = require('node:assert/strict');
const { parse } = require('./index.js');

assert.deepEqual(parse('example.org:8080'), { host: 'example.org', port: 8080 });
assert.deepEqual(parse('192.0.2.10', 80), { host: '192.0.2.10', port: 80 });
assert.deepEqual(parse('[2001:db8::1]:443'), { host: '2001:db8::1', port: 443 });
assert.deepEqual(parse('LOCALHOST'), { host: 'localhost', port: undefined });
assert.throws(() => parse('example.org:70000'), RangeError);
assert.throws(() => parse('two words:80'), TypeError);

console.log('ok');
