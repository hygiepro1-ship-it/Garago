# Audit technique de Garago — Phase 1

Date : 26 novembre 2026 · Branche : `seo-apercu` (100 commits devant `main`) · Aucun fichier de code modifié.

## 0. Ce qui a été vérifié, et comment

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint src` | **214 problèmes : 174 erreurs, 40 avertissements** (103 `no-explicit-any`, 42 `no-unescaped-entities`, 32 variables inutilisées, 5 `<img>`, 3 dépendances de hooks, 1 ref lue pendant le rendu) |
| `npm run test:securite` | 16 tests, 16 réussis |
| `npm audit --omit=dev` | **3 failles « high »** (paquet `effect`, ReDoS, tiré par la CLI `prisma`) — `SECURITE.md` indique encore « 0 faille » |
| `npm run build` | **Non lancé, volontairement** : il exécute `prisma db push` sur la base de `.env.local`, qui est la production (voir C1) |
| Parcours dans le navigateur | **Non fait dans cette phase.** Les points UX de la section 8 sont tirés du code et restent à confirmer sur le site démo |

Code lu en entier : schéma Prisma, `api/appointments` (POST, GET), `api/appointments/[id]` (PATCH), `api/garage/appointments`, `api/garages/[slug]/slots`, `api/garages` (recherche, en partie), `api/garage/upload`, `api/rdv/[token]` (début), webhook Stripe (début), `lib/auth.ts`, `lib/abuse.ts`, `lib/turnstile.ts`, `lib/ics-token.ts`, `lib/garage-access.ts`, `lib/bays.ts`, `lib/prisma.ts`, `lib/public-garage.ts`, `lib/garage-profile.ts`, configuration (`package.json`, `next.config.ts`, `prisma.config.ts`, `vercel.json`, workflow GitHub), tests existants. Le reste (pages, composants, `email.ts`, `sms.ts`, crons) a été parcouru par recherche ciblée, pas lu ligne à ligne.

## 1. Évaluation générale

Garago est **plus solide côté sécurité que la moyenne** d'un projet de cette taille : contrôles d'accès côté serveur systématiques, anti-force brute, jetons signés, validation des entrées, CSP, webhook Stripe vérifié et idempotent, réservation en ligne protégée par une transaction `Serializable`. Les commentaires expliquent le *pourquoi* métier, ce qui est rare et précieux.

Les faiblesses sont ailleurs :

1. **Environnement** : le poste de travail est branché sur la base de production, et chaque déploiement modifie le schéma de la base sans historique de migrations.
2. **Fiabilité des réservations** : la protection contre la double réservation ne couvre que la réservation en ligne, pas les écritures du garage.
3. **Maintenabilité** : quelques fichiers géants (le tableau de bord garage fait 3 915 lignes), logique métier dans les routes, valeurs métier en chaînes libres, lint non respecté.
4. **Tests** : les 16 tests vérifient la présence de motifs dans le code source ; aucune règle métier (créneaux, capacité, confirmation) n'est testée par exécution.

Note globale : sécurité **B+**, fiabilité métier **B−**, maintenabilité **C**, tests **D**, documentation **D** (README = gabarit de `create-next-app`).

## 2. Technologies réellement utilisées

| Couche | Technologie |
|---|---|
| Application | Next.js 16.4 (App Router, `AGENTS.md` signale des API qui diffèrent des versions connues), React 19.2, TypeScript 5 |
| Style | Tailwind CSS 4, beaucoup de `style={{}}` en ligne |
| Base | PostgreSQL chez Neon, Prisma 7.10 avec l'adaptateur `@prisma/adapter-pg` ; client généré dans `src/generated/prisma` |
| Authentification | NextAuth 4 (JWT 14 jours, identifiants + Google facultatif), bcryptjs |
| Paiement | Stripe 22 (abonnement, succursales facturées en plus) |
| Courriel / SMS | Resend ; Twilio appelé par `fetch` (`src/lib/sms.ts`) avec réponses entrantes (`api/webhooks/twilio-sms`) |
| Fichiers | Vercel Blob (logo, couverture) |
| Cartes | Leaflet / OpenStreetMap, Google Maps facultatif ; Nominatim pour le géocodage |
| Anti-robot | Cloudflare Turnstile (code prêt, **clés absentes en production**) |
| Hébergement | Vercel ; 7 crons Vercel quotidiens + GitHub Actions toutes les 15 min pour les confirmations |
| Tests | `node:test` + `tsx` (`tests/security`) |

Pas de couche « backend » séparée : les routes `src/app/api/**/route.ts` sont le backend. Pas de `middleware.ts` : chaque route vérifie elle-même la session.

## 3. Cartographie actuelle

```
src/
  app/                 ~70 pages publiques (FR + /en), SEO, tableaux de bord
    api/               84 routes (admin 13, garage 15, cron 7, public, Stripe, Twilio…)
    tableau-de-bord/   garage (3 915 l.), conducteur (1 273 l.), admin (1 195 l.)
  components/          46 composants (GarageAgenda 1 164 l., BookingWidget 618 l.)
  lib/                 ~60 modules : domaine (availability, bays, rdv-confirmation, customers),
                       infra (prisma, abuse, sms, email 1 487 l.), contenu (articles*, i18n 1 081 l.)
  content/guides/      pages guides SEO
  contexts/            LanguageContext
  generated/prisma/    client Prisma (généré, à ne pas lire)
prisma/                schema.prisma, seed.ts, migrations/ (5 migrations, la dernière du 26 mai 2026)
scripts/               scripts ponctuels (import de fiches, pilote, fusion de doublons, comptes de test)
tests/security/        6 fichiers de tests
```

Racine du dépôt : beaucoup de fichiers hors application (marketing, prospection, vidéos Remotion, `Garages_fiches_non_actives_par_quartier.xlsx`, `_pilot_chk.ts`, `prisma/dev.db` SQLite). La plupart ne sont pas suivis par Git, mais ils brouillent la lecture du projet.

Flux d'une réservation en ligne : `BookingWidget` → `GET /api/garages/[slug]/slots` (créneaux calculés par `lib/availability.ts`) → `POST /api/appointments` (revalidation du créneau, transaction `Serializable`, choix de la porte par `pickBay`, plan de confirmation `lib/rdv-confirmation.ts`) → courriels Resend → cron `rdv-confirmations` (GitHub Actions, 15 min) pour les relances et la libération des créneaux non confirmés.

## 4. Problèmes identifiés, par gravité

Format : **Problème** · emplacement · conséquence · solution · risque de la modification.

### CRITIQUE

**C1. Le poste de travail travaille sur la base de production.**
- Emplacement : `.env.local` pointe vers l'hôte Neon `ep-quiet-resonance` (celui que `scripts/comptes-test-apercu.ts` désigne lui-même comme la production). `prisma.config.ts` charge `.env.local`. `.claude/launch.json` : les configurations `garago` (3000) et `garago-3100` utilisent ce fichier.
- Conséquence : `npm run dev` lit et écrit les vraies données clients ; `npm run seed` / `db:seed` injecterait des données de démo en production ; `npm run build` en local lance `prisma db push` sur la production. Un clic de test qui annule un rendez-vous envoie un vrai courriel à un vrai client (seul `dev-apercu.mjs` vide les clés Resend et Twilio).
- Solution : faire pointer `.env.local` vers la base de test (`ep-round-wave`), garder l'adresse de production uniquement dans Vercel ; ajouter dans `prisma.config.ts` et `src/lib/prisma.ts` un garde-fou qui refuse l'hôte de production hors `VERCEL_ENV=production` ; retirer les configurations 3000/3100 de `launch.json` ou les brancher sur la base de test.
- Risque : nul pour le site en ligne (changement local). Vous devez seulement recopier les clés Stripe/Resend de test si vous en voulez en local.

**C2. Chaque déploiement modifie le schéma de la base, sans migrations.**
- Emplacement : `package.json` → `"build": "prisma generate && prisma db push && next build"`. Dossier `prisma/migrations` arrêté au 26 mai 2026 (Cal.com, Calendly : fonctionnalités supprimées depuis).
- Conséquence : le schéma réel n'a aucun historique ; impossible de savoir ce qui a changé, ni de revenir en arrière. Un déploiement de prévisualisation Vercel (n'importe quelle branche) pousse son schéma sur la base que ses variables désignent — **à vérifier dans Vercel** : si les variables « Preview » pointent vers la production, une branche expérimentale modifie la production. `db push` refuse les pertes de données sans option, donc le build échoue au lieu de détruire, mais tout ajout passe.
- Solution : créer une migration de référence à partir du schéma actuel (`prisma migrate diff` → `0_baseline`), la marquer appliquée (`prisma migrate resolve --applied`), puis remplacer `db push` par `prisma migrate deploy`, exécuté seulement pour l'environnement Production.
- Risque : moyen. `migrate resolve` écrit dans la table `_prisma_migrations` de la production : **demande votre autorisation explicite**, à faire d'abord sur la base de test.

### ÉLEVÉ

**E1. Double réservation possible entre le garage et un client en ligne.**
- Emplacement : `src/app/api/garage/appointments/route.ts:121-128` (création manuelle : lecture puis création, hors transaction) ; `src/app/api/appointments/[id]/route.ts:146-151` et `:300-317` (déplacement par le garage, décalage en chaîne : vérification hors transaction). Seuls `POST /api/appointments` et `api/rdv/[token]` utilisent `Serializable`.
- Conséquence : la protection `Serializable` de Postgres ne détecte un conflit que si **toutes** les transactions concernées sont sérialisables. Un garage qui saisit un rendez-vous au moment où un client réserve en ligne peut dépasser la capacité.
- Solution : un seul module `features/booking/server/write-appointment.ts` qui fait « vérifier puis écrire » dans une transaction `Serializable` avec une nouvelle tentative sur l'erreur `40001`, utilisé par les trois routes. Test d'intégration de concurrence sur la base de test.
- Risque : moyen (cœur du métier). À couvrir par des tests avant la modification.

**E2. Réactiver un rendez-vous annulé ne vérifie pas la capacité.**
- Emplacement : `src/app/api/appointments/[id]/route.ts` — la vérification de capacité n'a lieu que si l'heure ou la porte change (`if (movesAppt || bayAsked)`). Passer `status` de `CANCELLED` ou `NO_SHOW` à `CONFIRMED` ne vérifie rien. Aucun contrôle des transitions (un `COMPLETED` peut repasser à `PENDING`).
- Conséquence : un créneau libéré puis repris par un autre client peut être réoccupé par la réactivation : deux véhicules sur une porte.
- Solution : une table de transitions de statut autorisées (`lib/appointment-status.ts`) et une vérification de capacité dès qu'un rendez-vous redevient actif.
- Risque : faible.

**E3. Heure du Québec codée en dur, alors que le marché est tout le Canada.**
- Emplacement : `"America/Toronto"` dans 8 fichiers (`lib/availability.ts`, `lib/garage-access.ts`, `lib/rdv-confirmation.ts`, page du tableau de bord garage…). `Garage.province` existe mais n'est pas utilisé pour le fuseau.
- Conséquence : un garage de Vancouver ou de Calgary verrait des créneaux « déjà passés » ou proposés trois heures trop tôt ; les rappels et les échéances de confirmation partiraient à la mauvaise heure.
- Solution : un champ `timeZone` sur `Garage` (déduit de la province, modifiable), un module unique `lib/time.ts` qui prend le fuseau en paramètre, utilisé partout.
- Risque : moyen (touche tous les calculs d'heure). À faire avant l'arrivée du premier garage hors Québec/Ontario.

**E4. La note d'un garage n'est pas la même partout et compte les avis masqués.**
- Emplacement : recherche `src/app/api/garages/route.ts:139` (`reviews: { select: { rating } }`, **sans** `isHidden: false`) ; fiche `src/lib/garage-profile.ts:21-27` (moyenne des 20 avis visibles les plus récents seulement) ; `_count.reviews` inclut les avis masqués dans les deux cas.
- Conséquence : un avis masqué par le garage ou l'admin (abusif) fait encore baisser la note dans la recherche ; la note de la carte diffère de celle de la fiche ; le nombre d'avis affiché compte des avis invisibles.
- Solution : une fonction unique `getGarageRating(garageIds)` basée sur `prisma.review.groupBy` avec `isHidden: false`, utilisée par la recherche, la fiche et le JSON-LD.
- Risque : faible. Les notes affichées vont changer (c'est le but) : à vérifier sur le site démo.

**E5. Aucune règle métier n'est testée.**
- Emplacement : `tests/security/*.test.ts` vérifient surtout que certains motifs existent dans les fichiers (`assert.match(src, /getServerSession\(/)`). Aucun test de `computeFreeSlots`, `pickBay`, `wouldExceedCapacity`, `planConfirmation`, `planManualConfirmation`, des transitions de statut, ni des routes. Aucune CI ne lance `tsc`, le lint ou les tests (seul workflow : l'appel du cron).
- Conséquence : toute refactorisation du cœur (E1, E3) se fait à l'aveugle.
- Solution : voir section 12 ; ajouter `npm test` et un workflow GitHub qui lance `tsc`, les tests et le lint à chaque push.
- Risque : nul.

**E6. Fichiers qui font tout.**
- `src/app/tableau-de-bord/garage/page.tsx` : 3 915 lignes, 82 `useState`, 38 appels `fetch`, une dizaine de sous-composants internes (sélecteur de couleur, ambassadeur, description, résumé multi-jours…).
- `src/app/api/appointments/[id]/route.ts` : 390 lignes pour 6 responsabilités (droits client/garage, correction de fiche, déplacement, décalage en chaîne, annulation, « véhicule prêt » et avis).
- `src/lib/email.ts` : 1 487 lignes, tous les gabarits de courriel.
- `tableau-de-bord/conducteur/page.tsx` (1 273), `admin/page.tsx` (1 195), `components/GarageAgenda.tsx` (1 164).
- Conséquence : chaque modification risque une régression ailleurs dans le même fichier ; impossible à tester par morceaux ; longs temps de relecture.
- Solution : découpage progressif par onglet / par cas d'usage (section 10), sans changer le rendu.
- Risque : moyen, maîtrisé si fait onglet par onglet avec vérification visuelle sur le site démo.

### MOYEN

**M1. Les données publiques d'un garage sont filtrées par liste noire.**
- `src/lib/public-garage.ts` retire une liste de champs privés ; tout nouveau champ ajouté au modèle `Garage` devient public par défaut. Aujourd'hui sont exposés `subscriptionStatus`, `verificationStatus`, `ambassadorTier`, `isAmbassador`, `claimStatus`, `onlineBooking`, `capacity`, `ownerId` (ce dernier accepté dans `SECURITE.md`).
- Solution : liste blanche (`select` Prisma explicite + type de retour dédié). Test qui échoue si un champ non listé apparaît.
- Risque : faible ; vérifier que la fiche et la recherche n'utilisent aucun champ retiré.

**M2. Valeurs métier en chaînes libres.** `status`, `role`, `confirmationStatus`, `claimStatus`, `subscriptionStatus`, `source`, `contactChannel`… sont des `String` Prisma. Une faute de frappe (`"CANCELED"`) passe le typage. Les listes `["CANCELLED", "NO_SHOW"]` sont recopiées dans au moins 6 fichiers.
- Solution : constantes et types centralisés (`lib/domain/appointment.ts`) tout de suite ; enums Prisma plus tard, par migration.

**M3. Duplications.** Calcul du jour au Québec réécrit à 3 endroits (`availability.quebecToday`, `garage-access.countUpcomingAppointments`, `quebecTodayStr` dans le tableau de bord) ; contrôle `CRON_SECRET` copié dans les 7 crons (comparaison non constante dans le temps) ; règle « garage éligible à la réservation » écrite dans `POST /api/appointments` et ailleurs.
- Solution : `lib/time.ts`, `lib/cron-auth.ts` (avec `timingSafeEqual`), `lib/garage-eligibility.ts`.

**M4. Recherche : toutes les lignes d'avis chargées pour calculer une moyenne.** `api/garages/route.ts` charge chaque avis de chaque garage de la page. Avec la croissance, c'est la requête qui grossira le plus. Solution : agrégat (`groupBy`) ou note stockée sur `Garage`, mise à jour à chaque avis. Combine avec E4.

**M5. Deux systèmes de traduction.** `lib/i18n.ts` (clés typées) et `lib/dashboard-en.ts` (la clé est **le texte français**). Corriger une virgule dans un texte français fait silencieusement repasser l'interface anglaise en français. Solution : clés stables, ou au minimum un test qui liste les textes `tr("…")` sans traduction.

**M6. Lint non respecté (174 erreurs), 178 `any`.** Le plus utile à corriger : `any` dans les routes (`(session.user as any)`), absence de type pour la session NextAuth étendue (`types/next-auth.d.ts`), `react-hooks/refs` dans `components/Turnstile.tsx:45`.

**M7. Dépendances mal rangées.** `prisma`, `tsx`, `@types/leaflet`, `@types/pg` sont dans `dependencies`. Les 3 failles `npm audit` viennent de la CLI `prisma` (outil de build, pas exécuté par le site) : risque réel faible, mais `SECURITE.md` est faux sur ce point. Solution : déplacer en `devDependencies` (attention : `prisma generate` doit rester disponible au build Vercel, qui installe les devDependencies par défaut), mettre `SECURITE.md` à jour.

**M8. Anti-robot inactif en production.** Sans clés Turnstile, la réservation sans compte n'est freinée que par 6 réservations / heure / IP et 4 rendez-vous à venir par client. Un robot qui change d'IP peut remplir l'agenda d'un garage. Action de votre côté (déjà notée dans `SECURITE.md`).

**M9. Limiteur de débit adossé à `RegistrationAttempt`.** Table au nom trompeur qui sert à toutes les limites ; compter puis insérer n'est pas atomique (quelques requêtes simultanées dépassent la limite). Acceptable à la taille actuelle ; renommer la table par migration (`RateLimitHit`) et regrouper les appels dans `lib/rate-limit.ts`.

### FAIBLE

- **F1.** `src/app/api/appointments/route.ts:208` : expression régulière écrite avec de vrais caractères de contrôle ; Git et `grep` voient le fichier comme binaire (diffs illisibles). Remplacer par `\u0000-\u0008…` comme dans la route PATCH.
- **F2.** Messages d'erreur d'API mélangés anglais / français (`"Not found"`, `"date required"`).
- **F3.** `prisma/migrations` contient des migrations Cal.com / Calendly mortes ; `prisma/dev.db`, `_pilot_chk.ts`, `tsconfig.tsbuildinfo` à la racine.
- **F4.** Fichiers de marketing, prospection et vidéos dans le dépôt de l'application : à sortir dans un autre dossier ou dépôt.
- **F5.** README de gabarit ; pas de documentation d'architecture ni de base de données.
- **F6.** `src/app/apercu-agenda` : page de démonstration publique, à vérifier (indexation, lien).

## 5. Sécurité — ce qui est bien en place

Vérifié dans le code : sessions vérifiées côté serveur dans chaque route lue ; isolation des garages par `ownedGarageWhere` (`id` + `ownerId`) ; rendez-vous, rappels, véhicules filtrés par `userId` ; suppression d'un blocage filtrée par `garage.ownerId` ; rôle ADMIN contrôlé dans les 13 routes admin et le layout ; inscription limitée aux rôles `DRIVER` / `GARAGE_OWNER` (`api/register/route.ts:126`) ; mots de passe bcrypt, réponse à durée constante, compteurs d'échecs par courriel et par IP, sessions invalidées au changement de mot de passe ; téléversement vérifié par type, taille et premiers octets ; jetons `.ics` HMAC à comparaison constante ; jetons de confirmation de 192 bits ; webhook Stripe signé, relecture de l'abonnement contre le désordre des événements ; échappement HTML dans les courriels (`esc()` dans `email.ts`) ; JSON-LD échappé ; CSP appliquée en production. Pas de SQL brut repéré (Prisma partout).

Risques restants : C1, C2, E1, M1, M8. À noter aussi : la lecture de l'IP dans `x-forwarded-for` n'est fiable que derrière Vercel (qui réécrit l'en-tête) ; ne pas héberger ailleurs sans revoir `clientIp`.

## 6. Performance

- Recherche (`api/garages`) : bonne idée déjà en place (classement par distance sur les seules coordonnées, détail chargé pour la page seulement). Reste : avis chargés ligne par ligne (M4), `take: 3000` pour la carte.
- Tableau de bord garage : 100 % client, 38 appels `fetch` depuis une page ; chargement initial lourd sur mobile. Gain réel attendu en découpant par onglet avec chargement à la demande (`next/dynamic`).
- Index : ceux des requêtes chaudes existent (`Appointment[garageId, date]`, `[confirmationStatus, date]`, `Garage[latitude, longitude]`). Manquants probables : `Review[garageId, isHidden]` (après E4), `GarageService[garageId, active]`. À confirmer avec `EXPLAIN` sur la base de test.
- Le dernier commit a déjà réglé les écritures en base des robots et le rechargement de l'agenda.

## 7. Maintenabilité — synthèse

Logique métier bien isolée pour les créneaux (`availability.ts`, `bays.ts`, `rdv-confirmation.ts`) : c'est la bonne direction. Elle ne l'est pas pour les écritures (dans les routes) ni pour les tableaux de bord (dans les pages). Le reste : E6, M2, M3, M5, M6.

## 8. UX et fonctionnel — pistes à vérifier sur le site démo

Tirées du code, **non vérifiées dans un navigateur** :
1. Note et nombre d'avis différents entre la carte de recherche et la fiche (E4).
2. Le client ne peut plus modifier un rendez-vous à moins de 24 h : le message l'invite à appeler ; vérifier que le numéro du garage est affiché à côté.
3. Un garage qui réactive un rendez-vous annulé n'est pas averti d'un conflit (E2).
4. Tableau de bord garage sur téléphone : poids de la page et nombre d'onglets à vérifier.
5. Textes du tableau de bord en anglais qui repassent en français (M5).
6. Messages d'erreur d'API en anglais affichés tels quels (F2).

## 9. Incohérences entre parties du système

- Réservation en ligne protégée contre la concurrence, saisie du garage non (E1).
- Règles de note différentes entre recherche et fiche (E4).
- `SECURITE.md` dit « 0 faille » ; `npm audit` en trouve 3 (M7).
- `SECURITE.md` recommande déjà une base de test séparée en local : pas encore fait pour `.env.local` (C1).
- Commentaires du schéma qui parlent de « postes » alors que l'interface dit « portes » (cosmétique, mais à aligner sur le vocabulaire retenu).

## 10. Architecture cible (pragmatique)

Garder Next.js App Router et les adresses d'API actuelles (aucun contrat cassé). Regrouper par fonctionnalité, routes minces :

```
src/
  app/                        routes et pages seulement : lire la requête, appeler un service, répondre
  features/
    booking/
      domain/                 availability, bays, confirmation, statuts et transitions (pur, testé)
      server/                 createOnlineBooking, createManualBooking, updateAppointment (transactions)
      ui/                     BookingWidget, agenda (GarageAgenda découpé)
    garage-dashboard/         un dossier par onglet (agenda, clients, services, profil, abonnement, ambassadeur)
    search/                   recherche, classement, note des garages
    reviews/                  avis, réponses, signalements, calcul de la note
    billing/                  Stripe, essais, succursales
    notifications/            email/ (un gabarit par fichier), sms/, rappels
    auth/                     authOptions, types de session
  lib/                        infrastructure partagée : prisma, time (fuseau), rate-limit, cron-auth, http
  content/                    articles, guides, traductions
tests/
  unit/                       règles métier pures
  integration/                routes contre la base de test
  security/                   tests existants
docs/                         ARCHITECTURE, DATABASE, DEVELOPMENT, adr/
```

Fichiers à déplacer en premier : `lib/availability.ts`, `lib/bays.ts`, `lib/rdv-confirmation*.ts` → `features/booking/domain` ; `lib/email.ts` → `features/notifications/email/*`. Fonctionnalités à préserver absolument : calcul des créneaux, portes et polyvalence, décalage en chaîne, confirmation 48 h / 24 h sans annulation automatique des rendez-vous saisis par le garage, réponses SMS, plafonds SMS, parrainage et paliers ambassadeur, succursales.

## 11. Plan de refactorisation priorisé

Chaque lot se fait d'abord sur le site démo (`garago-apercu`, port 3200, base Neon de test), se vérifie, puis attend votre accord avant `main`.

| Lot | Contenu | Dépend de | Risque | Touche la production ? |
|---|---|---|---|---|
| 0 | C1 : `.env.local` sur la base de test, garde-fou d'hôte, `launch.json` | — | Nul | Non |
| 1 | E5 : tests unitaires des règles de créneaux et de confirmation, `npm test`, CI (`tsc` + tests, lint en avertissement) | — | Nul | Non |
| 2 | E1 + E2 : service d'écriture unique en transaction, transitions de statut, tests de concurrence | 1 | Moyen | Code seulement |
| 3 | E4 + M4 : note unique, avis masqués exclus | 1 | Faible | Code seulement |
| 4 | M1 : liste blanche des données publiques + test | 1 | Faible | Code seulement |
| 5 | C2 : migration de référence, `migrate deploy` | 0 | Moyen | **Oui — autorisation requise** |
| 6 | M2, M3, F1, F2 : constantes, `time.ts`, `cron-auth.ts`, messages | 1 | Faible | Code seulement |
| 7 | E6 : découpage de la route PATCH puis du tableau de bord, onglet par onglet | 1, 2 | Moyen | Code seulement |
| 8 | E3 : fuseau par garage (champ ajouté par migration) | 5, 6 | Moyen | Migration additive |
| 9 | Documentation : README, ARCHITECTURE, DATABASE, DEVELOPMENT, ADR | au fil des lots | Nul | Non |
| 10 | M5, M6, M7, F3, F4 : traductions, lint, dépendances, nettoyage | — | Faible | Non |

Lots indépendants entre eux : 0, 1, 9, 10. Lots coordonnés : 2 → 7 ; 5 → 8.

### Suivi

- **Lot 0** (26 nov.) : `.env.local` sur la base de test ; garde-fou `src/lib/db-guard.ts` (Prisma, CLI, seed).
- **Lot 1** (26 nov.) : `tests/unit/` (28 tests), `npm test`, `.github/workflows/qualite.yml`.
- **Lot 2** (26 nov.) : verrou par garage et par jour `src/lib/slot-lock.ts` utilisé par les 4 écritures qui occupent une place (réservation en ligne, saisie du garage, modification, reprise d'un créneau expiré) ; réactivation d'un rendez-vous annulé ou absent vérifiée. Test `tests/integration/double-reservation.test.ts` (`npm run test:integration`, site démo requis) : 2 échecs avant le correctif, 4 réussites après.

## 12. Tests à mettre en place

Unitaires (sans base, `node:test`) :
- `computeFreeSlots` : heures d'ouverture, jour fermé, blocage journée et partiel, créneau déjà passé aujourd'hui, durée qui dépasse la fermeture, capacité 1 et 3, portes autorisées par service.
- `wouldExceedCapacity` / `peakConcurrent` : rendez-vous qui se suivent, qui se chevauchent, pic au milieu de la plage.
- `pickBay` / `bayIsFree` : porte la plus spécialisée, aucune porte libre.
- `planConfirmation` / `planManualConfirmation` : 48 h, 24 h, dernière minute, confirmation désactivée, client injoignable, jamais d'annulation automatique pour `MANUAL`.
- Transitions de statut (après E2).
- `toPublicGarage` : aucun champ hors liste blanche (après M1).
- `normalizePhone`, `isValidEmail`, `cleanText`, `normalizePlate`.

Intégration (base de test Neon, jamais la production — garde-fou d'hôte dans le `setup`) :
- Deux réservations simultanées sur le dernier créneau : une seule réussit (409 pour l'autre).
- Saisie du garage + réservation en ligne simultanées (E1).
- Réactivation d'un rendez-vous annulé sur un créneau repris (E2).
- Garage A ne lit ni ne modifie un rendez-vous, un client, un blocage ou un service du garage B (multi-tenant).
- Client : annulation à plus et à moins de 24 h ; déplacement vers un créneau fermé refusé.
- « Terminé » refusé avant l'heure de début (non-régression du commit `60caa57`).
- Crons sans `CRON_SECRET` : 401.

Parcours (navigateur, sur le site démo) : recherche → fiche → réservation sans compte → lien de confirmation ; garage : saisie manuelle → déplacement → annulation ; conducteur : liste et annulation.
