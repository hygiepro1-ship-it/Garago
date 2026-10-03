import { NextRequest, NextResponse } from "next/server";

const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[A-Z]\d[A-Z]\d$/;
const UA = "Garago/1.0 (garagopro.ca)";

// Code postal canadien -> coordonnées. Code complet via Nominatim (OpenStreetMap),
// sinon repli sur la zone (3 premiers caractères) via Zippopotam.
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").toUpperCase().replace(/\s/g, "");
  if (!POSTAL.test(code)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;

  try {
    const u = new URL("https://nominatim.openstreetmap.org/search");
    u.searchParams.set("postalcode", spaced);
    u.searchParams.set("country", "ca");
    u.searchParams.set("format", "json");
    u.searchParams.set("limit", "1");
    const r = await fetch(u, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    if (r.ok) {
      const d = await r.json();
      const lat = parseFloat(d?.[0]?.lat), lng = parseFloat(d?.[0]?.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return NextResponse.json({ lat, lng, precision: "full" });
    }
  } catch { /* repli ci-dessous */ }

  try {
    const r = await fetch(`https://api.zippopotam.us/ca/${code.slice(0, 3)}`, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    if (r.ok) {
      const p = (await r.json())?.places?.[0];
      const lat = parseFloat(p?.latitude), lng = parseFloat(p?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return NextResponse.json({ lat, lng, precision: "area" });
    }
  } catch { /* introuvable */ }

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
