import assert from "node:assert/strict";
import test from "node:test";

import { bookingWindow, overlaps } from "./booking.ts";

const at = (iso: string) => new Date(iso);

test("a window ends after its duration", () => {
  const w = bookingWindow({ id: "a", startsAt: at("2026-03-01T09:00:00Z"), durationMinutes: 30 });
  assert.equal(w.to.toISOString(), "2026-03-01T09:30:00.000Z");
});

test("touching bookings do not overlap", () => {
  const a = { id: "a", startsAt: at("2026-03-01T09:00:00Z"), durationMinutes: 30 };
  const b = { id: "b", startsAt: at("2026-03-01T09:30:00Z"), durationMinutes: 30 };
  assert.equal(overlaps(a, b), false);
});
