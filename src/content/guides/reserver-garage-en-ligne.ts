import type { Guide } from "@/components/GuidePage";

export const fr: Guide = {
  path: "/conducteurs/reserver-garage-en-ligne",
  title: "Réserver son garage en ligne au Québec : rendez-vous sans appeler | Garago",
  description:
    "Prendre rendez-vous dans un garage en ligne, sans attendre au téléphone : choisissez le service, la date et l'heure parmi les disponibilités réelles. Gratuit pour les conducteurs.",
  ogDescription: "Choisir un garage, un service et une heure en quelques minutes, sans passer par le téléphone.",
  datePublished: "2026-10-14",
  crumb: { label: "Pour les conducteurs", href: "/pourquoi-garago#conducteurs" },
  heroCta: { label: "Trouver un garage", href: "/rechercher" },
  cta: { label: "Trouver un garage près de chez moi", href: "/rechercher", secondary: { label: "Voir les garages par ville", href: "/garages" } },
  h1: "Réserver son garage en ligne, sans appeler",
  intro: "Plus besoin d'appeler entre deux réunions ni de rappeler le lendemain. Vous choisissez le garage, le service, la date et l'heure parmi les disponibilités réelles, et vous recevez votre confirmation par courriel.",
  sections: [
    {
      h2: "Pourquoi réserver en ligne",
      bullets: [
        "Vous voyez les créneaux réellement libres, à toute heure, y compris le soir et la fin de semaine.",
        "Vous choisissez le service (vidange, pneus, freins, diagnostic…) et le garage selon la marque et le modèle de votre véhicule.",
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
    { h2: "Modifier ou annuler", paragraphs: ["Avec un compte Garago gratuit, vous retrouvez vos rendez-vous dans votre tableau de bord et pouvez les déplacer ou les annuler jusqu'à 24 heures avant. Passé ce délai, appelez directement le garage : son numéro figure sur votre confirmation."] },
    { h2: "Avant la saison des pneus d'hiver", paragraphs: ["Au Québec, les pneus d'hiver sont obligatoires à partir du 1er décembre, avec une amende de 200 $ à 300 $. CAA-Québec recommande de prendre rendez-vous tôt pour éviter la cohue à la première neige. Réserver en ligne dès octobre vous donne le choix de l'heure."] },
  ],
  faq: [
    { q: "Dois-je créer un compte pour réserver ?", a: "Non. Vous pouvez réserver en indiquant votre nom, votre courriel et votre téléphone, après avoir confirmé votre adresse courriel. Un compte gratuit vous permet ensuite de retrouver, déplacer ou annuler vos rendez-vous." },
    { q: "Est-ce vraiment gratuit ?", a: "Oui. Garago est gratuit pour les conducteurs : chercher, comparer, lire les avis et réserver." },
    { q: "Puis-je annuler mon rendez-vous ?", a: "Oui, depuis votre tableau de bord jusqu'à 24 heures avant le rendez-vous. Après ce délai, contactez le garage par téléphone." },
    { q: "Comment savoir si un garage accepte ma marque ?", a: "Filtrez la recherche par marque de véhicule : seuls les garages qui indiquent travailler sur votre marque sont proposés." },
  ],
  ctaTitle: "Trouvez votre garage en quelques minutes",
  ctaText: "Cherchez par service, par marque ou par ville, comparez les avis et réservez.",
  related: [
    { href: "/conseils/quand-passer-pneus-hiver-quebec", label: "Quand passer aux pneus d'hiver au Québec" },
    { href: "/garages", label: "Garages par ville au Québec" },
    { href: "/pourquoi-garago", label: "Pourquoi Garago" },
  ],
};

export const en: Guide = {
  path: "/en/drivers/book-garage-online",
  title: "Book an auto repair shop online in Quebec, without calling | Garago",
  description:
    "Book a garage appointment online, without waiting on the phone: choose the service, date and time from real availability. Free for drivers.",
  ogDescription: "Pick a garage, a service and a time in a few minutes, without picking up the phone.",
  datePublished: "2026-10-15",
  crumb: { label: "For drivers", href: "/en/why-garago#drivers" },
  heroCta: { label: "Find a garage", href: "/rechercher" },
  cta: { label: "Find a garage near me", href: "/rechercher", secondary: { label: "Garages by city", href: "/garages" } },
  h1: "Book your garage online, without calling",
  intro: "No more calling between meetings or calling back the next day. You choose the garage, the service, the date and the time from real availability, and you get your confirmation by email.",
  sections: [
    {
      h2: "Why book online",
      bullets: [
        "You see the slots that are actually free, at any hour, including evenings and weekends.",
        "You choose the service (oil change, tires, brakes, diagnostics…) and a garage that works on your vehicle's make and model.",
        "You get an email confirmation with the date, time and address.",
        "You read reviews from drivers who actually had an appointment at the garage.",
        "It's free for drivers.",
      ],
    },
    {
      h2: "How it works, in four steps",
      bullets: [
        "Search for a garage by service, vehicle make or city.",
        "Open its page and choose \"Book an appointment\".",
        "Select the service, date and time from the available slots.",
        "Enter your details, confirm your email and get your confirmation.",
      ],
    },
    { h2: "Change or cancel", paragraphs: ["With a free Garago account, you find your appointments in your dashboard and can move or cancel them up to 24 hours before. After that, call the garage directly: its number is on your confirmation."] },
    { h2: "Before winter tire season", paragraphs: ["In Quebec, winter tires are mandatory from December 1, with a fine of $200 to $300. CAA-Quebec recommends booking early to avoid the rush at the first snowfall. Booking online in October gives you your choice of time."] },
  ],
  faq: [
    { q: "Do I need an account to book?", a: "No. You can book with your name, email and phone number after confirming your email address. A free account then lets you find, move or cancel your appointments." },
    { q: "Is it really free?", a: "Yes. Garago is free for drivers: search, compare, read reviews and book." },
    { q: "Can I cancel my appointment?", a: "Yes, from your dashboard up to 24 hours before the appointment. After that, contact the garage by phone." },
    { q: "How do I know if a garage works on my make?", a: "Filter your search by vehicle make: only garages that say they work on your make are shown." },
  ],
  ctaTitle: "Find your garage in a few minutes",
  ctaText: "Search by service, make or city, compare reviews and book.",
  related: [
    { href: "/garages", label: "Garages by city in Quebec" },
    { href: "/en/why-garago", label: "Why Garago" },
  ],
};
