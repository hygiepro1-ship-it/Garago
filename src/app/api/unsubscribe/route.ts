import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

function page(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
      <title>Désabonnement | Garago</title>
      <style>body{font-family:system-ui,sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#0b1f3a}
      button{background:#0b1f3a;color:#fff;border:0;border-radius:6px;padding:12px 20px;font-weight:700;font-size:15px;cursor:pointer}
      p{line-height:1.6}</style></head><body>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// GET : simple page de confirmation, SANS effet de bord (les logiciels de sécurité des courriels ouvrent les liens
// automatiquement : un GET qui désabonnerait déjà ferait perdre des abonnés par erreur).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  const email = verifyUnsubscribeToken(token);
  if (!email) return page("<h2>Lien invalide</h2><p>Ce lien de désabonnement n'est pas valide ou est incomplet.</p>", 400);
  return page(`
    <h2>Se désabonner des courriels de Garago</h2>
    <p>Vous ne recevrez plus nos conseils auto et communications promotionnelles. Vous continuerez à recevoir les courriels liés à vos rendez-vous et à votre compte.</p>
    <form method="POST" action="/api/unsubscribe?t=${encodeURIComponent(token ?? "")}">
      <button type="submit">Confirmer le désabonnement</button>
    </form>`);
}

// POST : exécute le désabonnement. Accepte aussi le « désabonnement en un clic » (RFC 8058) envoyé directement
// par Gmail, Outlook et Yahoo à partir de l'en-tête List-Unsubscribe.
export async function POST(req: NextRequest) {
  const email = verifyUnsubscribeToken(req.nextUrl.searchParams.get("t"));
  if (!email) return page("<h2>Lien invalide</h2><p>Ce lien de désabonnement n'est pas valide.</p>", 400);
  await prisma.user.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { marketingConsent: false } });
  await prisma.auditLog.create({
    data: { action: "marketing_unsubscribed", targetType: "User", targetId: email, actorEmail: email, detail: "Désabonnement par lien dans un courriel" },
  }).catch(() => {});
  return page("<h2>Vous êtes désabonné</h2><p>C'est confirmé : vous ne recevrez plus de courriels promotionnels de Garago.</p>");
}
