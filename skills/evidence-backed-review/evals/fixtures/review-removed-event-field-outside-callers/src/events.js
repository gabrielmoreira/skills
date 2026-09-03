export function createOrderCreatedEvent(order) {
  if (!order || !order.id) {
    throw new Error("Invalid order payload");
  }

  return {
    eventId: `evt_${Date.now()}`,
    eventType: "order.created",
    orderId: order.id,
    customerId: order.customerId,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
    })),
    timestamp: new Date().toISOString(),
  };
}
