export interface ArticleSection {
  heading?: string;
  content: string;
  tips?: string[];
  warning?: string;
  note?: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: string;
  icon: string;
  readTime: number;
  imageId: string; // Unsplash photo slug
  publishedAt: string;
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    slug: "voiture-tremble-quand-je-freine",
    title: "Pourquoi ma voiture tremble quand je freine ?",
    excerpt: "Des vibrations au freinage indiquent souvent des disques voilés ou des plaquettes usées. Apprenez à identifier la cause et à savoir quand c'est urgent.",
    category: "Freins",
    categoryColor: "#ef4444",
    icon: "🔴",
    readTime: 4,
    imageId: "ii4XEyJEm_I",
    publishedAt: "2026-07-20",
    sections: [
      {
        heading: "Une vibration au freinage n'est jamais anodine",
        content: "Si vous ressentez un tremblement dans le volant, la pédale de frein ou le châssis lorsque vous freinez, c'est le signe que quelque chose ne va pas dans votre système de freinage. Les freins étant le système de sécurité le plus critique de votre véhicule, ce symptôme mérite une attention rapide.",
      },
      {
        heading: "Cause n°1 : des disques de frein voilés",
        content: "C'est la cause la plus fréquente. Un disque «voilé» est un disque qui n'est plus parfaitement plat — il présente une légère déformation en forme de vague. Quand les plaquettes frottent contre cette surface irrégulière, elles créent une vibration rythmique qui se transmet dans la pédale et le volant.",
        tips: [
          "La vibration augmente avec la vitesse de freinage",
          "Le volant oscille légèrement de gauche à droite",
          "On ressent une pulsation dans la pédale",
          "Souvent causé par des freinages brusques répétés ou de l'eau froide projetée sur des disques chauds",
        ],
      },
      {
        heading: "Cause n°2 : plaquettes usées ou cristallisées",
        content: "Des plaquettes de frein dont le matériau de friction est épuisé — ou dont la surface s'est vitrifiée à cause de surchauffe — ne mordent plus uniformément sur le disque. Résultat : une vibration et souvent un grincement ou un crissement.",
        tips: [
          "Grincement métallique au freinage (témoin d'usure en contact avec le disque)",
          "Distance de freinage allongée",
          "Pédale qui «descend» plus bas qu'avant",
        ],
      },
      {
        heading: "Cause n°3 : problème de suspension ou de roulement",
        content: "Si les vibrations apparaissent même sans freiner mais s'amplifient au freinage, le problème vient peut-être des amortisseurs, des rotules ou d'un roulement de roue défaillant. Dans ce cas les vibrations sont souvent présentes à haute vitesse et ne se limitent pas au freinage.",
      },
      {
        heading: "Que faire concrètement ?",
        content: "Faites inspecter votre système de freinage par un mécanicien dès que possible. Une inspection visuelle des disques et plaquettes prend environ 20 minutes et permet de diagnostiquer la cause précise. Le coût d'une inspection est sans commune mesure avec les risques d'un freinage défaillant.",
        warning: "Si les vibrations sont fortes ou si la distance de freinage est nettement augmentée, évitez l'autoroute et les vitesses élevées jusqu'à la réparation. Les freins défaillants sont la première cause d'accidents évitables.",
      },
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    slug: "quand-passer-pneus-hiver-quebec",
    title: "Quand passer aux pneus d'hiver au Québec ?",
    excerpt: "La loi impose les pneus d'hiver du 1er décembre au 15 mars — mais idéalement, il faut les installer dès que la température descend sous 7 °C.",
    category: "Pneus",
    categoryColor: "#3b82f6",
    icon: "❄️",
    readTime: 3,
    imageId: "lJ5_wZ2nkeI",
    publishedAt: "2026-07-27",
    sections: [
      {
        heading: "Ce que dit la loi québécoise",
        content: "Au Québec, le Code de la sécurité routière oblige tous les véhicules de promenade à être équipés de pneus d'hiver du 1er décembre au 15 mars inclusivement. Le non-respect de cette règle peut entraîner une amende entre 200 $ et 300 $.",
        note: "La règle s'applique à tous les véhicules de promenade, incluant les VUS et les camionnettes.",
      },
      {
        heading: "La règle des 7 °C — plus importante que la date",
        content: "Les pneus d'hiver sont faits d'un caoutchouc spécial qui reste souple en dessous de 7 °C. En dessous de ce seuil, un pneu quatre saisons ou été devient dur et perd jusqu'à 50 % de son adhérence. Ne pas attendre les premières neiges : la route verglacée à l'automne ou le frimas matinal sont tout aussi dangereux.",
        tips: [
          "Installez vos pneus d'hiver quand la température nocturne passe régulièrement sous 7 °C",
          "Au Québec, c'est généralement entre le 15 et le 31 octobre",
          "Ne pas attendre novembre pour éviter les listes d'attente dans les garages",
        ],
      },
      {
        heading: "Pneus quatre saisons : sont-ils suffisants ?",
        content: "Les pneus «toutes saisons» offrent un compromis, mais ne sont pas adaptés aux conditions hivernales québécoises. Ils peuvent manquer d'adhérence sur neige profonde, verglas et températures très froides. Pour la sécurité, un jeu de pneus d'hiver dédiés reste la meilleure option.",
      },
      {
        heading: "Entreposage : comment conserver vos pneus d'été",
        content: "Pour prolonger la durée de vie de vos pneus d'été pendant leur mise en hiver :",
        tips: [
          "Nettoyez-les avant rangement pour retirer le sel et les salissures",
          "Rangez-les dans un endroit frais, sombre et sec (idéalement entre 10 et 20 °C)",
          "À plat en pile ou verticaux sur une étagère — jamais suspendus",
          "Enveloppés dans des sacs opaques pour les protéger de l'ozone",
        ],
      },
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    slug: "voyants-tableau-de-bord",
    title: "Voyants du tableau de bord : que signifient-ils ?",
    excerpt: "Pression d'huile, moteur, batterie, TPMS… Chaque voyant a un niveau d'urgence différent. Ce guide vous explique lesquels ignorer et lesquels nécessitent d'arrêter immédiatement.",
    category: "Électronique",
    categoryColor: "#f59e0b",
    icon: "⚡",
    readTime: 5,
    imageId: "dPt-X-KVAjA",
    publishedAt: "2026-08-03",
    sections: [
      {
        heading: "Les voyants rouges : arrêtez-vous dès que possible",
        content: "Un voyant rouge allumé signale un problème critique qui peut endommager votre moteur ou mettre votre sécurité en danger.",
        tips: [
          "🔴 Pression d'huile : arrêtez le moteur immédiatement, vérifiez le niveau",
          "🔴 Température moteur : arrêtez-vous, ouvrez le capot, laissez refroidir",
          "🔴 Batterie : le circuit de charge défaille, planifiez un arrêt rapide",
          "🔴 Frein / ABS : problème de freinage, réduisez la vitesse et consultez",
          "🔴 Direction assistée : vous pouvez encore diriger mais avec plus d'effort",
        ],
        warning: "Ne jamais continuer à rouler avec un voyant rouge allumé, surtout celui de la pression d'huile. Un moteur sans huile peut être détruit en moins de 30 secondes.",
      },
      {
        heading: "Les voyants oranges : consultez dans les jours suivants",
        content: "Un voyant orange ou jaune indique un problème à régler prochainement, sans urgence immédiate.",
        tips: [
          "🟡 Check Engine (moteur) : problème émissions ou capteur — consultez sous 48h",
          "🟡 TPMS (pneus) : un ou plusieurs pneus sont sous-gonflés — vérifiez les pressions",
          "🟡 Lave-glace : réservoir vide — faites le plein au prochain arrêt",
          "🟡 Carburant faible : vous avez environ 50–80 km avant la panne",
          "🟡 Entretien requis : révision planifiée à effectuer",
        ],
      },
      {
        heading: "Le voyant moteur (Check Engine) : ne pas paniquer",
        content: "C'est le voyant le plus fréquent et le plus mal compris. Il peut signaler quelque chose d'aussi banal qu'un bouchon de carburant mal fermé, ou quelque chose de plus sérieux comme un capteur défaillant ou un catalyseur encrassé. La seule façon de savoir : un diagnostic OBD-II chez un mécanicien ou dans un magasin de pièces auto.",
        note: "Si le voyant moteur clignote (au lieu d'être fixe), c'est plus urgent — cela indique souvent un raté d'allumage qui peut endommager le catalyseur.",
      },
      {
        heading: "Le TPMS : comment gonfler vos pneus correctement",
        content: "Le système de surveillance de la pression des pneus (TPMS) s'allume lorsqu'un pneu est gonflé à moins de 25 % de la pression recommandée. Vérifiez la pression de chacun des 4 pneus (plus la roue de secours) avec un manomètre. La pression recommandée est indiquée sur l'autocollant dans la portière conducteur, pas sur le flanc du pneu.",
      },
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    slug: "vidange-huile-frequence",
    title: "Vidange d'huile : à quelle fréquence vraiment ?",
    excerpt: "Les 3 000 km, c'est du passé. Les huiles synthétiques modernes permettent de rouler beaucoup plus longtemps. Voici la vraie réponse selon votre véhicule.",
    category: "Entretien",
    categoryColor: "#8b5cf6",
    icon: "🛢️",
    readTime: 4,
    imageId: "V37iTrYZz2E",
    publishedAt: "2026-08-10",
    sections: [
      {
        heading: "La règle des 3 000 km est obsolète",
        content: "Pendant des décennies, les ateliers recommandaient une vidange tous les 3 000 km. Avec les huiles minérales des années 80-90, c'était justifié. Aujourd'hui, avec les huiles synthétiques et les moteurs modernes, ce conseil est largement dépassé — et coûteux inutilement.",
      },
      {
        heading: "Quelle fréquence selon mon huile ?",
        content: "La fréquence de vidange dépend principalement du type d'huile utilisée et de votre utilisation.",
        tips: [
          "Huile minérale conventionnelle : tous les 5 000 – 7 500 km",
          "Huile semi-synthétique : tous les 7 500 – 10 000 km",
          "Huile 100 % synthétique : tous les 10 000 – 15 000 km (jusqu'à 20 000 km pour certains moteurs)",
          "Toujours se référer au manuel du propriétaire — c'est la source officielle",
        ],
      },
      {
        heading: "Conditions de conduite «sévères»",
        content: "Si vous conduisez principalement en ville, faites beaucoup de courts trajets (moteur ne monte jamais à température), remorquez souvent ou roulez sur des routes de gravier, votre moteur travaille plus dur et l'huile se dégrade plus vite. Dans ces cas, divisez l'intervalle recommandé par 1,5.",
        tips: [
          "Trajets de moins de 8 km (moteur reste froid)",
          "Conduite par temps très froid (sous -20 °C)",
          "Remorquage fréquent ou charges lourdes",
          "Conduite sur routes de chantier ou gravier",
        ],
      },
      {
        heading: "Comment vérifier le niveau d'huile soi-même",
        content: "Entre les vidanges, vérifiez votre niveau d'huile tous les 2 à 3 mois ou avant un long voyage. Garez-vous à plat, coupez le moteur, attendez 5 minutes. Retirez la jauge, essuyez-la, remettez-la, retirez à nouveau. Le niveau doit se situer entre les marques MIN et MAX.",
        warning: "Si votre véhicule consomme plus de 1 litre d'huile aux 5 000 km, signalez-le à votre mécanicien. Une consommation excessive peut indiquer une fuite ou une usure interne.",
      },
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    slug: "batterie-voiture-duree-vie",
    title: "Batterie de voiture : combien de temps dure-t-elle ?",
    excerpt: "Une batterie dure en moyenne 3 à 5 ans. Le froid québécois l'accélère. Voici comment savoir quand la remplacer et éviter la panne au pire moment.",
    category: "Électrique",
    categoryColor: "#f59e0b",
    icon: "🔋",
    readTime: 4,
    imageId: "cpkUK_YD_zs",
    publishedAt: "2026-08-17",
    sections: [
      {
        heading: "La durée de vie réelle d'une batterie",
        content: "En moyenne, une batterie automobile dure entre 3 et 5 ans. Certaines atteignent 7 ans dans de bonnes conditions, d'autres lâchent à 2 ans en cas d'utilisation intensive. Le froid intense — une réalité québécoise — peut réduire la capacité d'une batterie de 30 à 50 % à -30 °C.",
      },
      {
        heading: "Les signes avant-coureurs d'une batterie à bout",
        content: "Ne vous laissez pas surprendre. Une batterie affaiblie envoie des signaux clairs :",
        tips: [
          "Démarrage lent ou laborieux, surtout le matin en hiver",
          "Lumières de l'habitacle qui faiblissent à l'arrêt",
          "Clic clic clic au démarrage (démarreur sans puissance)",
          "Voyant batterie ou alternateur qui s'allume",
          "La batterie date de plus de 4 ans",
          "Dépannages ou boosting fréquents",
        ],
      },
      {
        heading: "Le froid québécois : l'ennemi numéro un",
        content: "Par grand froid, une batterie doit fournir bien plus d'énergie pour démarrer un moteur dont l'huile est visqueuse — tout en ayant une capacité réduite par le gel. C'est pourquoi les pannes de batterie se concentrent en novembre-décembre et en janvier-février. Un test de batterie avant l'hiver peut vous éviter une mauvaise surprise.",
        note: "Faites tester votre batterie gratuitement chez la plupart des garages ou ateliers de pièces auto — la plupart offrent ce service en 5 minutes.",
      },
      {
        heading: "Choisir la bonne batterie de remplacement",
        content: "Chaque véhicule requiert une batterie avec des spécifications précises (groupe, ampérage à froid CCA, ampères-heures Ah). Ne jamais installer une batterie sous-dimensionnée pour faire des économies — elle tombera en panne plus vite et peut endommager l'électronique du véhicule.",
        tips: [
          "Consultez le manuel ou l'étiquette sur l'ancienne batterie",
          "Au Québec, visez un CCA (Cold Cranking Amps) d'au moins 500 A pour un moteur 4 cyl.",
          "Les batteries AGM (pour les véhicules avec Start/Stop) ne sont pas interchangeables avec les batteries standard",
        ],
      },
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    slug: "moteur-surchauffe-que-faire",
    title: "Mon moteur surchauffe : que faire et quoi éviter ?",
    excerpt: "Une aiguille de température dans le rouge est une urgence. Voici les bons réflexes à avoir et surtout les erreurs à ne pas commettre.",
    category: "Moteur",
    categoryColor: "#f97316",
    icon: "🌡️",
    readTime: 4,
    imageId: "sk6fOQYIO1o",
    publishedAt: "2026-08-24",
    sections: [
      {
        heading: "Les premiers signes de surchauffe",
        content: "L'aiguille de température monte vers le rouge, un nuage de vapeur sort du capot ou une odeur de brûlé entre dans l'habitacle. Ce sont des signaux d'alerte à prendre au sérieux immédiatement.",
        warning: "Un moteur en surchauffe peut atteindre des températures destructrices en moins de 2 minutes. Continuer à rouler peut entraîner une déformation de la culasse — une réparation de 2 000 $ à 5 000 $.",
      },
      {
        heading: "Que faire en cas de surchauffe",
        content: "Adoptez ces gestes dans l'ordre :",
        tips: [
          "1. Coupez la climatisation immédiatement",
          "2. Mettez le chauffage à fond (ça aide à dissiper la chaleur du moteur)",
          "3. Si ça ne suffit pas, immobilisez-vous dès que c'est sûr",
          "4. Coupez le moteur et attendez 20–30 minutes avant d'ouvrir le capot",
          "5. Ne jamais ouvrir le bouchon du radiateur quand le moteur est chaud — risque de brûlure grave",
          "6. Vérifiez le niveau de liquide de refroidissement (réservoir transparent, pas le radiateur)",
        ],
      },
      {
        heading: "Les causes les plus courantes",
        content: "La surchauffe est rarement soudaine — elle a une cause sous-jacente :",
        tips: [
          "Fuite de liquide de refroidissement (tuyau percé, joint de culasse défaillant)",
          "Thermostat bloqué en position fermée",
          "Ventilateur de refroidissement en panne",
          "Radiateur bouché ou endommagé",
          "Pompe à eau défaillante",
        ],
      },
      {
        heading: "Prévention : vérifiez votre circuit de refroidissement",
        content: "Faites inspecter votre circuit de refroidissement tous les 2 ans ou 40 000 km. Le liquide de refroidissement se dégrade avec le temps, perd ses propriétés anticorrosion et peut créer des dépôts qui bouchent le radiateur. Une vidange du circuit coûte entre 80 $ et 150 $ — bien moins que les conséquences d'une surchauffe.",
      },
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    slug: "antirouille-quebec-necessaire",
    title: "L'antirouille au Québec : vraiment indispensable ?",
    excerpt: "Le sel de déglaçage québécois est particulièrement agressif pour la carrosserie. Voici ce que vous devez savoir sur les traitements antirouille et leur efficacité réelle.",
    category: "Protection",
    categoryColor: "#6b7280",
    icon: "🛡️",
    readTime: 4,
    imageId: "f_ztFPZM50c",
    publishedAt: "2026-08-31",
    sections: [
      {
        heading: "Pourquoi le Québec est particulièrement agressif pour les véhicules",
        content: "Le Québec utilise plusieurs millions de tonnes de sel de déglaçage par an sur ses routes. Ce sel, mélangé à l'humidité et au cycle gel-dégel (parfois plusieurs fois par semaine), crée un environnement extrêmement corrosif pour la carrosserie et le dessous de caisse des véhicules.",
      },
      {
        heading: "Les différents types de protection antirouille",
        content: "Tous les traitements ne se valent pas :",
        tips: [
          "Huile d'inhibition (spray sous-caisse) : la plus efficace pour le dessous de caisse, s'infiltre dans les joints et cavités. À renouveler aux 1–2 ans.",
          "Cire ou polymère : protection de surface pour la carrosserie peinte.",
          "Électronique (ondes électroniques) : l'efficacité n'est pas prouvée scientifiquement.",
          "Traitement de cavité (injection dans les portes, seuils) : très efficace pour les zones creuses.",
        ],
      },
      {
        heading: "Quand l'appliquer et à quelle fréquence ?",
        content: "Le meilleur moment pour un traitement antirouille est à l'automne, avant les premières neiges et avant l'apparition du sel. Pour un véhicule neuf, faites-le dans les premiers mois. Pour un véhicule usagé, faites d'abord nettoyer la rouille existante avant d'appliquer le produit.",
        tips: [
          "Véhicule neuf ou récent : traitement dans les 6 premiers mois, puis tous les 2 ans",
          "Véhicule de plus de 5 ans : inspection annuelle, traitement aux 1–2 ans",
          "Après chaque hiver : lavage haute pression du dessous de caisse",
        ],
      },
      {
        heading: "Le bon plan : lavage hivernal régulier",
        content: "En dehors des traitements, la meilleure protection reste de laver son véhicule régulièrement tout au long de l'hiver, particulièrement le dessous de caisse. Après chaque redoux ou pluie suivie de gel, les résidus de sel sèchent et concentrent leur action corrosive. Un lavage bi-mensuel peut doubler la durée de vie de votre dessous de caisse.",
      },
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    slug: "freins-qui-grincent",
    title: "Freins qui grincent : dangereux ou juste gênant ?",
    excerpt: "Pas tous les grincements de frein sont alarmants — mais certains le sont. Apprenez à distinguer un bruit normal d'un signal d'urgence.",
    category: "Freins",
    categoryColor: "#ef4444",
    icon: "🔴",
    readTime: 3,
    imageId: "OOY5kdikxF8",
    publishedAt: "2026-09-07",
    sections: [
      {
        heading: "Un grincement le matin : souvent normal",
        content: "Par temps humide ou après une nuit fraîche, une légère couche de rouille superficielle se forme sur les disques de frein. Les premiers freinages la retirent, créant un grincement ou crissement temporaire. Si le bruit disparaît après 2–3 freinages, pas d'inquiétude.",
      },
      {
        heading: "Grincement persistant : signes à ne pas ignorer",
        content: "Un bruit qui persiste tout au long de la conduite est un autre signal :",
        tips: [
          "Grincement métallique constant : les témoins d'usure (lame métallique intégrée aux plaquettes) frottent contre le disque — remplacement urgent",
          "Crissement aigu à chaque freinage : plaquettes de mauvaise qualité ou vitrifées par la chaleur",
          "Bruit de meulage grave : plaquette complètement usée, métal contre métal — très urgent, les disques s'endommagent",
          "Grincement avec vibration : disques usés ou voilés en plus des plaquettes",
        ],
        warning: "Le bruit de meulage (son de métal broyant du métal) est une urgence. Chaque kilomètre parcouru ainsi détruit votre disque de frein — la réparation passe d'une simple plaquette à un remplacement complet de disques et plaquettes.",
      },
      {
        heading: "Combien ça coûte de ne pas réagir ?",
        content: "Des plaquettes usées laissées trop longtemps finissent par endommager les disques. Une réparation de plaquettes seules coûte environ 150–250 $. Si les disques doivent aussi être remplacés : 300–600 $ par essieu. Agir tôt est toujours moins cher.",
      },
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    slug: "climatisation-ne-refroidit-plus",
    title: "La clim de ma voiture ne refroidit plus : causes et solutions",
    excerpt: "Une climatisation qui souffle chaud en plein été est souvent causée par un manque de réfrigérant. Voici ce qu'il faut savoir avant d'aller chez un mécanicien.",
    category: "Climatisation",
    categoryColor: "#06b6d4",
    icon: "💨",
    readTime: 4,
    imageId: "UZUzvJEvKnI",
    publishedAt: "2026-09-14",
    sections: [
      {
        heading: "Pourquoi la clim perd de son efficacité",
        content: "Le circuit de climatisation est un système fermé qui contient du gaz réfrigérant (R-134a ou R-1234yf selon l'âge du véhicule). Par nature, ce gaz peut se déperdre lentement au fil des ans — jusqu'à 15 % par an selon les conditions. Après quelques années, la quantité de réfrigérant tombe sous le seuil minimal et la clim ne refroidit plus.",
      },
      {
        heading: "Les causes les plus fréquentes",
        content: "Avant de conclure à une simple recharge :",
        tips: [
          "Manque de réfrigérant (cause la plus fréquente, surtout sur les véhicules de plus de 5 ans)",
          "Condenseur bouché par des insectes ou débris (nettoyage suffit parfois)",
          "Compresseur défaillant (bruit de claquement à l'activation de la clim)",
          "Thermostat ou capteur de pression défaillant",
          "Fuite dans le circuit (recharge inutile sans réparer la fuite d'abord)",
        ],
      },
      {
        heading: "Recharge DIY ou chez un professionnel ?",
        content: "Des kits de recharge «faites-vous-même» sont vendus en magasin, mais ils ont des limites importantes. Ils ne peuvent pas détecter une fuite, ne permettent pas de récupérer l'ancien réfrigérant (obligatoire par loi), et peuvent surcharger le circuit si mal utilisés. Pour un résultat fiable, une recharge professionnelle avec station de recyclage est toujours préférable.",
        note: "La recharge professionnelle inclut test d'étanchéité, récupération de l'ancien gaz, mise sous vide et rechargement à la quantité exacte. Comptez 100–180 $ pour ce service.",
      },
      {
        heading: "Entretien préventif : utiliser la clim l'hiver aussi",
        content: "Un bon réflexe méconnu : faire fonctionner votre climatisation quelques minutes par mois même en hiver. Cela lubrifie les joints et le compresseur, et évite qu'ils ne sèchent et ne fuient. De nombreuses voitures modernes activent d'ailleurs la clim automatiquement quand vous utilisez le mode dégivrage.",
      },
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    slug: "consommation-essence-anormale",
    title: "Consommation d'essence anormale : les vraies causes",
    excerpt: "Votre voiture consomme soudainement plus que d'habitude ? Plusieurs causes simples peuvent expliquer cette hausse — et la plupart sont facilement corrigibles.",
    category: "Moteur",
    categoryColor: "#f97316",
    icon: "⛽",
    readTime: 4,
    imageId: "qy27JnsH9sU",
    publishedAt: "2026-09-21",
    sections: [
      {
        heading: "Comment mesurer sa vraie consommation",
        content: "Avant de paniquer, vérifiez votre consommation réelle. Faites le plein à ras bord, notez le kilométrage, puis roulez normalement jusqu'à mi-réservoir ou faites un plein complet. Divisez les litres ajoutés par les kilomètres parcourus, multipliez par 100. Comparez avec la consommation normale de votre modèle.",
      },
      {
        heading: "Causes mécaniques à vérifier en premier",
        content: "Plusieurs problèmes mécaniques augmentent directement la consommation :",
        tips: [
          "Pneus sous-gonflés : chaque 7 kPa de manque = +1 % de consommation",
          "Filtre à air encrassé : réduit l'efficacité de la combustion",
          "Bougies usées : combustion incomplète = plus d'essence pour la même puissance",
          "Capteur O2 défaillant : le moteur injecte trop ou pas assez d'essence",
          "Thermostat bloqué ouvert : moteur qui ne monte jamais à température = riche en carburant",
          "Plaquettes de frein qui frottent : résistance constante = effort moteur accru",
        ],
      },
      {
        heading: "Les causes liées à l'utilisation",
        content: "Avant de soupçonner une panne, vérifiez si votre utilisation a changé :",
        tips: [
          "Plus de trajets courts (moteur froid = consommation x2 à x3)",
          "Climatisation utilisée en permanence (+10 à 20 % de consommation)",
          "Coffre chargé ou galerie de toit avec résistance aérodynamique",
          "Conduite agressive (accélérations brusques, freinages tardifs)",
          "Carburant de qualité inférieure",
        ],
      },
      {
        heading: "Quand consulter un mécanicien ?",
        content: "Si la consommation a augmenté de plus de 15 % sans changement d'habitudes, faites faire un diagnostic. La plupart des causes sont bon marché à corriger (filtre à air : 30 $, bougies : 60–120 $) mais si elles sont ignorées, elles coûtent cher en carburant sur le long terme.",
      },
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    slug: "preparer-voiture-hiver-quebec",
    title: "Préparer sa voiture pour l'hiver québécois",
    excerpt: "Un hiver québécois met votre véhicule à rude épreuve. Cette checklist complète vous assure de rouler en toute sécurité de novembre à mars.",
    category: "Entretien",
    categoryColor: "#8b5cf6",
    icon: "📋",
    readTime: 5,
    imageId: "JXHN4c5CyUs",
    publishedAt: "2026-09-28",
    sections: [
      {
        heading: "Pneus et freins : la priorité absolue",
        content: "Avant tout le reste, vos pneus d'hiver et vos freins doivent être en parfait état. Un véhicule ne s'arrête pas sur la neige si ses freins sont faibles — les lois de la physique n'ont pas d'exceptions.",
        tips: [
          "Installer les pneus d'hiver dès que la température passe sous 7 °C",
          "Vérifier la profondeur des sculptures (minimum légal : 1,6 mm, recommandé : 4 mm+)",
          "Faire inspecter freins et disques avant la saison",
          "Vérifier la pression des pneus après chaque vague de froid (la pression baisse de ~1 PSI par 6 °C)",
        ],
      },
      {
        heading: "Batterie : testez avant le gel",
        content: "Une batterie qui démarre péniblement en octobre ne passera pas le mois de janvier. Faites-la tester gratuitement dans n'importe quel garage ou centre de pièces auto avant novembre. Si elle a plus de 4 ans et montre des signes de faiblesse, remplacez-la maintenant.",
      },
      {
        heading: "Liquides à vérifier",
        content: "Chaque liquide a un rôle crucial en hiver :",
        tips: [
          "Liquide de refroidissement : vérifier la protection antigel (idéalement jusqu'à -40 °C au Québec)",
          "Lave-glace : utiliser exclusivement un produit hivernal (-40 °C) — jamais d'eau",
          "Huile moteur : vérifier si une huile plus fluide par grand froid est recommandée",
          "Liquide de frein : si absorbant l'humidité, changer avant l'hiver",
        ],
      },
      {
        heading: "Visibilité : ne négligez pas l'essentiel",
        content: "En hiver, vous roulez souvent dans des conditions de visibilité réduites.",
        tips: [
          "Changer les balais d'essuie-glace (modèles hiver recommandés)",
          "Vérifier le dégivreur arrière et les rétroviseurs chauffants",
          "Tester les phares et vérifier leur orientation",
          "Toujours déneiger entièrement le véhicule avant de prendre la route (obligatoire par loi)",
        ],
        warning: "Une voiture partiellement déneigée peut projeter des blocs de neige sur les autres conducteurs. C'est une infraction au Code de la route et un danger grave.",
      },
      {
        heading: "Trousse d'urgence hivernale",
        content: "Gardez ces articles dans votre coffre tout l'hiver :",
        tips: [
          "Câbles de démarrage (ou booster portable)",
          "Grattoir à glace et balai à neige",
          "Sac de gravier ou litière (pour se désembourber)",
          "Couverture de survie, eau, barre tendre",
          "Lampe de poche avec piles fraîches",
          "Câble de remorquage",
        ],
      },
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    slug: "pression-pneus-comment-verifier",
    title: "Pression des pneus : comment vérifier et quel gonflage ?",
    excerpt: "Des pneus mal gonflés usent de manière irrégulière, augmentent la consommation et réduisent l'adhérence. La vérification prend 5 minutes — voici comment faire.",
    category: "Pneus",
    categoryColor: "#3b82f6",
    icon: "⭕",
    readTime: 3,
    imageId: "yqsgL2wKEHA",
    publishedAt: "2026-10-05",
    sections: [
      {
        heading: "Quelle pression est recommandée pour mon véhicule ?",
        content: "La pression recommandée n'est PAS inscrite sur le flanc du pneu — c'est la pression maximale que le pneu peut supporter. La pression correcte est indiquée sur un autocollant dans le montant de la portière conducteur (parfois aussi dans le couvercle de la trappe à essence ou dans le manuel du propriétaire).",
        note: "Les pressions avant et arrière peuvent être différentes. Sur certains VUS et camionnettes, la pression recommandée change aussi selon la charge.",
      },
      {
        heading: "Comment mesurer correctement",
        content: "Pour une mesure fiable, vérifiez toujours la pression à froid — avant de rouler ou après moins de 2 km. La chaleur de la route gonfle l'air et fausse la lecture d'environ 4 à 6 PSI.",
        tips: [
          "Retirez le capuchon de la valve",
          "Appuyez la jauge fermement sur la valve (un sifflement indique une mauvaise prise)",
          "Lisez la pression en PSI ou kPa selon votre jauge",
          "Comparez avec la valeur sur l'autocollant de portière",
          "Ajustez : ajoutez de l'air ou libérez-en en appuyant sur le noyau de valve",
          "Revérifiez après ajustement",
        ],
      },
      {
        heading: "L'effet du froid québécois sur la pression",
        content: "La pression d'un pneu baisse d'environ 1 PSI (7 kPa) tous les 6 °C de baisse de température. Entre l'été (+30 °C) et un matin d'hiver (-25 °C), vous pouvez perdre 9 PSI — soit 20 à 25 % de la pression recommandée pour la plupart des véhicules. C'est pourquoi le voyant TPMS s'allume souvent en automne sans qu'il y ait de fuite.",
        tips: [
          "Vérifiez la pression en début de saison froide et après chaque vague de froid intense",
          "Fréquence idéale : une fois par mois",
          "N'oubliez pas la roue de secours",
        ],
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(article: Article, count = 3): Article[] {
  return ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category
  )
    .slice(0, count)
    .concat(
      ARTICLES.filter(
        (a) => a.slug !== article.slug && a.category !== article.category
      ).slice(0, Math.max(0, count - ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category).length))
    )
    .slice(0, count);
}
