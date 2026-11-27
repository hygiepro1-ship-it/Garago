# Base de données

PostgreSQL chez Neon, schéma dans `prisma/schema.prisma` (Prisma 7, client généré dans `src/generated/prisma`).

- **Production** : utilisée seulement par le site en ligne (Vercel, environnement Production).
- **Test** (branche Neon « preview ») : site démo, développement local, tests d'intégration.
- `src/lib/db-guard.ts` refuse l'adresse de production partout ailleurs (serveur, CLI Prisma, seed).
  Exception volontaire pour un script : `ALLOW_PRODUCTION_DB=1`.

## Principales tables

| Table | Rôle |
|---|---|
| `User` | Comptes (rôle `DRIVER`, `GARAGE_OWNER` ou `ADMIN`) ; tables NextAuth `Account`, `Session`, `VerificationToken` |
| `Garage` | Fiche du garage : coordonnées, abonnement Stripe, vérification NEQ, statut de réclamation, `capacity` (portes), `onlineBooking`. `ownerId` nul = fiche pré-créée non réclamée ; `parentId` = succursale |
| `GarageService` / `ServiceCategory` | Services offerts, prix, durée (`durationMin`), portes où ils se font (`bays`) |
| `GarageAvailability` | Heures d'ouverture par jour de semaine ; `BlockedSlot` : fermetures ponctuelles |
| `GarageBrand` / `GarageBrandModel` | Marques (et modèles) acceptés ; aucun modèle listé = tous les modèles de la marque |
| `Appointment` | Rendez-vous : date et heures en texte (`YYYY-MM-DD`, `HH:MM`, heure du Québec), porte, statut, source (`ONLINE`/`MANUAL`), suivi de confirmation, langue du client |
| `Customer` | Carnet de clients d'un garage (propre à chaque garage) |
| `Review` | Avis (lié au rendez-vous terminé) ; `isHidden` = masqué par la modération, exclu de la note |
| `ClaimRequest`, `GarageReport`, `AuditLog` | Réclamation de fiches, signalements, journal des décisions admin |
| `RegistrationAttempt`, `LoginAttempt` | Limites de débit (clé libre dans `ip`), purgées par la tâche `cleanup-abuse-tables` |
| `UserVehicle`, `MaintenanceReminder`, `GarageFavorite` | Espace conducteur |
| `Suggestion`, `SupportQuestion`, `AutoTip`, `SiteSetting`, `SiteVisit`, `GarageProfileView`, `ClaimCtaClick` | Contenu, statistiques, réglages |

## Règles importantes

- **Statuts libres** : un rendez-vous `CANCELLED` ou `NO_SHOW` libère sa place (`FREE_SLOT_STATUSES`) ;
  `PENDING`, `CONFIRMED`, `COMPLETED` l'occupent.
- **Capacité** : un créneau est complet quand toutes les portes sont occupées en même temps (chevauchement
  d'intervalles, pas égalité d'heure de début).
- **Écritures concurrentes** : verrou `pg_advisory_xact_lock(garage, jour)` (`src/lib/slot-lock.ts`).
- **Multi-garage** : toute lecture ou écriture de l'espace garage filtre par `ownerId` (`ownedGarageWhere`).
  Les rendez-vous, rappels et véhicules d'un conducteur filtrent par `userId`.
- **Données publiques** : jamais la ligne `Garage` brute ; liste blanche dans `src/lib/public-garage.ts`.
- **Colonne inutilisée** : `Garage.requireConfirmation` (la confirmation est toujours demandée depuis le
  27 novembre 2026) ; à supprimer avec la première migration.

## Migrations

État actuel : le schéma est appliqué par `prisma db push` au build Vercel (`npm run build`).

Préparé le 27 novembre 2026 :
- les anciennes migrations (écrites pour SQLite, inutilisables avec PostgreSQL) sont archivées dans
  `prisma/migrations-sqlite-archive/` ;
- `prisma/migrations/0_baseline/` décrit le schéma actuel complet ; elle est marquée comme appliquée sur la base de
  **test** (`prisma migrate status` : « Database schema is up to date »), sans écart avec `schema.prisma`.

Reste à faire, avec autorisation explicite (écrit dans la table `_prisma_migrations` de la production) :
1. Vérifier l'absence d'écart en production :
   `ALLOW_PRODUCTION_DB=1 npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
   (avec l'adresse de production dans l'environnement) doit être vide.
2. `ALLOW_PRODUCTION_DB=1 npx prisma migrate resolve --applied 0_baseline` sur la production.
3. Remplacer `prisma db push` par `prisma migrate deploy` dans le script `build`.

Ensuite, modifier le schéma : changer `schema.prisma`, `npx prisma migrate dev --name <nom>` sur la base de
**test**, vérifier sur le site démo, publier ; Vercel applique la migration. Jamais de suppression de colonne sans
sauvegarde et accord.
