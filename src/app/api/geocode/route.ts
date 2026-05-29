import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q") ?? "";
  const type  = req.nextUrl.searchParams.get("type");
  const lat   = req.nextUrl.searchParams.get("lat");
  const lng   = req.nextUrl.searchParams.get("lng");
  // Bounding box from postal extent for tight filtering: "minLng,minLat,maxLng,maxLat"
  const bbox  = req.nextUrl.searchParams.get("bbox");

  if (q.trim().length < 3) return NextResponse.json([]);

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", type === "postcode" ? "1" : "6");
  url.searchParams.set("lang", "fr");
  url.searchParams.set("bbox", "-141,42,-52,84");

  if (lat && lng) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
  } else {
    url.searchParams.set("lat", "46.0");
    url.searchParams.set("lon", "-73.0");
  }

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

    // Parse postal extent for tight filtering
    let extentBbox: [number, number, number, number] | null = null;
    if (bbox) {
      const parts = bbox.split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        extentBbox = parts as [number, number, number, number];
      }
    }

    const filtered = features.filter((f: any) => {
      const p = f.properties ?? {};
      if (p.countrycode !== "CA") return false;
      if (type === "postcode") return true;
      if (!p.street && !p.name) return false;
      // Filter strictly within the postal extent bounding box
      if (extentBbox) {
        const [fLng, fLat] = f.geometry?.coordinates ?? [0, 0];
        const [minLng, minLat, maxLng, maxLat] = extentBbox;
        // Add 20% margin around the extent
        const mLng = (maxLng - minLng) * 0.2;
        const mLat = (maxLat - minLat) * 0.2;
        return fLng >= minLng - mLng && fLng <= maxLng + mLng &&
               fLat >= minLat - mLat && fLat <= maxLat + mLat;
      }
      return true;
    });

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
