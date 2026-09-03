import { beginRequest, endRequest } from "./session.js";
import { reroute } from "./consignments.js";

export async function handle(event, deps) {
  beginRequest(event.actor);
  try {
    return await reroute(event.consignmentId, event.depotCode, deps);
  } finally {
    endRequest();
  }
}
