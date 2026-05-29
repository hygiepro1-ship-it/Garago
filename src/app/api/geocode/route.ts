import { NextRequest, NextResponse } from "next/server";

function normalizePostal(p: string) {
  return p.toUpperCase().replace(/\s/g, "");
}

export async function GET(req: NextRequest) {
  const q        = req.nextUrl.searchParams.get("q") ?? "";
  const type     = req.nextUrl.searchParams.get("type");
  const lat      = req.nextUrl.searchParams.get("lat");
  const lng      = req.nextUrl.searchParams.get("lng");
  const postcode = req.nextUrl.searchParams.get("postcode"); // exact postcode filter

  if (q.trim().length < 3) return NextResponse.json([]);

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", type === "postcode" ? "1" : "10");
  url.searchParams.set("lang", "fr");
  url.searchParams.set("bbox", "-141,42,-52,84");

  if (lat && lng) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
  } else {
    url.searchParams.set("lat", "46.0");
    url.searchParams.set("lon", "-73.0");
  }

  // No osm_tag filter for address searches — we allow houses AND streets,
  // then filter by postcode/radius in code. For postcode lookups, keep default.
  if (type === "postcode") {
    // no additional filter needed
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Garago/1.0 (garago.ca)", Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json([]);

    const data     = await res.json();
    const features = data.features ?? [];

    const normalizedTarget = postcode ? normalizePostal(postcode) : null;
    const centerLat = lat ? parseFloat(lat) : null;
    const centerLng = lng ? parseFloat(lng) : null;

    const filtered = features.filter((f: any) => {
      const p = f.properties ?? {};
      if (p.countrycode !== "CA") return false;
      if (type === "postcode") return true;
      // Reject transit stops, waterways, parks — keep only routable addresses
      const REJECT_KEYS = ["railway", "waterway", "natural", "leisure", "tourism", "amenity"];
      if (REJECT_KEYS.includes(p.osm_key)) return false;

      const isAddress = p.type === "house" || (p.street && p.housenumber);
      const isStreet  = p.type === "street";
      if (!isAddress && !isStreet) return false;

      if (normalizedTarget) {
        const targetFsa = normalizedTarget.slice(0, 3); // Forward Sortation Area (H2G)
        if (p.postcode) {
          // Match by FSA (first 3 chars) — same neighbourhood, different house codes are fine
          return normalizePostal(p.postcode).slice(0, 3) === targetFsa;
        }
        // No postcode in result — keep only if within ~2 km of the postal center
        if (centerLat !== null && centerLng !== null) {
          const [fLng, fLat] = f.geometry?.coordinates ?? [0, 0];
          return Math.abs(fLat - centerLat) <= 0.018 && Math.abs(fLng - centerLng) <= 0.025;
        }
        return false;
      }

      return true;
    });

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
