import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { getCities, MIN_GARAGES_FOR_INDEX } from "@/lib/city-pages";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

const STATIC_ROUTES = [
  "",
  "/rechercher",
  "/prestations",
  "/conseils",
  "/garagistes",
  "/garagistes/rendez-vous-manques",
  "/garagistes/agenda-en-ligne",
  "/garagistes/saison-pneus-hiver",
  "/conducteurs/reserver-garage-en-ligne",
  "/pourquoi-garago",
  "/garages",
  "/faq",
  "/a-propos",
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

  return [...staticEntries, ...cityEntries, ...garageEntries];
}
