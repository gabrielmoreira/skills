export function validateOrder(order) {
  const errors = [];
  if (!order.id) errors.push("id is required");
  if (!(order.total > 0)) errors.push("total must be positive");
  if (!Array.isArray(order.lines) || order.lines.length === 0) errors.push("at least one line");
  return { ok: errors.length === 0, errors };
}
