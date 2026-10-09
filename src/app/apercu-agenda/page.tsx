import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AgendaDemo from "./AgendaDemo";

export const metadata: Metadata = { title: "Aperçu de l'agenda | Garago", robots: { index: false } };

// Aperçu de l'agenda d'un garage à plusieurs postes, avec des rendez-vous fictifs :
// sert à juger l'affichage sans compte ni base de données. Jamais servi en production.
export default function ApercuAgendaPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <AgendaDemo />;
}
