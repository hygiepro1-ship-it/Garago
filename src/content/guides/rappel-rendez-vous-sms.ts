import type { Guide } from "@/components/GuidePage";

const LCAP_FR = "https://laws-lois.justice.gc.ca/fra/lois/E-1.6/section-6.html";
const LCAP_EN = "https://laws-lois.justice.gc.ca/eng/acts/E-1.6/section-6.html";

export const fr: Guide = {
  path: "/garagistes/rappel-rendez-vous-sms",
  title: "Rappel de rendez-vous par texto pour garage | Garago",
  description:
    "Pourquoi confirmer les rendez-vous de votre garage par texto : moins d'absences, moins d'appels, des créneaux récupérés, et la loi anti-pourriel.",
  ogDescription: "Moins d'absences et moins d'appels : les confirmations de rendez-vous par texto, envoyées pour vous par Garago.",
  datePublished: "2026-10-15",
  h1: "Rappel de rendez-vous par texto : moins d'absences, moins d'appels",
  intro: "Un texto se lit presque toujours, souvent dans les minutes qui suivent. Pour un garage, c'est le moyen le plus simple de savoir qui viendra vraiment et de récupérer à temps les créneaux libérés. Garago envoie ces confirmations pour vous.",
  sections: [
    {
      h2: "Ce que vous y gagnez",
      bullets: [
        "Moins de clients qui ne se présentent pas : le client confirme, ou il annule assez tôt pour que vous repreniez le créneau.",
        "Moins d'appels de rappel : vous n'appelez que les clients qui n'ont pas répondu, au lieu de tout le monde.",
        "Un agenda fiable : vous savez la veille qui viendra, et vous planifiez l'atelier en conséquence.",
        "Des créneaux récupérés en saison : en période de pneus, un créneau libéré 48 heures avant se remplit facilement.",
        "Une image professionnelle : un message clair, au nom du garage, avec un lien pour confirmer ou annuler.",
      ],
    },
    {
      h2: "Comment Garago s'en occupe",
      image: { src: "/images/guides/texto-confirmation-fr.webp", alt: "Texto de Garago au nom du Garage Lavoie : rendez-vous le vendredi 16 octobre à 9 h, avec un lien pour confirmer ou annuler", width: 1800, height: 1240, caption: "La demande de confirmation que reçoit le client, 48 heures avant son rendez-vous." },
      bullets: [
        "Vous ajoutez le rendez-vous pris au téléphone dans l'agenda. Le client choisit texto ou courriel, et français ou anglais.",
        "48 heures avant, Garago lui envoie une demande de confirmation au nom de votre garage, avec un lien pour confirmer ou annuler.",
        "Le client confirme : le rendez-vous passe au vert dans l'agenda. Vous n'avez rien à faire.",
        "Le client annule : vous recevez un courriel et le créneau se libère dans l'agenda.",
        "Pas de réponse 24 heures avant : vous êtes prévenu pour l'appeler. Le créneau n'est jamais libéré automatiquement.",
        "Les clients qui réservent en ligne reçoivent une confirmation, puis un rappel la veille par courriel.",
        "Le client est gardé dans votre carnet : la prochaine fois, ses coordonnées et son véhicule reviennent d'eux-mêmes.",
      ],
    },
    {
      h2: "Des messages pensés pour être lus",
      bullets: [
        "Signés du nom de votre garage, pour que le client sache tout de suite qui lui écrit.",
        "Courts : la date, l'heure et un seul lien.",
        "Dans la langue du client.",
        "Sans publicité : ils servent uniquement au rendez-vous, ce qui les garde dans le cadre de la Loi canadienne anti-pourriel.",
      ],
    },
  ],
  faq: [
    { q: "Dois-je écrire les textos moi-même ?", a: "Non. Garago envoie la demande de confirmation automatiquement 48 heures avant, au nom de votre garage, dans la langue choisie par le client." },
    { q: "Que se passe-t-il si le client ne répond pas ?", a: "Garago vous prévient 24 heures avant pour que vous l'appeliez. Le rendez-vous reste dans l'agenda : il n'est jamais annulé automatiquement." },
    { q: "Le client peut-il recevoir un courriel plutôt qu'un texto ?", a: "Oui. Quand vous ajoutez le rendez-vous, le client choisit texto ou courriel, et français ou anglais." },
    { q: "Faut-il le consentement du client pour ces textos ?", a: "Selon le paragraphe 6(6) de la Loi canadienne anti-pourriel, un message qui sert uniquement à confirmer ou à faciliter une transaction déjà acceptée n'exige pas de consentement. Les messages de Garago ne contiennent aucune promotion." },
  ],
  ctaTitle: "Des confirmations envoyées pour vous",
  ctaText: "Essayez Garago 30 jours : demandes de confirmation par texto ou courriel, et un appel seulement si le client ne répond pas.",
  related: [
    { href: "/garagistes/rendez-vous-manques", label: "Rendez-vous manqués au garage : 7 moyens de réduire les absences" },
    { href: "/garagistes/prise-de-rendez-vous-en-ligne", label: "Prise de rendez-vous en ligne pour garage : le guide complet" },
    { href: "/garagistes/saison-pneus-hiver", label: "Saison des pneus d'hiver : comment un garage gère la ruée" },
  ],
  sources: [
    { label: "Loi canadienne anti-pourriel, article 6 (Justice Canada)", href: LCAP_FR },
  ],
};

export const en: Guide = {
  path: "/en/garage-owners/sms-appointment-reminders",
  title: "SMS appointment reminders for repair shops | Garago",
  description:
    "Why confirm your shop's appointments by text: fewer no-shows, fewer calls, slots recovered in time, and what Canada's anti-spam law says.",
  ogDescription: "Fewer no-shows and fewer calls: appointment confirmations by text, sent for you by Garago.",
  datePublished: "2026-10-15",
  h1: "SMS appointment reminders: fewer no-shows, fewer calls",
  intro: "A text message almost always gets read, often within minutes. For an auto repair shop, it's the simplest way to know who will really show up and to recover freed slots in time. Garago sends these confirmations for you.",
  sections: [
    {
      h2: "What you gain",
      bullets: [
        "Fewer no-shows: the customer confirms, or cancels early enough for you to fill the slot.",
        "Fewer reminder calls: you only call customers who haven't answered, instead of everyone.",
        "A reliable calendar: you know the day before who's coming, and plan the shop accordingly.",
        "Slots recovered in season: during tire season, a slot freed 48 hours ahead is easy to fill.",
        "A professional image: a clear message in the shop's name, with a link to confirm or cancel.",
      ],
    },
    {
      h2: "How Garago handles it",
      image: { src: "/images/guides/texto-confirmation-en.webp", alt: "Garago text message in Lavoie Garage's name: appointment Friday, October 16 at 9 AM, with a link to confirm or cancel", width: 1800, height: 1240, caption: "The confirmation request the customer receives, 48 hours before the appointment." },
      bullets: [
        "You add the phone booking to the calendar. The customer chooses text or email, and English or French.",
        "48 hours before, Garago sends a confirmation request in your shop's name, with a link to confirm or cancel.",
        "The customer confirms: the appointment turns green in the calendar. Nothing for you to do.",
        "The customer cancels: you get an email and the slot opens up in the calendar.",
        "No answer 24 hours before: you're notified so you can call. The slot is never released automatically.",
        "Customers who book online get a confirmation, then a day-before reminder by email.",
        "The customer is kept in your customer list: next time, their details and vehicle fill in by themselves.",
      ],
    },
    {
      h2: "Messages designed to be read",
      bullets: [
        "Signed with your shop's name, so the customer knows right away who is texting.",
        "Short: the date, the time and a single link.",
        "In the customer's language.",
        "No advertising: they only serve the appointment, which keeps them within Canada's Anti-Spam Legislation.",
      ],
    },
  ],
  faq: [
    { q: "Do I have to write the texts myself?", a: "No. Garago sends the confirmation request automatically 48 hours before, in your shop's name, in the language the customer chose." },
    { q: "What if the customer doesn't answer?", a: "Garago notifies you 24 hours before so you can call. The appointment stays in the calendar: it is never cancelled automatically." },
    { q: "Can the customer get an email instead of a text?", a: "Yes. When you add the appointment, the customer chooses text or email, and English or French." },
    { q: "Do I need the customer's consent for these texts?", a: "Under subsection 6(6) of Canada's Anti-Spam Legislation, a message that solely confirms or facilitates a transaction already agreed to doesn't require consent. Garago's messages contain no promotion." },
  ],
  ctaTitle: "Confirmations sent for you",
  ctaText: "Try Garago for 30 days: confirmation requests by text or email, and a call only when the customer doesn't answer.",
  related: [
    { href: "/en/garage-owners/missed-appointments", label: "Auto repair shop no-shows: 7 ways to reduce missed appointments" },
    { href: "/en/garage-owners/online-booking", label: "Online booking for auto repair shops: the complete guide" },
    { href: "/en/garage-owners/winter-tire-season", label: "Winter tire season: how an auto repair shop handles the rush" },
  ],
  sources: [
    { label: "Canada's Anti-Spam Legislation, section 6 (Justice Laws)", href: LCAP_EN },
  ],
};
