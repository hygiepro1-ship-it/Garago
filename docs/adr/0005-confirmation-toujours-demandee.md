# 0005 — Confirmation 48 h avant toujours demandée ; plus de rappel la veille

Date : 2026-11-27 · Statut : en vigueur

## Contexte
Un garage pouvait désactiver la demande de confirmation ; le rappel de la veille ne servait qu'à ces garages
(les autres clients recevaient déjà la demande 48 h avant). Aucun garage n'a intérêt à s'en passer.

## Décision
La case de désactivation est retirée du tableau de bord ; les plans de confirmation sont calculés avec
`enabled: true`. La tâche `appointment-reminders` (rappel la veille) et son courriel sont supprimés.

## Conséquences
- Tous les nouveaux rendez-vous reçoivent la demande 48 h avant ; une réservation en ligne sans réponse est
  libérée 12 h avant ; un rendez-vous saisi par le garage n'est jamais libéré automatiquement.
- Les rendez-vous déjà pris chez un garage qui avait désactivé la confirmation ne reçoivent plus de rappel.
- La colonne `Garage.requireConfirmation` n'est plus lue ; à supprimer par migration.
