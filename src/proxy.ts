import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Mode maintenance : bloque la navigation vers les pages du site quand il est
 * activé (depuis /tableau-de-bord/admin), sauf pour la connexion, l'espace
 * admin et les API — l'admin doit toujours pouvoir se reconnecter et
 * désactiver la maintenance. Les webhooks Stripe, l'authentification et les
 * tâches planifiées (cron) passent toujours par /api et ne sont donc jamais
 * bloqués.
 *
 * Le résultat est mis en cache en mémoire quelques secondes pour éviter une
 * requête base de données à chaque navigation — un délai de quelques
 * secondes pour l'activation/désactivation est sans conséquence ici.
 */

// Proxy tourne sur le runtime Node.js par défaut (Next.js 16) — accès direct à
// Prisma sans passer par un pilote compatible Edge.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|ttf|map|txt|xml)$).*)",
  ],
};

// Chemins exacts autorisés pendant la maintenance (sans les sous-chemins)
const ALLOWED_EXACT = ["/connexion", "/tableau-de-bord", "/maintenance"];
// Préfixes autorisés (la route et tout ce qui suit) — uniquement l'espace admin,
// surtout pas "/tableau-de-bord" seul qui inclurait aussi /garage et /conducteur.
const ALLOWED_PREFIXES = ["/tableau-de-bord/admin"];

function isAllowedPage(pathname: string): boolean {
  if (ALLOWED_EXACT.includes(pathname)) return true;
  return ALLOWED_PREFIXES.some((p) => pathname.startsWith(p + "/") || pathname === p);
}

type MaintenanceState = { active: boolean; message: string | null; until: string | null };
let cached: { state: MaintenanceState; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5000;

async function getMaintenanceState(): Promise<MaintenanceState> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.state;

  let state: MaintenanceState = { active: false, message: null, until: null };
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
    if (setting) {
      state = {
        active: setting.maintenanceMode,
        message: setting.maintenanceMessage,
        until: setting.maintenanceUntil ? setting.maintenanceUntil.toISOString() : null,
      };
    }
  } catch {
    // Échec de connexion à la base : on n'affiche pas la maintenance par erreur
    // (fail-open) — on garde la dernière valeur connue si elle existe.
    if (cached) return cached.state;
  }

  cached = { state, fetchedAt: Date.now() };
  return state;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAllowedPage(pathname)) {
    return NextResponse.next();
  }

  const state = await getMaintenanceState();
  if (!state.active) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.rewrite(url);
}
