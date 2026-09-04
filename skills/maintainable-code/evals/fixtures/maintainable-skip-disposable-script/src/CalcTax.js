export function calcTax(subtotalCents, rate) {
  return Math.round(subtotalCents * rate);
}
