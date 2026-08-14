---
id: test-first-by-evidence.hard-to-test-is-a-signal
owner: test-first-by-evidence
canonical: true
severity: default
references: [Listen to the tests (Freeman and Pryce), Dependency injection]
---

# Hard to Test Is a Signal

Decision: **A test that is hard to write is reporting a design problem, so fix the design rather than fighting the test.**

Use when:
- **The setup is longer than the assertion.**
- **Everything has to be mocked** before anything can be checked.
- **The test needs a clock, a network, or a global** that nothing lets you replace.
- **You cannot name what to assert.**
- **A test needs several things to be true at once** before it means anything.

Do:
- **Read the difficulty as information.** Hard to test almost always means hard to call.
- **Match the symptom to the design fix.**
  - Mocking everything: the unit takes its dependencies from inside rather than from its caller.
  - Huge setup: the unit needs too much context to do one thing.
  - Nothing obvious to assert: the unit has no result, only effects.
  - A clock or randomness you cannot control: time and entropy are being read instead of passed.
- **Pass the awkward dependency in**, and the test stops fighting you.
- **Where you cannot say what to assert, write the API you wish existed** and let the test drive it.
- **Where the design cannot change now, say so and name what the test therefore does not prove.**

Avoid:
- **Adding a test-only hook to production code** so the test can reach inside.
- **Reaching for a heavier seam** to escape a design problem. The problem travels with you.
- **Elaborate mock scaffolding** that ends up testing the scaffolding.
- **Skipping the test and calling the code untestable.** Untestable is a property of the design, and the design is yours.

Exceptions:
- **A third-party boundary MAY need a fake**, where the real thing is remote, paid, or destructive.
- **Legacy code MAY be pinned before it is reshaped**, with the reshape as the follow-up rather than the excuse.

Example (one instance, not the set):

```ts
// Hard: the clock is read inside, so the test cannot choose a time.
function isExpired(token: Token) {
  return token.expiresAt < Date.now();
}

// Easy: time arrives as an input, and the test picks it.
function isExpired(token: Token, now: number) {
  return token.expiresAt < now;
}
```

- **The second version is also better to call.** That is the pattern: the change the test wanted was the change the caller wanted.

Verify:
- **Name the design problem the difficulty pointed at.**
- **Check the fix improved the caller**, not only the test.
- **Check no test-only branch reached production.**
- **Where the design was left alone, check the report says what is therefore unproven.**
