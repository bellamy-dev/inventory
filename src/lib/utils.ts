export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + "$";
}

export function formatWeight(kg: number): string {
  return kg.toFixed(1) + " kg";
}

export function calcMargin(sellPrice: number, buyPrice: number, quantity: number): number {
  return (sellPrice - buyPrice) * quantity;
}
