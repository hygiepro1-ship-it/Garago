import Link from "next/link";

const FEATURES = [
  {
    icon: "👁️",
    title: "Visibilité immédiate",
    desc: "Des milliers de conducteurs québécois cherchent un garage chaque jour sur GarageQC. Votre garage apparaît dans les résultats de recherche filtré par marque, service et ville — exactement là où vos futurs clients regardent.",
    stat: "500+ recherches/jour",
    statColor: "#f97316",
  },
  {
    icon: "🚗",
    title: "Compatibilité véhicules",
    desc: "Indiquez précisément quelles marques et quels modèles vous traitez — et ceux que vous refusez. Fini les appels pour des véhicules que vous ne prenez pas en charge. Attirez seulement les bons clients.",
    stat: "37 marques configurables",
    statColor: "#0b1f3a",
  },
  {
    icon: "📋",
    title: "Gestion des services & prix",
    desc: "Affichez vos tarifs pour chaque prestation : vidange, freins, pneus, diagnostic, etc. Les conducteurs savent à quoi s'attendre avant d'appeler — vous recevez des clients qualifiés, pas des curieux.",
    stat: "25 catégories de services",
    statColor: "#f97316",
  },
  {
    icon: "⭐",
    title: "Avis vérifiés qui convertissent",
    desc: "Les avis sur GarageQC sont liés à de vrais comptes conducteurs — aucun faux avis possible. Une réputation solide, construite mérite par mérite, qui vous différencie de la concurrence.",
    stat: "4.7/5 note moyenne",
    statColor: "#f59e0b",
  },
  {
    icon: "📅",
    title: "Horaires & disponibilités en temps réel",
    desc: "Publiez vos horaires d'ouverture, indiquez si vous acceptez les sans-rendez-vous ou uniquement sur RDV. Moins d'appels inutiles, plus de clients bien préparés qui arrivent au bon moment.",
    stat: "−30% d'appels non qualifiés",
    statColor: "#22c55e",
  },
  {
    icon: "📊",
    title: "Tableau de bord centralisé",
    desc: "Gérez votre profil, vos services, vos avis et vos statistiques depuis un seul endroit. Pas besoin de compétences techniques — notre interface est faite pour les garagistes, pas les informaticiens.",
    stat: "5 min pour tout configurer",
    statColor: "#0b1f3a",
  },
];

const TESTIMONIALS = [
  {
    name: "Patrick G.",
    garage: "Auto-Sport Laval",
    city: "Laval",
    text: "En deux semaines sur GarageQC, j'ai eu 12 nouveaux clients que je n'aurais jamais trouvés autrement. L'abonnement s'est rentabilisé dès la première semaine.",
    rating: 5,
    months: "6 mois sur GarageQC",
  },
  {
    name: "Sylvie M.",
    garage: "Garage Métro Auto",
    city: "Montréal",
    text: "La fonction de marques exclues est parfaite pour moi — je ne fais que Toyota et Honda, et maintenant je reçois exactement ce type de clients. Plus de perte de temps.",
    rating: 5,
    months: "1 an sur GarageQC",
  },
  {
    name: "Carlos R.",
    garage: "Précision Mécanique",
    city: "Sherbrooke",
    text: "J'étais sceptique, mais mes avis ont attiré 3 fois plus de clients qu'avant. GarageQC est devenu mon principal canal d'acquisition.",
    rating: 5,
    months: "8 mois sur GarageQC",
  },
];

const FAQ = [
  {
    q: "Dois-je fournir une carte de crédit pour l'essai gratuit?",
    a: "Non! L'essai de 30 jours est entièrement gratuit, sans aucune information de paiement requise. Vous activez votre abonnement seulement si vous décidez de continuer.",
  },
  {
    q: "Puis-je annuler à tout moment?",
    a: "Oui, sans frais d'annulation ni période d'engagement. Résiliez en un clic depuis votre tableau de bord. Votre profil reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Que se passe-t-il à la fin de l'essai gratuit?",
    a: "Votre garage ne sera plus visible dans les résultats de recherche. Vos données sont conservées 90 jours, alors vous pouvez réactiver à tout moment sans recommencer de zéro.",
  },
  {
    q: "Les conducteurs paient-ils pour utiliser GarageQC?",
    a: "Non, jamais! GarageQC est 100% gratuit pour les conducteurs. Vous payez pour être visible auprès d'eux — c'est notre modèle et il fonctionne pour tout le monde.",
  },
  {
    q: "Combien de temps faut-il pour configurer mon profil?",
    a: "Moins de 10 minutes. Lors de l'inscription, vous choisissez vos services, vos marques acceptées/refusées et vos horaires. Votre profil est visible immédiatement après.",
  },
  {
    q: "Comment fonctionne le système d'avis?",
    a: "Les conducteurs inscrits sur la plateforme peuvent laisser un avis après avoir visité votre garage. Vous pouvez répondre à chaque avis depuis votre tableau de bord. Les avis sont liés à de vrais comptes — aucun faux avis possible.",
  },
  {
    q: "Est-ce que GarageQC remplace mon site web?",
    a: "Non, il le complète. GarageQC vous apporte une visibilité supplémentaire sur notre plateforme de recherche. Nous renvoyons même les clients vers votre site web si vous en avez un.",
  },
];

export default function TarifsPage() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20"
        style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-40 -top-40 w-[600px] h-[600px] rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
            style={{ backgroundColor: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}>
            🔧 Pour les propriétaires de garage au Québec
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Votre garage mérite<br />
            <span style={{ color: "#f97316" }}>d'être trouvé.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Des milliers de conducteurs québécois cherchent un garage de confiance chaque jour.
            Êtes-vous là où ils regardent?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/inscription/garage"
              className="px-8 py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90"
              style={{ backgroundColor: "#f97316" }}
            >
              Inscrire mon garage — 30j gratuit
            </Link>
            <a href="#formules" className="px-8 py-4 rounded-xl font-semibold text-blue-200 border border-blue-700 hover:bg-white/10 transition-all text-sm">
              Voir les formules ↓
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            {[
              { value: "500+", label: "garages partenaires" },
              { value: "8 000+", label: "avis vérifiés" },
              { value: "37", label: "villes couvertes" },
              { value: "49 $", label: "par mois seulement" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-sm text-blue-300 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">Est-ce que ça vous ressemble?</h2>
            <p className="text-gray-500 mt-2">Les défis que vivent la majorité des garagistes québécois</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "😤", text: "Des clients appellent pour des marques que vous ne traitez pas — perte de temps des deux côtés" },
              { icon: "📵", text: "Votre téléphone ne sonne plus assez, et la concurrence prend des clients qui auraient pu être les vôtres" },
              { icon: "🤷", text: "Vous n'avez aucune idée de combien de personnes cherchent un garage comme le vôtre chaque jour" },
              { icon: "📝", text: "Vos tarifs ne sont nulle part en ligne — les clients partent chez celui qui affiche ses prix" },
              { icon: "⭐", text: "Vous avez de bons clients fidèles, mais pas assez d'avis en ligne pour convaincre les nouveaux" },
              { icon: "🔍", text: "Sur Google, vous êtes à la page 3 — personne n'arrive jusque là" },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <span className="text-2xl mt-0.5">{p.icon}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-lg font-black text-gray-900">GarageQC résout tous ces problèmes. Voici comment.</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 mt-2">Une plateforme pensée par et pour les garagistes québécois</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black" style={{ backgroundColor: "rgba(249,115,22,0.1)", color: f.statColor }}>
                  {f.stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────── */}
      <section id="formules" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Des formules claires, sans surprise</h2>
            <p className="text-gray-500 mt-2">Commencez gratuitement. Passez au Pro quand vous êtes prêt.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-10">
            {/* Essai gratuit */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="text-3xl mb-3">🆓</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Essai gratuit</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-black text-gray-900">0</span>
                <span className="text-gray-400"> $ / 30 jours</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Aucune carte de crédit. Accès complet à toutes les fonctionnalités.</p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Profil garage complet",
                  "Services avec prix",
                  "Marques acceptées/refusées",
                  "Horaires d'ouverture",
                  "Avis clients",
                  "Visible dans les résultats",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription/garage" className="block w-full text-center font-bold py-3 rounded-xl transition-all hover:bg-gray-100 border border-gray-300 text-gray-700">
                Commencer gratuitement
              </Link>
            </div>

            {/* Pro Mensuel */}
            <div className="rounded-2xl p-8 relative" style={{ background: "linear-gradient(160deg, #0b1f3a, #0d2a50)", border: "2px solid #f97316" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-black text-white" style={{ backgroundColor: "#f97316" }}>
                LE PLUS POPULAIRE
              </div>
              <div className="text-3xl mb-3">🔧</div>
              <h3 className="text-xl font-black text-white mb-1">Pro Mensuel</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-black text-white">49</span>
                <span className="text-blue-300"> $ / mois</span>
              </div>
              <p className="text-blue-200 text-sm mb-6">Sans engagement. Résiliez en 1 clic à tout moment.</p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Tout de l'essai gratuit",
                  "Priorité dans les résultats",
                  'Badge "Certifié GarageQC"',
                  "Réponse aux avis clients",
                  "Statistiques de visite",
                  "Support prioritaire 7j/7",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
                    <span className="text-orange-400 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription/garage" className="block w-full text-center font-black py-3.5 rounded-xl text-white transition-all hover:opacity-90" style={{ backgroundColor: "#f97316" }}>
                Commencer l'essai 30j gratuit
              </Link>
              <p className="text-center text-xs text-blue-400 mt-2">Aucune carte requise pendant l'essai</p>
            </div>

            {/* Pro Annuel */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black" style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                ÉCONOMISEZ 20%
              </div>
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Pro Annuel</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-black text-gray-900">39</span>
                <span className="text-gray-400"> $ / mois</span>
              </div>
              <p className="text-gray-500 text-sm mb-1">Facturé annuellement — 468 $/an</p>
              <p className="text-sm font-bold text-green-600 mb-4">Vous économisez 120 $/an</p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Tout de Pro Mensuel",
                  "2 mois offerts",
                  "Tarif garanti 12 mois",
                  "Rapport annuel de performance",
                  "Onboarding personnalisé",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription/garage" className="block w-full text-center font-bold py-3 rounded-xl text-white transition-all hover:opacity-90" style={{ backgroundColor: "#0b1f3a" }}>
                Souscrire annuellement
              </Link>
            </div>
          </div>

          {/* ROI callout */}
          <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5" style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", border: "1px solid #fed7aa" }}>
            <span className="text-5xl">💡</span>
            <div>
              <h3 className="font-black text-gray-900 text-lg mb-1">Le calcul est simple</h3>
              <p className="text-gray-600 leading-relaxed">
                Une vidange d'huile rapporte en moyenne <strong>60–90 $</strong>. Il vous faut donc{" "}
                <strong className="text-orange-600">moins d'un nouveau client par mois</strong> pour rentabiliser votre abonnement Pro.
                Nos garages partenaires rapportent en moyenne <strong>8 à 15 nouvelles demandes</strong> par mois via GarageQC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">Ce que disent nos garages partenaires</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, j) => <span key={j} className="text-yellow-400 text-lg">★</span>)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ backgroundColor: "#0b1f3a" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.garage} · {t.city}</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
                    {t.months}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">En ligne en moins de 10 minutes</h2>
            <p className="text-gray-500 mt-2">3 étapes simples — aucune compétence technique requise</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                num: "1",
                icon: "📝",
                title: "Créez votre compte",
                desc: "Nom, courriel, nom du garage, adresse et code postal. C'est tout. Moins de 2 minutes.",
              },
              {
                num: "2",
                icon: "⚙️",
                title: "Configurez votre profil",
                desc: "Cochez vos services, vos prix de départ, les marques que vous traitez et vos horaires.",
              },
              {
                num: "3",
                icon: "🚀",
                title: "Recevez des clients",
                desc: "Votre garage est immédiatement visible dans les résultats de recherche. Les conducteurs vous trouvent.",
              },
            ].map((step, i) => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-white border-2 shadow-md" style={{ borderColor: "#f97316" }}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow" style={{ backgroundColor: "#f97316" }}>
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-2">
                  <span style={{ color: "#f97316" }} className="font-black mt-0.5">Q.</span>
                  {item.q}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed pl-5">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Prêt à remplir votre agenda?
          </h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            Rejoignez 500+ garages qui ont déjà choisi GarageQC pour développer leur clientèle au Québec.
            <br />
            <strong className="text-white">Commencez gratuitement — aucune carte de crédit.</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/inscription/garage"
              className="px-10 py-4 rounded-xl font-black text-white text-lg transition-all hover:opacity-90"
              style={{ backgroundColor: "#f97316" }}
            >
              Inscrire mon garage — C'est gratuit
            </Link>
          </div>
          <p className="text-blue-400 text-sm mt-4">30 jours d'essai · Sans engagement · Résiliation en 1 clic</p>
        </div>
      </section>
    </div>
  );
}
