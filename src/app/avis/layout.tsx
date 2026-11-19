import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notez votre garage",
  description: "Donnez une note au garage qui s'est occupé de votre véhicule.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
