import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const garage = await prisma.garage.findUnique({
    where: { slug },
    select: { name: true, city: true, province: true, description: true, logoUrl: true, hiddenByReport: true, verificationStatus: true, claimStatus: true },
  });

  // Fiche masquée, ou garage dont le NEQ n'est pas encore vérifié : la page publique renvoie « introuvable », donc
  // le titre et la description ne doivent pas révéler son nom non plus (ni être indexés).
  const hidden = !garage || garage.hiddenByReport || (garage.claimStatus === "activee" && garage.verificationStatus !== "APPROVED");
  if (!garage || hidden) {
    return { title: "Garage introuvable | Garago", robots: { index: false, follow: false } };
  }

  const title = `${garage.name}, ${garage.city}, ${garage.province} | Garago`;
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

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function GarageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await prisma.garage.findUnique({
    where: { slug },
    select: {
      name: true, address: true, city: true, province: true, postalCode: true, phone: true, logoUrl: true,
      latitude: true, longitude: true, description: true,
      hiddenByReport: true, verificationStatus: true, claimStatus: true,
      availability: { select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true } },
      reviews: { select: { rating: true } },
    },
  });
  // Mêmes règles de visibilité que la page : une fiche masquée ou non vérifiée n'émet aucune donnée.
  const visible = g && !g.hiddenByReport && !(g.claimStatus === "activee" && g.verificationStatus !== "APPROVED");
  if (!visible) return children;

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: g.name,
    url: `${BASE_URL}/garage/${slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: g.address,
      addressLocality: g.city,
      addressRegion: g.province,
      postalCode: g.postalCode,
      addressCountry: "CA",
    },
  };
  if (g.phone) ld.telephone = g.phone;
  if (g.logoUrl) ld.image = g.logoUrl;
  if (g.description?.trim()) ld.description = g.description.trim();
  if (g.latitude != null && g.longitude != null) ld.geo = { "@type": "GeoCoordinates", latitude: g.latitude, longitude: g.longitude };
  const open = g.availability.filter((a) => !a.isClosed && a.openTime && a.closeTime);
  if (open.length > 0) {
    ld.openingHoursSpecification = open.map((a) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAYS[a.dayOfWeek],
      opens: a.openTime,
      closes: a.closeTime,
    }));
  }
  // Note affichée seulement s'il existe de vrais avis (jamais une note inventée).
  if (g.reviews.length > 0) {
    const avg = g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length;
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(avg * 10) / 10,
      reviewCount: g.reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <>
      <JsonLd data={ld} />
      {children}
    </>
  );
}
