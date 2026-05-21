"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.user as any)?.role;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <span className="text-xl font-bold text-blue-700">GarageQC</span>
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Québec</span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/rechercher" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
              Trouver un garage
            </Link>
            {!session ? (
              <>
                <Link href="/inscription/garage" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                  Inscrire mon garage
                </Link>
                <Link href="/connexion" className="px-4 py-2 text-blue-700 border border-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                  Connexion
                </Link>
                <Link href="/inscription/conducteur" className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium transition-colors">
                  S'inscrire
                </Link>
              </>
            ) : (
              <>
                {role === "GARAGE_OWNER" ? (
                  <Link href="/tableau-de-bord/garage" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                    Mon garage
                  </Link>
                ) : (
                  <Link href="/tableau-de-bord/conducteur" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                    Mon espace
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{session.user?.name}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <Link href="/rechercher" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              Trouver un garage
            </Link>
            {!session ? (
              <>
                <Link href="/inscription/garage" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Inscrire mon garage
                </Link>
                <Link href="/connexion" className="block px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg font-medium">
                  Connexion
                </Link>
                <Link href="/inscription/conducteur" className="block px-4 py-2 bg-blue-700 text-white rounded-lg text-center font-medium">
                  S'inscrire gratuitement
                </Link>
              </>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Se déconnecter
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
