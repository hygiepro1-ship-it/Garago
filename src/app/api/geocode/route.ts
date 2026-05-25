import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for Nominatim (OpenStreetMap geocoding).
 * Running server-side lets us set User-Agent correctly (required by Nominatim ToS)
 * and avoids any CORS issue.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "ca");   // Canada only
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "fr");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "GarageQC/1.0 (garageqc.ca)",
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // cache 60s
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
