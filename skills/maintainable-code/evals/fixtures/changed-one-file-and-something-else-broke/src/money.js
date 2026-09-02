// The change that was made: `round` used to return a Number and now returns a
// string, so that the API stopped emitting 12.300000000000001. Everything that
// consumes it downstream still expects a Number, and only one of those places
// says so out loud.

export function round(cents) {
  return (Math.round(cents) / 100).toFixed(2);
}

export function add(a, b) {
  return a + b;
}
