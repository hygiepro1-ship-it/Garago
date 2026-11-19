import { prisma } from "@/lib/prisma";
import ReviewForm from "./ReviewForm";

// Le client note le garage après sa réparation, depuis le lien du message « véhicule prêt »
// (courriel ou texto). Pas besoin de compte : le lien unique du rendez-vous suffit.
export default async function NoterGaragePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appt = /^[a-f0-9]{48}$/.test(token)
    ? await prisma.appointment.findFirst({
        where: { reviewToken: token },
        select: { id: true, status: true, language: true, serviceName: true, garage: { select: { name: true, slug: true } } },
      })
    : null;
  const lang = appt?.language === "en" ? "en" : "fr";

  if (!appt || appt.status !== "COMPLETED") {
    return (
      <main className="min-h-[70vh] px-4 py-10" style={{ background: "#f8fafc" }} lang={lang}>
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8 text-center">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">{lang === "en" ? "This link is no longer valid" : "Ce lien n'est plus valide"}</h1>
          <p className="text-sm text-gray-500">{lang === "en" ? "Use the link from your most recent message from the garage." : "Utilisez le lien du dernier message reçu de votre garage."}</p>
        </div>
      </main>
    );
  }

  const existing = await prisma.review.findFirst({ where: { appointmentId: appt.id }, select: { rating: true, comment: true } });
  return (
    <ReviewForm
      token={token} lang={lang} garageName={appt.garage.name} garageSlug={appt.garage.slug} serviceName={appt.serviceName}
      initialRating={existing?.rating ?? 0} initialComment={existing?.comment ?? ""} alreadyReviewed={!!existing}
    />
  );
}
