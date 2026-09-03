# External Consumers Directory

## order.created

- **Producer:** `orders-service` (this repository)
- **Schema:** `{ orderId: string, customerId: string, totalCents: number, items: Array }`
- **External Consumers:**
  - **Service:** `billing-service`
    - **Owner:** Billing Operations Team (`@billing-ops`)
    - **Notification SLA:** Breaking changes require 2-week notice before release
    - **Required Fields:** `orderId`, `totalCents`, `currency` (used to route to regional settlement ledgers)
  - **Service:** `notification-service`
    - **Owner:** Customer Engagement (`@engagement-team`)
    - **Required Fields:** `orderId`, `customerId`
