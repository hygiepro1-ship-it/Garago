import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGarageProfile } from "@/lib/garage-profile";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const garage = await getGarageProfile(slug, async () => {
      const session = await getServerSession(authOptions);
      return session?.user ? { id: session.user.id, role: (session.user as any).role } : null;
    });
    if (!garage) {
      return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });
    }
    return NextResponse.json(garage);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
