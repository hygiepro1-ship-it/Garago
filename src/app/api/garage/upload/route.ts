import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import prisma from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "GARAGE_OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = session.user.id;
    const garage = await prisma.garage.findUnique({ where: { ownerId } });
    if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "logo" | "cover"

    if (!file || !type) {
      return NextResponse.json({ error: "Fichier et type requis" }, { status: 400 });
    }

    if (!["logo", "cover"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format invalide — utilisez une image JPEG, PNG ou WebP" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux — 5 Mo maximum" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `garages/${garage.id}/${type}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    const previousUrl = type === "logo" ? garage.logoUrl : garage.coverUrl;
    const update = type === "logo" ? { logoUrl: blob.url } : { coverUrl: blob.url };
    await prisma.garage.update({ where: { id: garage.id }, data: update });

    // Supprime l'ancienne image pour éviter une fuite de stockage (coûts qui augmentent indéfiniment)
    if (previousUrl) {
      del(previousUrl).catch((e) => console.error("[garage/upload] Échec suppression ancien blob :", e));
    }

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 });
  }
}
