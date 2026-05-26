import { defineConfig } from "prisma/config";

// prisma.config.ts : configuration pour les commandes CLI (migrate, db push, generate)
// Utilise DIRECT_URL (connexion directe sans pooler) pour les migrations
// Utilise DATABASE_URL en fallback (dev local sans pooler)
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
