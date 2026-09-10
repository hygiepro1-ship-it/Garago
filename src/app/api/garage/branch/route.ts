import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { geocodeAddress } from "@/lib/geocode";
import { getBillingGarage } from "@/lib/garage-access";
import { MAX_GARAGES_PER_OWNER, syncBranchQuantity } from "@/lib/stripe-branches";

export const dynamic = "force-dynamic";

/**
 * POST /api/garage/branch — ajoute une succursale au dossier du propriétaire.
 *
 * La succursale a un profil indépendant mais partage l'abonnement du garage
 * principal. Si l'abonnement est actif, Stripe facture immédiatement le prorata
 * du garage supplémentaire (+49,99 $/mois, −20 % en annuel).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "GARAGE_OWNER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const userId = session.user.id;

  const principal = await getBillingGarage(userId);
  if (!principal) return NextResponse.json({ error: "Garage principal introuvable" }, { status: 404 });

  // On ne peut ajouter une succursale que si l'abonnement du dossier est en cours
  // (actif ou en essai) — sinon le nouveau garage serait invisible de toute façon.
  if (principal.subscriptionStatus !== "ACTIVE" && principal.subscriptionStatus !== "TRIAL") {
    return NextResponse.json(
      { error: "Activez ou régularisez votre abonnement avant d'ajouter une succursale." },
      { status: 409 },
    );
  }

  const total = await prisma.garage.count({ where: { ownerId: userId } });
  if (total >= MAX_GARAGES_PER_OWNER) {
    return NextResponse.json(
      { error: `Limite de ${MAX_GARAGES_PER_OWNER} garages atteinte. Contactez-nous pour un compte multi-sites.` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? "").trim();
  const address = (body.address ?? "").trim();
  const city = (body.city ?? "").trim();
  const postalCode = (body.postalCode ?? "").trim();
  const phone = (body.phone ?? "").trim();

  if (!name || !address || !city) {
    return NextResponse.json({ error: "Nom, adresse et ville sont requis." }, { status: 422 });
  }

  // Slug unique
  const baseSlug = slugify(name);
  let slug = baseSlug || "garage";
  let i = 1;
  while (await prisma.garage.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  // Géocodage
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (body.latitude != null && body.longitude != null) {
    latitude = parseFloat(body.latitude);
    longitude = parseFloat(body.longitude);
  } else if (address && city) {
    const coords = await geocodeAddress(address, city);
    if (coords) { latitude = coords.latitude; longitude = coords.longitude; }
  }

  // La succursale hérite du statut d'abonnement du principal — aucun code de
  // parrainage ni avantage ambassadeur (le programme ambassadeur ne concerne
  // que le garage qui porte l'abonnement).
  const branch = await prisma.garage.create({
    data: {
      ownerId: userId,
      parentId: principal.id,
      name,
      slug,
      address,
      city,
      province: principal.province,
      postalCode,
      phone: phone || principal.phone,
      latitude,
      longitude,
      subscriptionStatus: principal.subscriptionStatus,
      subscriptionEndAt: principal.subscriptionEndAt,
      stripeCustomerId: principal.stripeCustomerId,
    },
  });

  // Facturation du garage supplémentaire si un abonnement est actif
  if (principal.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
      const subs = await stripe.subscriptions.list({ customer: principal.stripeCustomerId, status: "active", limit: 1 });
      if (subs.data[0]) await syncBranchQuantity(stripe, subs.data[0], userId);
    } catch (e) {
      console.error("[garage/branch] Erreur sync Stripe :", e);
      // Non-bloquant : la succursale est créée, la quantité sera recalée au prochain ajustement.
    }
  }

  return NextResponse.json({ id: branch.id, slug: branch.slug });
}
