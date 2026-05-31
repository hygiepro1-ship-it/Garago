"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AUTH_PATHS = ["/connexion", "/inscription"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {!isAuth && <Header />}
      <main className="flex-1">{children}</main>
      {!isAuth && <Footer />}
    </>
  );
}
