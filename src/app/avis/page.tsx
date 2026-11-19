import AvisForm from "./AvisForm";

// Avis sur Garago, depuis le lien des rappels de rendez-vous (texto et courriel).
// ?l=en : en anglais. ?r=<jeton> : le rendez-vous d'où vient l'avis (courriel seulement).
export default async function AvisPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const r = typeof q.r === "string" && /^[a-f0-9]{48}$/.test(q.r) ? q.r : null;
  return <AvisForm lang={q.l === "en" ? "en" : "fr"} token={r} />;
}
