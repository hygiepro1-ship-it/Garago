import { NextRequest, NextResponse } from "next/server";

// Lien court des textos : /c/<jeton> → page de confirmation du rendez-vous.
// Le jeton est validé par la page elle-même (voir /api/rdv/[token]).
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const safe = /^[a-f0-9]{48}$/.test(token) ? token : "invalide";
  return NextResponse.redirect(new URL(`/rdv/confirmer/${safe}`, req.url));
}
