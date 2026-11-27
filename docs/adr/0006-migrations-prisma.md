# 0006 — Migrations Prisma au lieu de `db push`

Date : 2026-11-27 · Statut : en vigueur

## Contexte
Chaque déploiement exécutait `prisma db push` : le schéma de production changeait sans historique, sans relecture
possible et sans retour arrière. Le dossier `prisma/migrations` contenait des migrations SQLite inutilisables.

## Décision
Migration de référence `0_baseline` générée depuis le schéma actuel, marquée comme appliquée en production et en
test après vérification de l'absence d'écart. Le build exécute `prisma migrate deploy`.

## Conséquences
- Chaque changement de schéma laisse un fichier SQL relu et versionné.
- Un changement de schéma se crée avec `prisma migrate dev` sur la base de test, jamais sur la production.
