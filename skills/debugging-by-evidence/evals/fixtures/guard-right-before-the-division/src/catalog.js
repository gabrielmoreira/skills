const CATALOG = new Map([
  [
    "prod_mug",
    { id: "prod_mug", name: "Ceramic Mug", weightGrams: 350, isPhysical: true },
  ],
  [
    "prod_tea",
    { id: "prod_tea", name: "Earl Grey Loose Leaf", weightGrams: 150, isPhysical: true },
  ],
  [
    "bundle_tea_set",
    {
      id: "bundle_tea_set",
      name: "Tea Starter Set",
      isBundle: true,
      items: [
        { id: "prod_mug", quantity: 1, specs: { weight: 350 } },
        { id: "prod_tea", quantity: 1, specs: { weight: 150 } },
      ],
    },
  ],
]);

export function lookupProduct(productId) {
  const item = CATALOG.get(productId);
  if (!item) {
    throw new Error(`Product not found: ${productId}`);
  }

  if (item.isBundle) {
    return item.items.map((sub) => ({
      productId: sub.id,
      quantity: sub.quantity,
      weightGrams: sub.weight ?? 0,
      isPhysical: true,
    }));
  }

  return [
    {
      productId: item.id,
      quantity: 1,
      weightGrams: item.weightGrams,
      isPhysical: item.isPhysical,
    },
  ];
}
