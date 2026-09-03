import type { Booking } from "./booking.ts";

const sent = new Set<string>();
let flushing: Promise<void> | null = null;

/** Batched so a burst of bookings costs one write. Flush is deferred. */
export function queueReminder(b: Booking): void {
  sent.add(b.id);
  flushing ??= new Promise((done) => setImmediate(() => { flushing = null; done(); }));
}

export async function flushed(): Promise<void> {
  await flushing;
}

export function dueReminders(bookings: Booking[], now: Date, leadMinutes = 60): Booking[] {
  const due: Booking[] = [];
  for (const b of bookings) {
    const lead = b.startsAt.getTime() - now.getTime();
    if (lead > 0 && lead <= leadMinutes * 60_000 && !sent.has(b.id)) {
      queueReminder(b);
      due.push(b);
    }
  }
  return due;
}

export function reminderCount(): number {
  return sent.size;
}
