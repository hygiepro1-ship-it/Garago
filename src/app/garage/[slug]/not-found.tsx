"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import NotFound from "@/app/not-found";
import GarageProfileClient from "./GarageProfileClient";

/**
 * 404 d'une fiche de garage. La page étant en cache (ISR), elle ne lit pas la session : une fiche dont le NEQ
 * n'est pas encore vérifié y renvoie donc un 404 pour tout le monde. Pour garder l'aperçu du propriétaire et
 * de l'admin, ce 404 redemande la fiche à l'API, qui, elle, connaît le visiteur. Le public garde le 404.
 */
export default function GarageNotFound() {
  const { slug } = useParams() as { slug: string };
  const { status } = useSession();
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    if (status !== "authenticated" || !slug) return;
    fetch(`/api/garages/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => { if (g?.id) setPreview(g); })
      .catch(() => {});
  }, [status, slug]);

  if (preview) return <GarageProfileClient initialGarage={preview} />;
  return <NotFound />;
}
