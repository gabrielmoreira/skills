export type Event = { kind: "shipped" | "delayed"; ref: string; etaDays?: number };

export function formatBody(e: Event): string {
  if (e.kind === "shipped") return `Parcel ${e.ref} is on its way.`;
  return `Parcel ${e.ref} is delayed by ${e.etaDays} days.`;
}
