# Service Onboarding Guide

## Client Defaults

The shared HTTP client defaults to 30 seconds for all downstream calls.
If your service requires longer timeouts, override `timeoutMs` in the constructor options.
