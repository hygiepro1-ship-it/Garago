/**
 * Webhook Stripe → reçoit les événements de paiement.
 *
 * Événements gérés :
 *   - customer.subscription.created  → abonnement activé
 *   - customer.subscription.updated  → changement de statut
 *   - customer.subscription.deleted  → résiliation
 *   - invoice.payment_succeeded      → paiement réussi (renouvellement)
 *   - invoice.payment_failed         → paiement échoué
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSubscriptionToGarage } from "@/lib/stripe-sync";

// Force la route en dynamique — empêche Next.js d'évaluer ce module au build
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Import dynamique de Stripe — évite l'évaluation au build sans STRIPE_SECRET_KEY
  const { default: Stripe } = await import("stripe");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
  const payload = await req.text();
  const sig     = req.headers.get("stripe-signature") ?? "";

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Stripe webhook signature invalide :", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Abonnement activé / renouvelé ────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const eventSub = event.data.object as import("stripe").Stripe.Subscription;
        // Stripe ne garantit pas l'ordre de livraison : un ancien « updated » arrivant après un plus récent
        // écraserait l'état réel. On relit donc l'abonnement courant plutôt que de croire la copie de l'événement.
        const sub = await stripe.subscriptions.retrieve(eventSub.id).catch(() => eventSub);
        await handleSubscriptionChange(sub);
        break;
      }

      // ── Abonnement résilié ───────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        // L'événement d'un ancien abonnement peut arriver après un réabonnement : on ne coupe l'accès que si
        // le client n'a plus aucun abonnement vivant.
        const live = (await stripe.subscriptions.list({ customer: sub.customer as string, status: "all", limit: 10 }))
          .data.find((s) => s.id !== sub.id && ["active", "trialing", "past_due"].includes(s.status));
        if (live) {
          await syncSubscriptionToGarage(live);
        } else {
          await prisma.garage.updateMany({
            where: { stripeCustomerId: sub.customer as string },
            data:  { subscriptionStatus: "EXPIRED", pastDueSince: null },
          });
        }
        break;
      }

      // ── Paiement réussi (renouvellement mensuel + parrainage) ────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object as any;
        // Depuis l'API « basil », l'abonnement d'une facture n'est plus dans `invoice.subscription` mais dans
        // `invoice.parent.subscription_details.subscription` : l'ancien champ seul rendait tout ce bloc inerte
        // (aucune récompense de parrainage). On lit les deux.
        const invSubRaw = inv.parent?.subscription_details?.subscription ?? inv.subscription;
        const invSubId: string | null = typeof invSubRaw === "string" ? invSubRaw : invSubRaw?.id ?? null;
        if (invSubId) {
          const { default: Stripe2 } = await import("stripe");
          const stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
          const sub = await stripe2.subscriptions.retrieve(invSubId);
          await handleSubscriptionChange(sub);

          // ── Commission de parrainage au 1er paiement ──────────────────
          // Tous les nouveaux garages commencent par un essai : la facture de création est à 0 $ et le premier
          // paiement réel arrive avec la facture de renouvellement. La récompense se déclenche donc à la première
          // facture payée, quelle que soit sa nature ; le drapeau referralRewardGranted empêche tout doublon.
          if ((inv.amount_paid ?? 0) > 0) {
            const newGarage = await prisma.garage.findFirst({
              where: { stripeCustomerId: inv.customer as string },
            });
            // Récompense accordée une seule fois : on « réserve » l'attribution de façon atomique avant de calculer quoi que ce
            // soit. Stripe peut livrer deux fois le même événement (ou deux en parallèle) ; sans cela, le parrain
            // aurait été récompensé deux fois.
            if (newGarage?.referredByCode && !newGarage.referralRewardGranted
              && (await prisma.garage.updateMany({ where: { id: newGarage.id, referralRewardGranted: false }, data: { referralRewardGranted: true } })).count === 1) {
              const referrer = await prisma.garage.findUnique({
                where: { referralCode: newGarage.referredByCode },
              });
              // Le programme de parrainage est réservé aux garages abonnés : un
              // parrain en essai / expiré ne monte pas en palier.
              // Auto-parrainage exclu : même propriétaire, même entreprise (NEQ) ou même client Stripe.
              const selfReferral = !!referrer && (
                referrer.id === newGarage.id
                || (!!referrer.ownerId && referrer.ownerId === newGarage.ownerId)
                || (!!referrer.neq && referrer.neq === newGarage.neq)
                || (!!referrer.stripeCustomerId && referrer.stripeCustomerId === newGarage.stripeCustomerId)
              );
              if (selfReferral) console.warn(`[parrainage] auto-parrainage ignoré : ${newGarage.name}`);
              if (referrer && !selfReferral && referrer.subscriptionStatus === "ACTIVE") {
                // Mise à jour compteur + tiers ambassadeur
                const newCount = (referrer.referralCount ?? 0) + 1;
                const newTier = newCount >= 20 ? 5 : newCount >= 15 ? 4 : newCount >= 10 ? 3 : newCount >= 6 ? 2 : newCount >= 3 ? 1 : 0;
                const oldTier = referrer.ambassadorTier ?? 0;
                const firstTier = oldTier === 0 && newTier >= 1;

                const updateData: any = {
                  referralCount: newCount,
                  ambassadorTier: newTier,
                  ambassadorSince: firstTier ? new Date() : referrer.ambassadorSince,
                  isAmbassador: newTier >= 5,
                };

                // Palier 2 — -10% sur prochaine facture (une seule fois)
                if (newTier >= 2 && !referrer.palier2Applied && referrer.stripeCustomerId) {
                  updateData.palier2Applied = true;
                  try {
                    // ID dédié « -once » — évite tout coupon "forever" hérité de l'ancienne logique
                    const COUPON_ID = "garago-ambassador-10pct-once";
                    try { await stripe2.coupons.retrieve(COUPON_ID); } catch {
                      await stripe2.coupons.create({ id: COUPON_ID, percent_off: 10, duration: "once", name: "−10% Ambassadeur Garago (palier 2)" });
                    }
                    const subs = await stripe2.subscriptions.list({ customer: referrer.stripeCustomerId, status: "active", limit: 1 });
                    if (subs.data[0]) await stripe2.subscriptions.update(subs.data[0].id, { discounts: [{ coupon: COUPON_ID }] });
                  } catch (e) { console.error("Erreur coupon palier 2 :", e); }
                }

                // Palier 3 — -20% (-30% annuel) sur prochaine facture (une seule fois)
                if (newTier >= 3 && !referrer.palier3Applied && referrer.stripeCustomerId) {
                  updateData.palier3Applied = true;
                  try {
                    const subs = await stripe2.subscriptions.list({ customer: referrer.stripeCustomerId, status: "active", limit: 1 });
                    const isAnnual = subs.data[0]?.items?.data?.[0]?.price?.recurring?.interval === "year";
                    const pct = isAnnual ? 30 : 20;
                    const COUPON_ID3 = `garago-ambassador-${pct}pct`;
                    try { await stripe2.coupons.retrieve(COUPON_ID3); } catch {
                      await stripe2.coupons.create({ id: COUPON_ID3, percent_off: pct, duration: "once", name: `−${pct}% Ambassadeur Garago (palier 3)` });
                    }
                    if (subs.data[0]) await stripe2.subscriptions.update(subs.data[0].id, { discounts: [{ coupon: COUPON_ID3 }] });
                  } catch (e) { console.error("Erreur coupon palier 3 :", e); }
                }

                // Palier 4 — priorité recherche 30 jours
                if (newTier >= 4 && oldTier < 4) {
                  updateData.palier4Expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                }

                await prisma.garage.update({ where: { id: referrer.id }, data: updateData });
                await prisma.garage.update({
                  where: { id: newGarage.id },
                  data: { referralRewardGranted: true },
                });
                const tierLabel = ["", "📊 PALIER 1", "💰 PALIER 2", "💰 PALIER 3", "🔝 PALIER 4", "🏆 CERTIFIÉ"][newTier] ?? "";
                console.log(`🤝 Parrainage ${newGarage.name} → ${referrer.name} (${newCount} au total) ${tierLabel}`);
              }
              // Récompense traitée (créditée ou non) — pas de reprise ultérieure.
              await prisma.garage.update({
                where: { id: newGarage.id },
                data: { referralRewardGranted: true },
              });
            }
          }
        }
        break;
      }

      // ── Paiement échoué ──────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const inv = event.data.object as any;
        const failedSubRaw = inv.parent?.subscription_details?.subscription ?? inv.subscription;
        const failedSubId: string | null = typeof failedSubRaw === "string" ? failedSubRaw : failedSubRaw?.id ?? null;
        if (failedSubId) {
          const failedSub = await stripe.subscriptions.retrieve(failedSubId).catch(() => null);
          // Facture d'un abonnement déjà résilié ou expiré : ne pas remettre le garage en « paiement échoué ».
          if (failedSub && ["canceled", "incomplete_expired"].includes(failedSub.status)) break;
        }
        // Démarre la période de grâce au 1er échec seulement (ne pas remettre le
        // compteur à zéro à chaque nouvelle tentative de Stripe).
        await prisma.garage.updateMany({
          where: { stripeCustomerId: inv.customer as string, pastDueSince: null },
          data:  { pastDueSince: new Date() },
        });
        await prisma.garage.updateMany({
          where: { stripeCustomerId: inv.customer as string },
          data:  { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Erreur traitement webhook Stripe :", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(sub: import("stripe").Stripe.Subscription) {
  await syncSubscriptionToGarage(sub);

  if (sub.status === "active") {
    console.log(`✅ Abonnement activé pour customer=${sub.customer}`);
  }
}
