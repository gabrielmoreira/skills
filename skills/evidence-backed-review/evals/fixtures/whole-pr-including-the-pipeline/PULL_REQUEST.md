# Rate limit the export endpoint

Adds a per-account limit so one client cannot exhaust the export workers.
Limit is 5 exports per minute, configurable through EXPORT_RATE_LIMIT.

- [x] tests added
- [x] runs locally
