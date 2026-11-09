// Données structurées schema.org (JSON-LD) : permettent aux moteurs de recherche d'afficher les fiches
// avec adresse, horaires et note. Rendu côté serveur ; « < », « > » et « & » sont échappés pour qu'aucun
// texte saisi par un garage ne puisse fermer la balise <script>.
// Attention : la séquence d'échappement doit être "\\u003c" (six caractères). "<" n'est que « < »
// lui-même en JavaScript, et ne protégeait donc de rien.
export function jsonLdHtml(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />;
}
