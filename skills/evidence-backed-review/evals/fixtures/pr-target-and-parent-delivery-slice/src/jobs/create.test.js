import { test } from "node:test";
import assert from "node:assert/strict";
import { validateExportRequest } from "./validate.js";

test("rejects an unsupported filter", () => {
  assert.throws(() => validateExportRequest({ email: "a@b.c", filters: { secret: 1 } }));
});
