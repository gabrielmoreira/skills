import { clampPageSize } from "./limits.js";
import { db } from "./db.js";

export async function listExports(req) {
  const size = clampPageSize(req.query.size);
  return db.query("select * from exports where account = ? limit ?", [req.account.id, size]);
}
