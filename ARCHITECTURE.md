# Architecture de Garago

Une seule application Next.js (App Router) : les pages et l'API vivent dans le même projet et sont déployées
ensemble sur Vercel. Il n'y a pas de serveur séparé : les fichiers `src/app/api/**/route.ts` sont le backend.

## Organisation des dossiers

```
src/
  app/                    Pages (FR à la racine, EN sous /en) et routes d'API
    api/
      appointments/       Réservation en ligne (POST), modification et annulation (PATCH [id]), fichier .ics
      garage/             Espace garage : agenda, rendez-vous saisis, services, horaires, clients, profil, photos…
      garages/            Public : recherche, fiche, créneaux libres, réclamation et signalement d'une fiche
      rdv/[token]/        Page publique de confirmation ou d'annulation (le jeton du courriel fait office d'accès)
      admin/              Administration (rôle ADMIN vérifié dans chaque route)
      cron/               Tâches planifiées (secret CRON_SECRET, src/lib/cron-auth.ts)
      webhooks/           Stripe (signature vérifiée), Twilio (réponses OUI/NON aux textos)
    tableau-de-bord/      Tableaux de bord garage, conducteur, admin (composants client)
    garage/[slug]/        Fiche publique d'un garage
  components/             Composants d'interface partagés (BookingWidget, GarageAgenda, cartes…)
  lib/                    Logique métier et services (voir ci-dessous)
  content/                Guides et articles (pages de contenu)
  generated/prisma/       Client Prisma généré (ne pas modifier, ne pas lire)
prisma/                   schema.prisma, seed.ts, anciennes migrations (voir DATABASE.md)
scripts/                  Scripts ponctuels (comptes de test, imports de fiches, fusion de doublons)
tests/
  unit/                   Règles métier pures (créneaux, portes, confirmation, courriels, garde-fou de base)
  security/               Contrôles de sécurité (admin, limites, données publiques, crons, JSON-LD…)
  integration/            Double réservation contre le site démo
```

## Modules de `src/lib` par responsabilité

| Domaine | Modules |
|---|---|
| Créneaux et portes | `availability.ts` (calcul pur des créneaux libres, capacité, choix de la porte, fuseau `QUEBEC_TZ`), `bays.ts` (règles de portes d'un garage), `slot-lock.ts` (verrou d'écriture par garage et par jour) |
| Confirmation des rendez-vous | `rdv-confirmation.ts` (paliers, échéances, liens), `rdv-confirmation-run.ts` (tâche toutes les 30 min), `sms-reply.ts` |
| Accès et sécurité | `auth.ts` (NextAuth), `garage-access.ts` (`ownedGarageWhere` : un garage n'accède qu'à ses données), `abuse.ts` (limites de débit, validation), `turnstile.ts`, `ics-token.ts`, `cron-auth.ts`, `db-guard.ts` |
| Données publiques | `public-garage.ts` (liste blanche des champs), `garage-profile.ts`, `garage-rating.ts` (note sur les avis visibles) |
| Notifications | `email.ts` (tous les gabarits, FR/EN selon la langue du client), `sms.ts` (Twilio, plafonds) |
| Garages et clients | `customers.ts` (carnet de clients), `services.ts`, `stripe-*.ts`, `trial-card.ts` |
| Contenu et i18n | `i18n.ts` (textes typés), `dashboard-en.ts` (anglais du tableau de bord, clé = texte français), `articles*.ts` |

## Flux principaux

**Réservation en ligne**
1. `BookingWidget` lit les créneaux : `GET /api/garages/[slug]/slots` → `computeFreeSlots` (heures d'ouverture,
   blocages, capacité, portes autorisées pour le service, heure passée).
2. `POST /api/appointments` revalide tout côté serveur, puis vérifie et crée le rendez-vous sous
   `withGarageDayLock` (aucune autre écriture ne peut prendre la place entre-temps) et choisit la porte.
3. Plan de confirmation (`planConfirmation`) selon le délai ; courriels au client (dans sa langue) et au garage.
4. La tâche `rdv-confirmations` (GitHub Actions, toutes les 30 min) envoie la demande 48 h avant, la relance,
   puis libère la place sans réponse à −12 h. Un rendez-vous saisi par le garage n'est jamais libéré
   automatiquement : le garage est prévenu pour appeler.

**Écritures qui occupent une place** — toutes passent par `withGarageDayLock` : réservation en ligne, saisie du
garage, modification (déplacement, porte, décalage en chaîne, réactivation), reprise d'un créneau expiré.
Voir `docs/adr/0002-verrou-par-garage-et-par-jour.md`.

**Multi-garage (isolation des données)** — chaque route de l'espace garage charge le garage avec
`ownedGarageWhere(session.user.id, garageId)` ; un propriétaire peut avoir un garage principal et des succursales
(`parentId`), jamais accéder au garage d'un autre propriétaire.

## Frontend et backend

Les pages publiques sont rendues côté serveur (SEO) ; les tableaux de bord sont des composants client qui
appellent l'API avec `fetch`. Le tableau de bord garage passe `?g=<garageId>` pour la succursale choisie.

## Points connus à améliorer

- Fichiers très longs : `tableau-de-bord/garage/page.tsx` (≈ 3 900 lignes), `conducteur/page.tsx`,
  `admin/page.tsx`, `components/GarageAgenda.tsx`, `lib/email.ts`, route PATCH `appointments/[id]`.
- Fuseau horaire unique (Québec) : à rendre propre à chaque garage avant les garages hors Québec/Ontario.
- 103 erreurs de lint restantes, toutes dans les composants d'interface (`any`, `setState` dans un effet).
