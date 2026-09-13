# Invoice sync runbook

A 429 or 5xx from the vendor is retried three times inside the client. Anything
else fails on the first attempt. If the sync still fails, `InvoiceFetchFailed`
is raised with the account id and the original error as `cause`. Look for the
account id in the failure.
