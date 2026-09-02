import { round } from "./money.js";

export function invoiceTotal(lines) {
  let cents = 0;
  for (const l of lines) cents += l.unitCents * l.quantity;
  return { lines: lines.length, total: round(cents) };
}
