import { currentActor } from "./session.js";

export function stamp(record) {
  const actor = currentActor();
  return { ...record, changedBy: actor.id, changedByName: actor.name };
}
