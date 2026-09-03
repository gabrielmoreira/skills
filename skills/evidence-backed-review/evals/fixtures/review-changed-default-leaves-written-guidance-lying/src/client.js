export const DEFAULT_TIMEOUT_MS = 5000;

export function createApiClient(options = {}) {
  return {
    baseUrl: options.baseUrl ?? "https://api.internal.example",
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retries: options.retries ?? 3,
  };
}
