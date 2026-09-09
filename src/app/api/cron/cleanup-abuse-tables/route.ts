import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Purge les vieilles lignes des tables anti-abus (elles n'ont pas de TTL natif
// et grossiraient indéfiniment sinon — les fenêtres de rate-limit ne dépassent
// jamais 15 minutes, donc tout ce qui a plus de 7 jours est inutile).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [registrationAttempts, loginAttempts, passwordResetCodes, emailVerificationCodes] = await Promise.all([
    prisma.registrationAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.passwordResetCode.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.emailVerificationCode.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      registrationAttempts: registrationAttempts.count,
      loginAttempts: loginAttempts.count,
      passwordResetCodes: passwordResetCodes.count,
      emailVerificationCodes: emailVerificationCodes.count,
    },
  });
}
