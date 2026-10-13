# NoraIvoire — Rapport d'audit

**Version auditée :** 0.1.0 · **Date :** 14 octobre 2026 · **Périmètre :** dépôt complet
**Méthode :** audit automatisé (`nora audit`, 67 contrôles), 91 tests node et 11 tests Flutter, vérification TypeScript stricte, `npm audit`, revue manuelle du code.
© Jonathan KABLAN — Document confidentiel

## 1. Synthèse

| Domaine | Résultat | Commentaire |
|---|---|---|
| Licence et confidentialité | ✅ Conforme | LICENSE propriétaire, 5 `package.json` privés `UNLICENSED`, en-tête sur les 8 fichiers générés |
| Chaîne d'approvisionnement | ✅ Conforme | 0 dépendance runtime ; 1 dépendance de dev (jsdom, MIT) ; `npm audit` : 0 vulnérabilité |
| Sécurité du compilateur | ✅ Conforme | Liste blanche stricte ; 7 tests d'attaque (injection, pollution de prototype, DoS, symlink) |
| Sécurité du moteur web | ✅ Conforme | 11 motifs dangereux absents ; écriture limitée aux variables `--fx-*` |
| Sécurité du CSS généré | ✅ Conforme | Aucun `@import`, `url()` externe, `javascript:`, `expression()`, `!important` |
| Accessibilité | ✅ Conforme (base) | Mouvement réduit sur 4 cibles, focus visible, zone tactile 44 px sur 3 cibles |
| Performance | ✅ Sous budget | CSS 3,2 Kio gzip (budget 15) ; moteur 3,0 Kio gzip (budget 4) |
| Déterminisme | ✅ Conforme | Deux compilations : octets identiques |
| Portabilité native | ✅ Conforme | TSX vérifié (TypeScript strict, RN 0.81) ; Dart analysé (`flutter analyze --fatal-infos`, 0 problème) et rendu par 8 tests de widgets dont 6 goldens (Flutter 3.47) |

**Verdict : apte pour un usage interne et une phase pilote.** Trois points doivent être levés avant toute licence commerciale (section 4).

## 2. Résultats chiffrés

| Indicateur | Valeur |
|---|---|
| Tests | 91 / 91 réussis (node) · 11 / 11 (Flutter, dont 6 goldens) |
| Contrôles d'audit | 67 / 67 réussis |
| Modèles validés par `nora check` | 13 fichiers, 0 erreur, 0 avertissement |
| Erreurs TypeScript (strict) sur le TSX généré | 0 |
| Vulnérabilités `npm audit` | 0 |

| Fichier distribué | Taille | gzip |
|---|---|---|
| `noraivoire.css` | 13,4 Kio | 3,4 Kio |
| `noraivoire.min.css` | 11,5 Kio | 3,2 Kio |
| `noraivoire.engine.js` | 8,8 Kio | 3,0 Kio |
| `noraivoire.auto.js` | 0,5 Kio | 0,4 Kio |
| `flutter/noraivoire.dart` | 15,6 Kio | 4,2 Kio |
| `react-native/noraivoire.tsx` | 12,9 Kio | 3,9 Kio |
| `fx/fx-scroll.js` (optionnel) | 3,6 Kio | 1,3 Kio (budget 2) |
| `fx/fx-text.js` (optionnel) | 3,8 Kio | 1,6 Kio (budget 2) |

## 3. Constats

| ID | Sévérité | Constat | Statut |
|---|---|---|---|
| A-01 | Moyenne | Le Dart généré n'avait pas été compilé (SDK Flutter inaccessible dans l'environnement d'audit). | **Levé** — `examples/flutter_app/` : `flutter analyze --fatal-infos --fatal-warnings` sans aucun problème (Flutter 3.47.5) après correction du générateur (`unnecessary_null_comparison` sur la bordure de `NoraBadge`) ; 8 tests de widgets dont 6 goldens (`NoraBtn` 5 tons × 3 tailles, `NoraCard(glass: true)`, `NoraBadge`, clair et sombre), sémantique et zone tactile vérifiées ; job CI `flutter` |
| A-02 | Moyenne | Les composants Twig et JSP acceptaient `href="javascript:…"` si l'URL venait de l'utilisateur. | **Corrigé** — liste blanche des schémas d'URL, `type` du bouton restreint |
| A-03 | Faible | `nora check` reposait sur des expressions régulières, pas sur un parseur complet : des cas exotiques (JSX très imbriqué, attributs multi-lignes complexes) pouvaient échapper à l'analyse. | **Corrigé** — tokenizer tolérant écrit à la main (`tokenize.js`), temps linéaire, 19 tests de cas limites dont des entrées pathologiques |
| A-04 | Faible | Si un effet personnalisé lève une exception **après** avoir modifié l'élément, ces modifications ne sont pas annulées (l'erreur est isolée, les autres effets continuent). | Ouvert — documenté |
| A-05 | Faible | `tilt` sur iOS ne peut pas utiliser le gyroscope sans demande de permission explicite : repli sur le toucher. | Accepté — limite de la plateforme |
| A-06 | Faible | Pas de CSS de secours pour les navigateurs sans `@layer` (antérieurs à 2022). | Ouvert |
| A-07 | Info | Un token de composant (`--btn-bg`) défini sur un parent n'est pas hérité. | Documenté (TECHNICAL §4.2) |
| A-08 | Info | `reveal` sur Flutter et React Native se déclenche au montage, pas au scroll, faute de dépendance de visibilité. | Documenté ; paramètre `visible` fourni |
| A-09 | Info | Le modèle HTML a été nettoyé de tout JS inline pour rester compatible avec une CSP stricte. | Corrigé |
| A-10 | Info | Le moteur web pèse 3,0 Kio gzip, au-dessus de l'objectif initial de 2 Kio annoncé dans la vision. | Accepté — budget fixé à 4 Kio ; minification réelle possible plus tard |

## 4. Conditions avant commercialisation

1. ~~Lever **A-01**~~ : fait (`examples/flutter_app/`, analyse et goldens). Reste à exécuter le job CI `flutter` sur Linux et à ajuster la tolérance si besoin.
2. Ajouter la **régression visuelle** web (Playwright) et un test **axe-core** sur la page de démo.
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
