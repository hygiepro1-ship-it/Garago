"use client";

// Extrait de src/app/tableau-de-bord/garage/page.tsx (découpage du tableau de bord du garage).

import { useEffect, useRef, useState } from "react";
import { useTr } from "@/lib/dashboard-en";

// ─── Colour utilities ────────────────────────────────────────────────────────
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToHue(hex: string | null): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(((h * 60) + 360) % 360);
}

// La pipette (EyeDropper) n'existe que sur Chrome/Edge de bureau : on ne montre pas un bouton qui ne marche pas.
export function useEyeDropper(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk("EyeDropper" in window); }, []);
  return ok;
}

export const BG_PRESETS = [
  "#ffffff","#f8fafc","#f1f5f9","#e2e8f0","#94a3b8","#64748b","#334155","#1e293b","#0f172a","#000000",
  "#fef9c3","#fde047","#eab308","#ca8a04","#78350f",
  "#fecdd3","#f43f5e","#e11d48","#9f1239","#4c0519",
  "#bbf7d0","#4ade80","#16a34a","#166534","#052e16",
  "#bfdbfe","#60a5fa","#2563eb","#1e40af","#1e3a8a",
  "#e9d5ff","#a855f7","#7c3aed","#5b21b6","#2e1065",
  "#fed7aa","#f97316","#ea580c","#9a3412","#431407",
];

export function BgColorPicker({ value, onChange, onClose }: {
  value: string | null;
  onChange: (c: string | null) => void;
  onClose: () => void;
}) {
  const tr = useTr();
  const [hex, setHex] = useState(value ?? "");
  const nativeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setHex(value ?? ""); }, [value]);

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-lg space-y-3 z-10 relative">
      {/* Preset swatches */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">{tr("Couleurs rapides")}</p>
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-1">
          {BG_PRESETS.map(c => (
            <button key={c} type="button" title={c} aria-label={c} aria-pressed={value === c}
              onClick={() => { onChange(c); setHex(c); }}
              className={`w-full min-h-[36px] sm:w-6 sm:h-6 sm:min-h-0 rounded-md transition-all hover:scale-110 border-2 ${value === c ? "border-orange-500 scale-110" : "border-gray-200 sm:border-transparent hover:border-gray-300"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Hue strip — click to pick */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">{tr("Teinte personnalisée")}</p>
        <div
          role="slider" tabIndex={0} aria-label={tr("Teinte personnalisée")}
          aria-valuemin={0} aria-valuemax={360} aria-valuenow={hexToHue(value)}
          className="h-11 sm:h-7 rounded-lg cursor-crosshair border border-gray-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          onKeyDown={(e) => {
            const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -5 : 0;
            if (!step) return;
            e.preventDefault();
            const color = hslToHex((hexToHue(value) + step + 360) % 360, 70, 55);
            onChange(color); setHex(color);
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const color = hslToHex(Math.round(ratio * 360), 70, 55);
            onChange(color); setHex(color);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const color = hslToHex(Math.round(ratio * 360), 70, 55);
            onChange(color); setHex(color);
          }}
          style={{ touchAction: "none", background: "linear-gradient(to right,hsl(0,70%,55%),hsl(30,70%,55%),hsl(60,70%,55%),hsl(90,70%,55%),hsl(120,70%,55%),hsl(150,70%,55%),hsl(180,70%,55%),hsl(210,70%,55%),hsl(240,70%,55%),hsl(270,70%,55%),hsl(300,70%,55%),hsl(330,70%,55%),hsl(360,70%,55%))" }}
        />
      </div>

      {/* Preview + hex + native fallback */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0 shadow-sm"
          style={{ background: value ?? "linear-gradient(135deg,#ccc 50%,#fff 50%)" }} />
        <input type="text" placeholder="#rrggbb" aria-label={tr("Code couleur hexadécimal")}
          className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 text-base sm:text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400"
          value={hex} maxLength={7} autoCapitalize="none" spellCheck={false}
          onChange={e => {
            const v = e.target.value.trim();
            setHex(v);
            // « ff7a00 » sans dièse est accepté : on le complète.
            const full = /^[0-9a-fA-F]{6}$/.test(v) ? `#${v}` : v;
            if (/^#[0-9a-fA-F]{6}$/.test(full)) onChange(full.toLowerCase());
          }}
        />
        <input ref={nativeRef} type="color" className="hidden"
          value={value ?? "#000000"}
          onChange={e => { onChange(e.target.value); setHex(e.target.value); }} />
        <button type="button" title={tr("Ouvrir la palette complète du système")}
          onClick={() => nativeRef.current?.click()}
          className="text-xs px-3 min-h-[44px] sm:min-h-0 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium whitespace-nowrap">
          {tr("Palette…")}
        </button>
        <button type="button" onClick={onClose} aria-label={tr("Fermer")}
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-gray-700 font-bold px-1">✕</button>
      </div>

      {/* Reset */}
      <button type="button" onClick={() => { onChange(null); setHex(""); onClose(); }}
        className="w-full text-xs py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors">
        {tr("↺ Fond automatique (image floutée)")}
      </button>
    </div>
  );
}
