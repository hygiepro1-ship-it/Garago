import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Faire une suggestion — Garago",
  description: "Une idée pour améliorer Garago ? Envoyez-nous votre suggestion.",
  alternates: { canonical: `${BASE_URL}/suggestions` },
  openGraph: { title: "Faire une suggestion — Garago", description: "Une idée pour améliorer Garago ? Envoyez-nous votre suggestion.", url: `${BASE_URL}/suggestions`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
