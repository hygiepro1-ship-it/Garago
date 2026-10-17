// Compléments des articles de conseils : réponse courte affichée en tête (« L'essentiel »), sources
// officielles citées en bas de l'article, et date de dernière mise à jour.
// Les sources sont des pages publiques du gouvernement du Québec, de la SAAQ, de l'Office de la protection
// du consommateur, de Transports Canada, de Ressources naturelles Canada et de CAA-Québec (vérifiées le 2026-10-17).

export interface ArticleSource { label: string; labelEn?: string; href: string }
export interface ArticleExtra {
  essentiel: { fr: string; en: string };
  sources: ArticleSource[];
  updatedAt: string;
}

const S = {
  quebecPneus: { label: "Gouvernement du Québec : obligations sur les pneus d'hiver", labelEn: "Government of Québec: winter tire requirements (French)", href: "https://www.quebec.ca/transports/conduire-en-hiver/pneus-hiver" },
  caaPneus: { label: "CAA-Québec : acheter des pneus d'hiver, guide complet", labelEn: "CAA-Québec: winter tire buying guide (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/petit-guide-pour-l-achat-de-pneus-d-hiver" },
  caaHiver: { label: "CAA-Québec : l'hiver en auto, guide complet", labelEn: "CAA-Québec: winter driving guide (French)", href: "https://www.caaquebec.com/fr/conseils/se-deplacer-sur-les-routes/l-hiver-en-auto-guide-complet" },
  caaPrep: { label: "CAA-Québec : préparer sa voiture pour l'hiver", labelEn: "CAA-Québec: getting your car ready for winter (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/preparer-sa-voiture-pour-l-hiver" },
  caaVoyants: { label: "CAA-Québec : comprendre les voyants du tableau de bord", labelEn: "CAA-Québec: dashboard warning lights explained (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/decodez-14-temoins-lumineux-importants-de-votre-auto" },
  caaEntretien: { label: "CAA-Québec : 10 questions fréquentes sur l'entretien auto", labelEn: "CAA-Québec: 10 common car maintenance questions (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/10-questions-frequentes-sur-l-entretien-auto" },
  caaBatterie: { label: "CAA-Québec : prolonger la vie de votre batterie", labelEn: "CAA-Québec: extending your battery's life (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/trucs-pour-prolonger-la-vie-de-votre-batterie-d-auto" },
  caaFroid: { label: "CAA-Québec : démarrer son auto par temps froid", labelEn: "CAA-Québec: starting your car in cold weather (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/demarrer-son-auto-par-temps-froid" },
  caaAntirouille: { label: "CAA-Québec : traitement antirouille, quand, lequel et pourquoi", labelEn: "CAA-Québec: rustproofing, when, which and why (French)", href: "https://www.caaquebec.com/fr/conseils/entretenir-un-vehicule/antirouille-et-autres-solutions-pour-prevenir-la-rouille-sur-votre-auto" },
  caaPanne: { label: "CAA-Québec : panne d'auto, rester en sécurité", labelEn: "CAA-Québec: staying safe after a breakdown (French)", href: "https://www.caaquebec.com/fr/conseils/se-deplacer-sur-les-routes/que-faire-en-cas-de-panne-d-auto" },
  caaInspection: { label: "CAA-Québec : inspection d'un véhicule", labelEn: "CAA-Québec: vehicle inspection (French)", href: "https://www.caaquebec.com/fr/mobilite/inspection-d-un-vehicule" },
  tcGonflage: { label: "Transports Canada : le gonflage des pneus", labelEn: "Transport Canada: inflating your tires", href: "https://tc.canada.ca/fr/transport-routier/securite-vehicules-automobiles/gonflage-pneus" },
  tcRappels: { label: "Transports Canada : banque de données des rappels", labelEn: "Transport Canada: motor vehicle recalls database", href: "https://wwwapps.tc.gc.ca/Saf-Sec-Sur/7/VRDB-BDRV/search-recherche/menu.aspx?lang=fra" },
  rncan: { label: "Ressources naturelles Canada : facteurs qui influent sur la consommation de carburant", labelEn: "Natural Resources Canada: factors that affect fuel efficiency", href: "https://ressources-naturelles.canada.ca/efficacite-energetique/efficacite-energetique-transports/vehicules-personnels/facteurs-ayant-repercussions-rendement-carburant" },
  opcDroits: { label: "Office de la protection du consommateur : auto au garage, connaissez vos droits", labelEn: "Office de la protection du consommateur: your rights at the garage (French)", href: "https://www.opc.gouv.qc.ca/droits-auto-garage" },
  opcConseils: { label: "Office de la protection du consommateur : avant de faire réparer une auto", labelEn: "Office de la protection du consommateur: before having a car repaired (French)", href: "https://www.opc.gouv.qc.ca/consommateur/bien-service/vehicule/reparation/conseils" },
  saaqGuide: { label: "SAAQ : guide de vérification mécanique des véhicules routiers (PDF)", labelEn: "SAAQ: road vehicle mechanical inspection guide (PDF, French)", href: "https://saaq.gouv.qc.ca/blob/saaq/documents/publications/guide-verification-mecanique.pdf" },
  saaqRemiser: { label: "SAAQ : remiser ou déremiser un véhicule (PDF)", labelEn: "SAAQ: putting a vehicle in or out of storage (PDF, French)", href: "https://saaq.gouv.qc.ca/blob/saaq/documents/publications/remiser-deremiser.pdf" },
  saaqMandataires: { label: "SAAQ : mandataires en vérification de véhicules routiers", labelEn: "SAAQ: authorized road vehicle inspection agents (French)", href: "https://saaq.gouv.qc.ca/controle-routier-quebec/mandataires-verification-vehicules-routiers" },
  saaqHiver: { label: "SAAQ : l'hiver, adaptez votre conduite (PDF)", labelEn: "SAAQ: adapting your driving in winter (PDF, French)", href: "https://saaq.gouv.qc.ca/blob/saaq/documents/publications/adaptez-hiver.pdf" },
  rdprm: { label: "Registre des droits personnels et réels mobiliers (RDPRM)", labelEn: "Québec register of personal and movable real rights (RDPRM)", href: "https://www.rdprm.gouv.qc.ca/" },
  halocarbures: { label: "Ministère de l'Environnement du Québec : le règlement sur les halocarbures en bref", labelEn: "Québec Ministry of the Environment: halocarbon regulation in brief (French)", href: "https://www.environnement.gouv.qc.ca/air/halocarbures/enbref.htm" },
} satisfies Record<string, ArticleSource>;

const MAJ = "2026-10-17";

export const ARTICLE_EXTRAS: Record<string, ArticleExtra> = {
  "voiture-tremble-quand-je-freine": {
    essentiel: {
      fr: "Une voiture qui tremble au freinage a le plus souvent des disques de frein voilés, parfois des plaquettes usées ou cristallisées, plus rarement un problème de suspension ou de roulement. Faites inspecter les freins rapidement ; si la vibration est forte ou si la voiture freine moins bien, évitez l'autoroute d'ici la réparation.",
      en: "A car that shakes when braking most often has warped brake rotors, sometimes worn or glazed pads, and less often a suspension or wheel bearing problem. Have the brakes inspected soon; if the vibration is strong or braking feels weaker, stay off the highway until it is fixed.",
    },
    sources: [S.caaEntretien, S.opcDroits],
    updatedAt: MAJ,
  },
  "quand-passer-pneus-hiver-quebec": {
    essentiel: {
      fr: "Au Québec, les pneus d'hiver sont obligatoires du 1er décembre au 15 mars pour les véhicules de promenade immatriculés au Québec (amende de 200 $ à 300 $). CAA-Québec conseille de les poser dès que la température tourne autour de 7 °C plusieurs jours de suite, souvent fin octobre ou début novembre selon la région.",
      en: "In Québec, winter tires are mandatory from December 1 to March 15 for passenger vehicles registered in Québec ($200 to $300 fine). CAA-Québec advises installing them once the temperature hovers around 7 °C for several days in a row, often in late October or early November depending on the region.",
    },
    sources: [S.quebecPneus, S.caaPneus, S.caaHiver],
    updatedAt: MAJ,
  },
  "voyants-tableau-de-bord": {
    essentiel: {
      fr: "Un voyant rouge (pression d'huile, température, freins) demande de s'arrêter dès que c'est sûr ; un voyant orange signale un problème à faire vérifier dans les jours qui suivent. Le voyant moteur fixe peut venir d'un simple bouchon d'essence mal fermé ; s'il clignote, immobilisez la voiture en lieu sûr.",
      en: "A red light (oil pressure, temperature, brakes) means stop as soon as it is safe; an orange light flags a problem to have checked in the next few days. A steady engine light can come from a loose gas cap; if it flashes, stop the car somewhere safe.",
    },
    sources: [S.caaVoyants, S.caaPanne],
    updatedAt: MAJ,
  },
  "vidange-huile-frequence": {
    essentiel: {
      fr: "La vidange tous les 3 000 km est dépassée : comptez environ 5 000 à 7 500 km avec une huile conventionnelle et 10 000 à 15 000 km avec une huile synthétique. Réduisez l'intervalle en conduite sévère (trajets courts, grand froid, remorquage) et suivez toujours le manuel du propriétaire, qui fait foi.",
      en: "The 3,000 km oil change is outdated: count roughly 5,000 to 7,500 km with conventional oil and 10,000 to 15,000 km with synthetic oil. Shorten the interval under severe driving (short trips, extreme cold, towing) and always follow the owner's manual, which has the final word.",
    },
    sources: [S.caaEntretien],
    updatedAt: MAJ,
  },
  "batterie-voiture-duree-vie": {
    essentiel: {
      fr: "Une batterie d'auto dure en moyenne de 4 à 5 ans selon CAA-Québec. Par grand froid (-30 °C), elle ne dispose plus que d'environ 25 % de sa puissance de démarrage. Démarrage lent, phares qui faiblissent ou batterie de plus de 4 ans : faites-la tester avant l'hiver.",
      en: "A car battery lasts about 4 to 5 years on average, according to CAA-Québec. In extreme cold (-30 °C), it has only about 25% of its starting power left. Slow starts, dimming lights or a battery older than 4 years: have it tested before winter.",
    },
    sources: [S.caaBatterie, S.caaFroid],
    updatedAt: MAJ,
  },
  "moteur-surchauffe-que-faire": {
    essentiel: {
      fr: "Si l'aiguille de température monte vers le rouge : coupez la climatisation, mettez le chauffage au maximum, puis arrêtez-vous dès que c'est sûr et coupez le moteur. N'ouvrez jamais le bouchon du radiateur moteur chaud. Une fuite de liquide, un thermostat bloqué ou un ventilateur en panne sont les causes les plus courantes.",
      en: "If the temperature needle climbs toward red: turn off the A/C, turn the heat to maximum, then stop as soon as it is safe and turn off the engine. Never open the radiator cap on a hot engine. A coolant leak, a stuck thermostat or a failed fan are the most common causes.",
    },
    sources: [S.caaPanne, S.caaEntretien],
    updatedAt: MAJ,
  },
  "antirouille-quebec-necessaire": {
    essentiel: {
      fr: "Avec le sel de déglaçage et le gel-dégel, un traitement antirouille est utile au Québec, surtout dans les premières années du véhicule. CAA-Québec recommande de l'appliquer entre août et octobre, avant le retour du sel ; l'efficacité des modules électroniques n'est pas démontrée. Lavez aussi le dessous de caisse durant l'hiver.",
      en: "With road salt and freeze-thaw cycles, rustproofing is worthwhile in Québec, especially in a vehicle's first years. CAA-Québec recommends applying it between August and October, before salt is back on the roads; electronic modules have not been shown to work. Also wash the underbody during the winter.",
    },
    sources: [S.caaAntirouille],
    updatedAt: MAJ,
  },
  "freins-qui-grincent": {
    essentiel: {
      fr: "Un grincement qui disparaît après deux ou trois freinages le matin vient souvent d'une fine rouille sur les disques : c'est normal. Un grincement métallique constant ou un bruit de meulage signale des plaquettes usées jusqu'au métal : faites réparer sans attendre, avant que les disques ne soient endommagés.",
      en: "A squeak that goes away after two or three stops in the morning often comes from light rust on the rotors: that is normal. A constant metallic squeal or a grinding noise means the pads are worn down to metal: have them repaired right away, before the rotors are damaged.",
    },
    sources: [S.caaEntretien, S.opcDroits],
    updatedAt: MAJ,
  },
  "climatisation-ne-refroidit-plus": {
    essentiel: {
      fr: "Une climatisation qui ne refroidit plus manque le plus souvent de réfrigérant, à cause d'une fuite lente ; un condenseur bouché ou un compresseur défaillant sont d'autres causes. Une recharge sans réparer la fuite ne dure pas, et au Québec le réfrigérant doit être récupéré par un technicien équipé.",
      en: "An A/C that no longer cools is most often low on refrigerant because of a slow leak; a clogged condenser or a failing compressor are other causes. A recharge without fixing the leak won't last, and in Québec the refrigerant must be recovered by an equipped technician.",
    },
    sources: [S.halocarbures, S.caaEntretien],
    updatedAt: MAJ,
  },
  "consommation-essence-anormale": {
    essentiel: {
      fr: "Commencez par mesurer votre vraie consommation. Des pneus sous-gonflés de 56 kPa (8 psi) l'augmentent de près de 4 %, et la climatisation jusqu'à 20 %, selon Ressources naturelles Canada. Filtre à air encrassé, bougies usées ou sonde d'oxygène défaillante sont les causes mécaniques fréquentes ; au-delà de 15 % de hausse, faites un diagnostic.",
      en: "Start by measuring your real fuel consumption. Tires under-inflated by 56 kPa (8 psi) raise it by nearly 4%, and air conditioning by up to 20%, according to Natural Resources Canada. A clogged air filter, worn spark plugs or a faulty oxygen sensor are common mechanical causes; past a 15% increase, get a diagnosis.",
    },
    sources: [S.rncan, S.tcGonflage],
    updatedAt: MAJ,
  },
  "preparer-voiture-hiver-quebec": {
    essentiel: {
      fr: "Avant l'hiver : pneus d'hiver posés avant le 1er décembre (obligatoires jusqu'au 15 mars), freins inspectés, batterie testée, antigel et lave-glace d'hiver, essuie-glaces neufs et une trousse d'urgence dans le coffre. Vérifiez la pression des pneus après chaque vague de froid : elle baisse d'environ 7 kPa par tranche de 5 °C.",
      en: "Before winter: winter tires on before December 1 (mandatory until March 15), brakes inspected, battery tested, antifreeze and winter washer fluid, new wiper blades and an emergency kit in the trunk. Check tire pressure after every cold snap: it drops about 7 kPa for every 5 °C.",
    },
    sources: [S.caaPrep, S.caaHiver, S.quebecPneus, S.saaqHiver],
    updatedAt: MAJ,
  },
  "pression-pneus-comment-verifier": {
    essentiel: {
      fr: "La bonne pression est inscrite sur l'étiquette de la portière du conducteur, pas sur le flanc du pneu, qui indique la pression maximale. Mesurez à froid, au moins une fois par mois, roue de secours comprise. Selon Transports Canada, la pression baisse d'environ 7 kPa (1 psi) chaque fois que la température diminue de 5 °C.",
      en: "The right pressure is on the label in the driver's door, not on the tire sidewall, which shows the maximum pressure. Measure when the tires are cold, at least once a month, spare included. According to Transport Canada, pressure drops about 7 kPa (1 psi) for every 5 °C drop in temperature.",
    },
    sources: [S.tcGonflage, S.rncan],
    updatedAt: MAJ,
  },
  "voyant-check-engine-allume": {
    essentiel: {
      fr: "Voyant check engine fixe : resserrez le bouchon d'essence, puis faites lire le code d'erreur si le voyant reste allumé. Voyant qui clignote : CAA-Québec recommande d'immobiliser la voiture en lieu sûr et de la faire remorquer jusqu'au garage, car continuer peut endommager le moteur et le catalyseur.",
      en: "Steady check engine light: tighten the gas cap, then have the error code read if the light stays on. Flashing light: CAA-Québec recommends stopping the car somewhere safe and having it towed to a garage, since driving on can damage the engine and the catalytic converter.",
    },
    sources: [S.caaVoyants, S.caaPanne, S.opcDroits],
    updatedAt: MAJ,
  },
  "voiture-ne-demarre-pas": {
    essentiel: {
      fr: "Écoutez le bruit au démarrage : un clic-clic rapide indique une batterie faible, un seul clic un démarreur ou une cosse en cause, aucun bruit une batterie à plat ou débranchée. Si le moteur tourne sans partir, pensez à l'essence, à l'allumage ou à l'antidémarrage. Un survoltage dépanne, mais faites ensuite tester batterie et alternateur.",
      en: "Listen when you turn the key: rapid clicking points to a weak battery, a single click to the starter or a loose terminal, silence to a dead or disconnected battery. If the engine cranks but won't start, think fuel, ignition or immobilizer. A boost gets you going, but then have the battery and alternator tested.",
    },
    sources: [S.caaFroid, S.caaBatterie, S.caaPanne],
    updatedAt: MAJ,
  },
  "inspection-pre-achat-voiture-usagee": {
    essentiel: {
      fr: "Avant d'acheter une voiture usagée, faites-la inspecter par un garage sans lien avec le vendeur (une heure à une heure et demie) : rouille, freins, fuites, codes d'erreur et essai routier. Vérifiez aussi au RDPRM qu'aucun prêt n'est rattaché au véhicule et consultez les rappels de Transports Canada.",
      en: "Before buying a used car, have it inspected by a garage with no ties to the seller (one to one and a half hours): rust, brakes, leaks, error codes and a road test. Also check the RDPRM register for any loan attached to the vehicle and look up Transport Canada recalls.",
    },
    sources: [S.rdprm, S.tcRappels, S.saaqGuide, S.caaInspection],
    updatedAt: MAJ,
  },
  "pneus-4-saisons-legal-quebec": {
    essentiel: {
      fr: "Oui, à une condition : du 1er décembre au 15 mars, un pneu 4 saisons est permis au Québec s'il porte le pictogramme d'un flocon dans une montagne. Un pneu « toutes saisons » marqué seulement M+S n'est pas conforme et expose à une amende de 200 $ à 300 $.",
      en: "Yes, on one condition: from December 1 to March 15, an all-weather tire is allowed in Québec if it bears the mountain and snowflake symbol. An \"all-season\" tire marked only M+S does not comply and can bring a $200 to $300 fine.",
    },
    sources: [S.quebecPneus, S.caaPneus],
    updatedAt: MAJ,
  },
  "usure-pneus-quand-changer": {
    essentiel: {
      fr: "Un pneu est usé sous 1,6 mm (2/32 po) de profondeur, au niveau des témoins d'usure. Pour un pneu d'hiver, n'attendez pas ce seuil : sous environ 4 mm, il évacue mal la neige et la gadoue. Une usure inégale révèle souvent un problème d'alignement, de gonflage ou d'amortisseurs à corriger.",
      en: "A tire is worn out below 1.6 mm (2/32 in.) of tread, where the wear bars sit. For a winter tire, don't wait for that point: below about 4 mm it clears snow and slush poorly. Uneven wear often reveals an alignment, inflation or shock absorber problem to fix.",
    },
    sources: [S.caaPneus, S.tcGonflage],
    updatedAt: MAJ,
  },
  "verification-mecanique-saaq": {
    essentiel: {
      fr: "Une voiture de promenade utilisée normalement n'a pas de vérification mécanique périodique au Québec. La SAAQ l'exige notamment pour un véhicule usagé venant d'une autre province, un véhicule gravement accidenté reconstruit ou un véhicule remisé plus de 12 mois, chez un mandataire reconnu.",
      en: "A passenger car in normal use has no periodic mechanical inspection in Québec. The SAAQ requires one notably for a used vehicle from another province, a rebuilt seriously damaged vehicle or a vehicle stored for more than 12 months, done by an authorized agent.",
    },
    sources: [S.saaqGuide, S.saaqRemiser, S.saaqMandataires],
    updatedAt: MAJ,
  },
  "garantie-reparation-automobile-quebec": {
    essentiel: {
      fr: "Au Québec, une réparation de plus de 50 $ est garantie 3 mois ou 5 000 km, selon la première limite atteinte. Au-delà de 100 $, le garage doit vous remettre une évaluation écrite avant les travaux et ne peut pas facturer plus que ce total sans votre accord, selon l'Office de la protection du consommateur.",
      en: "In Québec, a repair over $50 is guaranteed for 3 months or 5,000 km, whichever comes first. Above $100, the garage must give you a written estimate before the work and cannot bill more than that total without your consent, according to the Office de la protection du consommateur.",
    },
    sources: [S.opcDroits, S.opcConseils],
    updatedAt: MAJ,
  },
};
