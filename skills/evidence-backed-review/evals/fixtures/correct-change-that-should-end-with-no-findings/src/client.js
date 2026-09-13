// Vendor client, vendored here. Retries 429 and 5xx three times with backoff;
// AbortError is never retried. src/client.test.js pins this policy.
const RETRYABLE = (error) => error.status === 429 || error.status >= 500;

export function createClient({ transport, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  return {
    invoices: {
      async list({ accountId, signal }) {
        let lastError;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await transport({ accountId, path: `/accounts/${accountId}/invoices`, signal });
          } catch (error) {
            if (error.name === "AbortError" || !RETRYABLE(error)) throw error;
            lastError = error;
            await sleep(50 * 2 ** attempt);
          }
        }
        throw lastError;
      },
    },
  };
}

export const client = createClient({
  transport: async ({ accountId, signal }) => {
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    return [{ id: "inv_1", accountId }];
  },
});
