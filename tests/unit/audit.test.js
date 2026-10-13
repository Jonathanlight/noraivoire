// NoraIvoire — l'audit automatisé doit passer intégralement. © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from '../../packages/cli/src/audit.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('audit complet : 0 échec', () => {
  const report = runAudit(root);
  const failures = report.results.filter((r) => r.status === 'fail').map((r) => r.detail);
  assert.deepEqual(failures, []);
  assert.ok(report.total >= 40);
});
