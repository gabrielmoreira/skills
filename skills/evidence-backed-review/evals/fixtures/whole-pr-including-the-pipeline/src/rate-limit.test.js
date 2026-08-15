import assert from "node:assert/strict";
import test from "node:test";

import { allowExport } from "./rate-limit.js";

test("allows the first export", () => {
  assert.equal(allowExport("a-1", 0), true);
});
