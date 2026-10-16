import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
const PATH = "/garagistes/agenda-en-ligne";

export const metadata: Metadata = {
  title: "Agenda et rendez-vous en ligne pour garage : comment choisir | Garago",
  description:
    "Ce qu'un garage doit exiger d'un agenda de prise de rendez-vous en ligne : durée par service, nombre de portes, heures d'ouverture, rendez-vous au téléphone, mobile. Guide pour garagistes du Québec.",
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    title: "Agenda et rendez-vous en ligne pour garage : comment choisir",
    description: "Les critères à vérifier avant de choisir un agenda en ligne pour votre garage.",
    url: `${BASE_URL}${PATH}`, siteName: "Garago", locale: "fr_CA", type: "article",
  },
};

export default function Page() {
  return (
    <GuidePage
      path={PATH}
      datePublished="2026-10-14"
      h1="Agenda et prise de rendez-vous en ligne pour garage : comment choisir"
      intro="Un agenda générique de salon de coiffure ne comprend pas qu'une vidange dure 30 minutes et des freins 90 minutes, ni que trois véhicules peuvent être sur les ponts en même temps. Voici les critères à vérifier avant de choisir un outil de rendez-vous en ligne pour votre garage."
      sections={[
        {
          h2: "Pourquoi prendre les rendez-vous en ligne",
          paragraphs: [
            "Le téléphone sonne pendant que vous avez les mains dans un moteur, et les clients appellent souvent après les heures d'ouverture. Une réservation en ligne disponible 24 h sur 24 capte ces demandes sans interrompre l'atelier, et chaque rendez-vous arrive déjà complet : nom, véhicule, service, coordonnées.",
          ],
        },
        {
          h2: "Les 7 critères à vérifier",
          bullets: [
            "Une durée par service : le temps bloqué dans l'agenda doit dépendre du travail, pas d'un bloc fixe d'une heure.",
            "Le nombre de véhicules en même temps : un créneau n'est complet que lorsque toutes vos portes (postes de travail) sont occupées.",
            "Vos heures d'ouverture et vos congés : pouvoir fermer une journée ou une plage horaire en quelques clics.",
            "Les rendez-vous pris au téléphone : ils doivent entrer dans le même agenda que ceux pris en ligne, sinon vous risquez les doubles réservations.",
            "Une confirmation et un rappel automatiques pour le client, avec un moyen simple d'annuler ou de déplacer.",
            "Une utilisation sur téléphone, sans application à installer : l'agenda doit s'ouvrir dans le navigateur, à l'atelier comme à la maison.",
            "Vos données vous appartiennent : pouvoir exporter vos rendez-vous et vos clients, et savoir où ils sont hébergés.",
          ],
        },
        {
          h2: "Les erreurs fréquentes",
          bullets: [
            "Choisir un outil générique qui ne connaît ni les durées de service ni la capacité de l'atelier.",
            "Garder deux agendas, un papier et un en ligne, et se retrouver avec des chevauchements.",
            "Ne pas mettre à jour les heures d'ouverture avant la saison des pneus ou les vacances.",
            "Laisser les rendez-vous ouverts trop loin dans le temps : plus c'est loin, plus les absences augmentent.",
          ],
        },
        {
          h2: "Ce que fait Garago",
          bullets: [
            "Réservation en ligne 24 h sur 24 selon vos heures d'ouverture, la durée de chaque service et le nombre de portes.",
            "Agenda jour, semaine et mois, utilisable sur téléphone, avec les rendez-vous pris au téléphone ajoutés par vous.",
            "Fermeture d'une journée ou d'une plage horaire, avec avertissement si des rendez-vous sont déjà prévus.",
            "Confirmation et rappel la veille par courriel, demande de confirmation avec lien pour confirmer ou annuler, et suivi des clients absents.",
            "Fiche publique de votre garage pour que les conducteurs vous trouvent par service, marque et position, avec les avis de vrais clients.",
            "Plusieurs garages sur un même abonnement, et export de vos rendez-vous vers Excel.",
          ],
        },
        {
          h2: "Combien ça coûte",
          paragraphs: [
            "Garago coûte 109,99 $ par mois sans engagement, ou 88 $ par mois en abonnement annuel. Chaque garage supplémentaire s'ajoute pour 49,99 $ par mois. L'essai gratuit de 30 jours exige une carte, mais rien n'est prélevé avant la fin de l'essai.",
          ],
        },
      ]}
      faq={[
        { q: "Dois-je abandonner mon agenda actuel pour utiliser Garago ?", a: "Non, pas du jour au lendemain. Beaucoup de garages commencent par saisir leurs nouveaux rendez-vous dans Garago pendant l'essai, puis abandonnent l'ancien agenda quand ils sont à l'aise. Vous pouvez exporter vos rendez-vous vers Excel à tout moment." },
        { q: "Mes clients doivent-ils créer un compte pour réserver ?", a: "Non. Un client peut réserver en indiquant son nom, son courriel et son téléphone, après avoir confirmé son adresse courriel. Un compte lui permet ensuite de retrouver ses rendez-vous." },
        { q: "Puis-je gérer l'agenda depuis mon téléphone ?", a: "Oui. Le tableau de bord s'ouvre dans le navigateur du téléphone, sans application à installer, avec une liste par jour adaptée aux petits écrans." },
        { q: "Que se passe-t-il si deux clients réservent le même créneau ?", a: "C'est impossible : un créneau n'est offert que s'il reste une porte libre pour la durée du service choisi. Le second client voit simplement le créneau disparaître et en choisit un autre." },
      ]}
      ctaTitle="Essayez l'agenda de Garago pendant 30 jours"
      ctaText="Configurez vos heures, vos services et vos portes en quelques minutes, puis recevez vos premières réservations en ligne."
      related={[
        { href: "/garagistes/rendez-vous-manques", label: "Rendez-vous manqués au garage : 7 moyens de réduire les absences" },
        { href: "/garagistes", label: "Garago pour les garages : tarifs et fonctionnement" },
      ]}
    />
  );
}
