import { prisma } from "@/lib/prisma";
import { REVIEW_TOKEN_RE, reviewWindowOpen, canReview } from "@/lib/review-checks";
import ReviewForm from "./ReviewForm";

// Le client note le garage après sa réparation, depuis le lien du message « véhicule prêt »
// (courriel ou texto). Pas besoin de compte : le code unique du rendez-vous suffit. Il sert une
// seule fois et expire 15 jours après le rendez-vous (voir src/lib/review-checks.ts).
export default async function NoterGaragePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appt = REVIEW_TOKEN_RE.test(token)
    ? await prisma.appointment.findFirst({
        where: { reviewToken: token },
        select: { id: true, status: true, date: true, endTime: true, language: true, serviceName: true, garage: { select: { name: true, slug: true } } },
      })
    : null;
  const lang = appt?.language === "en" ? "en" : "fr";

  if (!appt || !canReview(appt.status, appt.date, appt.endTime) || !reviewWindowOpen(appt.date)) {
    return (
      <main className="min-h-[70vh] px-4 py-10" style={{ background: "#f8fafc" }} lang={lang}>
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8 text-center">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">{lang === "en" ? "This link is no longer valid" : "Ce lien n'est plus valide"}</h1>
          <p className="text-sm text-gray-500">{lang === "en" ? "A review link works only once and expires 15 days after the appointment." : "Un lien d'avis sert une seule fois et expire 15 jours après le rendez-vous."}</p>
        </div>
      </main>
    );
  }

  return <ReviewForm token={token} lang={lang} garageName={appt.garage.name} garageSlug={appt.garage.slug} serviceName={appt.serviceName} />;
}
