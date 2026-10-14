import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
const PATH = "/conducteurs/reserver-garage-en-ligne";

export const metadata: Metadata = {
  title: "Réserver son garage en ligne au Québec : rendez-vous sans appeler | Garago",
  description:
    "Prendre rendez-vous dans un garage en ligne, sans attendre au téléphone : choisissez le service, la date et l'heure parmi les disponibilités réelles. Gratuit pour les conducteurs.",
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    title: "Réserver son garage en ligne au Québec : rendez-vous sans appeler",
    description: "Choisir un garage, un service et une heure en quelques minutes, sans passer par le téléphone.",
    url: `${BASE_URL}${PATH}`, siteName: "Garago", locale: "fr_CA", type: "article",
  },
};

export default function Page() {
  return (
    <GuidePage
      path={PATH}
      datePublished="2026-10-14"
      crumb={{ label: "Pour les conducteurs", href: "/pourquoi-garago#conducteurs" }}
      heroCta={{ label: "Trouver un garage", href: "/rechercher" }}
      cta={{ label: "Trouver un garage près de chez moi", href: "/rechercher", secondary: { label: "Voir les garages par ville", href: "/garages" } }}
      h1="Réserver son garage en ligne, sans appeler"
      intro="Plus besoin d'appeler entre deux réunions ni de rappeler le lendemain. Vous choisissez le garage, le service, la date et l'heure parmi les disponibilités réelles, et vous recevez votre confirmation par courriel."
      sections={[
        {
          h2: "Pourquoi réserver en ligne",
          bullets: [
            "Vous voyez les créneaux réellement libres, à toute heure, y compris le soir et la fin de semaine.",
            "Vous choisissez le service (vidange, pneus, freins, diagnostic…) et le garage selon la marque de votre véhicule.",
            "Vous recevez une confirmation par courriel avec la date, l'heure et l'adresse.",
            "Vous lisez les avis de conducteurs qui ont réellement eu un rendez-vous dans le garage.",
            "C'est gratuit pour les conducteurs.",
          ],
        },
        {
          h2: "Comment ça marche, en quatre étapes",
          bullets: [
            "Cherchez un garage par service, par marque de véhicule ou par ville.",
            "Ouvrez sa fiche et choisissez « Prendre rendez-vous ».",
            "Sélectionnez le service, la date et l'heure parmi les créneaux offerts.",
            "Indiquez vos coordonnées, confirmez votre courriel et recevez votre confirmation.",
          ],
        },
        {
          h2: "Modifier ou annuler",
          paragraphs: [
            "Avec un compte Garago gratuit, vous retrouvez vos rendez-vous dans votre tableau de bord et pouvez les déplacer ou les annuler jusqu'à 24 heures avant. Passé ce délai, appelez directement le garage : son numéro figure sur votre confirmation.",
          ],
        },
        {
          h2: "Avant la saison des pneus d'hiver",
          paragraphs: [
            "Au Québec, les pneus d'hiver sont obligatoires à partir du 1er décembre, avec une amende de 200 $ à 300 $. CAA-Québec recommande de prendre rendez-vous tôt pour éviter la cohue à la première neige. Réserver en ligne dès octobre vous donne le choix de l'heure.",
          ],
        },
      ]}
      faq={[
        { q: "Dois-je créer un compte pour réserver ?", a: "Non. Vous pouvez réserver en indiquant votre nom, votre courriel et votre téléphone, après avoir confirmé votre adresse courriel. Un compte gratuit vous permet ensuite de retrouver, déplacer ou annuler vos rendez-vous." },
        { q: "Est-ce vraiment gratuit ?", a: "Oui. Garago est gratuit pour les conducteurs : chercher, comparer, lire les avis et réserver." },
        { q: "Puis-je annuler mon rendez-vous ?", a: "Oui, depuis votre tableau de bord jusqu'à 24 heures avant le rendez-vous. Après ce délai, contactez le garage par téléphone." },
        { q: "Comment savoir si un garage accepte ma marque ?", a: "Filtrez la recherche par marque de véhicule : seuls les garages qui indiquent travailler sur votre marque sont proposés." },
      ]}
      ctaTitle="Trouvez votre garage en quelques minutes"
      ctaText="Cherchez par service, par marque ou par ville, comparez les avis et réservez."
      related={[
        { href: "/conseils/quand-passer-pneus-hiver-quebec", label: "Quand passer aux pneus d'hiver au Québec" },
        { href: "/garages", label: "Garages par ville au Québec" },
        { href: "/pourquoi-garago", label: "Pourquoi Garago" },
      ]}
    />
  );
}
