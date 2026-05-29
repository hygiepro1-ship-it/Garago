import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q") ?? "";
  const type  = req.nextUrl.searchParams.get("type"); // "postcode" for postal geocoding
  const lat   = req.nextUrl.searchParams.get("lat");
  const lng   = req.nextUrl.searchParams.get("lng");
  const tight = req.nextUrl.searchParams.get("tight") === "1";

  if (q.trim().length < 3) return NextResponse.json([]);

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", type === "postcode" ? "1" : "6");
  url.searchParams.set("lang", "fr");
  url.searchParams.set("bbox", "-141,42,-52,84");

  // Geo-bias: use postal center if available, otherwise default to Quebec
  if (lat && lng) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
  } else {
    url.searchParams.set("lat", "46.0");
    url.searchParams.set("lon", "-73.0");
  }

  // For street search biased tightly on a postal center, limit to addresses only
  if (type !== "postcode") {
    url.searchParams.set("osm_tag", "place:house");
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Garago/1.0 (garago.ca)", Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json([]);

    const data     = await res.json();
    const features = data.features ?? [];

    const filtered = features.filter((f: any) => {
      const p = f.properties ?? {};
      if (p.countrycode !== "CA") return false;
      if (type === "postcode") return true;
      // For street search: must have a street
      if (!p.street && !p.name) return false;
      // If tight mode (postal center known): filter to results near the center
      if (tight && lat && lng) {
        const [fLng, fLat] = f.geometry?.coordinates ?? [0, 0];
        const dlat = fLat - parseFloat(lat);
        const dlng = fLng - parseFloat(lng);
        const dist = Math.sqrt(dlat * dlat + dlng * dlng);
        return dist < 0.15; // ~15km radius
      }
      return true;
    });

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
