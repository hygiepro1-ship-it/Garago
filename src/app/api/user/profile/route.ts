import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cleanText } from "@/lib/abuse";
import { countUpcomingAppointments } from "@/lib/garage-access";
import bcrypt from "bcryptjs";
import { isRateLimited } from "@/lib/abuse";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name:      true,
      email:     true,
      phone:     true,
      notifPref: true,
      marketingConsent: true,
      password: true,
      vehicles: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: {
          id: true, year: true, make: true, model: true, trim: true, isDefault: true,
          vin: true, tireSize: true, specs: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  // Le hachage du mot de passe ne sort jamais du serveur : on indique seulement si le compte en a un.
  const { password, ...safe } = user;
  return NextResponse.json({ ...safe, hasPassword: !!password });
}

// PATCH /api/user/profile — mise à jour notifPref et/ou phone
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const { notifPref, phone: phoneRaw, name: nameRaw, marketingConsent } = await req.json().catch(() => ({}));
  const phone = phoneRaw === undefined ? undefined : cleanText(phoneRaw, 30);
  const name  = nameRaw  === undefined ? undefined : cleanText(nameRaw, 100);
  if (name !== undefined && name.length < 2) return NextResponse.json({ error: "Nom invalide" }, { status: 400 });

  // Validation notifPref (SMS non disponible pour le moment)
  const validPrefs = ["EMAIL"];
  if (notifPref && !validPrefs.includes(notifPref)) {
    return NextResponse.json({ error: "Préférence invalide" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(notifPref !== undefined ? { notifPref } : {}),
      ...(typeof marketingConsent === "boolean" ? { marketingConsent } : {}),
      ...(phone     !== undefined ? { phone }     : {}),
      ...(name      !== undefined ? { name }      : {}),
    },
    select: { id: true, name: true, email: true, phone: true, notifPref: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/user/profile — suppression définitive du compte
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;

  // Suppression irréversible : on redemande le mot de passe (une session ouverte sur un poste partagé ou volée
  // ne doit pas suffire). Les comptes sans mot de passe (connexion Google) en sont dispensés.
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (account?.password) {
    if (await isRateLimited(`dp:${userId}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const ok = typeof body?.password === "string" && (await bcrypt.compare(body.password, account.password));
    if (!ok) return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (user.role === "GARAGE_OWNER") {
    // Un propriétaire peut avoir plusieurs garages (principal + succursales) — tous
    // partagent le même client Stripe, porté par le garage principal.
    const garages = await prisma.garage.findMany({
      where: { ownerId: userId },
      select: { id: true, stripeCustomerId: true },
    });
    // La suppression efface les garages et leurs rendez-vous : on refuse tant qu'il reste des clients attendus.
    const upcoming = await countUpcomingAppointments(garages.map((g) => g.id));
    if (upcoming > 0) {
      return NextResponse.json(
        { error: `Vous avez ${upcoming} rendez-vous à venir. Annulez-les ou terminez-les avant de supprimer votre compte, pour ne pas laisser des clients sans réponse.` },
        { status: 409 }
      );
    }
    const stripeCustomerId = garages.find((g) => g.stripeCustomerId)?.stripeCustomerId ?? null;

    if (stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      try {
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
        const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "active" });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      } catch (e) {
        console.error("[account/delete] Erreur annulation Stripe :", e);
        return NextResponse.json(
          { error: "Impossible d'annuler l'abonnement Stripe. Contactez le support avant de réessayer." },
          { status: 500 }
        );
      }
    }

    for (const g of garages) {
      // Seul GarageFavorite (favoris d'AUTRES utilisateurs sur ce garage) n'a pas de cascade en base
      await prisma.garageFavorite.deleteMany({ where: { garageId: g.id } });
      await prisma.garage.delete({ where: { id: g.id } });
    }
  }

  // Données personnelles du compte sans cascade en base
  await prisma.review.deleteMany({ where: { userId } });
  await prisma.garageFavorite.deleteMany({ where: { userId } });
  await prisma.maintenanceReminder.deleteMany({ where: { userId } });
  await prisma.userVehicle.deleteMany({ where: { userId } });
  // Rendez-vous pris chez d'autres garages : on délie le compte plutôt que de supprimer
  // l'historique de rendez-vous du garage (userId est nullable — "manuel"/anonyme).
  await prisma.appointment.updateMany({ where: { userId }, data: { userId: null } });

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
