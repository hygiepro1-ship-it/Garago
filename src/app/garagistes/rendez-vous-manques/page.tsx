import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
const PATH = "/garagistes/rendez-vous-manques";

export const metadata: Metadata = {
  title: "Rendez-vous manqués au garage : 7 moyens de réduire les absences | Garago",
  description:
    "Clients qui ne se présentent pas, créneaux perdus : 7 moyens concrets pour réduire les rendez-vous manqués dans un garage au Québec (confirmation, rappel, annulation facile, agenda).",
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    title: "Rendez-vous manqués au garage : 7 moyens de réduire les absences",
    description: "Confirmation, rappel, annulation facile et agenda en ligne : comment limiter les absences dans un garage.",
    url: `${BASE_URL}${PATH}`, siteName: "Garago", locale: "fr_CA", type: "article",
  },
};

export default function Page() {
  return (
    <GuidePage
      path={PATH}
      datePublished="2026-10-14"
      h1="Rendez-vous manqués au garage : 7 moyens de réduire les absences"
      intro="Un client qui ne se présente pas, c'est un pont élévateur vide et une heure de travail perdue. Voici ce qui fonctionne vraiment dans un garage pour réduire les rendez-vous manqués, sans alourdir le travail de la réception."
      sections={[
        {
          h2: "Pourquoi les clients ne se présentent pas",
          paragraphs: [
            "Dans la grande majorité des cas, ce n'est pas de la mauvaise foi : le client a oublié, un imprévu est arrivé, ou le rendez-vous a été pris trop longtemps d'avance. S'il ne sait pas comment annuler simplement, il ne dit rien et ne vient pas.",
            "Chaque absence a donc la même cause racine : rien ne rappelle le rendez-vous au client, et il n'existe pas de moyen facile de le déplacer. C'est précisément ce qu'on peut corriger.",
          ],
        },
        {
          h2: "1. Faire confirmer le rendez-vous avant la date",
          paragraphs: [
            "Une demande de confirmation 48 heures avant le rendez-vous change la nature de l'engagement : le client répond « oui », ou il vous libère le créneau à temps. Sans réponse, vous savez à l'avance qu'il y a un risque.",
          ],
        },
        {
          h2: "2. Envoyer un rappel la veille",
          paragraphs: [
            "Un rappel la veille, avec la date, l'heure, l'adresse du garage et le service prévu, suffit à éviter la majorité des oublis. Le message doit tenir en quelques lignes et contenir un moyen d'annuler.",
          ],
        },
        {
          h2: "3. Rendre l'annulation facile",
          paragraphs: [
            "Paradoxalement, faciliter l'annulation réduit les absences : le client qui peut annuler en un clic le fait, au lieu de ne pas se présenter. Le créneau libéré peut ensuite être reproposé à quelqu'un d'autre.",
          ],
        },
        {
          h2: "4. Éviter les rendez-vous trop éloignés pour les services ponctuels",
          paragraphs: [
            "Plus un rendez-vous est pris longtemps d'avance, plus il risque d'être oublié. Pour les changements de pneus de saison, par exemple, limitez l'horizon de réservation à quelques semaines et utilisez la confirmation pour les rendez-vous plus lointains.",
          ],
        },
        {
          h2: "5. Appeler seulement les clients qui n'ont pas répondu",
          paragraphs: [
            "Au lieu d'appeler tout le monde, gardez le téléphone pour les clients qui n'ont pas confirmé 24 heures avant. C'est un petit nombre d'appels, ciblés, qui sauvent des créneaux.",
          ],
        },
        {
          h2: "6. Mesurer vos absences",
          paragraphs: [
            "Notez chaque client absent. Votre taux d'absence est le nombre de rendez-vous manqués divisé par le nombre de rendez-vous pris sur trois mois. Sans ce chiffre, impossible de savoir si vos changements fonctionnent.",
          ],
        },
        {
          h2: "7. Prévoir une marge plutôt que surcharger",
          paragraphs: [
            "Certains garages surréservent pour compenser les absences. Cela fonctionne jusqu'au jour où tout le monde se présente. Mieux vaut réduire les absences à la source et garder une marge de capacité réaliste, en tenant compte du nombre de portes (postes de travail) occupées en même temps.",
          ],
        },
        {
          h2: "Comment Garago vous aide",
          bullets: [
            "Réservation en ligne 24 h sur 24, selon vos heures d'ouverture, la durée de chaque service et le nombre de portes disponibles.",
            "Le client reçoit une confirmation par courriel, puis un rappel la veille avec les coordonnées du garage. Les rendez-vous soumis à confirmation reçoivent en plus une demande avec un lien pour confirmer ou annuler.",
            "Vous voyez dans l'agenda les rendez-vous confirmés, ceux en attente de réponse et ceux à appeler.",
            "Vous marquez un client absent en un clic, pour suivre vos absences dans le temps.",
            "Vous ajoutez aussi les rendez-vous pris au téléphone dans le même agenda, depuis votre téléphone ou votre ordinateur.",
          ],
        },
      ]}
      faq={[
        { q: "Quel est le meilleur moment pour envoyer un rappel de rendez-vous ?", a: "Une demande de confirmation environ 48 heures avant, puis un rappel la veille, donnent au client le temps de réagir tout en gardant le rendez-vous en tête. Appelez ensuite seulement ceux qui n'ont pas répondu." },
        { q: "Faut-il facturer les rendez-vous manqués ?", a: "C'est une décision commerciale. Beaucoup de garages préfèrent d'abord réduire les absences par la confirmation et l'annulation facile, car facturer un client pour un oubli nuit à la relation. Si vous le faites, annoncez la règle clairement à la réservation." },
        { q: "Comment calculer son taux de rendez-vous manqués ?", a: "Divisez le nombre de clients absents par le nombre total de rendez-vous pris sur une période de trois mois, puis multipliez par 100. Refaites le calcul après avoir mis en place la confirmation pour mesurer l'effet." },
        { q: "Garago envoie-t-il des rappels automatiquement ?", a: "Oui : les clients qui réservent en ligne reçoivent une confirmation par courriel, puis un rappel la veille. Les rendez-vous soumis à confirmation reçoivent une demande avec un lien pour confirmer ou annuler, et vous voyez dans l'agenda ceux à rappeler." },
      ]}
      ctaTitle="Moins d'absences, plus de rendez-vous honorés"
      ctaText="Essayez Garago pendant 30 jours : réservation en ligne, confirmation et rappels par courriel, agenda sur téléphone. Carte requise, aucun prélèvement avant la fin de l'essai."
      related={[
        { href: "/garagistes/agenda-en-ligne", label: "Agenda et prise de rendez-vous en ligne pour garage : comment choisir" },
        { href: "/garagistes", label: "Garago pour les garages : tarifs et fonctionnement" },
      ]}
    />
  );
}
