// NoraIvoire — Audit automatisé : sécurité, licence, intégrité, performance, déterminisme.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../compiler/src/index.js';

export const BUDGETS = Object.freeze({
  cssGzip: 15 * 1024,
  engineGzip: 4 * 1024,
});

const ENGINE_FORBIDDEN = [
  [/\beval\s*\(/, 'eval()'],
  [/\bnew\s+Function\s*\(/, 'new Function()'],
  [/\.innerHTML\s*=/, 'innerHTML'],
  [/\.outerHTML\s*=/, 'outerHTML'],
  [/insertAdjacentHTML/, 'insertAdjacentHTML'],
  [/document\.write/, 'document.write'],
  [/setTimeout\s*\(\s*['"`]/, 'setTimeout(chaîne)'],
  [/\bfetch\s*\(/, 'fetch() (aucune requête réseau autorisée)'],
  [/XMLHttpRequest|WebSocket|sendBeacon/, 'requête réseau'],
  [/localStorage|sessionStorage|indexedDB|document\.cookie/, 'stockage / traçage'],
  [/import\s*\(\s*['"`]https?:/, 'import distant'],
];

const CSS_FORBIDDEN = [
  [/@import/i, '@import (chargement externe)'],
  [/url\(\s*['"]?https?:/i, 'url() externe'],
  [/javascript:/i, 'javascript:'],
  [/expression\s*\(/i, 'expression() (IE)'],
  [/<\/?script/i, 'balise script'],
  [/(?<![\w-])behavior\s*:/i, 'behavior: (IE)'],
];

export function runAudit(root) {
  const results = [];
  const add = (category, id, ok, detail) => results.push({ category, id, status: ok ? 'pass' : 'fail', detail });

  // 1. Licence et confidentialité
  const license = existsSync(join(root, 'LICENSE')) ? readFileSync(join(root, 'LICENSE'), 'utf8') : '';
  add('licence', 'license-file', /Tous droits réservés/.test(license) && /PROPRIÉTAIRE/.test(license), 'LICENSE propriétaire présent');
  const pkgFiles = ['package.json', ...readdirSync(join(root, 'packages')).map((p) => join('packages', p, 'package.json'))]
    .filter((f) => existsSync(join(root, f)));
  for (const f of pkgFiles) {
    const pkg = JSON.parse(readFileSync(join(root, f), 'utf8'));
    add('licence', `private:${f}`, pkg.private === true && pkg.license === 'UNLICENSED', `${f} : private=true, license=UNLICENSED`);
    const deps = Object.keys(pkg.dependencies ?? {});
    add('supply-chain', `deps:${f}`, deps.length === 0, deps.length ? `${f} : dépendances runtime ${deps.join(', ')}` : `${f} : zéro dépendance runtime`);
  }
  const npmrc = existsSync(join(root, '.npmrc')) ? readFileSync(join(root, '.npmrc'), 'utf8') : '';
  add('supply-chain', 'ignore-scripts', /ignore-scripts=true/.test(npmrc), '.npmrc : scripts d\'installation désactivés');

  // 2. Compilation : validité des specs + déterminisme
  let a;
  try {
    a = compile(join(root, 'spec'));
    add('spec', 'spec-valid', true, 'toutes les specs passent la validation stricte');
  } catch (err) {
    add('spec', 'spec-valid', false, err.message);
    return summarize(results);
  }
  const b = compile(join(root, 'spec'));
  const same = Object.keys(a.files).every((k) => a.files[k] === b.files[k]);
  add('intégrité', 'deterministic', same, 'deux compilations successives produisent des octets identiques');

  // 3. En-têtes de propriété
  for (const [name, content] of Object.entries(a.files)) {
    if (name.endsWith('.json') || name.endsWith('.txt')) continue;
    add('licence', `header:${name}`, content.slice(0, 400).includes('Jonathan KABLAN'), `${name} : en-tête de propriété`);
  }

  // 4. Sécurité du moteur JS
  const engine = a.files['noraivoire.engine.js'] + a.files['noraivoire.auto.js'];
  for (const [re, label] of ENGINE_FORBIDDEN) add('sécurité', `engine:${label}`, !re.test(engine), `moteur : absence de ${label}`);

  // 5. Sécurité du CSS
  const css = a.files['noraivoire.css'];
  for (const [re, label] of CSS_FORBIDDEN) add('sécurité', `css:${label}`, !re.test(css), `CSS : absence de ${label}`);
  add('sécurité', 'css:no-important', !/!important/.test(css), 'CSS : aucun !important (surcharge par layers)');

  // 6. Code natif généré
  const dart = a.files['flutter/noraivoire.dart'];
  const tsx = a.files['react-native/noraivoire.tsx'];
  add('supply-chain', 'dart:sdk-only', !/import 'package:(?!flutter\/)/.test(dart), 'Dart : imports limités au SDK Flutter');
  add('supply-chain', 'rn:core-only', [...tsx.matchAll(/from '([^']+)'/g)].every((m) => ['react', 'react-native'].includes(m[1])), 'TSX : imports limités à react et react-native');
  add('sécurité', 'native:no-dynamic-code', !/\beval\(|new Function|dart:mirrors/.test(dart + tsx), 'natif : pas de code dynamique');

  // 7. Accessibilité
  add('accessibilité', 'reduced-motion', /prefers-reduced-motion: reduce/.test(css) && /reducedMotion/.test(engine) && /DisableAnimations/.test(dart) && /isReduceMotionEnabled/.test(tsx),
    'prefers-reduced-motion respecté sur web, moteur, Flutter et React Native');
  add('accessibilité', 'focus-visible', /:focus-visible/.test(css), 'focus clavier visible');
  add('accessibilité', 'min-target', /min-block-size: 44px/.test(css) && /minHeight: 44/.test(dart) && /minTarget: 44/.test(tsx), 'zone tactile minimale 44 px sur les 3 cibles');

  // 8. Performance
  const cssGzip = a.integrity['noraivoire.min.css'].gzip;
  const engGzip = a.integrity['noraivoire.engine.js'].gzip;
  add('performance', 'css-budget', cssGzip <= BUDGETS.cssGzip, `CSS min+gzip ${cssGzip} o (budget ${BUDGETS.cssGzip})`);
  add('performance', 'engine-budget', engGzip <= BUDGETS.engineGzip, `moteur gzip ${engGzip} o (budget ${BUDGETS.engineGzip})`);
  add('performance', 'engine-raf', /requestAnimationFrame/.test(engine) && /passive: true/.test(engine), 'moteur : rAF + écouteurs passifs');

  // 9. Dist versionné à jour
  const dist = join(root, 'packages', 'core', 'dist');
  const stale = Object.keys(a.files).filter((k) => !existsSync(join(dist, k)) || readFileSync(join(dist, k), 'utf8') !== a.files[k]);
  add('intégrité', 'dist-up-to-date', stale.length === 0, stale.length ? `dist obsolète : ${stale.join(', ')} (lancer npm run build)` : 'dist identique à la compilation de la spec');

  return summarize(results);
}

function summarize(results) {
  const order = ['licence', 'supply-chain', 'spec', 'intégrité', 'sécurité', 'accessibilité', 'performance'];
  results.sort((x, y) => order.indexOf(x.category) - order.indexOf(y.category));
  const failed = results.filter((r) => r.status === 'fail').length;
  return { passed: results.length - failed, failed, total: results.length, results };
}
