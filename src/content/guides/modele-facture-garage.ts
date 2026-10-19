import type { Guide } from "@/components/GuidePage";

const OPC = "https://www.opc.gouv.qc.ca/en/consumer/good-service/vehicle/repairing/advice";
const RQ_FACTURES = "https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/collecting-gst-and-qst/preparing-invoices/";
const REG_CTI = "https://laws-lois.justice.gc.ca/eng/regulations/SOR-91-45/section-3.html";

export const fr: Guide = {
  path: "/garagistes/modele-facture-garage",
  title: "Facture et bon de travail de garage (Excel gratuit) | Garago",
  description:
    "Modèle de facture de garage gratuit pour le Québec : facture, évaluation écrite et bon de travail en Excel, avec TPS et TVQ calculées.",
  ogDescription: "Facture, évaluation écrite et bon de travail pour garage, avec TPS et TVQ calculées. Gratuit, en Excel.",
  datePublished: "2026-10-15",
  h1: "Modèle de facture et de bon de travail de garage gratuit, avec TPS et TVQ",
  intro: "Un modèle prêt à remplir pour les garages du Québec : facture, évaluation écrite et bon de travail dans un même fichier Excel. Les taxes se calculent seules, et les cases suivent ce qu'exigent Revenu Québec et la Loi sur la protection du consommateur.",
  heroCta: { label: "Télécharger le modèle gratuit", href: "/modeles/modele-facture-garage-quebec.xlsx" },
  sections: [
    {
      h2: "Téléchargez le modèle",
      paragraphs: [
        "Le fichier contient trois onglets : l'évaluation écrite à remettre avant les travaux, le bon de travail pour l'atelier et la facture finale. Remplissez vos coordonnées une seule fois en haut de chaque onglet, puis les lignes de pièces et de main-d'œuvre : les sous-totaux, la TPS (5 %), la TVQ (9,975 %) et le total se calculent automatiquement.",
      ],
      downloads: [
        { label: "Modèle de facture de garage (Excel, français)", href: "/modeles/modele-facture-garage-quebec.xlsx", note: "Facture, évaluation écrite et bon de travail. Gratuit, sans inscription." },
      ],
    },
    {
      h2: "Ce que doit contenir une facture, selon le montant",
      paragraphs: ["Revenu Québec et l'Agence du revenu du Canada exigent des renseignements différents selon le total de la facture, taxes comprises. Ce sont eux qui permettent à vos clients d'affaires de réclamer les taxes payées."],
      bullets: [
        "Moins de 100 $ : le nom de votre entreprise, la date de la facture et le montant total.",
        "De 100 $ à 499,99 $ : en plus, vos numéros d'inscription à la TPS et à la TVQ, et le montant des taxes indiqué séparément (ou la mention que les taxes sont incluses).",
        "500 $ et plus : en plus, le nom du client, les conditions de paiement et une description suffisante de chaque pièce ou service.",
      ],
    },
    {
      h2: "L'évaluation écrite : obligatoire avant une réparation de plus de 100 $",
      paragraphs: [
        "Selon l'Office de la protection du consommateur, le garage doit remettre une évaluation écrite avant toute réparation de plus de 100 $. Le client peut y renoncer seulement par un document qu'il écrit et signe lui-même : une renonciation préimprimée n'a pas de valeur. Le garage ne peut pas facturer plus que le total de l'évaluation, sauf les travaux supplémentaires autorisés par le client.",
      ],
      bullets: [
        "Les noms et adresses du client et du garage.",
        "La description du véhicule (année, marque, modèle, numéro d'identification, kilométrage).",
        "La nature et le prix total de la réparation.",
        "Les pièces à poser, en précisant si elles sont neuves, usagées, réusinées ou reconstruites.",
        "La date de l'évaluation et sa durée de validité.",
      ],
    },
    {
      h2: "La garantie légale à rappeler sur la facture",
      paragraphs: [
        "Toujours selon l'Office, une réparation de plus de 50 $ est garantie 3 mois ou 5 000 km, selon la première limite atteinte, à partir de la remise du véhicule. Le modèle l'indique au bas de la facture, avec le kilométrage à la sortie, ce qui évite les discussions si le client revient.",
      ],
    },
    {
      h2: "Bien remplir le modèle",
      bullets: [
        "Numérotez vos factures dans l'ordre, sans trou ni doublon.",
        "Séparez les pièces et la main-d'œuvre, avec le nombre d'heures et votre taux horaire.",
        "Notez le kilométrage à l'arrivée et à la sortie du véhicule.",
        "Gardez une copie de chaque facture : vous en aurez besoin pour vos déclarations de taxes.",
        "Si vous n'êtes pas inscrit aux taxes (revenus de 30 000 $ ou moins sur quatre trimestres consécutifs), n'ajoutez ni TPS ni TVQ : mettez les taux à zéro dans le modèle.",
      ],
    },
    {
      h2: "Et pour les rendez-vous ?",
      paragraphs: [
        "Le modèle règle la facture. Pour remplir l'atelier et éviter les clients qui ne viennent pas, Garago ajoute la réservation en ligne, un agenda sur téléphone et les demandes de confirmation par texto ou par courriel, à côté de vos factures.",
      ],
    },
  ],
  faq: [
    { q: "Le modèle est-il vraiment gratuit ?", a: "Oui, sans inscription. Vous pouvez le modifier, y ajouter votre logo et l'utiliser pour toutes vos factures." },
    { q: "Quels sont les taux de TPS et de TVQ au Québec ?", a: "La TPS est de 5 % et la TVQ de 9,975 %, calculées toutes deux sur le prix avant taxes, soit 14,975 % au total. Le modèle fait le calcul automatiquement." },
    { q: "Dois-je inscrire mon numéro de TPS et de TVQ ?", a: "Oui, sur toute facture de 100 $ ou plus si vous êtes inscrit. Sans ces numéros, vos clients d'affaires ne peuvent pas récupérer les taxes payées." },
    { q: "Une évaluation écrite est-elle obligatoire pour un changement de pneus ?", a: "Selon l'Office de la protection du consommateur, la vente et la pose de pneus facturées ensemble ne sont pas considérées comme une réparation, tout comme celles d'une batterie. L'évaluation écrite vise les réparations de plus de 100 $." },
  ],
  ctaTitle: "Votre facture est prête. Et votre agenda ?",
  ctaText: "Essayez Garago 30 jours gratuitement : réservation en ligne, confirmations par texto ou courriel et agenda sur téléphone.",
  related: [
    { href: "/garagistes/logiciel-garage-automobile", label: "Logiciel de garage automobile au Québec : comment choisir" },
    { href: "/garagistes/ouvrir-un-garage-quebec", label: "Ouvrir un garage automobile au Québec : les étapes" },
    { href: "/garagistes/rendez-vous-manques", label: "Rendez-vous manqués au garage : 7 moyens de réduire les absences" },
  ],
  sources: [
    { label: "Revenu Québec : préparer les factures (TPS et TVQ)", href: RQ_FACTURES },
    { label: "Règlement sur les renseignements nécessaires à une demande de crédit de taxe sur les intrants (TPS/TVH), article 3", href: REG_CTI },
    { label: "Office de la protection du consommateur : faire réparer son véhicule", href: OPC },
  ],
};

export const en: Guide = {
  path: "/en/garage-owners/auto-repair-invoice-template",
  title: "Free auto repair invoice template (Excel) | Garago",
  description:
    "Free auto repair invoice template for Quebec: invoice, written estimate and work order in Excel, with GST and QST calculated automatically.",
  ogDescription: "Auto repair invoice, written estimate and work order with GST and QST calculated. Free, in Excel.",
  datePublished: "2026-10-15",
  h1: "Free auto repair invoice template, with GST and QST",
  intro: "A ready-to-fill template for Quebec garages: invoice, written estimate and work order in one Excel file. Taxes calculate themselves, and the fields follow what Revenu Québec and the Consumer Protection Act require.",
  heroCta: { label: "Download the free template", href: "/modeles/auto-repair-invoice-template-quebec.xlsx" },
  sections: [
    {
      h2: "Download the template",
      paragraphs: [
        "The file has three tabs: the written estimate to give before the work, the work order for the shop and the final invoice. Fill in your details once at the top of each tab, then the parts and labour lines: subtotals, GST (5%), QST (9.975%) and the total are calculated automatically.",
      ],
      downloads: [
        { label: "Auto repair invoice template (Excel, English)", href: "/modeles/auto-repair-invoice-template-quebec.xlsx", note: "Invoice, written estimate and work order. Free, no sign-up." },
      ],
    },
    {
      h2: "What an invoice must include, by amount",
      paragraphs: ["Revenu Québec and the Canada Revenue Agency require different information depending on the invoice total, taxes included. This is what lets your business customers claim back the taxes they paid."],
      bullets: [
        "Under $100: your business name, the invoice date and the total amount.",
        "$100 to $499.99: also your GST and QST registration numbers, and the tax amounts shown separately (or a statement that taxes are included).",
        "$500 and over: also the customer's name, the payment terms and a description of each part or service sufficient to identify it.",
      ],
    },
    {
      h2: "Written estimates: required before a repair over $100",
      paragraphs: [
        "According to Quebec's Office de la protection du consommateur, the shop must give a written estimate before any repair over $100. The customer can only waive it in a document they write and sign themselves: a pre-printed waiver has no value. The shop can't charge more than the estimate total, except for extra work the customer authorized.",
      ],
      bullets: [
        "The names and addresses of the customer and the shop.",
        "A description of the vehicle (year, make, model, VIN, odometer).",
        "The nature and total price of the repair.",
        "The parts to be installed, stating whether they are new, used, remanufactured or rebuilt.",
        "The date of the estimate and how long it is valid.",
      ],
    },
    {
      h2: "The legal guarantee to show on the invoice",
      paragraphs: [
        "Also according to the Office, a repair over $50 is guaranteed for 3 months or 5,000 km, whichever comes first, from the time the vehicle is returned. The template states this at the bottom of the invoice, with the odometer reading at pickup, which avoids arguments if the customer comes back.",
      ],
    },
    {
      h2: "Filling in the template",
      bullets: [
        "Number your invoices in order, with no gaps or duplicates.",
        "Separate parts and labour, with the number of hours and your hourly rate.",
        "Record the odometer when the vehicle arrives and leaves.",
        "Keep a copy of every invoice: you'll need them for your tax returns.",
        "If you aren't registered for the taxes (revenue of $30,000 or less over four consecutive quarters), don't add GST or QST: set the rates to zero in the template.",
      ],
    },
    {
      h2: "And your appointments?",
      paragraphs: [
        "The template takes care of the invoice. To fill the shop and avoid customers who don't show up, Garago adds online booking, a calendar on your phone and confirmation requests by text or email, alongside your invoices.",
      ],
    },
  ],
  faq: [
    { q: "Is the template really free?", a: "Yes, with no sign-up. You can edit it, add your logo and use it for all your invoices." },
    { q: "What are the GST and QST rates in Quebec?", a: "GST is 5% and QST is 9.975%, both calculated on the pre-tax price, for 14.975% in total. The template calculates them automatically." },
    { q: "Do I need to show my GST and QST numbers?", a: "Yes, on any invoice of $100 or more if you are registered. Without these numbers, your business customers can't claim back the taxes they paid." },
    { q: "Is a written estimate required for a tire change?", a: "According to the Office de la protection du consommateur, the sale and installation of tires billed together isn't considered a repair, and the same goes for batteries. Written estimates apply to repairs over $100." },
  ],
  ctaTitle: "Your invoice is ready. What about your calendar?",
  ctaText: "Try Garago free for 30 days: online booking, confirmations by text or email, and a calendar on your phone.",
  related: [
    { href: "/en/garage-owners/auto-repair-shop-software", label: "Auto repair shop software in Quebec: how to choose" },
    { href: "/en/garage-owners/open-auto-repair-shop-quebec", label: "How to open an auto repair shop in Quebec" },
    { href: "/en/garage-owners/missed-appointments", label: "Auto repair shop no-shows: 7 ways to reduce missed appointments" },
  ],
  sources: [
    { label: "Revenu Québec: preparing invoices (GST and QST)", href: RQ_FACTURES },
    { label: "Input Tax Credit Information (GST/HST) Regulations, section 3", href: REG_CTI },
    { label: "Office de la protection du consommateur: getting your vehicle repaired", href: OPC },
  ],
};
