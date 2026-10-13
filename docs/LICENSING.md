# NoraIvoire — Licence et protection

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

> Ce document n'est pas un avis juridique. Faire relire le fichier LICENSE et le contrat de licence par un avocat en propriété intellectuelle avant toute commercialisation.

## 1. Choix de licence

NoraIvoire n'est **pas open source**. Le dépôt utilise une licence propriétaire « tous droits réservés » (fichier `LICENSE`) :

- aucun droit concédé sans contrat écrit ;
- copie, modification, redistribution, SaaS et ingénierie inverse interdits (dans les limites de l'article L.122-6-1 du CPI) ;
- interdiction d'utiliser le code ou la spec pour entraîner un modèle d'IA destiné à des tiers ou pour concevoir un produit concurrent ;
- les fichiers **générés** pour un licencié (CSS, Dart, TSX) peuvent être intégrés à ses applications, sans être redistribués comme kit autonome ;
- droit français, tribunaux de Paris.

Côté technique : `"private": true` et `"license": "UNLICENSED"` dans chaque `package.json`, registre npm scopé privé dans `.npmrc`, en-tête de propriété dans chaque fichier généré (contrôlé par l'audit).

## 2. Modèles commerciaux possibles

| Modèle | Contenu du contrat | Adapté pour |
|---|---|---|
| Licence par projet | 1 application, mises à jour 12 mois | Agences, freelances |
| Licence entreprise | Projets illimités, une entité, support | ESN, grands comptes |
| Licence OEM | Intégration dans un produit revendu | Éditeurs |
| Usage interne seul | Vos propres applications | Vous |

Clauses à prévoir : périmètre, durée, territoire, prix, mises à jour, support, confidentialité, audit de conformité, résiliation, sort des fichiers générés après résiliation.

## 3. Protection à mettre en place

| Action | Pourquoi | Où |
|---|---|---|
| Dépôt de la marque « NoraIvoire » | Protéger le nom (classes 9 et 42) | INPI ; OAPI pour la Côte d'Ivoire et l'Afrique francophone |
| Preuve d'antériorité | Dater la création du code et de la spec | Enveloppe Soleau (INPI) ou dépôt APP |
| Dépôt privé | Confidentialité | GitHub privé, accès nominatif, 2FA obligatoire |
| Registre privé | Distribution contrôlée aux licenciés | GitHub Packages ou Verdaccio auto-hébergé |
| Accord de confidentialité | Collaborateurs et testeurs | NDA avant tout accès au dépôt |

## 4. Composants tiers

Aucun composant tiers n'est embarqué dans les fichiers distribués. Voir `THIRD_PARTY_NOTICES.md`.
