import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          profile(profile) {
            return {
              id:    profile.sub,
              name:  profile.name,
              email: profile.email,
              image: profile.picture,
              role:  "DRIVER" as const,
            };
          },
        })]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Courriel", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email; // casse préservée — ne pas modifier la recherche en base
        const since = new Date(Date.now() - LOGIN_WINDOW_MS);

        // Anti-brute-force : bloque après trop d'échecs récents sur ce courriel
        const recentFailures = await prisma.loginAttempt.count({
          where: { email, createdAt: { gt: since } },
        });
        if (recentFailures >= MAX_LOGIN_ATTEMPTS) {
          throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          await prisma.loginAttempt.create({ data: { email } });
          return null;
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.password);
        if (!passwordValid) {
          await prisma.loginAttempt.create({ data: { email } });
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id   = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id   = token.id;
      }
      return session;
    },
  },
};
