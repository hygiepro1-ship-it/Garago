import { NextResponse } from "next/server";

// Un garage ne peut pas masquer lui-même un avis : cela permettrait de supprimer les avis négatifs et
// viderait les « avis vérifiés » de leur sens. Il doit utiliser « Signaler » (examen par l'équipe Garago).
export async function PATCH() {
  return NextResponse.json(
    { error: "Utilisez « Signaler » : l'équipe Garago examine la demande." },
    { status: 403 }
  );
}
