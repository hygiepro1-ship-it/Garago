import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDescriptionDecisionEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token    = searchParams.get("token");
  const garageId = searchParams.get("garageId");
  const action   = searchParams.get("action"); // "approve" | "reject"

  const secret = process.env.ADMIN_REVIEW_SECRET;
  if (!secret) return new NextResponse("ADMIN_REVIEW_SECRET non configuré", { status: 500 });
  if (token !== secret)
    return new NextResponse("Non autorisé", { status: 401 });

  if (!garageId || !["approve", "reject"].includes(action ?? ""))
    return new NextResponse("Paramètres invalides", { status: 400 });

  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: { id: true, name: true, email: true, descriptionDraft: true, descriptionStatus: true, owner: { select: { email: true } } },
  });

  if (!garage)
    return new NextResponse("Garage introuvable", { status: 404 });

  if (garage.descriptionStatus !== "PENDING")
    return new NextResponse(`Déjà traité (statut: ${garage.descriptionStatus})`, { status: 200 });

  if (action === "approve") {
    await prisma.garage.update({
      where: { id: garageId },
      data: {
        description:       garage.descriptionDraft,
        descriptionDraft:  null,
        descriptionStatus: "APPROVED",
      },
    });

    sendDescriptionDecisionEmail({
      ownerEmail: garage.owner?.email ?? garage.email ?? "",
      garageName: garage.name,
      approved:   true,
    }).catch(console.error);

    return new NextResponse(
      `✅ Description approuvée pour ${garage.name}. Elle est maintenant visible publiquement.`,
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  } else {
    await prisma.garage.update({
      where: { id: garageId },
      data: { descriptionStatus: "REJECTED" },
    });

    sendDescriptionDecisionEmail({
      ownerEmail: garage.owner?.email ?? garage.email ?? "",
      garageName: garage.name,
      approved:   false,
    }).catch(console.error);

    return new NextResponse(
      `✗ Description refusée pour ${garage.name}. Le propriétaire a été notifié.`,
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
