import { stamp } from "./audit.js";

export async function reroute(consignmentId, depotCode, deps) {
  const consignment = await deps.store.load(consignmentId);
  if (consignment.status === "delivered") {
    return { ok: false, reason: "already-delivered" };
  }

  const depot = await deps.depots.find(depotCode);
  if (!depot.acceptsInbound) {
    return { ok: false, reason: "depot-closed", depotCode };
  }

  const updated = stamp({
    ...consignment,
    depotCode,
    status: "rerouted",
  });

  await deps.store.save(updated);
  return { ok: true, consignment: updated };
}
