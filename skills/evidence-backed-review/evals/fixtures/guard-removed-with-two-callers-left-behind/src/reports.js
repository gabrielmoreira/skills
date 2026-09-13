import { clampPageSize } from "./limits.js";
import { db } from "./db.js";

export async function listReports(req) {
  const size = Math.min(clampPageSize(req.query.size), 100);
  // TODO: remove this once the reporting rewrite lands
  // const legacySize = req.query.pageSize ?? req.query.size;
  return db.query("select * from reports where account = ? limit ?", [req.account.id, size]);
}
