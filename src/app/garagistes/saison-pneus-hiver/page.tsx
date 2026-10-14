import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
const PATH = "/garagistes/saison-pneus-hiver";

export const metadata: Metadata = {
  title: "Saison des pneus d'hiver : comment un garage gère la ruée au Québec | Garago",
  description:
    "Du premier gel au 1er décembre, le téléphone ne dérougit pas. Comment un garage québécois planifie la saison des pneus d'hiver : réservation en ligne, confirmation, capacité de l'atelier.",
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    title: "Saison des pneus d'hiver : comment un garage gère la ruée au Québec",
    description: "Planifier la capacité, prendre les rendez-vous en ligne et limiter les absences pendant la saison la plus chargée.",
    url: `${BASE_URL}${PATH}`, siteName: "Garago", locale: "fr_CA", type: "article",
  },
};

export default function Page() {
  return (
    <GuidePage
      path={PATH}
      datePublished="2026-10-14"
      h1="Saison des pneus d'hiver : comment un garage gère la ruée"
      intro="Chaque automne, les conducteurs attendent le premier gel, puis appellent tous en même temps. Voici comment un garage québécois peut absorber la demande sans saturer le téléphone ni l'atelier."
      sections={[
        {
          h2: "Ce que dit CAA-Québec",
          paragraphs: [
            "Au Québec, les pneus d'hiver sont obligatoires à partir du 1er décembre, avec une amende de 200 $ à 300 $, plus les frais. CAA-Québec recommande de faire le changement quand la température se maintient autour de 7 °C pendant plusieurs jours, ce qui peut arriver dès octobre.",
            "Dans ses communiqués, l'organisme répète chaque année la même consigne aux conducteurs : prendre rendez-vous tôt pour éviter la cohue à la première neige. C'est précisément le moment où les garages reçoivent le plus d'appels.",
          ],
        },
        {
          h2: "1. Ouvrir la réservation avant la ruée",
          paragraphs: [
            "Certains ateliers contactent leurs clients dès août et commencent à poser des pneus début septembre, d'après des garages recommandés cités par CAA-Québec. Plus vous ouvrez tôt, plus la demande s'étale sur plusieurs semaines au lieu de se concentrer sur quelques jours.",
          ],
        },
        {
          h2: "2. Connaître sa vraie capacité",
          paragraphs: [
            "Le nombre de véhicules que votre atelier peut traiter en même temps, multiplié par le temps réel d'un changement de pneus, donne le nombre de rendez-vous par journée. Avec des durées par service et un nombre de portes (postes de travail) réalistes dans l'agenda, vous ne promettez pas plus que l'atelier ne peut livrer.",
          ],
        },
        {
          h2: "3. Laisser les clients réserver sans téléphoner",
          paragraphs: [
            "En saison, chaque appel d'un client qui demande « avez-vous de la place ? » est du temps volé à l'atelier. Une réservation en ligne montre les créneaux réellement disponibles à toute heure, y compris le soir, et chaque rendez-vous arrive complet : nom, véhicule, service, coordonnées.",
          ],
        },
        {
          h2: "4. Confirmer pour ne pas perdre de créneaux rares",
          paragraphs: [
            "Quand les créneaux se font rares, une absence coûte plus cher : un autre client aurait pris la place. Une demande de confirmation avant la date et un rappel la veille libèrent à temps les créneaux que les clients n'utiliseront pas.",
          ],
        },
        {
          h2: "5. Fermer ce que vous ne pouvez pas honorer",
          bullets: [
            "Bloquez les journées ou plages horaires où l'équipe est réduite (congés, formation).",
            "Mettez à jour vos heures d'ouverture si vous prolongez les soirées ou ouvrez le samedi.",
            "Gardez un moyen d'ajouter à l'agenda les clients qui appellent quand même.",
          ],
        },
        {
          h2: "Comment Garago vous aide",
          bullets: [
            "Réservation en ligne selon vos heures, la durée de chaque service et le nombre de portes.",
            "Fermeture d'une journée ou d'une plage, avec avertissement si des rendez-vous sont déjà prévus.",
            "Confirmation et rappel par courriel, et agenda utilisable sur téléphone.",
            "Votre garage visible par service, marque et ville, avec les avis de vrais clients.",
          ],
        },
      ]}
      faq={[
        { q: "Quand les conducteurs commencent-ils à appeler pour leurs pneus d'hiver ?", a: "Surtout à partir de la fin septembre, avec un pic au premier gel ou à la première neige. CAA-Québec recommande de prendre rendez-vous tôt et de faire le changement quand la température se maintient autour de 7 °C." },
        { q: "Quelle est la date limite pour les pneus d'hiver au Québec ?", a: "Le 1er décembre. Après cette date, un véhicule sans pneus d'hiver s'expose à une amende de 200 $ à 300 $, plus les frais, selon CAA-Québec." },
        { q: "Comment éviter de saturer le téléphone en saison ?", a: "En offrant la réservation en ligne avec vos vrais créneaux, en informant vos clients à l'avance, et en gardant le téléphone pour les cas particuliers." },
        { q: "Comment éviter de surcharger l'atelier ?", a: "En paramétrant la durée de chaque service et le nombre de véhicules que vous pouvez prendre en même temps : un créneau n'est offert que s'il reste une porte libre." },
      ]}
      ctaTitle="Préparez la saison avant le premier gel"
      ctaText="Configurez vos heures, vos services et vos portes pendant l'essai gratuit de 30 jours, puis ouvrez la réservation en ligne."
      related={[
        { href: "/garagistes/rendez-vous-manques", label: "Rendez-vous manqués au garage : 7 moyens de réduire les absences" },
        { href: "/garagistes/agenda-en-ligne", label: "Agenda et prise de rendez-vous en ligne pour garage : comment choisir" },
        { href: "/pourquoi-garago", label: "Pourquoi Garago" },
      ]}
    />
  );
}
