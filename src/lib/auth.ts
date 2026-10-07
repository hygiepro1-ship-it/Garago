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
    // 14 jours (au lieu de 30 par défaut) : une session volée ou oubliée sur un poste partagé expire plus vite.
    maxAge: 14 * 24 * 60 * 60,
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

        // Courriel normalisé : sans cela, varier la casse (A@x.com / a@x.com) contournerait le compteur d'échecs.
        const email = credentials.email.trim().toLowerCase();
        const since = new Date(Date.now() - LOGIN_WINDOW_MS);

        // Anti-brute-force : bloque après trop d'échecs récents sur ce courriel
        const recentFailures = await prisma.loginAttempt.count({
          where: { email, createdAt: { gt: since } },
        });
        if (recentFailures >= MAX_LOGIN_ATTEMPTS) {
          throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
        }

        // Recherche insensible à la casse : certains comptes ont été créés avec un
        // courriel dont la casse diffère de ce que l'utilisateur retape ensuite
        // (ex. majuscule auto sur mobile) — findUnique exigerait une correspondance exacte.
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

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
        token.checkedAt = Date.now();
        return token;
      }
      // Le rôle est relu en base au plus toutes les 5 minutes : un compte supprimé est déconnecté, et un changement
      // de rôle (ex. fiche réclamée et approuvée) s'applique sans attendre l'expiration de la session.
      if (token.id && (!token.checkedAt || Date.now() - (token.checkedAt as number) > 5 * 60 * 1000)) {
        try {
          const fresh = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true } });
          if (!fresh) return {} as typeof token; // compte supprimé : session invalide
          token.role = fresh.role;
          token.checkedAt = Date.now();
        } catch {
          // Base momentanément injoignable : on garde la session telle quelle (ne pas déconnecter tout le monde).
        }
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
