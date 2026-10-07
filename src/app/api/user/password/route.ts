import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isRateLimited } from "@/lib/abuse";

// POST /api/user/password — changer son mot de passe (mot de passe actuel requis).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = session.user.id;

  // Même protection que la connexion : on limite les essais du mot de passe actuel.
  if (await isRateLimited(`pw:${userId}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }
  if (newPassword.length < 8) return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  if (newPassword.length > 128) return NextResponse.json({ error: "Le nouveau mot de passe est trop long (128 caractères maximum)." }, { status: 400 });
  if (newPassword === currentPassword) return NextResponse.json({ error: "Le nouveau mot de passe doit être différent de l'actuel." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user?.password) {
    return NextResponse.json({ error: "Ce compte se connecte avec Google : il n'a pas de mot de passe à changer." }, { status: 400 });
  }
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 403 });
  }

  await prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(newPassword, 12) } });
  return NextResponse.json({ ok: true });
}
