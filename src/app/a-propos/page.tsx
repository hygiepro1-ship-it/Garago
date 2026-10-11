import type { Metadata } from "next";
import Link from "next/link";
import L from "@/components/L";

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
        <h1 className="text-2xl sm:text-4xl font-black mb-6" style={{ color: "#0b1f3a" }}><L fr="À propos de Garago" en="About Garago" /></h1>

        <p className={p}>
          <L
            fr="Garago aide les conducteurs du Québec à trouver un garage qui s'occupe de leur marque de véhicule, à lire les avis et à réserver en ligne. Du côté des garages, c'est une fiche publique, un agenda et des confirmations de rendez-vous envoyées aux clients par courriel ou par texto."
            en="Garago helps Quebec drivers find a garage that works on their make of vehicle, read reviews and book online. For garages, it is a public listing, a calendar and appointment confirmations sent to customers by email or text message."
          />
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}><L fr="Pour les conducteurs" en="For drivers" /></h2>
        <p className={p}>
          <L
            fr="La recherche est gratuite. Vous indiquez votre véhicule et votre code postal, et vous voyez les garages autour de vous avec leurs services, leurs avis et leurs prochaines disponibilités. Un compte n'est nécessaire que pour réserver et suivre vos rendez-vous."
            en="Searching is free. You enter your vehicle and your postal code, and you see the garages around you with their services, reviews and next availabilities. An account is only needed to book and to keep track of your appointments."
          />
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}><L fr="Pour les garages" en="For garages" /></h2>
        <p className={p}>
          <L
            fr="Un garage inscrit gère sa fiche, ses services, ses heures d'ouverture et ses rendez-vous depuis un tableau de bord. Les 30 premiers jours sont gratuits."
            en="A registered garage manages its listing, services, opening hours and appointments from a dashboard. The first 30 days are free."
          />{" "}
          <Link href="/garagistes" className="font-bold underline" style={{ color: "#c2410c" }}><L fr="Voir le détail pour les garages" en="See the details for garages" /></Link>.
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}><L fr="D'où viennent les fiches" en="Where the listings come from" /></h2>
        <p className={p}>
          <L
            fr="Certaines fiches ont été créées à partir de renseignements publics (nom, adresse, téléphone) avant que le garage ne s'inscrive. Elles sont indiquées comme non réclamées et ne permettent pas de réserver. Le propriétaire d'un garage peut réclamer sa fiche pour la gérer, ou en demander le retrait depuis la fiche elle-même."
            en="Some listings were created from public information (name, address, phone) before the garage signed up. They are marked as unclaimed and cannot be booked. A garage owner can claim the listing to manage it, or ask for its removal from the listing itself."
          />
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}><L fr="Les avis" en="Reviews" /></h2>
        <p className={p}>
          <L
            fr="Chaque avis est lié à un compte inscrit. Les garages peuvent y répondre et signaler un avis qui leur semble abusif. Garago ne rédige pas d'avis et n'en vend pas."
            en="Every review is tied to a registered account. Garages can reply to reviews and report one they consider abusive. Garago does not write reviews and does not sell them."
          />
        </p>

        <h2 className={h2} style={{ color: "#0b1f3a" }}><L fr="Nous joindre" en="Contact us" /></h2>
        <p className={p}>
          <L fr="Une question, une erreur sur une fiche, une idée ? Écrivez à" en="A question, a mistake on a listing, an idea? Write to" />{" "}
          <a href="mailto:info@garagopro.ca" className="font-bold underline" style={{ color: "#c2410c" }}>info@garagopro.ca</a>{" "}
          <L fr="ou passez par la page" en="or use the" /> <Link href="/suggestions" className="font-bold underline" style={{ color: "#c2410c" }}><L fr="Suggestions" en="Suggestions page" /></Link>.
        </p>
      </div>
    </div>
  );
}
