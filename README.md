# Garago

Plateforme de prise de rendez-vous pour les garages automobiles au Canada (garagopro.ca).

- **Conducteurs** : recherche de garages (position, marque et modèle du véhicule, service), fiche du garage
  avec avis, réservation en ligne avec ou sans compte, confirmation par courriel, annulation.
- **Garages** : tableau de bord (agenda par portes, carnet de clients, services et durées, horaires, blocages,
  marques acceptées, statistiques, abonnement Stripe, succursales), rendez-vous saisis au téléphone avec
  confirmation par texto ou courriel.
- **Admin** : vérification des garages (NEQ), réclamations de fiches, modération des descriptions et des avis.

## Technologies

| Couche | Outil |
|---|---|
| Application | Next.js 16 (App Router), React 19, TypeScript 5 — **lire `AGENTS.md`** : cette version de Next.js diffère des versions connues |
| Style | Tailwind CSS 4 |
| Base de données | PostgreSQL (Neon), Prisma 7 avec l'adaptateur `@prisma/adapter-pg` ; client généré dans `src/generated/prisma` |
| Authentification | NextAuth 4 (sessions JWT de 14 jours, identifiants ou Google) |
| Paiement | Stripe (abonnement, garages supplémentaires) |
| Courriels / textos | Resend / Twilio |
| Fichiers | Vercel Blob |
| Hébergement | Vercel (déploiement automatique de `main`) ; tâches planifiées Vercel Cron + GitHub Actions |

## Prérequis

- Node.js 22 ou plus, npm.
- Une base PostgreSQL **de test** (branche Neon). Ne jamais utiliser la base de production en local :
  le code la refuse (`src/lib/db-guard.ts`).

## Installation

```bash
npm ci
cp .env.example .env.local      # puis remplir les valeurs (base de TEST)
npx prisma generate
```

Variables principales (voir `.env.example` pour la liste complète et les explications) :
`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_*`, `CRON_SECRET`.
Sans `RESEND_API_KEY` ni clés Twilio, aucun courriel ni texto ne part (les codes de vérification s'affichent dans la console).

## Lancer en local

| Commande | Usage |
|---|---|
| `npm run dev` | Serveur de développement (port 3000), base de `.env.local` |
| `node scripts/dev-apercu.mjs` | **Site démo** (port 3200) sur la base de test de `.env.apercu.local`, courriels et textos coupés. C'est là que tout changement se vérifie avant la mise en ligne |
| `npx tsx scripts/comptes-test-apercu.ts` | Remplit la base de test (garages, conducteur, admin) et génère leurs mots de passe |

## Commandes

| Commande | Rôle |
|---|---|
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests unitaires et de sécurité (sans base de données) |
| `npm run test:integration` | Tests de double réservation contre le site démo (il doit tourner) |
| `npm run lint` | ESLint |
| `npm run build` | Build de production (exécute aussi `prisma db push` : réservé à Vercel) |
| `npm run db:studio` | Prisma Studio sur la base de `.env.local` |

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — organisation du code, flux principaux.
- [DATABASE.md](DATABASE.md) — modèle de données, règles, multi-garage.
- [DEVELOPMENT.md](DEVELOPMENT.md) — conventions, procédure de changement et de mise en ligne.
- [SECURITE.md](SECURITE.md) — contrôles de sécurité et vérifications avant mise en ligne.
- [docs/adr/](docs/adr/) — décisions d'architecture.
