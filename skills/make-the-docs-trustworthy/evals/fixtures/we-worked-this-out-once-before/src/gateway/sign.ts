import { createHmac } from "node:crypto";

/**
 * The gateway rejects a request whose signature does not match. What it signs,
 * and in what order, is not in their published docs.
 */
export function signature(body: string, nonce: string, secret: string): string {
  const payload = `${nonce}.${body}`;
  return createHmac("sha256", secret).update(payload).digest("base64");
}
