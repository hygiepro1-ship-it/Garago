"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

export default function SuggestionsPage() {
  const { t } = useLang();
  const s = t.suggestions;
  const [form, setForm]     = useState({ content: "", authorName: "", authorEmail: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  const MAX = 2000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.content.trim()) { setError(s.errorEmpty); return; }
    setSending(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? s.errorServer); return; }
      setDone(true);
    } catch { setError(s.errorNetwork); }
    finally { setSending(false); }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-8 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors" style={{ color: "#0b1f3a" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {s.back}
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="mb-6">
          <div className="text-4xl mb-3">💡</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{s.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{s.sub}</p>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{s.successTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">{s.successSub}</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setDone(false); setForm({ content: "", authorName: "", authorEmail: "" }); }}
                className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">
                {s.sendAnother}
              </button>
              <Link href="/" className="text-sm px-4 py-2 rounded-xl text-white font-semibold"
                style={{ background: "#f97316" }}>
                {s.backHome}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {s.label} <span style={{ color: "#f97316" }}>*</span>
              </label>
              <textarea
                required
                maxLength={MAX}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-orange-400 transition-colors"
                placeholder={s.placeholder}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.content.length}/{MAX}</p>
            </div>

            {/* Optional contact info */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                {s.contactOptional}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{s.nameLabel}</label>
                  <input type="text" maxLength={100}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    placeholder={s.namePlaceholder}
                    value={form.authorName}
                    onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{s.emailLabel}</label>
                  <input type="email" maxLength={200}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    placeholder={s.emailPlaceholder}
                    value={form.authorEmail}
                    onChange={e => setForm(f => ({ ...f, authorEmail: e.target.value }))} />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={sending || !form.content.trim()}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
              style={{ background: "#f97316" }}>
              {sending ? s.sending : s.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
