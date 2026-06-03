"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

// ── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({ q, a, open, onToggle }: {
  q: string; a: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="border-b last:border-b-0 transition-colors"
      style={{ borderColor: "rgba(11,31,58,0.08)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span
          className="font-semibold text-sm sm:text-base leading-snug transition-colors"
          style={{ color: open ? "#f97316" : "#0b1f3a" }}
        >
          {q}
        </span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{
            background: open ? "#f97316" : "rgba(11,31,58,0.06)",
            color: open ? "#fff" : "#0b1f3a",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          className="pb-5 text-sm leading-relaxed"
          style={{ color: "#475569" }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FAQPage() {
  const { t } = useLang();
  const f = t.faq;

  const [tab, setTab]         = useState<"driver" | "garage">("driver");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Contact form state
  const [form, setForm]     = useState({ type: "DRIVER", question: "", authorName: "", authorEmail: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");
  const MAX = 2000;

  const faqList = tab === "driver" ? f.driverFaq : f.garageFaq;

  // Switch tab → reset open accordion & sync form type
  function switchTab(t: "driver" | "garage") {
    setTab(t);
    setOpenIndex(0);
    setForm(prev => ({ ...prev, type: t === "driver" ? "DRIVER" : "GARAGE" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.question.trim()) { setError(f.errorEmpty); return; }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? f.errorServer); return; }
      setDone(true);
    } catch { setError(f.errorNetwork); }
    finally { setSending(false); }
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{ background: "#0b1f3a" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-14 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold mb-8 px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {f.back}
          </Link>

          <div
            className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
          >
            {f.badge}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{f.heroTitle}</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.55)" }}>{f.heroSub}</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 pb-20">

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8 p-1.5 rounded-2xl shadow-sm" style={{ background: "#fff", border: "1px solid rgba(11,31,58,0.08)" }}>
          {(["driver", "garage"] as const).map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={
                  active
                    ? { background: "#0b1f3a", color: "#fff", boxShadow: "0 2px 8px rgba(11,31,58,0.18)" }
                    : { background: "transparent", color: "#64748b" }
                }
              >
                {key === "driver" ? f.driverTab : f.garageTab}
              </button>
            );
          })}
        </div>

        {/* Accordion */}
        <div
          className="rounded-2xl shadow-sm mb-10 px-6 sm:px-8"
          style={{ background: "#fff", border: "1px solid rgba(11,31,58,0.08)" }}
        >
          {faqList.map((item, i) => (
            <AccordionItem
              key={i}
              q={item.q}
              a={item.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* ── Contact form ── */}
        <div
          className="rounded-2xl shadow-sm overflow-hidden"
          style={{ border: "1px solid rgba(11,31,58,0.08)" }}
        >
          {/* Header bar */}
          <div
            className="px-6 sm:px-8 py-6"
            style={{ background: "linear-gradient(135deg, #0b1f3a 0%, #1a3a6b 100%)" }}
          >
            <div className="text-2xl mb-2">💬</div>
            <h2 className="text-xl font-black text-white mb-1">{f.askTitle}</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{f.askSub}</p>
          </div>

          <div className="bg-white px-6 sm:px-8 py-8">
            {done ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "#0b1f3a" }}>{f.successTitle}</h3>
                <p className="text-sm text-gray-500 mb-6">{f.successSub}</p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => { setDone(false); setForm({ type: tab === "driver" ? "DRIVER" : "GARAGE", question: "", authorName: "", authorEmail: "" }); }}
                    className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold transition-colors"
                  >
                    {f.sendAnother}
                  </button>
                  <Link
                    href="/"
                    className="text-sm px-4 py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "#f97316" }}
                  >
                    {f.backHome}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Who are you */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#94a3b8" }}>
                    {f.askerTypeLabel}
                  </label>
                  <div className="flex gap-2">
                    {(["DRIVER", "GARAGE"] as const).map((type) => {
                      const active = form.type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, type }));
                            switchTab(type === "DRIVER" ? "driver" : "garage");
                          }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                          style={
                            active
                              ? { borderColor: "#f97316", background: "rgba(249,115,22,0.06)", color: "#f97316" }
                              : { borderColor: "#e2e8f0", background: "#fff", color: "#64748b" }
                          }
                        >
                          {type === "DRIVER" ? `👤 ${f.askerDriver}` : `🔧 ${f.askerGarage}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0b1f3a" }}>
                    {f.questionLabel} <span style={{ color: "#f97316" }}>*</span>
                  </label>
                  <textarea
                    required
                    maxLength={MAX}
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-orange-400 transition-colors"
                    style={{ color: "#0b1f3a" }}
                    placeholder={f.questionPlaceholder}
                    value={form.question}
                    onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.question.length}/{MAX}</p>
                </div>

                {/* Optional contact */}
                <div className="border-t pt-4" style={{ borderColor: "rgba(11,31,58,0.06)" }}>
                  <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#94a3b8" }}>
                    {f.emailLabel.split("(")[0].trim()}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{f.nameLabel}</label>
                      <input
                        type="text"
                        maxLength={100}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                        placeholder={f.namePlaceholder}
                        value={form.authorName}
                        onChange={e => setForm(prev => ({ ...prev, authorName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{f.emailLabel}</label>
                      <input
                        type="email"
                        maxLength={200}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                        placeholder={f.emailPlaceholder}
                        value={form.authorEmail}
                        onChange={e => setForm(prev => ({ ...prev, authorEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || !form.question.trim()}
                  className="w-full text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: "#f97316" }}
                >
                  {sending ? f.sending : f.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
