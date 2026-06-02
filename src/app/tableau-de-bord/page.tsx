"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TableauDeBordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/connexion");
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "ADMIN") router.replace("/tableau-de-bord/admin");
      else if (role === "GARAGE_OWNER") router.replace("/tableau-de-bord/garage");
      else router.replace("/tableau-de-bord/conducteur");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <div className="flex items-center gap-3" style={{ color: "#94a3b8" }}>
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-sm font-semibold">Chargement de votre espace…</p>
      </div>
    </div>
  );
}
