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
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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

  if (garage.owner?.email) {
    sendGarageVerificationDecision({
      ownerEmail: garage.owner.email,
      garageName: garage.name,
      approved: action === "approve",
    }).catch(e => console.error("[GARAGE VERIFICATION DECISION EMAIL]", e));
  }

  return NextResponse.json({ ok: true });
}
