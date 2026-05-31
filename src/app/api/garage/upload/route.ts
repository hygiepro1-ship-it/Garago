import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "GARAGE_OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = (session.user as any).id;
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

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `garages/${garage.id}/${type}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    const update = type === "logo" ? { logoUrl: blob.url } : { coverUrl: blob.url };
    await prisma.garage.update({ where: { id: garage.id }, data: update });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 });
  }
}
