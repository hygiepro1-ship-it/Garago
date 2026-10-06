import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendGarageVerificationDecision } from "@/lib/email";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

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

  const garage = await prisma.garage.findUnique({
    where: { id },
    select: { name: true, owner: { select: { email: true } } },
  });
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  await prisma.garage.update({
    where: { id },
    data: { verificationStatus: action === "approve" ? "APPROVED" : "REJECTED" },
  });
  await prisma.auditLog.create({
    data: {
      action: action === "approve" ? "garage_verified" : "garage_rejected",
      targetType: "Garage", targetId: id,
      actorEmail: (session.user as any)?.email ?? null,
      detail: `Vérification du NEQ : ${garage.name}`,
    },
  });

  if (garage.owner?.email) {
    sendGarageVerificationDecision({
      ownerEmail: garage.owner.email,
      garageName: garage.name,
      approved: action === "approve",
    }).catch(e => console.error("[GARAGE VERIFICATION DECISION EMAIL]", e));
  }

  return NextResponse.json({ ok: true });
}
