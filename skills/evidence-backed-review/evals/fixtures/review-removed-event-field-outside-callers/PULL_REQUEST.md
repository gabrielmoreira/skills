# Refactor: streamline order created event payload

Removes redundant `currency` field from `order.created` event payload since all stores operate in USD.
All internal unit tests pass.

- [x] unit tests passing
- [x] internal consumers updated
