import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncBranchQuantity } from "@/lib/stripe-branches";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/garage/branch/[id] — retire une succursale du dossier.
 *
 * Le profil est supprimé (invisible immédiatement dans la recherche) et la
 * facture baisse du montant du garage supplémentaire dès le prochain ajustement
 * Stripe. Le garage principal ne peut pas être retiré par cette route.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "GARAGE_OWNER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const branch = await prisma.garage.findFirst({ where: { id, ownerId: userId } });
  if (!branch) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });
  if (branch.parentId === null) {
    return NextResponse.json(
      { error: "Le garage principal ne peut pas être retiré ici. Utilisez « Supprimer mon compte » ou changez de garage principal." },
      { status: 400 },
    );
  }

  await prisma.garageFavorite.deleteMany({ where: { garageId: branch.id } });
  await prisma.garage.delete({ where: { id: branch.id } });

  // Ajuste la facturation Stripe (une succursale de moins)
  if (branch.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
      const subs = await stripe.subscriptions.list({ customer: branch.stripeCustomerId, status: "active", limit: 1 });
      if (subs.data[0]) await syncBranchQuantity(stripe, subs.data[0], userId);
    } catch (e) {
      console.error("[garage/branch] Erreur sync Stripe (retrait) :", e);
    }
  }

  return NextResponse.json({ ok: true });
}
