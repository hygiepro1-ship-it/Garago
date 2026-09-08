import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Garago",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-8"
        style={{ color: "#f97316" }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Retour à l'accueil
      </Link>

      <h1 className="text-3xl font-black mb-2" style={{ color: "#0b1f3a" }}>Politique de confidentialité</h1>
      <p className="text-sm mb-10" style={{ color: "#94a3b8" }}>Dernière mise à jour : septembre 2026</p>

      <div className="space-y-8" style={{ color: "#374151" }}>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>1. Informations que nous collectons</h2>
          <p className="text-sm leading-relaxed mb-3">Lors de votre utilisation de Garago, nous pouvons collecter :</p>
          <ul className="list-disc list-inside text-sm leading-relaxed space-y-1.5">
            <li>Informations d'identification : nom, adresse courriel, numéro de téléphone</li>
            <li>Informations sur votre véhicule : marque, modèle, année</li>
            <li>Données de localisation (avec votre consentement) pour trouver les garages proches</li>
            <li>Historique de navigation et d'utilisation de la plateforme</li>
            <li>Avis et évaluations que vous publiez</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>2. Utilisation de vos données</h2>
          <p className="text-sm leading-relaxed mb-3">Vos données sont utilisées pour :</p>
          <ul className="list-disc list-inside text-sm leading-relaxed space-y-1.5">
            <li>Fournir et améliorer nos services</li>
            <li>Personnaliser votre expérience sur la plateforme</li>
            <li>Vous envoyer des notifications et rappels d'entretien (si vous y avez consenti)</li>
            <li>Assurer la sécurité et prévenir la fraude</li>
            <li>Répondre à vos demandes de support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>3. Partage de vos données</h2>
          <p className="text-sm leading-relaxed">
            Nous ne vendons jamais vos données personnelles à des tiers. Vos informations peuvent être partagées
            uniquement avec les garages que vous contactez via la plateforme, dans le cadre de la prise de rendez-vous,
            ou avec nos prestataires techniques (hébergement, envoi de courriels) soumis aux mêmes obligations de confidentialité.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>4. Localisation</h2>
          <p className="text-sm leading-relaxed">
            Garago demande l'accès à votre localisation pour vous proposer des garages à proximité. Cette donnée
            n'est utilisée qu'au moment de la recherche et n'est jamais stockée de façon permanente sur nos serveurs
            sans votre consentement explicite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>5. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Nous utilisons des cookies essentiels pour maintenir votre session et des cookies analytiques pour
            améliorer notre service. Vous pouvez désactiver les cookies non essentiels via les paramètres de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>6. Conservation des données</h2>
          <p className="text-sm leading-relaxed">
            Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression de
            votre compte et de vos données en contactant notre support. Certaines données peuvent être conservées
            plus longtemps pour des raisons légales ou de sécurité.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>7. Vos droits</h2>
          <p className="text-sm leading-relaxed mb-3">Conformément à la Loi 25 (Québec) et aux lois applicables, vous avez le droit de :</p>
          <ul className="list-disc list-inside text-sm leading-relaxed space-y-1.5">
            <li>Accéder à vos données personnelles</li>
            <li>Corriger les informations inexactes</li>
            <li>Demander la suppression de vos données</li>
            <li>Retirer votre consentement à tout moment</li>
            <li>Portabilité de vos données</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>8. Sécurité</h2>
          <p className="text-sm leading-relaxed">
            Nous appliquons des mesures de sécurité techniques et organisationnelles pour protéger vos données,
            notamment le chiffrement des mots de passe et des connexions HTTPS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#0b1f3a" }}>9. Contact</h2>
          <p className="text-sm leading-relaxed">
            Pour exercer vos droits ou poser des questions sur notre politique de confidentialité, contactez notre
            responsable de la protection des données à{" "}
            <a href="mailto:confidentialite@garagopro.ca" className="font-semibold" style={{ color: "#f97316" }}>
              confidentialite@garagopro.ca
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
