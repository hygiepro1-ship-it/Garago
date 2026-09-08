import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Garago",
};

export default function ConditionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-8"
        style={{ color: "#f97316" }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Retour à l'accueil
      </Link>

      <h1 className="text-3xl font-black mb-2" style={{ color: "#0b1f3a" }}>Conditions d'utilisation</h1>
      <p className="text-sm mb-10" style={{ color: "#94a3b8" }}>Dernière mise à jour : septembre 2026</p>

      <div className="prose prose-slate max-w-none space-y-8" style={{ color: "#374151" }}>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>1. Acceptation des conditions</h2>
          <p className="text-sm leading-relaxed">
            En utilisant la plateforme Garago (accessible à garagopro.ca), vous acceptez les présentes conditions d'utilisation.
            Si vous n'êtes pas d'accord avec ces conditions, veuillez ne pas utiliser notre service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>2. Description du service</h2>
          <p className="text-sm leading-relaxed">
            Garago est une plateforme de mise en relation entre des conducteurs et des garages automobiles au Québec et au Canada.
            Nous facilitons la recherche de garages, la prise de rendez-vous et la gestion des entretiens de véhicules.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>3. Création de compte</h2>
          <p className="text-sm leading-relaxed">
            Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de la confidentialité
            de vos identifiants et de toute activité effectuée via votre compte. Vous vous engagez à fournir des informations
            exactes et à jour lors de votre inscription.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>4. Utilisation acceptable</h2>
          <p className="text-sm leading-relaxed mb-3">Vous vous engagez à ne pas :</p>
          <ul className="list-disc list-inside text-sm leading-relaxed space-y-1.5">
            <li>Utiliser la plateforme à des fins illicites ou frauduleuses</li>
            <li>Publier des avis faux ou trompeurs</li>
            <li>Harceler ou menacer d'autres utilisateurs</li>
            <li>Tenter de contourner les mesures de sécurité de la plateforme</li>
            <li>Extraire automatiquement des données sans autorisation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>5. Avis et évaluations</h2>
          <p className="text-sm leading-relaxed">
            Les avis publiés sur Garago doivent être honnêtes, basés sur une expérience réelle, et respectueux.
            Garago se réserve le droit de supprimer tout avis qui enfreint ces conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>6. Responsabilité</h2>
          <p className="text-sm leading-relaxed">
            Garago agit en tant qu'intermédiaire entre les conducteurs et les garages. Nous ne sommes pas responsables
            de la qualité des services fournis par les garages partenaires ni des dommages résultant de l'utilisation
            de ces services. Les garages sont des entreprises indépendantes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>7. Propriété intellectuelle</h2>
          <p className="text-sm leading-relaxed">
            Tous les contenus de la plateforme Garago (marques, logos, textes, images) sont la propriété de Garago
            ou de ses partenaires. Toute reproduction sans autorisation est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>8. Modification des conditions</h2>
          <p className="text-sm leading-relaxed">
            Garago se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront
            informés de tout changement important par courriel ou via la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>9. Droit applicable</h2>
          <p className="text-sm leading-relaxed">
            Les présentes conditions sont régies par les lois en vigueur au Québec, Canada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>10. Contact</h2>
          <p className="text-sm leading-relaxed">
            Pour toute question concernant ces conditions, contactez-nous à{" "}
            <a href="mailto:support@garagopro.ca" className="font-semibold" style={{ color: "#f97316" }}>
              support@garagopro.ca
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
