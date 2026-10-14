// NoraIvoire — préparation des paquets npm publiés (build/npm/), sans toucher aux sources.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Les package.json du dépôt restent "private": true (aucune publication accidentelle depuis les sources).
// Ce script assemble une copie publiable de chaque paquet : fichiers retenus, "private" retiré,
// dépendances internes à version exacte, LICENSE et README. Les archives .tgz sont produites par `npm pack`.
// Usage : npm run release:pack            (assemble + npm pack)
//         npm run release:check           (assemble, pack, installe dans un projet vierge et vérifie)
//         npm run release:publish -- --otp=123456   (publie ; demande une confirmation explicite)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..', '..');
export const OUT = join(ROOT, 'build', 'npm');
const SCOPE = '@jonathankablan/noraivoire-';
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

/** Paquets publiés : dossier source, fichiers retenus (relatifs au paquet) et dépendances internes. */
export const PACKAGES = Object.freeze([
  { dir: 'core', files: ['dist'], deps: [], keywords: ['css', 'design-system', 'flutter', 'react-native', 'tokens'] },
  { dir: 'cli', files: ['src/cli.js', 'src/check.js', 'src/tokenize.js'], deps: ['core'], keywords: ['lint', 'accessibility', 'templates'] },
  { dir: 'mcp', files: ['src', 'README.md'], extra: [['recipes', 'recipes']], deps: ['cli', 'core'], keywords: ['mcp', 'model-context-protocol', 'ai'] },
  { dir: 'fx-scroll', files: ['src'], deps: [], keywords: ['scroll', 'parallax', 'effects'] },
  { dir: 'fx-text', files: ['src'], deps: [], keywords: ['text', 'animation', 'effects'] },
]);

const LICENCE_NOTE = 'Logiciel propriétaire © 2026 Jonathan KABLAN, tous droits réservés (voir LICENSE). La mise à disposition sur npm ne vaut pas concession de licence : tout usage est subordonné à un contrat de licence écrit.';

const READMES = {
  core: (v) => `# ${SCOPE}core

Sorties compilées de **NoraIvoire** ${v}, langage de design multi-plateforme : une même spec produit la CSS, le moteur d'effets web, les widgets Flutter, les composants React Native, les types TypeScript, le manifest machine et \`llms-full.txt\` pour les agents IA. Zéro dépendance.

\`\`\`bash
npm install ${SCOPE}core
\`\`\`

\`\`\`html
<link rel="stylesheet" href="node_modules/${SCOPE}core/dist/noraivoire.css">
<script type="module" src="node_modules/${SCOPE}core/dist/noraivoire.auto.js"></script>

<button class="btn" data-tone="primary" data-size="md">Valider</button>
<div class="card" data-fx="tilt">…</div>
\`\`\`

| Import | Fichier |
|---|---|
| \`${SCOPE}core\` ou \`/css\` | \`dist/noraivoire.css\` (\`/min.css\`, \`/legacy.min.css\` sans \`@layer\`) |
| \`${SCOPE}core/engine\` | moteur d'effets (\`defineEffect\`, \`start\`, \`attach\`…), types inclus |
| \`${SCOPE}core/auto\` | démarrage automatique du moteur |
| \`${SCOPE}core/native\`, \`/native-fx\` | composants React Native (TSX) |
| \`${SCOPE}core/flutter/noraivoire.dart\` | widgets Flutter (copier dans \`lib/\`) |
| \`${SCOPE}core/fx/*\` | paquets d'effets optionnels compilés (\`fx-scroll\`, \`fx-text\`) |
| \`${SCOPE}core/manifest.json\`, \`/llms-full.txt\` | contrat machine et contrat pour agents IA |

Validation des templates : \`${SCOPE}cli\` (\`npx nora check src\`). Serveur MCP : \`${SCOPE}mcp\`.

${LICENCE_NOTE}
`,
  cli: (v) => `# ${SCOPE}cli

\`nora check\` ${v} : valide les templates (HTML, Twig, JSP, JSX/TSX, Vue, Angular, Svelte, Astro) contre le contrat NoraIvoire — classes, variantes, effets, accessibilité (libellés, \`alt\`, \`aria-current\`, rôles…) — et propose une correction pour chaque problème. 20 règles, zéro dépendance hors \`${SCOPE}core\`.

\`\`\`bash
npm install --save-dev ${SCOPE}cli
npx nora check src templates --format=text   # ou --format=json ; code de sortie 1 en cas d'erreur
\`\`\`

\`\`\`text
✖ src/page.html:12  [foreign-class] « btn-primary » : classe Bootstrap, inexistant dans NoraIvoire
    → class="btn" data-tone="primary"
\`\`\`

API : \`import { checkSource } from '${SCOPE}cli/check'\`. Option \`--manifest=<chemin>\` pour un autre manifest.

${LICENCE_NOTE}
`,
  'fx-scroll': (v) => `# ${SCOPE}fx-scroll

Effets de défilement optionnels de NoraIvoire ${v} : \`pin\`, \`scrub\`, \`parallax\`. Chargés à la demande, aucun effet de bord à l'import, ≤ 2 Kio gzip, mouvement réduit respecté.

\`\`\`html
<link rel="stylesheet" href="node_modules/${SCOPE}core/dist/fx/fx-scroll.css">
<script type="module">
  import * as moteur from '${SCOPE}core/engine';
  import { install } from '${SCOPE}fx-scroll';
  install(moteur);
  moteur.start();
</script>
<img data-fx="parallax" data-fx-parallax="speed:30" src="…" alt="…">
\`\`\`

${LICENCE_NOTE}
`,
  'fx-text': (v) => `# ${SCOPE}fx-text

Effets de texte optionnels de NoraIvoire ${v} : \`split\`, \`scramble\`. Chargés à la demande, texte complet lu une seule fois par les lecteurs d'écran, DOM restauré au démontage, mouvement réduit respecté.

\`\`\`html
<link rel="stylesheet" href="node_modules/${SCOPE}core/dist/fx/fx-text.css">
<script type="module">
  import * as moteur from '${SCOPE}core/engine';
  import { install } from '${SCOPE}fx-text';
  install(moteur);
  moteur.start();
</script>
<h1 data-fx="split" data-fx-split="words:true;stagger:60">Bonjour Abidjan</h1>
\`\`\`

${LICENCE_NOTE}
`,
};

/** package.json publiable dérivé du package.json source. */
export function publishManifest(src, pkg, version) {
  const out = { ...src, name: `${SCOPE}${pkg.dir}`, version };
  delete out.private;
  delete out.devDependencies;
  out.license = 'UNLICENSED';
  out.author = 'Jonathan KABLAN';
  out.keywords = ['noraivoire', ...pkg.keywords];
  out.files = [...new Set([...pkg.files, ...(pkg.extra ?? []).map(([, to]) => to), 'LICENSE', 'README.md'])];
  out.dependencies = Object.fromEntries(pkg.deps.map((d) => [`${SCOPE}${d}`, version]));
  out.publishConfig = { access: 'public', registry: 'https://registry.npmjs.org/' };
  out.engines = { node: '>=20', ...(src.engines ?? {}) };
  return out;
}

/** Assemble build/npm/<paquet>/ pour chaque paquet publié. */
export function assemble(out = OUT) {
  const version = read('package.json').version;
  rmSync(out, { recursive: true, force: true });
  const dirs = [];
  for (const pkg of PACKAGES) {
    const srcDir = join(ROOT, 'packages', pkg.dir);
    const dest = join(out, pkg.dir);
    mkdirSync(dest, { recursive: true });
    for (const f of pkg.files) {
      const from = join(srcDir, f);
      if (!existsSync(from)) throw new Error(`${pkg.dir} : ${f} introuvable (lancer npm run build ?)`);
      cpSync(from, join(dest, f), { recursive: true });
    }
    for (const [from, to] of pkg.extra ?? []) cpSync(join(ROOT, from), join(dest, to), { recursive: true });
    const src = JSON.parse(readFileSync(join(srcDir, 'package.json'), 'utf8'));
    if (src.version !== version) throw new Error(`${pkg.dir} : version ${src.version} ≠ ${version}`);
    writeFileSync(join(dest, 'package.json'), `${JSON.stringify(publishManifest(src, pkg, version), null, 2)}\n`);
    cpSync(join(ROOT, 'LICENSE'), join(dest, 'LICENSE'));
    if (READMES[pkg.dir]) writeFileSync(join(dest, 'README.md'), READMES[pkg.dir](version));
    else if (!existsSync(join(dest, 'README.md'))) throw new Error(`${pkg.dir} : README manquant`);
    else writeFileSync(join(dest, 'README.md'), `${readFileSync(join(dest, 'README.md'), 'utf8').trimEnd()}\n\n${LICENCE_NOTE}\n`);
    dirs.push(dest);
  }
  return { version, dirs };
}

/** Lance `npm pack` sur chaque paquet assemblé ; renvoie les chemins des archives. */
export function pack(out = OUT) {
  const tgz = [];
  for (const pkg of PACKAGES) {
    const res = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', out], { cwd: join(out, pkg.dir), encoding: 'utf8' }));
    tgz.push(join(out, res[0].filename));
  }
  return tgz;
}

export const listFiles = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath ?? e.path, e.name).slice(dir.length + 1)).sort();

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { version, dirs } = assemble();
  const tgz = pack();
  console.log(`Paquets NoraIvoire ${version} assemblés (${dirs.length}) :`);
  for (const t of tgz) console.log(`  ${t}`);
}
