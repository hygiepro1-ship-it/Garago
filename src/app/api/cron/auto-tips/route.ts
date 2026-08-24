import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyTips } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Vérifie l'autorisation Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();

  // Trouve les 2 conseils de cette semaine (publishAt <= maintenant, pas encore envoyés)
  const tips = await prisma.autoTip.findMany({
    where: { publishAt: { lte: now }, sentAt: null },
    orderBy: { publishAt: "asc" },
    take: 2,
  });

  if (tips.length === 0) {
    return NextResponse.json({ message: "Aucun conseil à envoyer", sent: 0 });
  }

  // Récupère tous les utilisateurs ayant consenti au marketing
  const users = await prisma.user.findMany({
    where: { marketingConsent: true, email: { not: null } },
    select: { email: true, name: true },
  });

  const recipients = users
    .filter((u) => u.email)
    .map((u) => ({ email: u.email!, name: u.name }));

  if (recipients.length > 0) {
    await sendWeeklyTips({
      recipients,
      tips: tips.map((t) => ({
        title:    t.title,
        content:  t.content,
        category: t.category,
        season:   t.season,
      })),
      conseilsUrl: `${process.env.NEXTAUTH_URL ?? "https://garagopro.ca"}/conseils`,
    });
  }

  // Marque les conseils comme envoyés
  await prisma.autoTip.updateMany({
    where: { id: { in: tips.map((t) => t.id) } },
    data:  { sentAt: now },
  });

  return NextResponse.json({
    message: "Conseils envoyés",
    tipCount: tips.length,
    recipientCount: recipients.length,
  });
}
