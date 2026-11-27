# Développement

## Conventions

- **Langue** : code (noms de fonctions, variables) en anglais ou en français selon le module existant ; commentaires,
  messages d'erreur d'API, textes et commits en français. Vocabulaire : « porte » (jamais « poste ») pour un
  emplacement de travail du garage.
- **Commentaires** : expliquer le *pourquoi* (règle métier, piège évité), pas ce que fait la ligne.
- **Routes d'API** : vérifier la session côté serveur, charger le garage avec `ownedGarageWhere`, valider chaque
  champ reçu (format, longueur ; `cleanText`, `isValidEmail`, `normalizePhone`), ne jamais faire confiance à une
  durée ou un prix envoyé par le navigateur.
- **Places dans l'agenda** : toute écriture qui occupe une place passe par `withGarageDayLock`.
- **Heures** : dates et heures des rendez-vous en heure du Québec ; utiliser `quebecToday`, `quebecMinutes`,
  `quebecInstant` (`src/lib/availability.ts`, `src/lib/rdv-confirmation.ts`), jamais `new Date().toISOString()`
  pour « aujourd'hui ».
- **Courriels aux clients** : passer la langue du rendez-vous (`appointment.language`) ; le français reste la valeur
  par défaut.
- **Données publiques** : ajouter un champ à `PUBLIC_GARAGE_FIELDS` seulement s'il doit vraiment être vu par tous.
- **Dépendances** : n'en ajouter qu'avec une raison claire.

## Ajouter une fonctionnalité ou corriger un bogue

1. Lire le code concerné et noter ce qui doit absolument continuer de fonctionner.
2. Pour un bogue : écrire d'abord un test qui le reproduit (unitaire si la règle est pure, intégration sinon).
3. Faire le changement, puis :
   ```bash
   npm run typecheck
   npm test
   node scripts/dev-apercu.mjs        # site démo, dans un autre terminal
   npm run test:integration
   ```
4. Vérifier dans le navigateur sur le site démo (http://localhost:3200).
5. Mettre à jour la documentation si le comportement ou la structure change.

## Branches et mise en ligne

- Travail local sur une branche de travail ; **rien n'est publié sans l'accord explicite du responsable**.
- Avec cet accord : pousser directement sur `main` ; Vercel déploie `main` en production.
- Après la mise en ligne : vérifier le statut Vercel et le workflow GitHub « Qualité du code », puis les pages
  principales du site.
- La base de production ne se modifie jamais à la main ; un changement de schéma passe par la base de test d'abord.

## Tests

| Dossier | Contenu | Base de données |
|---|---|---|
| `tests/unit` | Créneaux, portes, confirmation, courriels FR/EN, garde-fou | Aucune |
| `tests/security` | Admin, limites, données publiques, crons, calendrier, JSON-LD, dépendances | Aucune |
| `tests/integration` | Double réservation, réactivation, déplacement | Site démo + base de test |

Le workflow GitHub « Qualité du code » lance le typage, `npm test` et le lint (informatif) à chaque envoi.
