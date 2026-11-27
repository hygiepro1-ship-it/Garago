# 0002 — Verrou par garage et par jour pour toute écriture qui occupe une place

Date : 2026-11-26 · Statut : en vigueur

## Contexte
La réservation en ligne utilisait une transaction `Serializable`, mais la saisie par le garage et les
déplacements non. Postgres ne détecte un conflit que si toutes les transactions concernées sont sérialisables :
un test sur le site démo a créé deux rendez-vous sur une place à une seule porte.

## Décision
`withGarageDayLock(garageId, date, fn)` (`src/lib/slot-lock.ts`) prend `pg_advisory_xact_lock` sur la journée du
garage, puis lit et écrit dans la même transaction. Utilisé par la réservation en ligne, la saisie du garage, la
modification (déplacement, porte, décalage en chaîne, réactivation) et la reprise d'un créneau expiré.

## Conséquences
- Plus de double réservation (tests/integration/double-reservation.test.ts).
- Deux écritures sur la même journée d'un même garage passent l'une après l'autre (quelques millisecondes).
- Toute nouvelle écriture qui occupe une place doit utiliser ce verrou.
