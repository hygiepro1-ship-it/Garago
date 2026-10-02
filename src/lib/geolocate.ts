export interface Fix { lat: number; lng: number; accuracy: number }

const GOOD_ENOUGH_M = 30;   // précision GPS : on s'arrête dès qu'on l'atteint
const MAX_WAIT_MS   = 15000;

/**
 * Position la plus précise disponible, comme le font Google Maps ou Waze :
 * le premier relevé d'un navigateur est souvent approximatif (Wi‑Fi / antenne),
 * le GPS n'arrive qu'après quelques secondes. On écoute donc en continu et on
 * garde le meilleur relevé jusqu'à atteindre ~30 m ou la fin du délai.
 * Sans cache (maximumAge: 0) pour ne jamais réutiliser une ancienne position.
 */
export function getBestPosition(): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject({ code: 0 });
      return;
    }
    let best: Fix | null = null;
    let done = false;
    let watchId = 0;
    let timer: ReturnType<typeof setTimeout>;

    const finish = (err?: { code: number }) => {
      if (done) return;
      done = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (best) resolve(best); else reject(err ?? { code: 3 });
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        if (!best || fix.accuracy < best.accuracy) best = fix;
        if (best.accuracy <= GOOD_ENOUGH_M) finish();
      },
      (err) => finish(err),
      { enableHighAccuracy: true, timeout: MAX_WAIT_MS, maximumAge: 0 },
    );
    timer = setTimeout(() => finish(), MAX_WAIT_MS);
  });
}
