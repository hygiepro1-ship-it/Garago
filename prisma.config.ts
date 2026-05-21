import path from "node:path";
import { defineConfig } from "prisma/config";

const dbUrl = (process.env["DATABASE_URL"] ?? "file:./prisma/dev.db").replace("file:", "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `file:${path.resolve(dbUrl)}`,
  },
});
