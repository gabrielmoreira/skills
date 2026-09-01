export type CatalogueRow = {
  sku: string;
  display?: { title?: { long?: string; short?: string } };
  pricing: { amount: number; currency: string };
  stock: number;
  categoryCode?: string;
};

export type PartnerItem = {
  sku: string;
  title: string;
  price: number;
  currency: string;
  available: boolean;
};
