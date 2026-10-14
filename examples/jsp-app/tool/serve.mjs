// NoraIvoire — lance examples/jsp-app dans Tomcat pour l'essayer à la main (npm run jsp:serve).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Ctrl+C arrête Tomcat et supprime son CATALINA_BASE temporaire.
import { sync } from './sync.mjs';
import { startTomcat } from './tomcat.mjs';

await sync();
const tomcat = await startTomcat();
console.log(`Modèle JSP servi par Tomcat : ${tomcat.origin}/orders.jsp  (Ctrl+C pour arrêter)`);
const stop = async () => {
  await tomcat.stop();
  process.exit(0);
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
