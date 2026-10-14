// NoraIvoire — démarrage d'un Tomcat isolé pour examples/jsp-app (tests JSP et galerie du README).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// CATALINA_BASE temporaire : un connecteur HTTP sur 127.0.0.1 et un port libre, aucun port d'arrêt,
// aucune autre application. Prérequis : JDK 17+ et Tomcat 10.1+ (JAVA_HOME / CATALINA_HOME, sinon Homebrew).

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { WEBAPP } from './sync.mjs';

const firstExisting = (...paths) => paths.find((p) => p && existsSync(p));
export const CATALINA_HOME = firstExisting(process.env.CATALINA_HOME, '/opt/homebrew/opt/tomcat/libexec', '/usr/local/opt/tomcat/libexec');
export const JAVA_HOME = firstExisting(process.env.JAVA_HOME, '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
  '/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home');

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  });
}

function makeBase(port) {
  const base = mkdtempSync(join(tmpdir(), 'nora-tomcat-'));
  for (const d of ['conf', 'logs', 'temp', 'work']) mkdirSync(join(base, d));
  copyFileSync(join(CATALINA_HOME, 'conf', 'web.xml'), join(base, 'conf', 'web.xml'));
  writeFileSync(join(base, 'conf', 'server.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<Server port="-1" shutdown="SHUTDOWN">
  <Service name="Catalina">
    <Connector address="127.0.0.1" port="${port}" protocol="HTTP/1.1" connectionTimeout="20000" />
    <Engine name="Catalina" defaultHost="localhost">
      <Host name="localhost" appBase="${dirname(WEBAPP)}" unpackWARs="false" autoDeploy="false" deployOnStartup="true" />
    </Engine>
  </Service>
</Server>
`);
  return base;
}

/**
 * Démarre Tomcat (application déjà assemblée par sync()) et attend que `readyPath` réponde.
 * @returns {Promise<{ origin: string, output: () => string, stop: () => Promise<void> }>}
 */
export async function startTomcat({ readyPath = '/orders.jsp', timeout = 60_000 } = {}) {
  if (!CATALINA_HOME) throw new Error('Tomcat introuvable : définir CATALINA_HOME (Tomcat 10.1+, Jakarta EE)');
  if (!JAVA_HOME) throw new Error('JDK introuvable : définir JAVA_HOME (JDK 17+)');
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const base = makeBase(port);
  let output = '';
  const tomcat = spawn(join(CATALINA_HOME, 'bin', 'catalina.sh'), ['run'], {
    env: { ...process.env, CATALINA_HOME, CATALINA_BASE: base, JAVA_HOME, CATALINA_PID: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const s of [tomcat.stdout, tomcat.stderr]) s.on('data', (c) => { output += c; });
  // Arrêt garanti même si le processus Node est interrompu.
  process.once('exit', () => { if (tomcat.exitCode === null) tomcat.kill('SIGKILL'); });

  const stop = async () => {
    if (tomcat.exitCode === null) {
      const exited = new Promise((r) => tomcat.once('exit', r));
      tomcat.kill('SIGTERM');
      const timer = setTimeout(() => tomcat.kill('SIGKILL'), 15_000);
      await exited;
      clearTimeout(timer);
    }
    rmSync(base, { recursive: true, force: true });
  };

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (tomcat.exitCode !== null) {
      await stop();
      throw new Error(`Tomcat s'est arrêté (code ${tomcat.exitCode}) :\n${output.slice(-4000)}`);
    }
    try {
      const res = await fetch(`${origin}${readyPath}`);
      await res.arrayBuffer();
      return { origin, output: () => output, stop };
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  await stop();
  throw new Error(`Tomcat n'a pas répondu à temps :\n${output.slice(-4000)}`);
}
