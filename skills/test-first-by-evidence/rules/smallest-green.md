---
id: test-first-by-evidence.smallest-green
owner: test-first-by-evidence
canonical: true
severity: default
references: [Test-Driven Development (Beck), YAGNI]
---

# Smallest Green

Decision: **Write the least code that turns the red green, then run the whole suite before touching anything else.**

Use when:
- **A red run exists** and implementation is the next move.
- **The suite is green** and cleanup is tempting.
- **A second behaviour occurs to you** while making the first one pass.

Do:
- **Write the simplest thing that satisfies the assertion.** Generality is a later test's job.
- **Run the whole suite, not only the new test.** One new green beside three new reds is not green.
- **Refactor only from green**, and keep it green after every step.
- **Limit refactoring to shape.** Duplication, names, extraction. Nothing that changes behaviour.
- **Take the next behaviour as the next red**, not as an addition to this one.
- **Keep the output clean.** A passing suite that prints warnings is hiding something.

Avoid:
- **Writing more than the test demands.** Untested generality is a guess with a nice name.
- **Refactoring while red.** You will not know which change broke it.
- **Adding behaviour during refactor.** That behaviour has no test.
- **Declaring done on one green test** while the rest of the suite was never run.
- **Leaving a skipped or focused test behind.** A suite that ignores itself reports nothing.

Exceptions:
- **An obvious constant MAY be written directly** rather than faked and then replaced, where faking it teaches nobody anything.
- **A refactor MAY span several greens**, provided the suite is green at every commit.

Example (one instance, not the set):

```ts
// RED said: retries a failed operation three times.
// The smallest green does exactly that, and nothing about backoff or jitter.
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 0; i < 3; i++) {
    try { return await fn(); } catch (e) { last = e; }
  }
  throw last;
}
```

- **Backoff is a real requirement and gets its own red.** Writing it here would ship untested behaviour under a green tick.

Verify:
- **Check nothing in the implementation is unreachable from a test.**
- **Check the whole suite ran, and the output is clean.**
- **Check the refactor changed shape only**, with the tests untouched.
- **Name the next behaviour, and confirm it starts from red.**
