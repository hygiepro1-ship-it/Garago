import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * Contrôle serveur de l'espace admin : la page (composant navigateur) vérifiait le rôle seulement après
 * son chargement. Ici, un visiteur sans compte ADMIN est renvoyé avant que la page ne lui soit envoyée.
 * Les routes /api/admin/* vérifient aussi le rôle de leur côté.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "ADMIN") redirect("/tableau-de-bord");
  return children;
}
