import assert from "node:assert/strict";
import test from "node:test";

import { statementTotal } from "./statement.js";

test("adds two invoices", () => {
  const r = statementTotal([{ cents: 1230 }, { cents: 450 }]);
  assert.equal(r.total, 16.8);
});
