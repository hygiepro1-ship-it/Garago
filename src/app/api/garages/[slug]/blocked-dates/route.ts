import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/garages/[slug]/blocked-dates?month=YYYY-MM
// Liste publique des journées entières indisponibles (vacances, fermeture exceptionnelle)
// pour un garage donné — utilisée pour griser ces dates dans le calendrier de réservation.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const month = req.nextUrl.searchParams.get("month"); // "YYYY-MM"
  if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

  const garage = await prisma.garage.findUnique({ where: { slug }, select: { id: true } });
  if (!garage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocked = await prisma.blockedSlot.findMany({
    where: { garageId: garage.id, allDay: true, date: { gte: `${month}-01`, lte: `${month}-31` } },
    select: { date: true },
  });

  return NextResponse.json({ dates: blocked.map((b) => b.date) });
}
