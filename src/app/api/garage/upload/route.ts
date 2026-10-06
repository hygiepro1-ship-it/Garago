import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "GARAGE_OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = session.user.id;
    const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(ownerId, readGarageId(req.url)) });
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

    // Le type MIME est déclaré par le client : on vérifie aussi les premiers octets du fichier.
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const isPng  = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isWebp = head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    const okSignature = (file.type === "image/jpeg" && isJpeg) || (file.type === "image/png" && isPng) || (file.type === "image/webp" && isWebp);
    if (!okSignature) {
      return NextResponse.json({ error: "Le fichier n'est pas une vraie image JPEG, PNG ou WebP." }, { status: 400 });
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
