// NoraIvoire — assemble l'application JSP d'exemple (WAR éclaté) dans examples/jsp-app/build/ROOT/.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Copie (et n'édite jamais) :
//   examples/jsp-app/web/                → build/ROOT/            (web.xml, pages de démo et d'essai)
//   templates/jsp/page.jsp               → build/ROOT/page.jsp
//   templates/jsp/WEB-INF/tags/nora/     → build/ROOT/WEB-INF/tags/nora/
//   packages/core/dist/ (CSS, moteur)    → build/ROOT/noraivoire/
// Tomcat ne fournit pas la JSTL utilisée par les modèles (jakarta.tags.core) : ses deux jars sont
// téléchargés depuis Maven Central, vérifiés par SHA-256, mis en cache hors du dépôt versionné
// (examples/jsp-app/.cache/, ignoré) et copiés dans WEB-INF/lib. Outil de test, jamais distribué.

import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(app, '..', '..');
export const WEBAPP = join(app, 'build', 'ROOT');
const CACHE = join(app, '.cache');

/** JSTL 3.0 (Jakarta EE 10+) : API + implémentation de référence, EPL-2.0 OU GPL-2.0 avec Classpath Exception. */
export const JSTL_JARS = Object.freeze([
  {
    file: 'jakarta.servlet.jsp.jstl-api-3.0.2.jar',
    url: 'https://repo1.maven.org/maven2/jakarta/servlet/jsp/jstl/jakarta.servlet.jsp.jstl-api/3.0.2/jakarta.servlet.jsp.jstl-api-3.0.2.jar',
    sha256: 'd55951aefedb543cb16193a873b92d22c40c3b8ba26cfa7ed9229eb118bb9c9b',
  },
  {
    file: 'jakarta.servlet.jsp.jstl-3.0.1.jar',
    url: 'https://repo1.maven.org/maven2/org/glassfish/web/jakarta.servlet.jsp.jstl/3.0.1/jakarta.servlet.jsp.jstl-3.0.1.jar',
    sha256: '5cc6e60b9e74d38c25fe4f2d22dfd40577f5b8396bc885f7061cd2c525a43b86',
  },
]);

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function fetchJar({ file, url, sha256: expected }) {
  const target = join(CACHE, file);
  if (existsSync(target) && sha256(readFileSync(target)) === expected) return target;
  const res = await fetch(url, { redirect: 'error' });
  if (!res.ok) throw new Error(`jsp:sync — téléchargement refusé (${res.status}) : ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const got = sha256(buf);
  if (got !== expected) throw new Error(`jsp:sync — somme SHA-256 inattendue pour ${file} : ${got}`);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(target, buf);
  return target;
}

export async function sync() {
  const dist = join(root, 'packages', 'core', 'dist');
  for (const f of ['noraivoire.css', 'noraivoire.auto.js', 'noraivoire.engine.js']) {
    if (!existsSync(join(dist, f))) throw new Error(`jsp:sync — ${f} absent (lancez d'abord npm run build)`);
  }
  rmSync(WEBAPP, { recursive: true, force: true });
  cpSync(join(app, 'web'), WEBAPP, { recursive: true });
  copyFileSync(join(root, 'templates', 'jsp', 'page.jsp'), join(WEBAPP, 'page.jsp'));
  cpSync(join(root, 'templates', 'jsp', 'WEB-INF', 'tags'), join(WEBAPP, 'WEB-INF', 'tags'), { recursive: true });
  mkdirSync(join(WEBAPP, 'noraivoire'), { recursive: true });
  for (const f of ['noraivoire.css', 'noraivoire.auto.js', 'noraivoire.engine.js']) copyFileSync(join(dist, f), join(WEBAPP, 'noraivoire', f));
  mkdirSync(join(WEBAPP, 'WEB-INF', 'lib'), { recursive: true });
  for (const jar of JSTL_JARS) copyFileSync(await fetchJar(jar), join(WEBAPP, 'WEB-INF', 'lib', jar.file));
  return WEBAPP;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sync().then((dir) => console.log(`jsp:sync — application assemblée dans ${dir}`), (err) => { console.error(err.message); process.exit(1); });
}
