export function formatEUR(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);
}
