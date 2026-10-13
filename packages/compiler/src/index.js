// NoraIvoire — API du compilateur.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { readFileSync, writeFileSync, mkdirSync, realpathSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpecDir } from './load.js';
import { buildCss } from './targets/css.js';
import { buildFlutter } from './targets/flutter.js';
import { buildReactNative } from './targets/react-native.js';
import { buildManifest, buildLlms, buildWebTypes } from './targets/manifest.js';
import { header } from './header.js';
import { loadFx, buildFx } from './fx.js';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
export const VERSION = pkg.version;

const ENGINE_DIR = join(here, '..', '..', 'engine', 'src');

/** Minification sûre : commentaires non protégés et espaces superflus uniquement. */
export function minifyCss(css) {
  return css
    .replace(/\/\*(?!!)[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim() + '\n';
}

/** Retire uniquement les commentaires de ligne entière et les blocs JSDoc (le code reste intact). */
export function stripJsComments(js) {
  return js
    .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*$/gm, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\n{2,}/g, '\n');
}

function engineFiles(meta) {
  const engine = readFileSync(join(ENGINE_DIR, 'engine.js'), 'utf8');
  const auto = readFileSync(join(ENGINE_DIR, 'auto.js'), 'utf8');
  const dts = readFileSync(join(ENGINE_DIR, 'engine.d.ts'), 'utf8');
  const stamp = `${header('js', meta)}\n`;
  return {
    'noraivoire.engine.js': stamp + stripJsComments(engine),
    'noraivoire.auto.js': stamp + stripJsComments(auto),
    'noraivoire.engine.d.ts': stamp + dts,
  };
}

/** Compile une spec en mémoire. Déterministe : mêmes entrées → mêmes octets. */
export function compile(specDir, { version = VERSION } = {}) {
  const model = loadSpecDir(specDir);
  const meta = { version };
  const css = buildCss(model, meta);
  const manifest = buildManifest(model, meta);
  // Paquets d'effets optionnels : fichiers séparés, effets déclarés dans le contrat public.
  const fx = buildFx(loadFx(realpathSync(resolve(specDir)), model.effects), meta);
  Object.assign(manifest.effects, fx.manifestEffects);
  const files = {
    'noraivoire.css': css,
    'noraivoire.min.css': minifyCss(css),
    ...engineFiles(meta),
    'noraivoire.types.ts': buildWebTypes(manifest, meta),
    'flutter/noraivoire.dart': buildFlutter(model, meta),
    'react-native/noraivoire.tsx': buildReactNative(model, meta),
    'manifest.json': JSON.stringify(manifest, null, 2) + '\n',
    'llms-full.txt': buildLlms(manifest),
    ...fx.files,
  };
  const integrity = {};
  for (const [name, content] of Object.entries(files)) {
    integrity[name] = {
      sha256: createHash('sha256').update(content).digest('hex'),
      sri: `sha384-${createHash('sha384').update(content).digest('base64')}`,
      bytes: Buffer.byteLength(content),
      gzip: gzipSync(content, { level: 9 }).length,
    };
  }
  files['integrity.json'] = JSON.stringify({ name: 'NoraIvoire', version, files: integrity }, null, 2) + '\n';
  return { files, manifest, model, integrity };
}

/** Écrit la compilation dans outDir (jamais en dehors). */
export function build(specDir, outDir, opts = {}) {
  const { files, integrity } = compile(specDir, opts);
  const outAbs = resolve(outDir);
  mkdirSync(outAbs, { recursive: true });
  const outReal = realpathSync(outAbs);
  if (existsSync(resolve(specDir)) && outReal === realpathSync(resolve(specDir))) {
    throw new Error('Le dossier de sortie ne peut pas être le dossier de specs.');
  }
  for (const [name, content] of Object.entries(files)) {
    const target = resolve(outReal, name);
    const rel = relative(outReal, target);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Chemin de sortie refusé : ${name}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return integrity;
}
