import { clampPageSize } from "./limits.js";
import { db } from "./db.js";

export async function listAccounts(req) {
  const size = clampPageSize(req.query.size);
  return db.query("select * from accounts limit ?", [size]);
}
