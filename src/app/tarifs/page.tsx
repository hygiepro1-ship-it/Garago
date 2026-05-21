import Link from "next/link";

export default function TarifsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Tarifs simples et transparents</h1>
        <p className="text-gray-500 text-lg">Pour les garages du Québec — 30 jours d'essai gratuit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Trial */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-3xl mb-3">🆓</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Essai gratuit</h2>
          <div className="text-4xl font-extrabold text-gray-900 my-4">0 $</div>
          <p className="text-gray-500 text-sm mb-6">30 jours — Aucune carte de crédit</p>
          <ul className="space-y-2 text-sm text-gray-600 mb-8">
            {["Profil garage complet", "Gestion des services et marques", "Horaires d'ouverture", "Avis clients", "Visibilité dans les résultats"].map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
            ))}
          </ul>
          <Link href="/inscription/garage" className="block w-full text-center bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
            Commencer gratuitement
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-blue-700 text-white rounded-2xl p-8 shadow-xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-extrabold px-4 py-1 rounded-full">
            RECOMMANDÉ
          </div>
          <div className="text-3xl mb-3">🔧</div>
          <h2 className="text-xl font-extrabold mb-1">Pro Mensuel</h2>
          <div className="my-4">
            <span className="text-5xl font-extrabold">49</span>
            <span className="text-blue-200"> $/mois</span>
          </div>
          <p className="text-blue-200 text-sm mb-6">Sans engagement — Résiliez quand vous voulez</p>
          <ul className="space-y-2 text-sm mb-8">
            {["Tout inclus dans l'essai gratuit", "Priorité dans les résultats de recherche", "Badge \"Garage certifié GarageQC\"", "Réponses aux avis clients", "Support prioritaire", "Statistiques de visite"].map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="text-blue-300">✓</span>{f}</li>
            ))}
          </ul>
          <Link href="/inscription/garage" className="block w-full text-center bg-white text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Commencer l'essai gratuit
          </Link>
        </div>

        {/* Annual */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-3xl mb-3">📅</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Pro Annuel</h2>
          <div className="my-4">
            <span className="text-5xl font-extrabold text-gray-900">39</span>
            <span className="text-gray-500"> $/mois</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">Facturé annuellement — Économisez 20%</p>
          <ul className="space-y-2 text-sm text-gray-600 mb-8">
            {["Tout inclus dans Pro Mensuel", "2 mois offerts", "Tarif garanti 12 mois", "Rapport annuel de performance", "Onboarding personnalisé"].map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
            ))}
          </ul>
          <Link href="/inscription/garage" className="block w-full text-center bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors">
            Souscrire annuellement
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            { q: "Dois-je fournir une carte de crédit pour l'essai gratuit?", a: "Non! L'essai de 30 jours est entièrement gratuit, sans carte de crédit requise." },
            { q: "Puis-je annuler à tout moment?", a: "Oui, vous pouvez résilier votre abonnement à tout moment depuis votre tableau de bord. Aucuns frais d'annulation." },
            { q: "Que se passe-t-il à la fin de l'essai gratuit?", a: "Votre garage ne sera plus visible dans les résultats de recherche. Vos données sont conservées 90 jours." },
            { q: "Les conducteurs paient-ils pour utiliser GarageQC?", a: "Non! GarageQC est entièrement gratuit pour les conducteurs." },
            { q: "Comment fonctionne le système d'avis?", a: "Les conducteurs inscrits sur la plateforme peuvent laisser un avis après avoir visité votre garage. Vous pouvez répondre à chaque avis depuis votre tableau de bord." },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
              <p className="text-gray-600 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
