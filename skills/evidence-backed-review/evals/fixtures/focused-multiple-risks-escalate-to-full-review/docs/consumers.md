# Who reads the billing payload

| Consumer | Owned by | Reads |
| --- | --- | --- |
| ledger exporter | finance tooling, released separately | `taxCents` |
| receipt renderer | in this repository, `src/receipt.js` | `taxCents` |

The ledger exporter pins no version of this service.
