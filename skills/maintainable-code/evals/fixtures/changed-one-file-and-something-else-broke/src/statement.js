import { round, add } from "./money.js";

// The caller that broke, and it is not the one that was edited. It adds the
// rounded values together, so a string turns the sum into concatenation and no
// error is raised anywhere: "12.30" + "4.50" is "12.304.50" and the statement
// reports it as a total.

export function statementTotal(invoices) {
  let running = 0;
  for (const inv of invoices) running = add(running, round(inv.cents));
  return { count: invoices.length, total: running };
}
