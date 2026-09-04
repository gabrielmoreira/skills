import { test } from "node:test";
import assert from "node:assert/strict";
import { ValidationError, UpstreamTimeoutError } from "./errors.ts";

test("a validation failure carries its code and severity", () => {
  const error = new ValidationError("email is required");
  assert.equal(error.code, "VALIDATION_FAILED");
  assert.equal(error.severity, "warning");
});

test("an upstream timeout keeps the cause", () => {
  const cause = new Error("socket hang up");
  const error = new UpstreamTimeoutError("https://example.invalid/x", cause);
  assert.equal(error.code, "UPSTREAM_TIMEOUT");
  assert.equal(error.cause, cause);
});
