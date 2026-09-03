#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"

# Base commit on main
git checkout -q -b main 2>/dev/null || true

# Temporarily write base events.js with currency
cat << 'EOF' > src/events.js
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
    currency: order.currency || "USD",
    items: order.items.map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
    })),
    timestamp: new Date().toISOString(),
  };
}
EOF

git add package.json docs/consumers.md verify-consumer.js src/events.js src/events.test.js
git commit -qm "base: initial order event publishing"

# Create feature branch
git checkout -qb refactor/streamline-order-events

# Write branch version (drops currency)
cat << 'EOF' > src/events.js
export function createOrderCreatedEvent(order) {
  if (!order || !order.id) {
    throw new Error("Invalid order payload");
  }

  // Streamlined payload: currency field removed in this branch
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
EOF

git add PULL_REQUEST.md src/events.js
git commit -qm "refactor: streamline order created event payload"
