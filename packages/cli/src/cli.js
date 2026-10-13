#!/usr/bin/env node
// NoraIvoire — CLI : nora check <chemins…> [--format=json|text] · nora audit [--format=json|text]
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPaths } from './check.js';
import { runAudit } from './audit.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const args = process.argv.slice(2);
const cmd = args[0];
const format = (args.find((a) => a.startsWith('--format=')) ?? '--format=text').split('=')[1];
const positional = args.slice(1).filter((a) => !a.startsWith('--'));

function loadManifest() {
  const flag = args.find((a) => a.startsWith('--manifest='));
  const path = flag ? flag.slice('--manifest='.length) : join(repoRoot, 'packages', 'core', 'dist', 'manifest.json');
  if (!existsSync(path)) {
    console.error('✖ manifest.json introuvable : lancer « npm run build » ou passer --manifest=<chemin>');
    process.exit(2);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

if (cmd === 'check') {
  const manifest = loadManifest();
  const { files, issues } = checkPaths(positional.length ? positional : ['.'], manifest);
  const errors = issues.filter((i) => i.level === 'error').length;
  if (format === 'json') {
    console.log(JSON.stringify({ files, errors, warnings: issues.length - errors, issues }, null, 2));
  } else {
    for (const i of issues) {
      console.log(`${i.level === 'error' ? '✖' : '⚠'} ${i.file}:${i.line}  [${i.rule}] ${i.message}${i.fix ? `\n    → ${i.fix}` : ''}`);
    }
    console.log(`\n${files} fichier(s) analysé(s) — ${errors} erreur(s), ${issues.length - errors} avertissement(s)`);
  }
  process.exit(errors ? 1 : 0);
} else if (cmd === 'audit') {
  const report = runAudit(repoRoot);
  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    let cat = '';
    for (const r of report.results) {
      if (r.category !== cat) { cat = r.category; console.log(`\n■ ${cat.toUpperCase()}`); }
      console.log(`  ${r.status === 'pass' ? '✔' : '✖'} ${r.detail}`);
    }
    console.log(`\nAudit NoraIvoire : ${report.passed}/${report.total} contrôles réussis, ${report.failed} échec(s).`);
  }
  process.exit(report.failed ? 1 : 0);
} else {
  console.log('Usage :\n  nora check <chemins…> [--format=json|text] [--manifest=<chemin>]\n  nora audit [--format=json|text]');
  process.exit(cmd ? 1 : 0);
}
