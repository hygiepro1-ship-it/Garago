import type { Metadata } from "next";
import GaragistesContent from "./GaragistesContent";
import "./garagistes.css";

export const metadata: Metadata = {
  title: "Garago pour les garages — rendez-vous en ligne, sans téléphone",
  description:
    "Vos clients réservent eux-mêmes en ligne, selon vos heures d'ouverture et la durée de chaque service. Essai gratuit de 30 jours.",
};

export default function GaragistesPage() {
  return <GaragistesContent />;
}
