# 0004 — Liste blanche des données publiques d'un garage

Date : 2026-11-27 · Statut : en vigueur

## Contexte
Les routes publiques retiraient une liste de champs privés de la ligne `Garage`. Tout nouveau champ devenait
public par défaut, et des informations internes sortaient (vérification, palier ambassadeur, capacité…).

## Décision
`toPublicGarage` (`src/lib/public-garage.ts`) ne copie que les champs de `PUBLIC_GARAGE_FIELDS`.
Test : `tests/security/donnees-publiques-garage.test.ts`.

## Conséquences
- Un nouveau champ reste privé tant qu'on ne l'ajoute pas volontairement à la liste.
- Une page publique qui a besoin d'un nouveau champ doit l'ajouter à la liste (et justifier pourquoi il est public).
