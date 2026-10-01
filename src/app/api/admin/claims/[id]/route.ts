import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendClaimDecision } from "@/lib/email";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

// POST /api/admin/claims/[id] — approuver ou refuser une demande de réclamation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json(); // "approve" | "reject"
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const claim = await prisma.claimRequest.findUnique({
    where: { id },
    include: { garage: { select: { id: true, name: true, ownerId: true } } },
  });
  if (!claim) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (claim.status !== "en_attente") {
    return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
  }

  const adminEmail = session.user?.email ?? null;
  let setPasswordUrl: string | undefined;

  if (action === "approve") {
    // Compte existant pour ce courriel, sinon on en crée un sans mot de passe —
    // la personne en choisit un via le code envoyé par courriel (même mécanisme
    // que "mot de passe oublié").
    let user = await prisma.user.findFirst({ where: { email: { equals: claim.email, mode: "insensitive" } } });
    if (!user) {
      user = await prisma.user.create({
        data: { name: claim.name, email: claim.email.toLowerCase(), phone: claim.phone, role: "GARAGE_OWNER" },
      });
    } else if (user.role !== "GARAGE_OWNER") {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: "GARAGE_OWNER" } });
    }

    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.garage.update({
        where: { id: claim.garage.id },
        data: {
          ownerId: user.id,
          claimStatus: "activee",
          neq: claim.neq ?? undefined,
          subscriptionStatus: "TRIAL",
          subscriptionEndAt: trialEndsAt,
        },
      }),
      prisma.claimRequest.update({
        where: { id },
        data: { status: "approuvee", reviewedAt: new Date(), reviewNote: `Approuvé par ${adminEmail ?? "admin"}` },
      }),
      prisma.auditLog.create({
        data: {
          action: "claim_approved",
          targetType: "ClaimRequest",
          targetId: id,
          actorEmail: adminEmail,
          detail: `Fiche ${claim.garage.name} attribuée à ${claim.email}`,
        },
      }),
    ]);

    // Code à usage unique pour définir le mot de passe, via l'écran existant
    // "mot de passe oublié" (fonctionne même sans mot de passe préalable).
    await prisma.passwordResetCode.deleteMany({ where: { email: user.email! } });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.passwordResetCode.create({
      data: { email: user.email!, code, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    });
    setPasswordUrl = `${process.env.NEXTAUTH_URL ?? "https://garagopro.ca"}/mot-de-passe-oublie`;

    sendClaimDecision({
      requesterEmail: claim.email,
      requesterName: claim.name,
      garageName: claim.garage.name,
      approved: true,
      setPasswordUrl,
      resetCode: code,
    }).catch((e) => console.error("[CLAIM DECISION EMAIL]", e));
  } else {
    await prisma.$transaction([
      prisma.claimRequest.update({
        where: { id },
        data: { status: "refusee", reviewedAt: new Date(), reviewNote: `Refusé par ${adminEmail ?? "admin"}` },
      }),
      // La fiche redevient réclamable — ex. si la personne s'est trompée de garage ou n'a pas fourni assez de preuves.
      prisma.garage.update({
        where: { id: claim.garage.id },
        data: { claimStatus: "non_reclamee" },
      }),
      prisma.auditLog.create({
        data: {
          action: "claim_rejected",
          targetType: "ClaimRequest",
          targetId: id,
          actorEmail: adminEmail,
          detail: `Fiche ${claim.garage.name}, demande de ${claim.email} refusée`,
        },
      }),
    ]);

    sendClaimDecision({
      requesterEmail: claim.email,
      requesterName: claim.name,
      garageName: claim.garage.name,
      approved: false,
    }).catch((e) => console.error("[CLAIM DECISION EMAIL]", e));
  }

  return NextResponse.json({ ok: true });
}
