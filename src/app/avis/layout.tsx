import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votre avis sur Garago",
  description: "Dites-nous ce que vous pensez des rappels de rendez-vous Garago.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
