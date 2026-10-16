import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { getCities, MIN_GARAGES_FOR_INDEX } from "@/lib/city-pages";
import { PAGE_PAIRS, languagesFor } from "@/lib/alternates";
import { ARTICLES } from "@/lib/articles";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

// Pages en une seule version. Les pages traduites (français et anglais) viennent de PAGE_PAIRS.
const STATIC_ROUTES = [
  "/rechercher",
  "/prestations",
  "/conseils",
  "/garages",
  "/faq",
  "/a-propos",
  "/inscription/conducteur",
  "/inscription/garage",
  "/conditions",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Chaque page traduite annonce ses deux versions : Google montre la bonne selon la langue de la recherche.
  const pairedEntries: MetadataRoute.Sitemap = PAGE_PAIRS.flat().map((path) => ({
    url: `${BASE_URL}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" || path === "/en" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/en" ? 0.9 : 0.7,
    alternates: { languages: languagesFor(path) },
  }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Articles de conseils pour les conducteurs
  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${BASE_URL}/conseils/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const subOr = activeSubscriptionOr();
  const garages = await prisma.garage.findMany({
    where: {
      hiddenByReport: false,
      OR: [
        { parentId: null, verificationStatus: "APPROVED", OR: subOr },
        { parent: { verificationStatus: "APPROVED", OR: subOr } },
        { claimStatus: "non_reclamee", hiddenByReport: false },
      ],
    },
    select: { slug: true, updatedAt: true },
  });

  const garageEntries: MetadataRoute.Sitemap = garages.map((g) => ({
    url: `${BASE_URL}/garage/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Pages de ville : seulement celles qui ont assez de garages pour être utiles (les autres sont en noindex).
  const cityEntries: MetadataRoute.Sitemap = (await getCities())
    .filter((c) => c.count >= MIN_GARAGES_FOR_INDEX)
    .map((c) => ({
      url: `${BASE_URL}/garages/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...pairedEntries, ...staticEntries, ...articleEntries, ...cityEntries, ...garageEntries];
}
