export type Booking = { id: string; startsAt: Date; durationMinutes: number };

export function bookingWindow(b: Booking): { from: Date; to: Date } {
  const to = new Date(b.startsAt.getTime() + b.durationMinutes * 60_000);
  return { from: b.startsAt, to };
}

export function overlaps(a: Booking, b: Booking): boolean {
  const wa = bookingWindow(a);
  const wb = bookingWindow(b);
  return wa.from < wb.to && wb.from < wa.to;
}
