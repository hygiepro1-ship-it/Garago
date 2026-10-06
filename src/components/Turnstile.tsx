"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  /** reçoit le jeton (ou "" quand il expire) */
  onToken: (token: string) => void;
  /** changer cette valeur remet la case à zéro (un jeton ne sert qu'une fois) */
  resetKey?: number;
}

// Case « Je ne suis pas un robot ». N'affiche rien tant que NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas définie.
export default function Turnstile({ onToken, resetKey = 0 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !box.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        language: "fr",
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(""),
        "error-callback": () => cb.current(""),
      });
    }).catch(() => cb.current(""));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) {
      cb.current("");
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="my-2" />;
}

export const turnstileActive = !!SITE_KEY;
