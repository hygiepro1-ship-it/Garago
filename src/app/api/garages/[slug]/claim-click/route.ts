import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";

export const dynamic = "force-dynamic";

// POST /api/garages/[slug]/claim-click — compte un clic sur « Activez votre page »
// d'une fiche non réclamée, pour mesurer le passage vue → clic → demande.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Un seul clic compté par visiteur et par fiche toutes les 30 minutes, comme les vues.
    if (await isRateLimited(`cc:${clientIp(req)}:${slug}`, 1, 30 * 60 * 1000)) {
      return NextResponse.json({ ok: true });
    }
    const garage = await prisma.garage.findUnique({ where: { slug }, select: { id: true, claimStatus: true } });
    if (!garage) return NextResponse.json({ ok: false }, { status: 404 });
    if (garage.claimStatus !== "non_reclamee") return NextResponse.json({ ok: true });

    await prisma.claimCtaClick.create({ data: { garageId: garage.id } });
    return NextResponse.json({ ok: true });
  } catch {
    // La mesure ne doit jamais bloquer l'ouverture du formulaire.
    return NextResponse.json({ ok: false });
  }
}
