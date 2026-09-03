import { rateClient } from "./rate-client.js";

export async function quoteFor(shipment, account, deps) {
  const client = rateClient(deps, account);
  const bands = await client.bands(shipment.originZone, shipment.destinationZone);
  const band = bands.find((b) => shipment.weightGrams <= b.upToGrams);
  if (!band) return { ok: false, reason: "over-max-weight" };
  return { ok: true, accountId: account.id, priceCents: band.priceCents };
}
