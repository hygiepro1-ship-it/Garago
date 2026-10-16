// Articles écrits à partir des recherches les plus fréquentes des conducteurs sur Google
// (suggestions de recherche relevées en octobre 2026) : « check engine allumé », « voiture ne démarre pas »,
// « inspection préachat », « pneus 4 saisons légal au Québec », « usure pneus », « vérification mécanique SAAQ »,
// « garantie réparation automobile Québec ». Les règles citées viennent de Québec.ca, de la SAAQ et de
// l'Office de la protection du consommateur.

import type { Article } from "@/lib/articles";

export const ARTICLES_RECHERCHES: Article[] = [
  {
    slug: "voyant-check-engine-allume",
    title: "Voyant check engine allumé : que faire ? (fixe ou qui clignote)",
    excerpt: "Voyant moteur orange allumé ou qui clignote : ce que ça veut dire, quand il faut s'arrêter tout de suite et comment savoir la cause sans se faire avoir.",
    category: "Électronique",
    categoryColor: "#f59e0b",
    icon: "⚠️",
    readTime: 4,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "diagnostic",
    sections: [
      {
        heading: "Ce que signifie le voyant check engine",
        content: "Le voyant moteur (souvent appelé « check engine ») s'allume quand l'ordinateur du véhicule détecte un problème dans le moteur, l'allumage, l'injection ou le système antipollution. Il ne dit pas quel est le problème : il signale qu'un code d'erreur a été enregistré.",
      },
      {
        heading: "Voyant fixe ou voyant qui clignote : la grande différence",
        content: "La couleur et le comportement du voyant indiquent l'urgence.",
        tips: [
          "Voyant orange fixe : un problème à faire vérifier dans les prochains jours, sans urgence immédiate si la voiture roule normalement",
          "Voyant qui clignote : souvent un raté d'allumage important ; réduisez la vitesse et faites vérifier le jour même",
          "Voyant accompagné d'une perte de puissance, d'une fumée ou d'un bruit anormal : arrêtez-vous en lieu sûr",
        ],
        warning: "Un voyant qui clignote ne doit pas être ignoré : continuer à rouler peut endommager le catalyseur, une réparation coûteuse.",
      },
      {
        heading: "Les causes les plus fréquentes",
        content: "Beaucoup de voyants check engine ont une cause simple, mais seule la lecture du code permet de le savoir.",
        tips: [
          "Bouchon d'essence mal fermé après un plein",
          "Sonde d'oxygène ou capteur de débit d'air défectueux",
          "Bougies ou bobines d'allumage usées (ratés)",
          "Fuite dans le système de récupération des vapeurs d'essence",
          "Catalyseur encrassé ou défaillant",
        ],
      },
      {
        heading: "Que faire concrètement ?",
        content: "Vérifiez d'abord le bouchon d'essence et resserrez-le. Si le voyant reste allumé après quelques trajets, faites lire le code d'erreur avec un lecteur OBD-II, puis faites diagnostiquer le problème par un garage. Le code donne une piste, pas toujours la pièce à changer : un bon diagnostic évite de remplacer des pièces au hasard.",
        note: "Avant une réparation de plus de 100 $, le garage doit vous remettre une évaluation écrite (Loi sur la protection du consommateur).",
      },
    ],
  },
  {
    slug: "voiture-ne-demarre-pas",
    title: "Voiture qui ne démarre pas : causes et que faire (clic, aucun bruit, batterie OK)",
    excerpt: "Un clic, plusieurs clics, aucun bruit ou un moteur qui tourne sans partir : chaque symptôme pointe vers une cause différente. Voici comment s'y retrouver.",
    category: "Électrique",
    categoryColor: "#10b981",
    icon: "🔑",
    readTime: 4,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "battery",
    sections: [
      {
        heading: "Écoutez ce qui se passe quand vous tournez la clé",
        content: "Le bruit (ou l'absence de bruit) au démarrage est le meilleur indice pour trouver la cause.",
        tips: [
          "Clic-clic-clic rapide et tableau de bord faible : batterie trop faible, le cas le plus fréquent en hiver",
          "Un seul clic, tableau de bord normal : démarreur ou connexion de batterie desserrée ou corrodée",
          "Aucun bruit et tableau de bord éteint : batterie complètement à plat ou cosse débranchée",
          "Le moteur tourne mais ne part pas : problème d'essence, d'allumage ou d'antidémarrage",
        ],
      },
      {
        heading: "Batterie OK mais la voiture ne démarre pas",
        content: "Une batterie neuve ou qui se recharge bien n'écarte pas tout. Des cosses oxydées empêchent le courant de passer, un démarreur usé peut refuser de tourner, et la clé ou la télécommande peut ne plus être reconnue par le système antidémarrage (pile faible).",
        tips: [
          "Vérifiez que les cosses sont propres et bien serrées",
          "Essayez la clé de rechange si le voyant d'antidémarrage clignote",
          "Pour une boîte automatique, vérifiez que le levier est bien sur « P »",
        ],
      },
      {
        heading: "Le froid québécois, ennemi de la batterie",
        content: "Par grand froid, une batterie perd une bonne partie de sa puissance alors que le moteur, à l'huile épaissie, demande plus d'effort pour tourner. Une batterie de plus de 4 ou 5 ans qui démarre difficilement à l'automne a de bonnes chances de lâcher au premier gros froid.",
      },
      {
        heading: "Que faire ?",
        content: "Un survoltage (« boost ») permet souvent de repartir si la batterie est en cause. Si la voiture redémarre mais que le problème revient, faites tester la batterie et l'alternateur : un alternateur qui ne recharge plus vide une batterie neuve en quelques jours.",
        warning: "Si vous sentez une odeur d'essence ou voyez de la fumée, n'insistez pas sur le démarreur : faites remorquer le véhicule.",
      },
    ],
  },
  {
    slug: "inspection-pre-achat-voiture-usagee",
    title: "Inspection pré-achat d'une voiture usagée : pourquoi et quoi vérifier",
    excerpt: "Avant d'acheter une voiture d'occasion au Québec : ce que vérifie une inspection pré-achat, les documents à demander et les règles de la SAAQ pour un véhicule venant d'une autre province.",
    category: "Entretien",
    categoryColor: "#8b5cf6",
    icon: "🔍",
    readTime: 5,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "inspection",
    sections: [
      {
        heading: "Pourquoi faire inspecter une voiture avant de l'acheter",
        content: "Une voiture usagée peut cacher de la rouille structurelle, des freins usés, une fuite ou un problème de transmission qu'un essai routier ne révèle pas. Une inspection pré-achat par un garage indépendant vous donne la liste des réparations à prévoir : de quoi négocier le prix, ou renoncer à temps.",
      },
      {
        heading: "Ce qu'une inspection pré-achat vérifie",
        content: "Le contenu varie d'un garage à l'autre ; demandez la liste des points avant de réserver.",
        tips: [
          "Châssis et dessous de caisse : rouille, soudures, traces d'accident",
          "Freins, suspension, direction et pneus (usure régulière ou non)",
          "Fuites d'huile, de liquide de refroidissement ou de transmission",
          "Lecture des codes d'erreur de l'ordinateur de bord",
          "Essai routier : bruits, vibrations, passage des vitesses",
        ],
      },
      {
        heading: "Les documents à vérifier",
        content: "L'état mécanique ne suffit pas : vérifiez aussi la situation légale du véhicule.",
        tips: [
          "Le certificat d'immatriculation, au nom du vendeur",
          "Le registre des droits personnels et réels mobiliers (RDPRM), pour s'assurer qu'aucun prêt n'est rattaché au véhicule",
          "L'historique d'entretien et les factures de réparations",
          "Les rappels du constructeur non effectués",
        ],
      },
      {
        heading: "Véhicule venant d'une autre province",
        content: "Selon la SAAQ, un véhicule usagé provenant de l'extérieur du Québec doit passer une vérification mécanique avant d'être immatriculé. C'est aussi le cas d'un véhicule gravement accidenté reconstruit ou remisé plus de 12 mois. Renseignez-vous avant d'acheter : la vérification et les réparations exigées sont à prévoir dans votre budget.",
      },
      {
        heading: "Réserver une inspection",
        content: "Choisissez un garage qui n'a aucun lien avec le vendeur, et prévoyez une heure à une heure et demie. Sur Garago, vous pouvez chercher un garage qui offre l'inspection pré-achat près du véhicule et réserver en ligne.",
      },
    ],
  },
  {
    slug: "pneus-4-saisons-legal-quebec",
    title: "Pneus 4 saisons : sont-ils légaux l'hiver au Québec ?",
    excerpt: "Du 1er décembre au 15 mars, les pneus doivent porter le pictogramme montagne et flocon. Les pneus 4 saisons qui l'ont sont permis ; les autres, non. Les règles en clair.",
    category: "Pneus",
    categoryColor: "#3b82f6",
    icon: "🛞",
    readTime: 3,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "tires",
    sections: [
      {
        heading: "La règle : le pictogramme montagne et flocon",
        content: "Au Québec, du 1er décembre au 15 mars inclusivement, les véhicules de promenade immatriculés au Québec doivent rouler avec des pneus conçus pour l'hiver. Un pneu est considéré comme un pneu d'hiver s'il porte le pictogramme d'un flocon de neige dans une montagne, ou s'il est muni de crampons.",
      },
      {
        heading: "Pneus 4 saisons et pneus toutes saisons : la différence",
        content: "Le pictogramme fait toute la différence.",
        tips: [
          "Pneu 4 saisons avec le pictogramme montagne et flocon : permis l'hiver",
          "Pneu « toutes saisons » marqué seulement M+S : non conforme du 1er décembre au 15 mars",
          "Vérifiez le flanc du pneu : le pictogramme y est moulé",
        ],
        note: "Un pneu 4 saisons homologué reste un compromis : sur glace et neige profonde, un vrai pneu d'hiver garde un avantage. Il évite toutefois deux changements de pneus par année.",
      },
      {
        heading: "Les autres règles à connaître",
        content: "L'obligation vise tous les véhicules de promenade immatriculés au Québec, y compris ceux de location. Les pneus à crampons sont permis du 15 octobre au 1er mai. Rouler sans pneus conformes pendant la période obligatoire expose à une amende de 200 $ à 300 $, plus les frais.",
      },
      {
        heading: "Le bon moment pour les installer",
        content: "N'attendez pas le 30 novembre : les garages sont saturés à la première neige. Installez vos pneus d'hiver quand la température se maintient autour de 7 °C, souvent dès la fin octobre, et réservez votre rendez-vous quelques semaines d'avance.",
      },
    ],
  },
  {
    slug: "usure-pneus-quand-changer",
    title: "Usure des pneus : quand faut-il les changer ?",
    excerpt: "Profondeur minimale, témoins d'usure, usure à l'intérieur ou en dents de scie : comment lire l'usure de vos pneus et savoir quand les remplacer.",
    category: "Pneus",
    categoryColor: "#3b82f6",
    icon: "🛞",
    readTime: 4,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "tires",
    sections: [
      {
        heading: "La profondeur minimale",
        content: "Un pneu dont la bande de roulement descend sous 1,6 mm (2/32 de pouce) est usé : il doit être remplacé. Les témoins d'usure, de petites barres moulées au fond des rainures, arrivent au niveau de la bande à cette profondeur. Pour un pneu d'hiver, n'attendez pas ce seuil : sous environ 4 mm, il évacue mal la neige et la gadoue.",
        tips: [
          "Mesurez avec une jauge de profondeur, vendue quelques dollars",
          "Mesurez à plusieurs endroits : au centre et sur les deux bords",
          "Pensez aussi à l'âge : un pneu durcit avec les années, même peu usé",
        ],
      },
      {
        heading: "Ce que l'usure inégale vous dit",
        content: "La façon dont un pneu s'use révèle souvent un autre problème à régler, sans quoi les pneus neufs s'useront de la même façon.",
        tips: [
          "Usé à l'intérieur ou à l'extérieur : problème d'alignement (géométrie)",
          "Usé au centre : pneus trop gonflés",
          "Usé sur les deux bords : pneus pas assez gonflés",
          "Usure en dents de scie : amortisseurs fatigués ou alignement à revoir",
        ],
      },
      {
        heading: "Faire durer ses pneus",
        content: "Vérifiez la pression une fois par mois, à froid, selon l'autocollant de la portière du conducteur. Faites permuter les pneus selon les recommandations du fabricant, et faites vérifier l'alignement après un choc contre un nid-de-poule ou une bordure.",
      },
      {
        heading: "Quand passer au garage",
        content: "Profitez du changement saisonnier : le garage peut mesurer la profondeur, repérer une usure inégale et vérifier l'alignement en même temps que la pose.",
      },
    ],
  },
  {
    slug: "verification-mecanique-saaq",
    title: "Vérification mécanique SAAQ : quand est-elle obligatoire ?",
    excerpt: "Véhicule venant d'une autre province, reconstruit, remisé plus de 12 mois, taxi, école de conduite… Les cas où la SAAQ exige une vérification mécanique, et comment s'y préparer.",
    category: "Entretien",
    categoryColor: "#8b5cf6",
    icon: "📋",
    readTime: 4,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "inspection",
    sections: [
      {
        heading: "Pas de vérification obligatoire pour une voiture ordinaire",
        content: "Au Québec, une voiture de promenade utilisée normalement n'a pas de vérification mécanique périodique obligatoire. La SAAQ l'exige seulement dans certains cas précis, avant de remettre le véhicule sur la route ou à intervalles réguliers selon son usage.",
      },
      {
        heading: "Avant la mise en circulation ou la remise en circulation",
        content: "Selon la SAAQ, une vérification mécanique est requise notamment pour :",
        tips: [
          "Un véhicule usagé provenant de l'extérieur du Québec",
          "Un véhicule gravement accidenté reconstruit",
          "Un véhicule remisé ou non autorisé à circuler depuis plus de 12 mois",
          "Un véhicule fabriqué artisanalement ou modifié",
          "Un véhicule jugé dangereux par la SAAQ ou par un agent de la paix",
        ],
      },
      {
        heading: "Vérifications périodiques selon l'usage",
        content: "Certains véhicules sont vérifiés tous les 6 ou 12 mois : véhicules d'école de conduite, transport d'écoliers, véhicules de transport rémunéré de personnes selon leur âge, véhicules d'urgence et véhicules lourds. Les règles détaillées sont publiées par la SAAQ.",
      },
      {
        heading: "Se préparer à la vérification",
        content: "La vérification se fait dans un centre de vérification mécanique ou chez un mandataire reconnu par la SAAQ. Pour éviter un échec, faites inspecter le véhicule par votre garage avant : freins, éclairage, pneus, direction, suspension et pare-brise sont des points souvent vérifiés.",
      },
    ],
  },
  {
    slug: "garantie-reparation-automobile-quebec",
    title: "Garantie sur une réparation automobile au Québec : vos droits",
    excerpt: "Évaluation écrite obligatoire au-delà de 100 $, garantie de 3 mois ou 5 000 km, prix maximal : ce que la Loi sur la protection du consommateur vous garantit au garage.",
    category: "Entretien",
    categoryColor: "#8b5cf6",
    icon: "🛡️",
    readTime: 4,
    imageId: "",
    publishedAt: "2026-10-15",
    service: "engine",
    sections: [
      {
        heading: "L'évaluation écrite avant les travaux",
        content: "Selon l'Office de la protection du consommateur, pour une réparation de plus de 100 $, le garage doit vous remettre une évaluation écrite avant de commencer. Vous pouvez y renoncer uniquement par un document que vous écrivez et signez vous-même : un formulaire préimprimé n'a pas de valeur.",
        tips: [
          "Vos nom et adresse, et ceux du garage",
          "La description du véhicule",
          "La nature et le prix total de la réparation",
          "Les pièces à poser : neuves, usagées, réusinées ou reconstruites",
          "La date et la durée de validité de l'évaluation",
        ],
      },
      {
        heading: "Un prix qui ne peut pas grimper",
        content: "Le garage ne peut pas vous facturer plus que le total de l'évaluation, sauf pour des travaux supplémentaires que vous avez autorisés. Si le garagiste découvre un autre problème, il doit vous en parler avant de le réparer.",
      },
      {
        heading: "La garantie de 3 mois ou 5 000 km",
        content: "Une réparation de plus de 50 $ est garantie 3 mois ou 5 000 km, selon la première limite atteinte, à partir de la remise du véhicule. Si le problème revient pendant cette période, retournez au même garage, qui doit corriger la réparation.",
        note: "La vente et la pose de pneus facturées ensemble ne sont pas considérées comme une réparation au sens de ces règles, tout comme celles d'une batterie.",
      },
      {
        heading: "Ce que le garage doit afficher",
        content: "Le garage doit afficher son taux horaire et les principaux droits des consommateurs en matière de réparation automobile. Gardez vos évaluations et factures : elles prouvent la date, le kilométrage et le travail fait si vous devez faire valoir la garantie.",
      },
    ],
  },
];
