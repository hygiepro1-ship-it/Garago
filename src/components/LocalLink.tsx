"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { localHref } from "@/lib/alternates";

/** Lien vers la version de la page dans la langue affichée (par ex. /conseils → /en/tips sur une page anglaise). */
export default function LocalLink({ href, ...rest }: React.ComponentProps<typeof Link> & { href: string }) {
  const { lang } = useLang();
  return <Link href={localHref(href, lang)} {...rest} />;
}
