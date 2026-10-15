import type { Guide } from "@/components/GuidePage";

const LCAP_FR = "https://laws-lois.justice.gc.ca/fra/lois/E-1.6/section-6.html";
const LCAP_EN = "https://laws-lois.justice.gc.ca/eng/acts/E-1.6/section-6.html";
const CRTC_FR = "https://crtc.gc.ca/fra/com500/faq500.htm";
const CRTC_EN = "https://crtc.gc.ca/eng/com500/faq500.htm";

export const fr: Guide = {
  path: "/garagistes/rappel-rendez-vous-sms",
  title: "Rappel de rendez-vous par texto (SMS) pour garage : modèles et règles | Garago",
  description:
    "Confirmation et rappel de rendez-vous par texto pour garage au Québec : quand les envoyer, quoi écrire (exemples prêts à copier), longueur d'un SMS et ce que dit la Loi canadienne anti-pourriel.",
  ogDescription: "Quand envoyer un texto de confirmation, quoi écrire et quelles règles respecter : le guide pour garagistes.",
  datePublished: "2026-10-15",
  h1: "Rappel de rendez-vous par texto pour garage : modèles et règles",
  intro: "Un texto se lit presque toujours, souvent dans les minutes qui suivent. C'est le moyen le plus direct de faire confirmer un rendez-vous ou de récupérer un créneau à temps. Voici quand l'envoyer, quoi écrire et les règles à respecter au Canada.",
  sections: [
    {
      h2: "Quand envoyer les messages",
      bullets: [
        "À la prise du rendez-vous : un message court qui confirme la date, l'heure et le service.",
        "48 heures avant : une demande de confirmation, avec un lien pour confirmer ou annuler.",
        "24 heures avant, sans réponse : un appel du garage, plutôt qu'un deuxième texto.",
        "Jamais d'annulation automatique : un client qui n'a pas répondu peut tout de même venir.",
      ],
    },
    {
      h2: "Quoi écrire : trois modèles prêts à copier",
      paragraphs: [
        "Prise du rendez-vous : « Garage Lavoie : votre rendez-vous est le mardi 20 octobre à 9 h pour vos pneus d'hiver. Au plaisir ! »",
        "Demande de confirmation : « Garage Lavoie : rendez-vous le mardi 20 octobre à 9 h. Confirmez ou annulez ici : [lien] »",
        "Après une annulation : « Garage Lavoie : votre rendez-vous du 20 octobre est annulé. Appelez-nous au 514 555-0123 pour en reprendre un. »",
      ],
    },
    {
      h2: "Les règles d'un bon texto",
      bullets: [
        "Commencez par le nom du garage : le client ne connaît pas le numéro qui écrit, et un message non signé ressemble à de l'hameçonnage.",
        "Donnez le jour, la date et l'heure en toutes lettres, sans abréviation ambiguë.",
        "Un seul lien, et une seule action par message.",
        "Restez sous 160 caractères. Certains caractères (ê, ç, apostrophe typographique, émojis) réduisent la limite d'un texto à 70 caractères et font envoyer plusieurs messages.",
        "Écrivez dans la langue du client : français ou anglais.",
        "Aucune promotion dans un rappel : il doit servir uniquement le rendez-vous.",
      ],
    },
    {
      h2: "Ce que dit la Loi canadienne anti-pourriel",
      paragraphs: [
        "La Loi canadienne anti-pourriel (LCAP) exige en principe un consentement avant d'envoyer un message électronique commercial. Son paragraphe 6(6) prévoit toutefois que ce consentement n'est pas requis pour un message qui sert uniquement à faciliter, à compléter ou à confirmer une transaction que le client a déjà acceptée.",
        "Un rappel de rendez-vous demandé par le client entre dans cette logique, à condition qu'il ne contienne aucune offre ni promotion. Par prudence, identifiez toujours le garage et donnez un moyen simple de ne plus recevoir de messages. Pour des envois promotionnels (offres, rappels d'entretien non demandés), il faut le consentement du client : en cas de doute, consultez les lignes directrices du CRTC ou un conseiller juridique.",
      ],
    },
    {
      h2: "Texto ou courriel ?",
      paragraphs: [
        "Le texto est plus rapide à lire, le courriel peut contenir plus de détails (adresse, itinéraire, préparation du véhicule). Le plus simple est de laisser le client choisir à la prise du rendez-vous, et de noter sa préférence.",
      ],
    },
    {
      h2: "Comment Garago s'en occupe",
      bullets: [
        "Quand vous ajoutez un rendez-vous pris au téléphone, le client choisit texto ou courriel, et français ou anglais.",
        "48 heures avant, Garago lui envoie une demande de confirmation au nom de votre garage, avec un lien pour confirmer ou annuler.",
        "Sans réponse 24 heures avant, vous êtes prévenu pour l'appeler. Le créneau n'est jamais libéré automatiquement.",
        "Si le client annule, vous recevez un courriel et le créneau se libère dans l'agenda.",
        "Les clients qui réservent en ligne reçoivent une confirmation et un rappel la veille par courriel.",
      ],
    },
  ],
  faq: [
    { q: "Combien de temps avant le rendez-vous envoyer le texto ?", a: "Une demande de confirmation 48 heures avant laisse le temps au client de répondre et à vous de remplir le créneau s'il annule. Sans réponse 24 heures avant, un appel est plus efficace qu'un second texto." },
    { q: "Faut-il le consentement du client pour un rappel par texto ?", a: "Selon le paragraphe 6(6) de la Loi canadienne anti-pourriel, un message qui sert uniquement à confirmer ou à faciliter une transaction déjà acceptée n'exige pas de consentement. Le rappel ne doit contenir aucune promotion. Identifiez le garage et offrez un moyen de ne plus recevoir de messages." },
    { q: "Pourquoi mon texto part-il en plusieurs morceaux ?", a: "Un texto compte 160 caractères en alphabet standard, mais seulement 70 dès qu'un caractère spécial apparaît (certains accents, apostrophe courbe, émoji). Raccourcissez le message ou remplacez ces caractères." },
    { q: "Garago envoie-t-il les textos à mon nom ?", a: "Oui. Les demandes de confirmation commencent par le nom de votre garage, pour que le client sache tout de suite qui lui écrit." },
  ],
  ctaTitle: "Des confirmations envoyées pour vous",
  ctaText: "Essayez Garago 30 jours : demandes de confirmation par texto ou courriel, appel seulement si le client ne répond pas.",
  related: [
    { href: "/garagistes/rendez-vous-manques", label: "Rendez-vous manqués au garage : 7 moyens de réduire les absences" },
    { href: "/garagistes/prise-de-rendez-vous-en-ligne", label: "Prise de rendez-vous en ligne pour garage : le guide complet" },
    { href: "/garagistes/saison-pneus-hiver", label: "Saison des pneus d'hiver : comment un garage gère la ruée" },
  ],
  sources: [
    { label: "Loi canadienne anti-pourriel, article 6 (Justice Canada)", href: LCAP_FR },
    { label: "CRTC : foire aux questions sur la Loi canadienne anti-pourriel", href: CRTC_FR },
  ],
};

export const en: Guide = {
  path: "/en/garage-owners/sms-appointment-reminders",
  title: "SMS appointment reminders for auto repair shops: templates and rules | Garago",
  description:
    "Appointment confirmations and reminders by text for Quebec auto repair shops: when to send them, what to write (ready-to-copy examples), SMS length and what Canada's anti-spam law says.",
  ogDescription: "When to send a confirmation text, what to write and which rules to follow: a guide for garage owners.",
  datePublished: "2026-10-15",
  h1: "SMS appointment reminders for auto repair shops: templates and rules",
  intro: "A text message almost always gets read, often within minutes. It's the most direct way to get an appointment confirmed or recover a slot in time. Here is when to send it, what to write and the rules to follow in Canada.",
  sections: [
    {
      h2: "When to send messages",
      bullets: [
        "When the appointment is booked: a short message confirming the date, time and service.",
        "48 hours before: a confirmation request with a link to confirm or cancel.",
        "24 hours before, with no answer: a call from the shop rather than a second text.",
        "Never cancel automatically: a customer who didn't answer may still show up.",
      ],
    },
    {
      h2: "What to write: three ready-to-copy templates",
      paragraphs: [
        "Booking: \"Lavoie Garage: your appointment is Tuesday, October 20 at 9 AM for your winter tires. See you then!\"",
        "Confirmation request: \"Lavoie Garage: appointment Tuesday, October 20 at 9 AM. Confirm or cancel here: [link]\"",
        "After a cancellation: \"Lavoie Garage: your October 20 appointment is cancelled. Call us at 514-555-0123 to book another.\"",
      ],
    },
    {
      h2: "Rules for a good text",
      bullets: [
        "Start with the shop's name: the customer doesn't know the number texting them, and an unsigned message looks like phishing.",
        "Write out the day, date and time, with no ambiguous abbreviations.",
        "One link and one action per message.",
        "Stay under 160 characters. Some characters (curly apostrophes, certain accents, emojis) cut the limit to 70 characters and split the text into several messages.",
        "Write in the customer's language: English or French.",
        "No promotions in a reminder: it should only serve the appointment.",
      ],
    },
    {
      h2: "What Canada's Anti-Spam Legislation says",
      paragraphs: [
        "Canada's Anti-Spam Legislation (CASL) generally requires consent before sending a commercial electronic message. However, subsection 6(6) says consent isn't required for a message that solely facilitates, completes or confirms a transaction the customer has already agreed to.",
        "An appointment reminder the customer asked for fits that logic, as long as it contains no offer or promotion. To be safe, always identify the shop and give a simple way to stop receiving messages. For promotional messages (offers, unrequested maintenance reminders), you need the customer's consent: if in doubt, check the CRTC's guidance or ask a legal advisor.",
      ],
    },
    {
      h2: "Text or email?",
      paragraphs: [
        "A text is faster to read; an email can include more details (address, directions, how to prepare the vehicle). The simplest approach is to let the customer choose when booking, and record their preference.",
      ],
    },
    {
      h2: "How Garago handles it",
      bullets: [
        "When you add a phone booking, the customer chooses text or email, and English or French.",
        "48 hours before, Garago sends a confirmation request in your shop's name, with a link to confirm or cancel.",
        "With no answer 24 hours before, you're notified so you can call. The slot is never released automatically.",
        "If the customer cancels, you get an email and the slot opens up in your calendar.",
        "Customers who book online get a confirmation and a day-before reminder by email.",
      ],
    },
  ],
  faq: [
    { q: "How long before the appointment should I send the text?", a: "A confirmation request 48 hours before gives the customer time to answer and gives you time to fill the slot if they cancel. With no answer 24 hours before, a call works better than a second text." },
    { q: "Do I need consent to send a text reminder?", a: "Under subsection 6(6) of Canada's Anti-Spam Legislation, a message that solely confirms or facilitates a transaction already agreed to doesn't require consent. The reminder must not contain any promotion. Identify the shop and offer a way to stop receiving messages." },
    { q: "Why does my text get split into several messages?", a: "A text holds 160 characters in the standard alphabet, but only 70 as soon as a special character appears (some accents, curly apostrophes, emojis). Shorten the message or replace those characters." },
    { q: "Does Garago send texts in my shop's name?", a: "Yes. Confirmation requests start with your shop's name, so the customer knows right away who is texting them." },
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
    { label: "CRTC: frequently asked questions about Canada's Anti-Spam Legislation", href: CRTC_EN },
  ],
};
