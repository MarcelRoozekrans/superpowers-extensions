'use strict';

// A host is a DNS name, an IPv4 address, or a bracketed IPv6 address,
// optionally followed by ":port".
const HOST_SPEC = /^([a-z0-9.]+|\[[0-9a-f:]+\])(?::(\d{1,5}))?$/i;

function parse(spec, defaultPort) {
  const text = String(spec).trim();
  const match = HOST_SPEC.exec(text);
  if (!match) {
    throw new TypeError(`hostspec: invalid host spec "${text}"`);
  }
  const host = match[1].replace(/^\[|\]$/g, '').toLowerCase();
  const port = match[2] === undefined ? defaultPort : Number(match[2]);
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new RangeError(`hostspec: port out of range in "${text}"`);
  }
  return { host, port };
}

module.exports = { parse };
