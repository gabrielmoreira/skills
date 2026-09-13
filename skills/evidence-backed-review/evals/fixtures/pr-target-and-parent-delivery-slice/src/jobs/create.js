import { randomUUID } from "node:crypto";
import { validateExportRequest } from "./validate.js";
import { db } from "../db.js";
import { log } from "../log.js";

export async function createExportJob(req) {
  const request = validateExportRequest(req.body);
  const id = randomUUID();
  log.info("export job requested", { id, requesterEmail: request.email });
  await db.jobs.insert({
    id,
    accountId: req.account.id,
    requesterEmail: request.email,
    filters: request.filters,
    status: "queued",
    createdAt: new Date(),
  });
  return { id, status: "queued" };
}
