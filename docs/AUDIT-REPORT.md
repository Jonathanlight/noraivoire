# NoraIvoire — Rapport d'audit

**Version auditée :** 0.1.0 · **Date :** 14 octobre 2026 · **Périmètre :** dépôt complet
**CI GitHub :** 10 jobs réussis le 14 octobre 2026 (Node 20 et 22, Flutter, Playwright, Symfony PHP 8.4 et 8.5, JSP/Tomcat, React Native types et rendu).
**Méthode :** audit automatisé (`nora audit`, 86 contrôles), 171 tests node, 29 tests Flutter et 54 tests PHPUnit, 94 tests de rendu React Native (Jest), 14 tests JSP dans Tomcat, 35 tests Playwright (captures, axe-core, catalogue), vérification TypeScript stricte, `npm audit`, revue manuelle du code.
© Jonathan KABLAN — Document confidentiel

## 1. Synthèse

| Domaine | Résultat | Commentaire |
|---|---|---|
| Licence et confidentialité | ✅ Conforme | LICENSE propriétaire, 8 `package.json` privés `UNLICENSED` (racine + 7 paquets), bundle Symfony `proprietary`, en-tête sur les 27 fichiers générés (CSS, JS, Dart, TSX, Twig, PHP) |
| Chaîne d'approvisionnement | ✅ Conforme (runtime) · ⚠️ outillage de dev | 0 dépendance runtime (`npm audit --omit=dev` : 0 vulnérabilité) ; dépendances de dev en versions exactes (jsdom, Playwright, axe-core, Jest, React Native et Testing Library pour les tests de rendu), licences de tout l'arbre contrôlées (`npm run audit:licenses`, aucune copyleft) ; `npm audit` complet : 2 avis sans correctif dans l'outillage Jest (`braces`, `sprintf-js`, déni de service sur entrées forgées), jamais distribués ; Composer : symfony/* et twig/* (MIT, BSD-3), contrôle des licences en CI |
| Sécurité du compilateur | ✅ Conforme | Liste blanche stricte ; 8 tests d'attaque (injection, pollution de prototype, DoS, symlink, description multi-ligne dans les commentaires natifs) |
| Sécurité du moteur web | ✅ Conforme | 11 motifs dangereux absents ; écriture limitée aux variables `--fx-*` |
| Sécurité du serveur MCP | ✅ Conforme | Lecture seule (contrôle `mcp:read-only`) ; accès confiné au manifest et à `recipes/` ; tailles bornées ; spec MCP `2026-07-28` et versions à `initialize` |
| Sécurité du bundle Symfony | ✅ Conforme | Twig Components générés : listes blanches (ton, taille, type, URL, `id`), attributs verrouillés, échappement ; `nora:check` sans shell (contrôle `symfony:twig-hardening`) |
| Sécurité du CSS généré | ✅ Conforme | Aucun `@import`, `url()` externe, `javascript:`, `expression()`, `!important` |
| Accessibilité | ✅ Conforme (base) | Mouvement réduit sur 4 cibles, focus visible, zone tactile 44 px sur 3 cibles ; formulaires : label associé obligatoire (`nora check`), `aria-invalid` relié au message, sémantique Flutter / React Native vérifiée ; axe-core : 0 violation sérieuse ou critique (clair et sombre) ; contraste AA testé pour chaque ton |
| Performance | ✅ Sous budget | CSS 5,0 Kio gzip (budget 15) ; moteur 3,3 Kio gzip (budget 4) |
| Déterminisme | ✅ Conforme | Deux compilations : octets identiques |
| Portabilité native | ✅ Conforme | TSX vérifié (TypeScript strict, RN 0.81) ; Dart analysé (`flutter analyze --fatal-infos`, 0 problème) et rendu par 29 tests de widgets dont 12 goldens (Flutter 3.47) ; parité mesurée CSS / Flutter / React Native : 0 écart sur 52 cas × 2 thèmes ; Twig Components rendus par 54 tests PHPUnit (PHP 8.5, Symfony 8.1) |

**Verdict : apte pour un usage interne et une phase pilote.** Trois points doivent être levés avant toute licence commerciale (section 4).

## 2. Résultats chiffrés

| Indicateur | Valeur |
|---|---|
| Tests | 171 / 171 réussis (node) · 94 / 94 (rendu React Native, Jest) · 29 / 29 (Flutter, dont 12 goldens) · 54 / 54 (PHPUnit, bundle Symfony) · 35 / 35 (Playwright : 12 captures, 4 axe-core, 2 sans JS, 2 legacy, 1 parité, 14 catalogue) · 14 / 14 (JSP dans Tomcat 11) |
| Contrôles d'audit | 86 / 86 réussis |
| Modèles validés par `nora check` | 13 fichiers + 20 recettes, 0 erreur, 0 avertissement |
| Erreurs TypeScript (strict) sur le TSX généré | 0 |
| Vulnérabilités `npm audit` | 0 |

| Fichier distribué | Taille | gzip |
|---|---|---|
| `noraivoire.css` | 28,8 Kio | 5,3 Kio |
| `noraivoire.min.css` | 25,3 Kio | 5,0 Kio |
| `noraivoire.legacy.min.css` | 25,0 Kio | 4,9 Kio |
| `noraivoire.engine.js` | 9,5 Kio | 3,3 Kio |
| `noraivoire.auto.js` | 0,5 Kio | 0,4 Kio |
| `flutter/noraivoire.dart` | 43,9 Kio | 7,9 Kio |
| `react-native/noraivoire.tsx` | 37,1 Kio | 7,5 Kio |
| `fx/fx-scroll.js` (optionnel) | 3,6 Kio | 1,3 Kio (budget 2) |
| `fx/fx-text.js` (optionnel) | 3,8 Kio | 1,6 Kio (budget 2) |

## 3. Constats

| ID | Sévérité | Constat | Statut |
|---|---|---|---|
| A-01 | Moyenne | Le Dart généré n'avait pas été compilé (SDK Flutter inaccessible dans l'environnement d'audit). | **Levé** — `examples/flutter_app/` : `flutter analyze --fatal-infos --fatal-warnings` sans aucun problème (Flutter 3.47.5) après correction du générateur (`unnecessary_null_comparison` sur la bordure de `NoraBadge`) ; 8 tests de widgets dont 6 goldens (`NoraBtn` 5 tons × 3 tailles, `NoraCard(glass: true)`, `NoraBadge`, clair et sombre), sémantique et zone tactile vérifiées ; job CI `flutter` |
| A-02 | Moyenne | Les composants Twig et JSP acceptaient `href="javascript:…"` si l'URL venait de l'utilisateur. | **Corrigé** — liste blanche des schémas d'URL, `type` du bouton restreint |
| A-03 | Faible | `nora check` reposait sur des expressions régulières, pas sur un parseur complet : des cas exotiques (JSX très imbriqué, attributs multi-lignes complexes) pouvaient échapper à l'analyse. | **Corrigé** — tokenizer tolérant écrit à la main (`tokenize.js`), temps linéaire, 19 tests de cas limites dont des entrées pathologiques |
| A-04 | Faible | Si un effet personnalisé lève une exception **après** avoir modifié l'élément, ces modifications n'étaient pas annulées (l'erreur est isolée, les autres effets continuent). | **Corrigé** — relevé des variables `--fx-*` et attributs `data-fx-*` avant le montage, restauration si `mount()` lève ; test jsdom |
| A-05 | Faible | `tilt` sur iOS ne peut pas utiliser le gyroscope sans demande de permission explicite : repli sur le toucher. | Accepté — limite de la plateforme |
| A-06 | Faible | Pas de CSS de secours pour les navigateurs sans `@layer` (antérieurs à 2022). | **Corrigé** — `noraivoire.legacy.min.css` généré (blocs `@layer` déroulés dans l'ordre) ; rendu identique au pixel vérifié par Playwright |
| A-07 | Info | Un token de composant (`--btn-bg`) défini sur un parent n'est pas hérité. | Documenté (TECHNICAL §4.2) |
| A-08 | Info | `reveal` sur Flutter et React Native se déclenche au montage, pas au scroll, faute de dépendance de visibilité. | Documenté ; paramètre `visible` fourni |
| A-09 | Info | Le modèle HTML a été nettoyé de tout JS inline pour rester compatible avec une CSP stricte. | Corrigé |
| A-10 | Info | Le moteur web pèse 3,0 Kio gzip, au-dessus de l'objectif initial de 2 Kio annoncé dans la vision. | Accepté — budget fixé à 4 Kio ; minification réelle possible plus tard |
| A-11 | Moyenne | Une description de spec sur plusieurs lignes pouvait sortir d'un commentaire `///` et injecter du code Dart (et `*/` fermer un commentaire TSX). | **Corrigé** — `docComment()` partagé par toutes les cibles natives ; test d'injection |
| A-12 | Faible | Twig Components des contrôles de formulaire génériques ; `Nora:Field` relie libellé, aide et erreur, mais `aria-describedby` / `aria-invalid` restent à poser sur le contrôle. | **Corrigé** — `Nora:Field` expose `control` (étalement `{{ ...control }}`) et `controlHtml` (input brut) : `id`, `aria-describedby`, `aria-invalid` transmis sans pose manuelle ; 2 tests PHPUnit |
| A-13 | Faible | Rendu statique Flutter (mouvement réduit) des cases, radios et interrupteurs à tailles fixes (18, 20, 52 × 32 px), différentes des proportions de la spec rendues par CSS et React Native. | **Corrigé** — générateur aligné sur la spec (1,25 em ; 2,25 em × 1,25 em) ; détecté par la parité mesurée (`tests/unit/parity.test.js`) |
| A-14 | Moyenne | Le tag JSP `<nora:btn>` acceptait `href="/\hôte"`, que les navigateurs lisent comme l'URL relative au protocole `//hôte` (redirection ouverte, lien vers un domaine tiers) ; `type="reset"` était ramené à `button`, contrairement aux Twig Components. | **Corrigé** — refus de `/\` aligné sur `URL_DENIED_PREFIXES` de `targets/symfony.js`, `type` aligné sur `BUTTON_TYPES` ; révélé par l'exécution réelle dans Tomcat (`npm run test:jsp`), figé sans Java par `tests/unit/jsp-template.test.js` |
| A-15 | Faible | React Native : la coche `✓` d'une case cochée était lue par les lecteurs d'écran (nom « ✓ J'accepte ») ; `NoraTilt` s'abonnait au capteur d'orientation avant de connaître la préférence de mouvement réduit (lecture asynchrone, `false` par défaut) ; le modèle utilisait `SafeAreaView` du cœur, déprécié. | **Corrigé** — coche masquée (`importantForAccessibility="no"`, `accessibilityElementsHidden`) et nom explicite des cases, interrupteurs et radios ; `useMotionPreference()` (vrai / faux / inconnu) : capteur seulement une fois le mouvement confirmé autorisé ; modèle sur `View`, `SafeAreaView` de react-native-safe-area-context recommandé ; détectés par les tests de rendu (`tests/rn/`) |

## 4. Conditions avant commercialisation

1. ~~Lever **A-01**~~ : fait (`examples/flutter_app/`, analyse et goldens). Job CI `flutter` exécuté sur GitHub (Linux, Flutter 3.47.7) avec des goldens de référence propres à Linux (exécution 38489740274 : les 10 jobs du CI réussis).
2. ~~Ajouter la **régression visuelle** web et un test **axe-core**~~ : fait (`tests/visual/`, 12 captures, axe-core sans violation sérieuse ni critique, rendu sans JS vérifié). axe a révélé un contraste insuffisant du ton `primary` en clair (`#E8590C` sur blanc : 3,58:1) : corrigé dans la spec (`#C94A0B`, 4,70:1) et verrouillé par `tests/unit/contrast.test.js`.
3. Faire relire **LICENSE** et rédiger le **contrat de licence** par un avocat ; déposer la marque.

## 5. Reproduire l'audit

```bash
npm ci --ignore-scripts
npm run verify
npm audit --audit-level=moderate
node packages/cli/src/cli.js audit --format=json > audit.json
```

## 6. Limites de cet audit

Audit réalisé par analyse statique, tests automatisés et revue par l'auteur de l'outillage. Il ne remplace pas un test d'intrusion indépendant, ni des tests sur appareils réels, ni un audit d'accessibilité manuel (lecteurs d'écran).
