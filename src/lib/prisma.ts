import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbUrl = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace("file:", "");

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: path.resolve(dbUrl) });
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
