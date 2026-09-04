export function fetchOrders(store, customerId) {
  return store.orders.filter((o) => o.customerId === customerId);
}
