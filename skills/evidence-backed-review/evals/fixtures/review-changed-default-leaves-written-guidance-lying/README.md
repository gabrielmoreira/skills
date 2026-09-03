# Platform API Client

Shared HTTP client for internal services.

## Configuration Options

- `baseUrl`: The target service endpoint. Defaults to `https://api.internal.example`.
- `timeoutMs`: Request timeout in milliseconds. Defaults to 30000 (30 seconds).
- `retries`: Number of attempts on network failure. Defaults to 3.
