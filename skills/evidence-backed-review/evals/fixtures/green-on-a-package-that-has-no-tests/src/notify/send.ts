import { formatBody } from "./format.ts";
import type { Event } from "./format.ts";

export async function send(e: Event, post: (body: string) => Promise<Response>): Promise<boolean> {
  const res = await post(formatBody(e));
  return res.ok;
}
