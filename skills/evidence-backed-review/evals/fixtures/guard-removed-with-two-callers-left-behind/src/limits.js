// Shared page-size coercion.
export function clampPageSize(n) {
  return Number(n) || 25;
}
