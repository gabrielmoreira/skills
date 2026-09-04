import { getJson } from "./http.ts";

interface Ledger {
  entries: number;
}

const UPSTREAM_TIMEOUT_MS = 60_000;

export async function handler(): Promise<{ statusCode: number; body: string }> {
  const ledger = await getJson<Ledger>("https://ledger.internal.example.invalid/entries", {
    timeoutMs: UPSTREAM_TIMEOUT_MS,
  });
  return { statusCode: 200, body: JSON.stringify({ entries: ledger.entries }) };
}
