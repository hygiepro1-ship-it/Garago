import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDaysStr, quebecToday } from "@/lib/availability";
import { REVIEW_WINDOW_DAYS } from "@/lib/review-checks";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

// Purge les vieilles lignes des tables anti-abus (elles n'ont pas de TTL natif
// et grossiraient indéfiniment sinon — les fenêtres de rate-limit ne dépassent
// jamais 15 minutes, donc tout ce qui a plus de 7 jours est inutile).
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Codes d'avis (src/lib/review-checks.ts) : effacés 15 jours après la date du rendez-vous.
  const reviewCutoff = addDaysStr(quebecToday(), -REVIEW_WINDOW_DAYS);

  const [registrationAttempts, loginAttempts, passwordResetCodes, emailVerificationCodes, reviewTokens] = await Promise.all([
    prisma.registrationAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.passwordResetCode.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.emailVerificationCode.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.appointment.updateMany({ where: { reviewToken: { not: null }, date: { lt: reviewCutoff } }, data: { reviewToken: null } }),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      registrationAttempts: registrationAttempts.count,
      loginAttempts: loginAttempts.count,
      passwordResetCodes: passwordResetCodes.count,
      emailVerificationCodes: emailVerificationCodes.count,
      reviewTokens: reviewTokens.count,
    },
  });
}
