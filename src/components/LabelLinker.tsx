"use client";

import { useEffect } from "react";

// Beaucoup de formulaires du site écrivent <label> puis le champ à côté, sans les lier.
// Un lecteur d'écran n'annonce alors aucun nom pour le champ et un toucher sur le libellé
// n'active pas le champ. Ce composant lie, après coup, chaque libellé orphelin au premier
// champ qui le suit dans le même bloc (aucune liaison existante n'est modifiée).
const CONTROL = "input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea";

export default function LabelLinker() {
  useEffect(() => {
    let n = 0;
    let queued = false;
    const link = () => {
      queued = false;
      document.querySelectorAll<HTMLLabelElement>("label:not([for])").forEach((label) => {
        if (label.querySelector("input, select, textarea")) return; // déjà un libellé englobant
        // Le champ suit le libellé dans le même bloc, ou dans le bloc voisin (libellé + lien sur une même ligne).
        let from: Element | null = label;
        for (let up = 0; up < 2 && from; up++, from = from.parentElement) {
          let sib: Element | null = from.nextElementSibling;
          while (sib) {
            if (sib.tagName === "LABEL" || sib.querySelector("label")) return; // champ du libellé suivant
            const control = sib.matches(CONTROL) ? sib : sib.querySelector(CONTROL);
            if (control) {
              if (!control.id) control.id = `lbl-${++n}`;
              if (!control.getAttribute("aria-label") && !control.getAttribute("aria-labelledby")) label.htmlFor = control.id;
              return;
            }
            sib = sib.nextElementSibling;
          }
        }
      });
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(link); } };
    link();
    const obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return null;
}
