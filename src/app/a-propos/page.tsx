import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "À propos | Garago",
  description: "Ce qu'est Garago, comment les fiches de garages et les avis fonctionnent, et comment nous joindre.",
  alternates: { canonical: `${BASE_URL}/a-propos` },
};

export default function AProposPage() {
  const h2 = "text-lg sm:text-xl font-black mt-10 mb-3";
  const p = "text-base leading-relaxed mb-4";
  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ color: "#334155" }}>
        <h1 className="text-2xl sm:text-4xl font-black mb-6" style={{ color: "#0b1f3a" }}>À propos de Garago</h1>

        <p className={p}>
          Garago aide les conducteurs du Québec à trouver un garage qui s&apos;occupe de leur marque de véhicule, à lire les avis
          et à réserver en ligne. Du côté des garages, c&apos;est une fiche publique, un agenda et des confirmations de
          rendez-vous envoyées aux clients par courriel ou par texto.
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}>Pour les conducteurs</h2>
        <p className={p}>
          La recherche est gratuite. Vous indiquez votre véhicule et votre code postal, et vous voyez les garages autour de
          vous avec leurs services, leurs avis et leurs prochaines disponibilités. Un compte n&apos;est nécessaire que pour
          réserver et suivre vos rendez-vous.
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}>Pour les garages</h2>
        <p className={p}>
          Un garage inscrit gère sa fiche, ses services, ses heures d&apos;ouverture et ses rendez-vous depuis un tableau de
          bord. Les 30 premiers jours sont gratuits.{" "}
          <Link href="/garagistes" className="font-bold underline" style={{ color: "#c2410c" }}>Voir le détail pour les garages</Link>.
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}>D&apos;où viennent les fiches</h2>
        <p className={p}>
          Certaines fiches ont été créées à partir de renseignements publics (nom, adresse, téléphone) avant que le garage ne
          s&apos;inscrive. Elles sont indiquées comme non réclamées et ne permettent pas de réserver. Le propriétaire d&apos;un
          garage peut réclamer sa fiche pour la gérer, ou en demander le retrait depuis la fiche elle-même.
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}>Les avis</h2>
        <p className={p}>
          Chaque avis est lié à un compte inscrit. Les garages peuvent y répondre et signaler un avis qui leur semble abusif.
          Garago ne rédige pas d&apos;avis et n&apos;en vend pas.
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}>Nous joindre</h2>
        <p className={p}>
          Une question, une erreur sur une fiche, une idée ? Écrivez à{" "}
          <a href="mailto:info@garagopro.ca" className="font-bold underline" style={{ color: "#c2410c" }}>info@garagopro.ca</a>{" "}
          ou passez par la page <Link href="/suggestions" className="font-bold underline" style={{ color: "#c2410c" }}>Suggestions</Link>.
        </p>
      </div>
    </div>
  );
}
