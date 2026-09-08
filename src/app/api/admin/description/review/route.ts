import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDescriptionDecisionEmail } from "@/lib/email";

function htmlPage(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Modération — Garago</title>
      <style>body{font-family:system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;color:#0b1f3a}
      button{background:#f97316;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-weight:700;font-size:15px;cursor:pointer}
      button.reject{background:#dc2626}
      p{line-height:1.6}</style></head><body>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// GET — affiche une page de confirmation SANS effet de bord (sûr même si un
// scanner de liens d'email pré-charge l'URL automatiquement).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token    = searchParams.get("token");
  const garageId = searchParams.get("garageId");
  const action   = searchParams.get("action"); // "approve" | "reject"

  const secret = process.env.ADMIN_REVIEW_SECRET;
  if (!secret) return htmlPage("<p>ADMIN_REVIEW_SECRET non configuré.</p>", 500);
  if (token !== secret) return htmlPage("<p>Non autorisé.</p>", 401);

  if (!garageId || !["approve", "reject"].includes(action ?? ""))
    return htmlPage("<p>Paramètres invalides.</p>", 400);

  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: { id: true, name: true, descriptionDraft: true, descriptionStatus: true },
  });

  if (!garage) return htmlPage("<p>Garage introuvable.</p>", 404);

  if (garage.descriptionStatus !== "PENDING")
    return htmlPage(`<p>Déjà traité (statut : ${garage.descriptionStatus}).</p>`, 200);

  const label = action === "approve" ? "Approuver" : "Refuser";
  return htmlPage(`
    <h2>Confirmation requise</h2>
    <p><strong>Garage :</strong> ${garage.name}</p>
    <p><strong>Description proposée :</strong><br>${garage.descriptionDraft ?? ""}</p>
    <form method="POST" action="${req.url}">
      <button type="submit" class="${action === "reject" ? "reject" : ""}">${label} cette description</button>
    </form>
  `);
}

// POST — exécute réellement la décision. N'est déclenché que par un clic
// humain sur le bouton de confirmation ci-dessus, jamais par un simple GET.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token    = searchParams.get("token");
  const garageId = searchParams.get("garageId");
  const action   = searchParams.get("action");

  const secret = process.env.ADMIN_REVIEW_SECRET;
  if (!secret) return htmlPage("<p>ADMIN_REVIEW_SECRET non configuré.</p>", 500);
  if (token !== secret) return htmlPage("<p>Non autorisé.</p>", 401);

  if (!garageId || !["approve", "reject"].includes(action ?? ""))
    return htmlPage("<p>Paramètres invalides.</p>", 400);

  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: { id: true, name: true, email: true, descriptionDraft: true, descriptionStatus: true, owner: { select: { email: true } } },
  });

  if (!garage) return htmlPage("<p>Garage introuvable.</p>", 404);

  if (garage.descriptionStatus !== "PENDING")
    return htmlPage(`<p>Déjà traité (statut : ${garage.descriptionStatus}).</p>`, 200);

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

    return htmlPage(`<p>✅ Description approuvée pour <strong>${garage.name}</strong>. Elle est maintenant visible publiquement.</p>`);
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

    return htmlPage(`<p>✗ Description refusée pour <strong>${garage.name}</strong>. Le propriétaire a été notifié.</p>`);
  }
}
