import type { MetadataRoute } from "next";
import { notTestGarage } from "@/lib/test-garages";
import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { getCities, MIN_GARAGES_FOR_INDEX } from "@/lib/city-pages";
import { PAGE_PAIRS, languagesFor } from "@/lib/alternates";
import { ARTICLES } from "@/lib/articles";
import { ARTICLE_EXTRAS } from "@/lib/articles-extras";
import { VIDEOS } from "@/content/videos";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

// Régénéré toutes les heures : les garages ajoutés, réclamés ou fusionnés y apparaissent sans attendre une publication.
export const revalidate = 3600;

const VIDEO_BY_PATH = new Map(Object.values(VIDEOS).flatMap((byLang) => Object.values(byLang)).map((v) => [v.path, {
  title: v.h1,
  description: v.description,
  thumbnail_loc: `${BASE_URL}${v.poster}`,
  content_loc: `${BASE_URL}${v.file}`,
  duration: v.duration === "PT54S" ? 54 : 51,
  publication_date: v.uploadDate,
}]));

// Dates de modification (lastmod) : seulement quand on connaît la vraie date (article, garage, vidéo).
// Pour les autres pages, on n'en met pas plutôt que d'annoncer une fausse date à chaque régénération.
// changefreq et priority ne sont pas émis : Google les ignore.

// Pages en une seule version. Les pages traduites (français et anglais) viennent de PAGE_PAIRS.
const STATIC_ROUTES = [
  "/rechercher",
  "/prestations",
  "/inscription/conducteur",
  "/inscription/garage",
  "/conditions",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Chaque page traduite annonce ses deux versions : Google montre la bonne selon la langue de la recherche.
  const pairedEntries: MetadataRoute.Sitemap = PAGE_PAIRS.flat().map((path) => ({
    url: `${BASE_URL}${path === "/" ? "" : path}`,
    ...(VIDEO_BY_PATH.get(path) ? { lastModified: VIDEO_BY_PATH.get(path)!.publication_date } : {}),
    alternates: { languages: languagesFor(path) },
    // Pages de lecture des vidéos : la vidéo est annoncée à Google avec sa vignette et son fichier.
    ...(VIDEO_BY_PATH.get(path) ? { videos: [VIDEO_BY_PATH.get(path)!] } : {}),
  }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
  }));

  // Articles de conseils pour les conducteurs
  // Chaque article en français (/conseils/…) et en anglais (/en/tips/…), avec ses deux versions annoncées.
  const articleEntries: MetadataRoute.Sitemap = ARTICLES.flatMap((a) => [`/conseils/${a.slug}`, `/en/tips/${a.slug}`].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: ARTICLE_EXTRAS[a.slug]?.updatedAt ?? a.publishedAt,
    alternates: { languages: languagesFor(path) },
  })));

  const subOr = activeSubscriptionOr();
  const garages = await prisma.garage.findMany({
    where: {
      hiddenByReport: false,
      ...notTestGarage(),
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
  }));

  // Pages de ville : seulement celles qui ont assez de garages pour être utiles (les autres sont en noindex).
  const cityEntries: MetadataRoute.Sitemap = (await getCities())
    .filter((c) => c.count >= MIN_GARAGES_FOR_INDEX)
    .map((c) => ({
      url: `${BASE_URL}/garages/${c.slug}`,
    }));

  return [...pairedEntries, ...staticEntries, ...articleEntries, ...cityEntries, ...garageEntries];
}
