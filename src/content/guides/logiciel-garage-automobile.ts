import type { Guide } from "@/components/GuidePage";

const OPC = "https://www.opc.gouv.qc.ca/en/consumer/good-service/vehicle/repairing/advice";
const OPC_AIDE = "https://cdn.opc.gouv.qc.ca/media/documents/commercant/secteur/vehicule/aide-memoire_auto-au-garage.pdf";
const RQ_FACTURES = "https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/collecting-gst-and-qst/preparing-invoices/";

export const fr: Guide = {
  path: "/garagistes/logiciel-garage-automobile",
  title: "Logiciel de garage automobile au Québec : comment choisir (2026) | Garago",
  description:
    "Logiciel de gestion de garage, facturation TPS/TVQ, évaluation écrite, prise de rendez-vous : les critères pour choisir un logiciel de garage automobile adapté au Québec, et les pièges des logiciels conçus pour la France.",
  ogDescription: "Facturation TPS/TVQ, évaluation écrite exigée par la loi, rendez-vous en ligne : bien choisir son logiciel de garage au Québec.",
  datePublished: "2026-10-15",
  h1: "Logiciel de garage automobile au Québec : comment choisir",
  intro: "Quand on cherche un logiciel de garage, la plupart des résultats viennent de France : taxes, catalogues de pièces et règles différentes. Voici ce qu'un garage québécois doit vérifier, et comment répartir le travail entre un logiciel de facturation et un outil de rendez-vous.",
  sections: [
    {
      h2: "Deux familles d'outils, deux besoins",
      paragraphs: [
        "Un logiciel de gestion de garage (souvent appelé DMS) sert au travail administratif de l'atelier : évaluations écrites, bons de travail, factures avec TPS et TVQ, pièces et inventaire, historique de chaque véhicule.",
        "Un outil de rendez-vous et de relation client sert à remplir l'atelier : agenda, réservation en ligne, confirmations et rappels, fiche visible par les conducteurs, avis. Certains logiciels font les deux, souvent moins bien d'un côté. Beaucoup de garages gardent leur logiciel de facturation et ajoutent un outil spécialisé pour les rendez-vous.",
      ],
    },
    {
      h2: "Ce que la loi québécoise impose à vos documents",
      paragraphs: [
        "La Loi sur la protection du consommateur encadre la réparation automobile (articles 167 à 181). Selon l'Office de la protection du consommateur, pour une réparation de plus de 100 $, le garage doit remettre une évaluation écrite avant de commencer les travaux. Elle indique les noms et adresses du client et du garage, la description du véhicule, la nature et le prix total de la réparation, les pièces à poser (neuves, usagées, réusinées ou reconstruites), la date et la durée de validité de l'évaluation. Le garage ne peut pas facturer plus que le total indiqué, sauf les travaux ajoutés que le client a autorisés.",
        "Toujours selon l'Office, une réparation de plus de 50 $ est garantie 3 mois ou 5 000 km, selon la première limite atteinte, et le garage doit afficher son taux horaire. Votre logiciel doit donc produire des évaluations et des factures en français qui contiennent tous ces renseignements.",
        "Côté taxes, Revenu Québec exige des renseignements différents selon le montant de la facture : le nom du fournisseur, la date et le total sous 100 $ ; à partir de 100 $, les numéros d'inscription à la TPS et à la TVQ et les taxes indiquées séparément ; à partir de 500 $, en plus, le nom du client, les conditions de paiement et une description de chaque fourniture.",
      ],
    },
    {
      h2: "Les critères pour choisir",
      bullets: [
        "Facturation avec TPS (5 %) et TVQ (9,975 %), vos numéros d'inscription et les renseignements exigés selon le montant.",
        "Évaluation écrite conforme à la Loi sur la protection du consommateur, convertie en bon de travail puis en facture sans ressaisie.",
        "Interface, documents et soutien technique en français.",
        "Catalogues de pièces de vos fournisseurs canadiens, et non des catalogues européens.",
        "Historique par véhicule (numéro d'identification, kilométrage, travaux faits) pour le suivi et la garantie de 3 mois ou 5 000 km.",
        "Utilisation sur téléphone ou tablette dans l'atelier.",
        "Export de vos données (clients, véhicules, factures) si vous changez de logiciel.",
        "Prise de rendez-vous en ligne intégrée, ou compatible avec un outil spécialisé.",
      ],
    },
    {
      h2: "Attention aux logiciels conçus pour la France",
      paragraphs: [
        "Les comparatifs en français sont presque tous écrits pour le marché français. Ces logiciels calculent la TVA, se branchent sur des catalogues et des plateformes d'assurance européens, et emploient un vocabulaire différent. Avant de signer, demandez une démonstration avec une facture québécoise réelle : TPS, TVQ, vos numéros d'inscription et une évaluation écrite conforme.",
      ],
    },
    {
      h2: "Gratuit ou payant ?",
      paragraphs: [
        "Un tableur et un modèle de facture suffisent pour démarrer, surtout pour un garage d'une ou deux portes. Les limites arrivent vite : pas d'historique par véhicule, risque d'erreur dans les taxes, rendez-vous notés à part. Commencez par un modèle bien fait, puis passez à un logiciel quand la ressaisie vous coûte plus d'une heure par semaine.",
      ],
      downloads: [
        { label: "Modèle de facture de garage gratuit (Excel)", href: "/modeles/modele-facture-garage-quebec.xlsx", note: "Facture, évaluation écrite et bon de travail, avec TPS et TVQ calculées." },
      ],
    },
    {
      h2: "Où se place Garago",
      paragraphs: [
        "Garago n'est pas un logiciel de facturation : gardez le vôtre. Garago s'occupe de ce qui remplit l'atelier et évite les absences : la réservation en ligne 24 h sur 24 selon vos services, leur durée et votre nombre de portes, l'agenda où vous ajoutez aussi les rendez-vous pris au téléphone, les demandes de confirmation par texto ou par courriel, et une fiche publique où les conducteurs vous trouvent par service, marque et ville.",
        "Vos rendez-vous s'exportent vers Excel à tout moment. L'abonnement coûte 109,99 $ par mois sans engagement, ou 88 $ par mois à l'année, avec 30 jours d'essai gratuit.",
      ],
    },
  ],
  faq: [
    { q: "Existe-t-il un logiciel de garage automobile gratuit ?", a: "Il existe des versions gratuites limitées et des modèles de facture à télécharger. Pour un petit garage, un modèle avec TPS et TVQ bien calculées suffit au départ. Vérifiez qu'il contient les renseignements exigés par Revenu Québec et par la Loi sur la protection du consommateur." },
    { q: "Garago fait-il la facturation ?", a: "Non. Garago gère les rendez-vous : réservation en ligne, agenda, confirmations et rappels, fiche publique et avis. Il fonctionne à côté de votre logiciel de facturation actuel." },
    { q: "Quels renseignements doit contenir une évaluation écrite au Québec ?", a: "Selon l'Office de la protection du consommateur : les noms et adresses du client et du garage, la description du véhicule, la nature et le prix total de la réparation, les pièces à poser (neuves, usagées, réusinées ou reconstruites), la date et la durée de validité. Elle est obligatoire pour une réparation de plus de 100 $, sauf renonciation écrite et signée par le client." },
    { q: "Un logiciel de garage français peut-il convenir au Québec ?", a: "Rarement tel quel : les taxes, les catalogues de pièces et les documents exigés sont différents. Demandez à voir une facture avec TPS et TVQ et une évaluation écrite conforme avant de vous engager." },
  ],
  ctaTitle: "Gardez votre facturation, remplissez votre agenda",
  ctaText: "Essayez Garago 30 jours : réservation en ligne, agenda sur téléphone et confirmations par texto ou courriel, à côté de votre logiciel actuel.",
  related: [
    { href: "/garagistes/modele-facture-garage", label: "Modèle de facture de garage gratuit (TPS et TVQ)" },
    { href: "/garagistes/prise-de-rendez-vous-en-ligne", label: "Prise de rendez-vous en ligne pour garage : le guide complet" },
    { href: "/garagistes/agenda-en-ligne", label: "Agenda en ligne pour garage : les critères à vérifier" },
  ],
  sources: [
    { label: "Office de la protection du consommateur : faire réparer son véhicule", href: OPC },
    { label: "Office de la protection du consommateur : aide-mémoire « L'auto au garage » (PDF)", href: OPC_AIDE },
    { label: "Revenu Québec : préparer les factures (TPS et TVQ)", href: RQ_FACTURES },
  ],
};

export const en: Guide = {
  path: "/en/garage-owners/auto-repair-shop-software",
  title: "Auto repair shop software in Quebec: how to choose (2026) | Garago",
  description:
    "Shop management software, GST/QST invoicing, written estimates, online booking: what to check when choosing auto repair shop software for Quebec, and why software built for other markets often falls short.",
  ogDescription: "GST/QST invoicing, legally required written estimates and online booking: choosing auto repair shop software in Quebec.",
  datePublished: "2026-10-15",
  h1: "Auto repair shop software in Quebec: how to choose",
  intro: "Most auto shop software is built for the United States or France, with different taxes, parts catalogs and legal requirements. Here is what a Quebec garage should check, and how to split the work between invoicing software and a booking tool.",
  sections: [
    {
      h2: "Two kinds of tools, two needs",
      paragraphs: [
        "Shop management software (often called a DMS) handles the paperwork: written estimates, work orders, invoices with GST and QST, parts and inventory, and each vehicle's history.",
        "A booking and customer tool fills the shop: calendar, online booking, confirmations and reminders, a public page drivers can find, reviews. Some software does both, usually doing one side less well. Many shops keep their invoicing software and add a dedicated booking tool.",
      ],
    },
    {
      h2: "What Quebec law requires from your documents",
      paragraphs: [
        "Quebec's Consumer Protection Act regulates car repairs (sections 167 to 181). According to the Office de la protection du consommateur, for a repair over $100 the shop must give a written estimate before starting work. It shows the names and addresses of the customer and the shop, a description of the vehicle, the nature and total price of the repair, the parts to be installed (new, used, remanufactured or rebuilt), and the date and validity period of the estimate. The shop can't charge more than the total stated, except for added work the customer authorized.",
        "Also according to the Office, a repair over $50 is guaranteed for 3 months or 5,000 km, whichever comes first, and the shop must post its hourly rate. Your software must produce estimates and invoices that contain all of this.",
        "For taxes, Revenu Québec requires different information depending on the invoice amount: supplier name, date and total under $100; from $100, the GST and QST registration numbers and the taxes shown separately; from $500, also the customer's name, the payment terms and a description of each supply.",
      ],
    },
    {
      h2: "Criteria to choose",
      bullets: [
        "Invoicing with GST (5%) and QST (9.975%), your registration numbers and the information required for each amount.",
        "Written estimates that meet the Consumer Protection Act, turned into a work order then an invoice without re-entry.",
        "Documents and support available in French as well as English.",
        "Parts catalogs from your Canadian suppliers.",
        "History per vehicle (VIN, odometer, work done) for follow-up and the 3-month or 5,000 km guarantee.",
        "Works on a phone or tablet in the shop.",
        "Export of your data (customers, vehicles, invoices) if you switch software.",
        "Built-in online booking, or compatibility with a dedicated tool.",
      ],
    },
    {
      h2: "Watch out for software built for other markets",
      paragraphs: [
        "Many popular auto shop systems are designed for the United States: sales tax instead of GST and QST, US parts catalogs, English-only documents. Before signing, ask for a demo with a real Quebec invoice: GST, QST, your registration numbers and a compliant written estimate.",
      ],
    },
    {
      h2: "Free or paid?",
      paragraphs: [
        "A spreadsheet and a good invoice template are enough to start, especially for a one- or two-bay shop. The limits come quickly: no history per vehicle, tax mistakes, appointments tracked separately. Start with a solid template, then move to software when re-entering data costs you more than an hour a week.",
      ],
      downloads: [
        { label: "Free auto repair invoice template (Excel)", href: "/modeles/auto-repair-invoice-template-quebec.xlsx", note: "Invoice, written estimate and work order, with GST and QST calculated." },
      ],
    },
    {
      h2: "Where Garago fits",
      paragraphs: [
        "Garago isn't invoicing software: keep yours. Garago handles what fills the shop and prevents no-shows: online booking 24/7 based on your services, their length and your number of bays, a calendar where you also add phone bookings, confirmation requests by text or email, and a public page where drivers find you by service, make and city.",
        "Your appointments export to Excel at any time. The subscription is $109.99 per month with no commitment, or $88 per month on an annual plan, with a 30-day free trial.",
      ],
    },
  ],
  faq: [
    { q: "Is there free auto repair shop software?", a: "There are limited free versions and invoice templates you can download. For a small shop, a template with GST and QST calculated correctly is enough to start. Check that it includes the information Revenu Québec and the Consumer Protection Act require." },
    { q: "Does Garago do invoicing?", a: "No. Garago handles appointments: online booking, calendar, confirmations and reminders, a public page and reviews. It works alongside your current invoicing software." },
    { q: "What must a written estimate include in Quebec?", a: "According to the Office de la protection du consommateur: the names and addresses of the customer and the shop, a description of the vehicle, the nature and total price of the repair, the parts to be installed (new, used, remanufactured or rebuilt), and the date and validity period. It is required for repairs over $100 unless the customer waives it in a document they write and sign themselves." },
    { q: "Can US auto shop software work in Quebec?", a: "Rarely as is: taxes, parts catalogs and required documents are different. Ask to see an invoice with GST and QST and a compliant written estimate before you commit." },
  ],
  ctaTitle: "Keep your invoicing, fill your calendar",
  ctaText: "Try Garago for 30 days: online booking, a calendar on your phone, and confirmations by text or email, alongside your current software.",
  related: [
    { href: "/en/garage-owners/auto-repair-invoice-template", label: "Free auto repair invoice template (GST and QST)" },
    { href: "/en/garage-owners/online-booking", label: "Online booking for auto repair shops: the complete guide" },
    { href: "/en/garage-owners/online-scheduling-calendar", label: "Online scheduling calendar for auto repair shops: how to choose" },
  ],
  sources: [
    { label: "Office de la protection du consommateur: getting your vehicle repaired", href: OPC },
    { label: "Office de la protection du consommateur: \"L'auto au garage\" checklist (PDF, French)", href: OPC_AIDE },
    { label: "Revenu Québec: preparing invoices (GST and QST)", href: RQ_FACTURES },
  ],
};
