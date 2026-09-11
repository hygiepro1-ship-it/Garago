import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } }).catch(() => null);

  const message = setting?.maintenanceMessage?.trim()
    || "Le site est actuellement en maintenance. Nous serons de retour très bientôt.";

  const until = setting?.maintenanceUntil
    ? new Date(setting.maintenanceUntil).toLocaleString("fr-CA", {
        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0b1f3a" }}>
      <div className="w-full max-w-md text-center">
        <img src="/garago_logo_transparent_1.png?v=3" alt="Garago" className="h-12 w-auto object-contain mx-auto mb-8" />

        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(249,115,22,0.15)" }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">Maintenance en cours</h1>
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          {message}
        </p>

        {until && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              De retour vers {until}
            </span>
          </div>
        )}

        <p className="mt-10 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Merci de votre patience.
        </p>
      </div>
    </div>
  );
}
