import assert from "node:assert/strict";
import test from "node:test";

import { buildEncodePlan, planAll } from "./encode.ts";
import type { Profile } from "./profiles.ts";

const table: Record<string, Profile> = {
  "web-high": { bitrateKbps: 256, sampleRateHz: 48_000, channels: 2, container: "mp4" },
  "web-standard": { bitrateKbps: 128, sampleRateHz: 44_100, channels: 2, container: "mp4" },
  "mobile-standard": { bitrateKbps: 96, sampleRateHz: 44_100, channels: 2, container: "webm" },
};

test("estimates size from bitrate and duration", () => {
  const plan = buildEncodePlan("web-high", 60, table);
  assert.equal(plan.estimatedBytes, 1_920_000);
  assert.equal(plan.container, "mp4");
});

test("marks a single channel profile as downmixed", () => {
  const mono: Record<string, Profile> = {
    voice: { bitrateKbps: 64, sampleRateHz: 22_050, channels: 1, container: "webm" },
  };
  assert.equal(buildEncodePlan("voice", 10, mono).downmixed, true);
});

test("stereo profiles are not downmixed", () => {
  assert.equal(buildEncodePlan("web-standard", 10, table).downmixed, false);
});

test("rejects a tier that is not in the table", () => {
  assert.throws(() => buildEncodePlan("nope", 10, table), /unknown tier/);
});

test("plans every tier in the table", () => {
  const plans = planAll(30, table);
  assert.equal(plans.length, 3);
  assert.deepEqual(
    plans.map((p) => p.tier),
    ["web-high", "web-standard", "mobile-standard"],
  );
});
