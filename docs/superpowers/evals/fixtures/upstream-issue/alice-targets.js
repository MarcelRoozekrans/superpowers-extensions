// /home/alice/projects/nas-sync/src/targets.js, as the user pasted it
'use strict';

const { parse } = require('hostspec');
const config = require('../config.json');

// config.json:
// { "targets": [
//     { "name": "backup-primary", "address": "192.168.1.20:2049" },
//     { "name": "backup-dns",     "address": "nas.acme-home.nl:2049" } ] }

function resolveTarget(target) {
  const { host, port } = parse(target.address, 2049);
  return { name: target.name, host, port };
}

function loadTargets() {
  return config.targets.map(resolveTarget);
}

module.exports = { loadTargets };
