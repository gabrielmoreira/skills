import assert from "node:assert/strict";
import test from "node:test";

import { splitAmount } from "./split.js";

test("divides evenly when it can", () => {
  assert.deepEqual(splitAmount(900, 3), [300, 300, 300]);
});

test("gives the remainder to the earliest shares, one cent each", () => {
  assert.deepEqual(splitAmount(1000, 3), [334, 333, 333]);
});

test("always returns one share per way, and they sum to the total", () => {
  const shares = splitAmount(1007, 4);
  assert.equal(shares.length, 4);
  assert.equal(shares.reduce((a, b) => a + b, 0), 1007);
});

test("one way takes everything", () => {
  assert.deepEqual(splitAmount(1007, 1), [1007]);
});

test("refuses fewer than one way", () => {
  assert.throws(() => splitAmount(100, 0), RangeError);
});
