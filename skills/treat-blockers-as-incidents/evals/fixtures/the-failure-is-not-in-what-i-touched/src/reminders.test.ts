import assert from "node:assert/strict";
import test from "node:test";

import { dueReminders, reminderCount } from "./reminders.ts";

const booking = (id: string, minutesFromNow: number) => ({
  id,
  startsAt: new Date(Date.now() + minutesFromNow * 60_000),
  durationMinutes: 30,
});

test("a booking inside the lead window is due", () => {
  assert.equal(dueReminders([booking("r1", 30)], new Date()).length, 1);
});

test("a booking outside the lead window is not due", () => {
  assert.equal(dueReminders([booking("r2", 240)], new Date()).length, 0);
});

test("the queue count reflects one send", () => {
  assert.equal(reminderCount(), 1);
});

test("a booking already reminded is not due twice", () => {
  const b = booking("r4", 30);
  dueReminders([b], new Date());
  assert.equal(dueReminders([b], new Date()).length, 0);
  assert.equal(reminderCount(), 1);
});
