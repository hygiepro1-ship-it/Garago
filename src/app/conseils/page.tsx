import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

const CAT_ICONS: Record<string, string> = {
  entretien: "🔧", securite: "⚠️", saisonnier: "🍂", economie: "💰", electrique: "⚡", achat: "🛒",
};
const CAT_LABELS: Record<string, string> = {
  entretien: "Entretien", securite: "Sécurité", saisonnier: "Saisonnier",
  economie: "Économie", electrique: "Électrique / VE", achat: "Achat",
};
const SEASON_LABELS: Record<string, string> = {
  printemps: "Printemps", ete: "Été", automne: "Automne", hiver: "Hiver", toute_annee: "Toute l'année",
};

export default async function ConseilsPage() {
  const tips = await prisma.autoTip.findMany({
    where: { publishAt: { lte: new Date() } },
    orderBy: { publishAt: "desc" },
  });

  return (
    <main>
      {/* ── Hero ── */}
      <section style={{ background: "#0b1f3a" }} className="py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Prenez soin de votre voiture
            <br />
            <span style={{ color: "#f97316" }}>toute l'année</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Deux nouveaux conseils chaque semaine, adaptés à la saison et aux besoins des conducteurs québécois.
          </p>
        </div>
      </section>

      {/* ── Contenu ── */}
      <section className="py-12 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto">
          {tips.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-bold text-lg" style={{ color: "#0b1f3a" }}>Aucun conseil publié pour le moment.</p>
              <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>Revenez bientôt — de nouveaux conseils arrivent chaque lundi.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {tips.map((tip) => (
                <article
                  key={tip.id}
                  className="bg-white rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 10px rgba(11,31,58,0.06)", border: "1px solid #e2e8f0" }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                      style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}
                    >
                      {CAT_ICONS[tip.category]} {CAT_LABELS[tip.category] ?? tip.category}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "#f1f5f9", color: "#64748b" }}
                    >
                      {SEASON_LABELS[tip.season] ?? tip.season}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: "#cbd5e1" }}>
                      {tip.publishAt.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h2 className="text-lg font-black mb-2" style={{ color: "#0b1f3a" }}>{tip.title}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{tip.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Inscription newsletter ── */}
      <section className="py-14 px-4" style={{ background: "#0b1f3a" }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
            Ne manquez rien
          </p>
          <h2 className="text-2xl font-black text-white mb-3">
            Recevez ces conseils par courriel
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Créez un compte Garago et activez les communications dans vos préférences pour recevoir les conseils chaque semaine.
          </p>
          <a
            href="/inscription"
            className="inline-block px-8 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
            style={{ background: "#f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
          >
            Créer un compte gratuitement →
          </a>
        </div>
      </section>
    </main>
  );
}
