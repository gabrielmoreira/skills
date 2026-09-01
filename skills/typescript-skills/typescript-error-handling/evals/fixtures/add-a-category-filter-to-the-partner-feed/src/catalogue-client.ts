import { CatalogueRow } from "./types";

export async function fetchCatalogue(q: { partnerId: string; region: string }): Promise<{ rows: CatalogueRow[] }> {
  const r = await fetch(`${process.env.CATALOGUE_URL}/v2/rows?partner=${q.partnerId}&region=${q.region}`);
  if (!r.ok) throw new Error(`catalogue ${r.status}`);
  return (await r.json()) as { rows: CatalogueRow[] };
}
