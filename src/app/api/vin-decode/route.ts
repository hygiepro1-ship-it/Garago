import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get("vin")?.trim().toUpperCase();
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "NIV invalide — doit contenir exactement 17 caractères." }, { status: 400 });
  }

  // Appels parallèles : specs véhicule + rappels actifs
  const [specsRes, recallsRes] = await Promise.allSettled([
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, { next: { revalidate: 86400 } }),
    fetch(`https://api.nhtsa.gov/recalls/recallsByVin?vin=${vin}`,                      { next: { revalidate: 3600  } }),
  ]);

  if (specsRes.status === "rejected" || !specsRes.value.ok) {
    return NextResponse.json({ error: "Erreur lors de la consultation du registre NHTSA." }, { status: 502 });
  }

  const specsData = await specsRes.value.json();
  const r = specsData?.Results?.[0];

  if (!r || (r.ErrorCode !== "0" && r.ErrorCode !== "6")) {
    return NextResponse.json({ error: r?.AdditionalErrorText || "NIV non reconnu." }, { status: 422 });
  }

  // ── Pneus ─────────────────────────────────────────────────────────────────
  const frontTire = r.FrontTireSize?.trim() || null;
  const rearTire  = r.RearTireSize?.trim()  || null;
  let tireSize: string | null = null;
  if (frontTire && rearTire && frontTire !== rearTire) {
    tireSize = `Av. ${frontTire} / Ar. ${rearTire}`;
  } else {
    tireSize = frontTire || rearTire || null;
  }

  // ── Moteur ────────────────────────────────────────────────────────────────
  const displ = r.DisplacementL ? parseFloat(r.DisplacementL).toFixed(1) : null;
  const cyl   = r.EngineCylinders ? `${r.EngineCylinders} cyl` : null;
  const hp    = r.EngineHP        ? parseInt(r.EngineHP)        : null;
  const engineParts = [displ ? `${displ}L` : null, cyl].filter(Boolean).join(" ");
  const engine = engineParts || null;

  // ── Carburant ─────────────────────────────────────────────────────────────
  const FUEL_MAP: Record<string, string> = {
    "Gasoline":                                    "Essence",
    "Diesel":                                      "Diesel",
    "Electric":                                    "Électrique",
    "Flex Fuel (FFVL)":                            "Flex-fuel",
    "Plug-in Hybrid/Electric Vehicle (PHEV)":      "PHEV",
    "Hybrid Electric Vehicle (HEV)":               "Hybride",
    "Natural Gas":                                 "Gaz naturel",
    "Hydrogen":                                    "Hydrogène",
  };
  const fuel = FUEL_MAP[r.FuelTypePrimary] ?? r.FuelTypePrimary ?? null;

  // ── Transmission ──────────────────────────────────────────────────────────
  const TRANS_MAP: Record<string, string> = {
    "Automatic":         "Automatique",
    "Manual/Standard":   "Manuelle",
    "CVT":               "CVT",
    "Semi-Automatic":    "Semi-automatique",
    "Dual-Clutch":       "Double embrayage (DCT)",
  };
  const transBase = TRANS_MAP[r.TransmissionStyle] ?? r.TransmissionStyle ?? null;
  const transSpeeds = r.TransmissionSpeeds && r.TransmissionSpeeds !== "0" ? ` ${r.TransmissionSpeeds} rapports` : "";
  const transmission = transBase ? `${transBase}${transSpeeds}` : null;

  // ── Traction ──────────────────────────────────────────────────────────────
  const DRIVE_MAP: Record<string, string> = {
    "Front-Wheel Drive (FWD)":                     "Traction avant (FWD)",
    "Rear-Wheel Drive (RWD)":                      "Propulsion arrière (RWD)",
    "All-Wheel Drive (AWD)":                       "Intégrale (AWD)",
    "4-Wheel Drive (4WD)/4-Wheel Drive (4WD)":    "4x4 (4WD)",
    "4-Wheel Drive (4WD)":                         "4x4 (4WD)",
    "Part-time 4-Wheel Drive":                     "4x4 débrayable",
  };
  const driveType = DRIVE_MAP[r.DriveType] ?? r.DriveType ?? null;

  // ── Carrosserie ───────────────────────────────────────────────────────────
  const BODY_MAP: Record<string, string> = {
    "Sedan/Saloon":                "Berline",
    "Coupe":                       "Coupé",
    "Hatchback/Liftback/Notchback":"Hatchback",
    "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)": "VUS",
    "Pickup":                      "Camionnette",
    "Van":                         "Fourgonnette",
    "Minivan":                     "Minifourgonnette",
    "Convertible/Cabriolet":       "Cabriolet",
    "Wagon":                       "Familiale",
    "Crossover Utility Vehicle (CUV)": "VUS compact",
  };
  const bodyType = BODY_MAP[r.BodyClass] ?? r.BodyClass ?? null;

  const doors = r.Doors ? parseInt(r.Doors) : null;

  // ── Rappels ───────────────────────────────────────────────────────────────
  let recalls: { campaign: string; component: string; summary: string; date: string }[] = [];
  if (recallsRes.status === "fulfilled" && recallsRes.value.ok) {
    try {
      const recallData = await recallsRes.value.json();
      recalls = (recallData?.results ?? []).slice(0, 5).map((rc: any) => ({
        campaign:  rc.NHTSACampaignNumber ?? "",
        component: rc.Component           ?? "",
        summary:   rc.Summary             ?? "",
        date:      rc.ReportReceivedDate  ?? "",
      }));
    } catch { /* silencieux */ }
  }

  return NextResponse.json({
    vin,
    year:         r.ModelYear ? parseInt(r.ModelYear) : null,
    make:         r.Make      ? capitalise(r.Make)    : null,
    model:        r.Model     || null,
    trim:         r.Trim      || null,
    // Specs
    engine,
    hp,
    fuel,
    transmission,
    driveType,
    bodyType,
    doors,
    tireSize,
    // Rappels
    recallCount:  recalls.length,
    recalls,
  });
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
