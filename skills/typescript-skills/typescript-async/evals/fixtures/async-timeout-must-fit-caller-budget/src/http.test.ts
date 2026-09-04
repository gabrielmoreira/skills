import { test } from "node:test";
import assert from "node:assert/strict";
import { getJson } from "./http.ts";

test("returns the parsed body on success", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ entries: 3 }), { status: 200 });
  try {
    const body = await getJson<{ entries: number }>("https://example.invalid/x", { timeoutMs: 100 });
    assert.equal(body.entries, 3);
  } finally {
    globalThis.fetch = original;
  }
});

test("throws when the upstream is not ok", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 503 });
  try {
    await assert.rejects(() => getJson("https://example.invalid/x", { timeoutMs: 100 }), /503/);
  } finally {
    globalThis.fetch = original;
  }
});
