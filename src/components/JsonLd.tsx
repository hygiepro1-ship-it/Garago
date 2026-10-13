// Données structurées schema.org (JSON-LD) : permettent aux moteurs de recherche d'afficher les fiches
// avec adresse, horaires et note. Rendu côté serveur ; « < » est échappé pour qu'aucun texte saisi par un
// garage ne puisse fermer la balise <script>.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}
