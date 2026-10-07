// Prix affichés en dollars canadiens, sans décimales quand le prix est rond (« 89 $ »).
export function formatPrice(n: number | string | null | undefined): string | null {
  const v = typeof n === "string" ? parseFloat(n.replace(",", ".")) : n;
  if (v == null || !Number.isFinite(v) || v <= 0) return null;
  return new Intl.NumberFormat("fr-CA", {
    style: "currency", currency: "CAD",
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2,
  }).format(v);
}
