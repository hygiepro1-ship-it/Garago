import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy vers Photon (komoot.io) — meilleur moteur d'autocomplétion que Nominatim pour le Canada.
 * Photon utilise les données OpenStreetMap avec un index Elasticsearch optimisé.
 * Pas de clé API requise, rate limit généreux.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lang", "fr");
  // Focusé sur le Canada : bbox lon_min,lat_min,lon_max,lat_max
  url.searchParams.set("bbox", "-141,42,-52,84");
  // Biais géographique sur le Québec pour les résultats les plus pertinents
  url.searchParams.set("lat", "46.0");
  url.searchParams.set("lon", "-73.0");
  // Seulement les adresses et bâtiments (pas les parcs, rivières, etc.)
  url.searchParams.set("osm_tag", "place:house");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Garago/1.0 (garago.ca)",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const features = data.features ?? [];

    // Filter: Canada only, must have street info
    const filtered = features.filter((f: any) => {
      const p = f.properties ?? {};
      return p.countrycode === "CA" && (p.street || p.name);
    });

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
