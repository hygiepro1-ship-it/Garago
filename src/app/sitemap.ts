import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

const STATIC_ROUTES = [
  "",
  "/rechercher",
  "/prestations",
  "/conseils",
  "/tarifs",
  "/faq",
  "/inscription/conducteur",
  "/inscription/garage",
  "/connexion",
  "/conditions",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const garages = await prisma.garage.findMany({
    where: { subscriptionStatus: { in: ["ACTIVE", "TRIAL"] } },
    select: { slug: true, updatedAt: true },
  });

  const garageEntries: MetadataRoute.Sitemap = garages.map((g) => ({
    url: `${BASE_URL}/garage/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...garageEntries];
}
