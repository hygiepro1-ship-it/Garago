import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/car-image?make=volkswagen&model=tiguan
 *
 * Proxy côté serveur vers imagin.studio — contourne le blocage
 * des requêtes directes depuis le navigateur.
 * Images mises en cache 24h sur le CDN Vercel.
 */
export async function GET(req: NextRequest) {
  const make  = req.nextUrl.searchParams.get("make")  ?? "";
  const model = req.nextUrl.searchParams.get("model") ?? "";
  const year  = req.nextUrl.searchParams.get("year")  ?? "";

  // Normalise : lowercase, espaces→tirets, premier mot du modèle
  const m  = make.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const mf = model.toLowerCase().split(/[\s,/]/)[0].replace(/[^a-z0-9]/g, "");

  if (!m || !mf) {
    return new NextResponse(null, { status: 400 });
  }

  const yearParam = year ? `&modelYear=${year}` : "";

  const imaginUrl =
    `https://cdn.imagin.studio/getImage` +
    `?customer=img` +
    `&make=${m}` +
    `&modelFamily=${mf}` +
    yearParam +
    `&angle=34` +
    `&width=480` +
    `&zoomType=fullscreen`;

  try {
    const res = await fetch(imaginUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Garago/1.0)",
        "Accept":     "image/webp,image/avif,image/*,*/*;q=0.8",
      },
      // Vercel Edge cache — revalide chaque 24h
      next: { revalidate: 86400 },
    });

    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.startsWith("image/")) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":  ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
