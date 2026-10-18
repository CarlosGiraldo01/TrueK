// 0000 -> "$ 0.000" (ppayment format like in Colombia)
export function formatPrice(value: number) {
  return `$ ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}