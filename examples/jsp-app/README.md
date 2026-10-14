# NoraIvoire — application JSP d'exemple

© 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

Application web minimale (WAR éclaté, sans Maven ni Gradle) qui exécute réellement les modèles JSP livrés dans `templates/jsp/` sous Tomcat 10.1+ (Jakarta EE).

```bash
npm run build
npm run jsp:sync     # assemble examples/jsp-app/build/ROOT/ (non versionné)
npm run test:jsp     # démarre Tomcat, vérifie le rendu réel, arrête Tomcat
npm run jsp:serve    # garde Tomcat lancé pour essayer la page (Ctrl+C pour arrêter)
```

## Contenu

| Chemin | Rôle |
|---|---|
| `web/WEB-INF/web.xml` | Descripteur Jakarta EE (encodage UTF-8) |
| `web/orders.jsp` | Données de démonstration (dont un identifiant et une référence hostiles), puis renvoi vers `page.jsp` |
| `web/hostile.jsp` | Rend `<nora:btn>` avec `tone`, `size`, `href`, `type` et le libellé pris dans la requête (tests d'attaque, constat A-02) |
| `tool/sync.mjs` | Copie `templates/jsp/page.jsp`, `templates/jsp/WEB-INF/tags/`, la CSS et le moteur de `packages/core/dist/`, et la JSTL dans `build/ROOT/` |

`build/ROOT/` est une copie : la source de vérité reste `templates/jsp/` et `packages/core/dist/`.

## Prérequis

- JDK 17+ (`JAVA_HOME`) et Tomcat 10.1+ (`CATALINA_HOME`). Sans ces variables, `tests/jsp/run.mjs` cherche les installations Homebrew (`openjdk@21`, `tomcat`).
- Tomcat ne fournit pas la JSTL (`jakarta.tags.core`, `jakarta.tags.functions`) : `jsp:sync` télécharge l'API 3.0.2 et l'implémentation 3.0.1 depuis Maven Central, vérifie leur SHA-256 et les met en cache dans `.cache/` (ignoré par git). Ce sont des outils de test, jamais distribués ni versionnés (voir `THIRD_PARTY_NOTICES.md`).

## Isolation du test

Tomcat est lancé avec un `CATALINA_BASE` temporaire : un seul connecteur HTTP sur `127.0.0.1` et un port libre, aucun port d'arrêt, aucune autre application ; il est arrêté (SIGTERM, puis SIGKILL après 15 s) même si un test échoue.
