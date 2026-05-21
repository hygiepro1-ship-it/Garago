import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔧</span>
              <span className="text-xl font-bold text-white">GarageQC</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              La plateforme québécoise qui connecte les conducteurs avec les meilleurs garages de leur région. Trouvez le bon garage pour votre véhicule, rapidement et en toute confiance.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Conducteurs</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rechercher" className="hover:text-white transition-colors">Trouver un garage</Link></li>
              <li><Link href="/inscription/conducteur" className="hover:text-white transition-colors">Créer un compte</Link></li>
              <li><Link href="/connexion" className="hover:text-white transition-colors">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Garages</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/inscription/garage" className="hover:text-white transition-colors">S'inscrire (30 jours gratuits)</Link></li>
              <li><Link href="/connexion" className="hover:text-white transition-colors">Tableau de bord</Link></li>
              <li><Link href="/tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} GarageQC. Tous droits réservés.</p>
          <p className="text-sm text-gray-500">Fait avec ❤️ au Québec 🍁</p>
        </div>
      </div>
    </footer>
  );
}
