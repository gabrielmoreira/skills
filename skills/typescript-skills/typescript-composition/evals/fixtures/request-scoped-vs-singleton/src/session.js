let current = null;

export function beginRequest(actor) {
  current = actor;
}

export function currentActor() {
  if (!current) throw new Error("no actor on this request");
  return current;
}

export function endRequest() {
  current = null;
}
