import { test } from "node:test";
import assert from "node:assert/strict";
import { clampPageSize } from "./limits.js";

test("defaults to 25", () => {
  assert.equal(clampPageSize(undefined), 25);
});
