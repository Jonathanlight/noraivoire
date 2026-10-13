#!/usr/bin/env node
// NoraIvoire — CLI du compilateur : noractl build --spec spec --out packages/core/dist
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { build, VERSION } from './index.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const cmd = process.argv[2];

if (cmd === 'build') {
  try {
    const integrity = build(arg('spec', 'spec'), arg('out', 'packages/core/dist'));
    console.log(`NoraIvoire ${VERSION} — compilation réussie\n`);
    for (const [f, i] of Object.entries(integrity)) {
      console.log(`  ${f.padEnd(30)} ${String(i.bytes).padStart(7)} o   gzip ${String(i.gzip).padStart(6)} o`);
    }
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }
} else if (cmd === '--version' || cmd === '-v') {
  console.log(VERSION);
} else {
  console.log(`noractl ${VERSION}\n\nUsage :\n  noractl build [--spec <dossier>] [--out <dossier>]\n  noractl --version`);
  process.exit(cmd ? 1 : 0);
}
