# 0003 — Base de production refusée hors du site en ligne

Date : 2026-11-26 · Statut : en vigueur

## Contexte
Le fichier `.env.local` pointait vers la base de production : le serveur local, le seed et `prisma db push`
lisaient et modifiaient les données réelles des clients.

## Décision
`src/lib/db-guard.ts` refuse l'adresse de production sauf si `VERCEL_ENV=production` (site en ligne) ou
`ALLOW_PRODUCTION_DB=1` (script voulu). Branché sur le client Prisma, `prisma.config.ts` et `prisma/seed.ts`
(le seed refuse la production même depuis Vercel). Le développement et le site démo utilisent la base de test.

## Conséquences
- Un déploiement de prévisualisation Vercel dont les variables pointent vers la production échoue : c'est voulu.
- Un script de maintenance sur la production doit être lancé explicitement avec `ALLOW_PRODUCTION_DB=1`.
