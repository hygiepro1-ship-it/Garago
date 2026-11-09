# Sécurité de Garago — les 7 portes

Dernière vérification : 8 novembre 2026.

## Relancer les tests

```bash
npm run test:securite
```

Les tests ne touchent à aucune base de données : `tests/security/setup.mjs` remplace l'adresse de la base
par une adresse inexistante avant chaque test. À relancer avant chaque mise en ligne et après chaque
grosse modification faite par l'IA. Un test rouge = une porte rouverte : ne pas mettre en ligne.

## État des 7 portes

| # | Porte | État | Ce qui la ferme | Test |
|---|---|---|---|---|
| 1 | Ce que le navigateur montre | Fermée | Aucun secret dans le code envoyé au navigateur ; seules des clés publiques par nature sont en `NEXT_PUBLIC_` (carte, anti-robot). Cartes de code source (`.map`) refusées en ligne (403). | Vérification manuelle (voir plus bas) |
| 2 | Clé d'IA | Sans objet | L'appli n'appelle aucun service d'IA. Historique Git sans clé ; les fichiers `.env*` sont ignorés par Git. | Vérification manuelle (voir plus bas) |
| 3 | Sécurité de la base (RLS) | Fermée | Base Postgres chez Neon : seul le serveur s'y connecte, le navigateur n'a aucun accès direct (pas de Supabase ni de Firebase). | — |
| 4 | À qui appartient chaque donnée | Fermée | Routes garage : `ownedGarageWhere` (`src/lib/garage-access.ts`). Rendez-vous, rappels, véhicules : filtrés par `userId`. Lien calendrier `.ics` : jeton signé (`src/lib/ics-token.ts`) ou client / garage connecté. | `porte4-lien-calendrier.test.ts` |
| 5 | Espace admin | Fermée | `src/app/tableau-de-bord/admin/layout.tsx` (contrôle serveur de la page) et contrôle du rôle ADMIN dans chaque route `src/app/api/admin/*`. | `porte5-espace-admin.test.ts` |
| 6 | Limites | Fermée, sauf anti-robot | Inscription : 5 par IP / 15 min et courriel vérifié avant création du compte. Connexion : 8 échecs par courriel et 30 par IP / 15 min (`src/lib/auth.ts`). Courriels de code : limités par IP et par adresse. SMS : 6 par numéro, 100 par garage et 1000 pour le site, par jour (`src/lib/sms.ts`). | `porte6-*.test.ts` |
| 7 | Webhook de paiement (Stripe) | Fermée | Signature vérifiée avec `STRIPE_WEBHOOK_SECRET` ; événements de plus de 5 minutes refusés (règle Stripe) ; doublons sans effet (abonnement relu chez Stripe, drapeau `referralRewardGranted`). | Vérification manuelle (voir plus bas) |

## À faire de votre côté

- **Anti-robot Cloudflare Turnstile — désactivé en ligne.** Créer un widget sur dash.cloudflare.com → Turnstile
  (gratuit), puis ajouter `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` dans Vercel (Production)
  et redéployer. Sans ces clés, `src/lib/turnstile.ts` laisse tout passer.
- **Base de test séparée.** Le fichier `.env` local pointe vers la base de production chez Neon : lancer le site
  sur votre ordinateur, c'est travailler sur les vraies données des clients. Créer une branche Neon de test
  et mettre son adresse dans `.env.local`.
- **Clé Google Maps** (si vous en ajoutez une) : la limiter au domaine `garagopro.ca` dans Google Cloud.

## Vérifications manuelles avant une mise en ligne

1. **Navigateur :** sur garagopro.ca, outils du navigateur → Réseau. Aucun `sk_`, `whsec_`, `re_`, `AC…`
   (Twilio), `postgresql://` ni `neon.tech` dans les fichiers `.js`.
2. **Variables publiques :** `grep -rhoE 'NEXT_PUBLIC_[A-Z_]+' src | sort -u` ne doit lister que des clés
   publiques par nature (carte, anti-robot).
3. **Historique Git :** aucun fichier `.env` suivi : `git log --all --name-only -- '.env*'` ne doit montrer
   que `.env.example`.
4. **Webhook Stripe :** la route `src/app/api/webhooks/stripe/route.ts` doit toujours commencer par
   `stripe.webhooks.constructEvent(...)` avant tout traitement.

## Si une clé fuit

La supprimer du code ne suffit pas : la **révoquer chez le fournisseur** (Stripe, Twilio, Resend, Neon,
Google), en créer une nouvelle, la mettre dans Vercel, puis redéployer.
