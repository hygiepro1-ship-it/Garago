import type { Metadata } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const garage = await prisma.garage.findUnique({
    where: { slug },
    select: { name: true, city: true, province: true, description: true, logoUrl: true },
  });

  if (!garage) {
    return { title: "Garage introuvable — Garago" };
  }

  const title = `${garage.name} — ${garage.city}, ${garage.province} | Garago`;
  const description =
    garage.description?.trim()
      || `Consultez les avis, services et disponibilités de ${garage.name} à ${garage.city}. Réservez en ligne sur Garago.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/garage/${slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/garage/${slug}`,
      siteName: "Garago",
      images: garage.logoUrl ? [{ url: garage.logoUrl }] : undefined,
      locale: "fr_CA",
      type: "website",
    },
  };
}

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
