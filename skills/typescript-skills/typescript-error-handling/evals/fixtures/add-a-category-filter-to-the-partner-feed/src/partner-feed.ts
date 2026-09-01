import { fetchCatalogue } from "./catalogue-client";
import { PartnerItem, CatalogueRow } from "./types";

const REGION_DEFAULT = "eu-west";

export async function buildPartnerFeed(partnerId: string, region?: string): Promise<PartnerItem[]> {
  const rows = await loadRows(partnerId, region);
  return rows.map(toPartnerItem);
}

async function loadRows(partnerId: string, region?: string): Promise<CatalogueRow[]> {
  try {
    const res = await fetchCatalogue({
      partnerId,
      region: region || REGION_DEFAULT,
    });
    return res.rows;
  } catch (e) {
    console.error("catalogue fetch failed", e);
    return [];
  }
}

function toPartnerItem(row: CatalogueRow): PartnerItem {
  return {
    sku: row.sku,
    title: row.display?.title?.long ?? row.display?.title?.short ?? "",
    price: row.pricing.amount,
    currency: row.pricing.currency,
    available: row.stock > 0,
  };
}
