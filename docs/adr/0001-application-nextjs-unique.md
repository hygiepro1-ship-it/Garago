# 0001 — Une seule application Next.js (pages et API)

Date : 2026-11-27 · Statut : en vigueur (décision constatée)

## Contexte
Garago est développé et maintenu par une très petite équipe ; le site public doit être bien référencé.

## Décision
Pages, tableaux de bord et API dans un seul projet Next.js (App Router), déployé sur Vercel. Les routes
`src/app/api/**/route.ts` forment le backend ; la logique métier réutilisable vit dans `src/lib`.

## Conséquences
- Un seul déploiement, un seul dépôt, rendu serveur pour le référencement.
- La logique métier ne doit pas rester dans les routes ni dans les pages : la placer dans `src/lib` pour pouvoir
  la tester sans serveur.
