import type { Guide } from "@/components/GuidePage";

const OPC = "https://www.opc.gouv.qc.ca/en/consumer/good-service/vehicle/repairing/advice";
const OPC_AIDE = "https://cdn.opc.gouv.qc.ca/media/documents/commercant/secteur/vehicule/aide-memoire_auto-au-garage.pdf";
const HALO = "https://www.quebec.ca/emploi/informer-metier-profession/profession-metier-reglemente/connaitre-certificats-qualification-obligatoire/qualification-environnementale-halocarbures";
const CCQ_HALO = "https://www.ccq.org/qualification-acces-industrie/halocarbures";
const RECYC_PNEUS = "https://www.recyc-quebec.gouv.qc.ca/sites/default/files/documents/programme-pneus-2021-2026.pdf";
const GUICHET = "https://www.guichetemplois.gc.ca/rapportmarche/prerequis/14857/QC";

export const fr: Guide = {
  path: "/garagistes/ouvrir-un-garage-quebec",
  title: "Ouvrir un garage automobile au Québec : les étapes et obligations (2026) | Garago",
  description:
    "Ouvrir un garage mécanique au Québec : immatriculation et NEQ, TPS et TVQ, zonage, Loi sur la protection du consommateur, huiles et pneus usagés, climatisation, comité paritaire, assurances et premiers clients.",
  ogDescription: "NEQ, taxes, zonage, protection du consommateur, environnement et premiers clients : les étapes pour ouvrir un garage au Québec.",
  datePublished: "2026-10-15",
  h1: "Ouvrir un garage automobile au Québec : les étapes",
  intro: "Ouvrir un garage, c'est d'abord une affaire de mécanique, mais aussi d'obligations propres au Québec : protection du consommateur, environnement, taxes et, dans certaines régions, un comité paritaire. Voici les étapes dans l'ordre, avec les sources officielles à consulter.",
  sections: [
    {
      h2: "1. Choisir la forme de l'entreprise et l'immatriculer",
      paragraphs: [
        "Entreprise individuelle ou société par actions : le choix a des effets sur votre responsabilité et votre fiscalité, et mérite une discussion avec un comptable. L'immatriculation auprès du Registraire des entreprises du Québec vous donne votre numéro d'entreprise du Québec (NEQ), demandé par vos fournisseurs, votre assureur et les plateformes où vous inscrirez votre garage.",
      ],
    },
    {
      h2: "2. S'inscrire aux taxes",
      paragraphs: [
        "L'inscription à la TPS et à la TVQ devient obligatoire quand vos revenus taxables dépassent 30 000 $ sur quatre trimestres consécutifs ou dans un seul trimestre. La plupart des garages franchissent ce seuil rapidement : beaucoup s'inscrivent dès l'ouverture pour récupérer les taxes payées sur l'équipement.",
      ],
    },
    {
      h2: "3. Vérifier le zonage et les permis de la ville",
      paragraphs: [
        "Avant de signer un bail, demandez à la municipalité si un atelier de mécanique est permis à cette adresse, et quels permis ou certificats d'occupation sont nécessaires. Les règles sur l'entreposage extérieur, le stationnement des véhicules de clients et l'affichage varient d'une ville à l'autre.",
      ],
    },
    {
      h2: "4. Connaître vos obligations envers les clients",
      paragraphs: ["La Loi sur la protection du consommateur encadre la réparation automobile (articles 167 à 181). Selon l'Office de la protection du consommateur :"],
      bullets: [
        "Une évaluation écrite est obligatoire avant toute réparation de plus de 100 $, sauf renonciation écrite et signée par le client lui-même.",
        "Le garage ne peut pas facturer plus que le total de l'évaluation, sauf les travaux supplémentaires autorisés.",
        "Une réparation de plus de 50 $ est garantie 3 mois ou 5 000 km, selon la première limite atteinte.",
        "Le garage doit afficher son taux horaire et les principaux droits des consommateurs en matière de réparation.",
      ],
    },
    {
      h2: "5. Gérer les huiles, filtres, antigels et pneus usagés",
      paragraphs: [
        "Les huiles usagées, leurs contenants, les filtres et les antigels sont récupérés au Québec par un programme géré par la SOGHU, un organisme reconnu par RECYC-QUÉBEC. Les ateliers mécaniques forment l'essentiel de son réseau de points de dépôt, et la collecte y est offerte sans frais.",
        "Pour les pneus hors d'usage, RECYC-QUÉBEC gère un programme de récupération : un garage qui a l'équipement pour changer et déjanter les pneus peut s'inscrire comme point de collecte pour bénéficier de l'enlèvement gratuit. Renseignez-vous auprès de la SOGHU et de RECYC-QUÉBEC avant l'ouverture.",
      ],
    },
    {
      h2: "6. La climatisation : une qualification obligatoire",
      paragraphs: [
        "Selon le gouvernement du Québec, toute personne qui manipule des halocarbures, notamment pour l'entretien d'un climatiseur de véhicule, doit détenir le certificat de qualification environnementale en halocarbures. Seuls les détenteurs de cette qualification peuvent acheter ces réfrigérants. La formation est offerte par l'intermédiaire de la Commission de la construction du Québec.",
      ],
    },
    {
      h2: "7. Vérifier si un comité paritaire s'applique",
      paragraphs: [
        "Dans plusieurs régions, dont celle de Montréal, un décret de convention collective encadre l'industrie des services automobiles. Il est administré par un comité paritaire qui fixe des conditions de travail et des obligations pour les employeurs (registre, rapport mensuel, prélèvement). Communiquez avec le comité paritaire de votre région avant d'embaucher.",
        "Selon Guichet-Emplois, la certification de mécanicien de véhicules automobiles est facultative au Québec, contrairement à d'autres provinces. Vérifiez toutefois les exigences du décret de votre région.",
      ],
    },
    {
      h2: "8. Embaucher et s'assurer",
      bullets: [
        "Comme employeur, inscrivez-vous à la CNESST et aux retenues à la source auprès de Revenu Québec et de l'Agence du revenu du Canada.",
        "Avec un courtier, prévoyez une assurance responsabilité civile et une protection pour les véhicules des clients qui vous sont confiés.",
        "Préparez vos documents : évaluation écrite, bon de travail et facture conformes.",
      ],
      downloads: [
        { label: "Modèle de facture, évaluation écrite et bon de travail (Excel)", href: "/modeles/modele-facture-garage-quebec.xlsx", note: "Gratuit, avec TPS et TVQ calculées." },
      ],
    },
    {
      h2: "9. Trouver vos premiers clients",
      bullets: [
        "Créez votre fiche d'entreprise Google dès que l'adresse est confirmée, avec photos et heures.",
        "Ouvrez la réservation en ligne dès le premier jour : un nouveau garage n'a pas encore de bouche-à-oreille, il doit être facile à réserver.",
        "Demandez un avis à chacun de vos premiers clients satisfaits.",
        "Inscrivez votre garage sur Garago pour être trouvé par service, marque et ville.",
      ],
    },
  ],
  faq: [
    { q: "Peut-on ouvrir un garage sans diplôme au Québec ?", a: "Selon Guichet-Emplois, la certification de mécanicien automobile est facultative au Québec. Certaines activités exigent toutefois une qualification, comme la manipulation des réfrigérants de climatisation, et un décret de convention collective peut s'appliquer dans votre région. Une formation reste un atout pour la qualité du travail et la confiance des clients." },
    { q: "Faut-il un permis pour ouvrir un garage ?", a: "Il n'existe pas de permis unique « de garage », mais vous devez immatriculer l'entreprise, vérifier le zonage et obtenir les permis municipaux requis, et respecter les obligations de la Loi sur la protection du consommateur et de l'environnement." },
    { q: "Quelles obligations envers les clients dès l'ouverture ?", a: "Évaluation écrite avant une réparation de plus de 100 $, garantie de 3 mois ou 5 000 km sur les réparations de plus de 50 $, et affichage du taux horaire, selon l'Office de la protection du consommateur." },
    { q: "Comment un nouveau garage se fait-il connaître ?", a: "Une fiche Google complète, la réservation en ligne dès l'ouverture, des avis demandés systématiquement et une présence sur les plateformes où les conducteurs cherchent un garage." },
  ],
  ctaTitle: "Ouvrez avec un agenda déjà prêt",
  ctaText: "Essayez Garago 30 jours : fiche publique, réservation en ligne et confirmations, pour remplir l'atelier dès les premières semaines.",
  related: [
    { href: "/garagistes/modele-facture-garage", label: "Modèle de facture de garage gratuit (TPS et TVQ)" },
    { href: "/garagistes/attirer-clients-garage", label: "Attirer plus de clients dans son garage au Québec" },
    { href: "/garagistes/logiciel-garage-automobile", label: "Logiciel de garage automobile au Québec : comment choisir" },
  ],
  sources: [
    { label: "Office de la protection du consommateur : faire réparer son véhicule", href: OPC },
    { label: "Office de la protection du consommateur : aide-mémoire « L'auto au garage » (PDF)", href: OPC_AIDE },
    { label: "Québec.ca : qualification environnementale en halocarbures", href: HALO },
    { label: "Commission de la construction du Québec : qualification en halocarbures", href: CCQ_HALO },
    { label: "RECYC-QUÉBEC : programme de gestion des pneus hors d'usage (PDF)", href: RECYC_PNEUS },
    { label: "Guichet-Emplois : exigences pour les mécaniciens de véhicules automobiles au Québec", href: GUICHET },
  ],
};

export const en: Guide = {
  path: "/en/garage-owners/open-auto-repair-shop-quebec",
  title: "How to open an auto repair shop in Quebec: steps and obligations (2026) | Garago",
  description:
    "Opening an auto repair shop in Quebec: registration and NEQ, GST and QST, zoning, the Consumer Protection Act, used oil and tires, air conditioning, joint committees, insurance and your first customers.",
  ogDescription: "NEQ, taxes, zoning, consumer protection, environment and first customers: the steps to open an auto repair shop in Quebec.",
  datePublished: "2026-10-15",
  h1: "How to open an auto repair shop in Quebec",
  intro: "Opening a garage is about mechanics first, but also about obligations specific to Quebec: consumer protection, environment, taxes and, in some regions, a joint committee. Here are the steps in order, with the official sources to check.",
  sections: [
    { h2: "1. Choose a business structure and register it", paragraphs: ["Sole proprietorship or corporation: the choice affects your liability and taxes and is worth discussing with an accountant. Registering with the Registraire des entreprises du Québec gives you your Quebec enterprise number (NEQ), which suppliers, insurers and the platforms where you list your shop will ask for."] },
    { h2: "2. Register for the taxes", paragraphs: ["GST and QST registration becomes mandatory when your taxable revenue exceeds $30,000 over four consecutive quarters or in a single quarter. Most shops pass that threshold quickly: many register from day one to recover the taxes paid on equipment."] },
    { h2: "3. Check zoning and city permits", paragraphs: ["Before signing a lease, ask the municipality whether a repair shop is allowed at that address and which permits or occupancy certificates you need. Rules on outdoor storage, customer vehicle parking and signage vary from city to city."] },
    {
      h2: "4. Know your obligations to customers",
      paragraphs: ["Quebec's Consumer Protection Act regulates car repairs (sections 167 to 181). According to the Office de la protection du consommateur:"],
      bullets: [
        "A written estimate is required before any repair over $100, unless the customer waives it in a document they write and sign themselves.",
        "The shop can't charge more than the estimate total, except for authorized additional work.",
        "A repair over $50 is guaranteed for 3 months or 5,000 km, whichever comes first.",
        "The shop must post its hourly rate and the main consumer rights for repairs.",
      ],
    },
    {
      h2: "5. Handle used oil, filters, antifreeze and tires",
      paragraphs: [
        "Used oil, oil containers, filters and antifreeze are collected in Quebec through a program run by SOGHU, an organization recognized by RECYC-QUÉBEC. Repair shops make up most of its network of drop-off points, and collection is free.",
        "For scrap tires, RECYC-QUÉBEC runs a recovery program: a shop with the equipment to change and dismount tires can register as a collection point to get free pickup. Contact SOGHU and RECYC-QUÉBEC before opening.",
      ],
    },
    { h2: "6. Air conditioning: a mandatory qualification", paragraphs: ["According to the Government of Quebec, anyone who handles halocarbons, including servicing a vehicle air conditioner, must hold the environmental qualification certificate for halocarbons. Only holders of this qualification can buy these refrigerants. Training is offered through the Commission de la construction du Québec."] },
    {
      h2: "7. Check whether a joint committee applies",
      paragraphs: [
        "In several regions, including Montreal, a collective agreement decree governs the automotive services industry. It is administered by a joint committee (comité paritaire) that sets working conditions and employer obligations (register, monthly report, levy). Contact the joint committee for your region before hiring.",
        "According to Job Bank, automotive service technician certification is voluntary in Quebec, unlike in some other provinces. Still, check the requirements of your region's decree.",
      ],
    },
    {
      h2: "8. Hire and get insured",
      bullets: [
        "As an employer, register with the CNESST and for source deductions with Revenu Québec and the Canada Revenue Agency.",
        "With a broker, plan for liability insurance and coverage for customer vehicles left in your care.",
        "Prepare your documents: compliant written estimate, work order and invoice.",
      ],
      downloads: [
        { label: "Invoice, written estimate and work order template (Excel)", href: "/modeles/auto-repair-invoice-template-quebec.xlsx", note: "Free, with GST and QST calculated." },
      ],
    },
    {
      h2: "9. Find your first customers",
      bullets: [
        "Create your Google Business Profile as soon as the address is confirmed, with photos and hours.",
        "Open online booking from day one: a new shop has no word of mouth yet, so it has to be easy to book.",
        "Ask every satisfied early customer for a review.",
        "List your shop on Garago to be found by service, make and city.",
      ],
    },
  ],
  faq: [
    { q: "Can I open a garage without a mechanic's diploma in Quebec?", a: "According to Job Bank, automotive service technician certification is voluntary in Quebec. Some activities do require a qualification, such as handling air conditioning refrigerants, and a collective agreement decree may apply in your region. Training remains an asset for work quality and customer trust." },
    { q: "Do I need a permit to open a garage?", a: "There is no single \"garage permit\", but you must register the business, check zoning and get the required municipal permits, and meet the obligations of the Consumer Protection Act and environmental rules." },
    { q: "What obligations apply to customers from day one?", a: "A written estimate before any repair over $100, a 3-month or 5,000 km guarantee on repairs over $50, and a posted hourly rate, according to the Office de la protection du consommateur." },
    { q: "How does a new shop get known?", a: "A complete Google Business Profile, online booking from day one, reviews requested systematically, and a presence on the platforms where drivers search for a garage." },
  ],
  ctaTitle: "Open with your calendar ready",
  ctaText: "Try Garago for 30 days: a public page, online booking and confirmations, to fill the shop from the first weeks.",
  related: [
    { href: "/en/garage-owners/auto-repair-invoice-template", label: "Free auto repair invoice template (GST and QST)" },
    { href: "/en/garage-owners/get-more-customers", label: "How to get more customers for your auto repair shop in Quebec" },
    { href: "/en/garage-owners/auto-repair-shop-software", label: "Auto repair shop software in Quebec: how to choose" },
  ],
  sources: [
    { label: "Office de la protection du consommateur: getting your vehicle repaired", href: OPC },
    { label: "Office de la protection du consommateur: \"L'auto au garage\" checklist (PDF, French)", href: OPC_AIDE },
    { label: "Québec.ca: environmental qualification for halocarbons (French)", href: HALO },
    { label: "Commission de la construction du Québec: halocarbon qualification", href: "https://www.ccq.org/en/qualification-acces-industrie/halocarbures" },
    { label: "RECYC-QUÉBEC: scrap tire management program (PDF, French)", href: RECYC_PNEUS },
    { label: "Job Bank: requirements for automotive service technicians in Quebec", href: "https://www.jobbank.gc.ca/marketreport/requirements/14857/QC" },
  ],
};
