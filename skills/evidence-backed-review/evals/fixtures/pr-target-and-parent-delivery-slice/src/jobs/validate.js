const ALLOWED_FILTERS = new Set(["accountId", "from", "to", "status"]);

export function validateExportRequest(body) {
  if (typeof body?.email !== "string" || !body.email.includes("@")) {
    throw Object.assign(new Error("email is required"), { status: 400 });
  }
  const filters = {};
  for (const [key, value] of Object.entries(body.filters ?? {})) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw Object.assign(new Error("unsupported filter " + key), { status: 400 });
    }
    filters[key] = String(value).slice(0, 200);
  }
  return { email: body.email, filters };
}
