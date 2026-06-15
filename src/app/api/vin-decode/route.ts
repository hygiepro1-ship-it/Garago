import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get("vin")?.trim().toUpperCase();
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "NIV invalide — doit contenir exactement 17 caractères." }, { status: 400 });
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur lors de la consultation du registre NHTSA." }, { status: 502 });
  }

  const data = await res.json();
  const r = data?.Results?.[0];

  if (!r || r.ErrorCode !== "0") {
    const msg = r?.AdditionalErrorText || "NIV non reconnu.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // Taille de pneu : NHTSA retourne FrontTireSize / RearTireSize
  const frontTire = r.FrontTireSize?.trim() || null;
  const rearTire  = r.RearTireSize?.trim()  || null;
  let tireSize: string | null = null;
  if (frontTire && rearTire && frontTire !== rearTire) {
    tireSize = `Av. ${frontTire} / Ar. ${rearTire}`;
  } else {
    tireSize = frontTire || rearTire || null;
  }

  return NextResponse.json({
    vin,
    year:     r.ModelYear     ? parseInt(r.ModelYear)   : null,
    make:     r.Make          ? capitalise(r.Make)       : null,
    model:    r.Model         || null,
    trim:     r.Trim          || null,
    bodyType: r.BodyClass     || null,
    engine:   r.DisplacementL ? `${r.DisplacementL}L ${r.FuelTypePrimary || ""}`.trim() : null,
    tireSize,
  });
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
