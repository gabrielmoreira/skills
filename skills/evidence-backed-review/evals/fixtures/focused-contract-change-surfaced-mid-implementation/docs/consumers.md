# Who reads the quote response

The quote endpoint is consumed by two clients that deploy on their own schedule.

| Consumer | Owned by | Reads |
| --- | --- | --- |
| checkout web client | storefront team | `quoteId`, `totalCents`, `estimatedDeliveryDays` |
| order confirmation mailer | in this repository, `src/notify.js` | `estimatedDeliveryDays` |

The storefront client is released separately and pins no version of this
service. A field removed here reaches it on the next deploy of this service,
not on theirs.
