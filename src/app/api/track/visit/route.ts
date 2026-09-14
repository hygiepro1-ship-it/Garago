import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "gpv_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

// POST /api/track/visit — enregistre une visite anonyme (une par session de
// navigateur, pas par page vue — voir VisitorTracker.tsx). Aucune donnée
// personnelle collectée : un identifiant aléatoire dans un cookie, jamais lié
// à un compte.
export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json().catch(() => ({ path: "/" }));
    let visitorId = req.cookies.get(COOKIE_NAME)?.value;
    const isNew = !visitorId;
    if (!visitorId) visitorId = randomUUID();

    await prisma.siteVisit.create({
      data: { visitorId, path: typeof path === "string" ? path.slice(0, 200) : "/" },
    });

    const res = NextResponse.json({ ok: true });
    if (isNew) {
      res.cookies.set(COOKIE_NAME, visitorId, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    }
    return res;
  } catch {
    // Le suivi de visites ne doit jamais faire échouer la navigation.
    return NextResponse.json({ ok: false });
  }
}
