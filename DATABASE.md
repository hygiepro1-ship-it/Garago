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

Depuis le 27 novembre 2026, le schéma évolue par migrations Prisma (`prisma/migrations/`) :
- `0_baseline` décrit le schéma complet de départ ; elle est marquée comme appliquée en production et sur la base
  de test (aucun écart vérifié avant).
- Le build Vercel (`npm run build`) exécute `prisma migrate deploy` : il applique les nouvelles migrations, sans
  jamais en créer ni réinitialiser la base.
- Les anciennes migrations (écrites pour SQLite) sont archivées dans `prisma/migrations-sqlite-archive/`.

Modifier le schéma :
1. Changer `schema.prisma`.
2. `npx prisma migrate dev --name <nom-court>` (base de **test** de `.env.local`) : crée le fichier SQL et l'applique.
3. Relire le SQL généré ; vérifier sur le site démo.
4. Publier : Vercel applique la migration en production au déploiement.

Jamais de suppression de colonne ou de table sans sauvegarde et accord explicite.
