---
id: test-first-by-evidence.tests-that-cannot-lie
owner: test-first-by-evidence
canonical: true
severity: hard-gate
references: [Test state not interactions, DAMP over DRY, Arrange-Act-Assert]
---

# Tests That Cannot Lie

Decision: **A test asserts what a caller can observe, and you MUST be able to name the production change that would make it fail.** Which seam it sits at belongs to `rules/where-the-test-goes.md`.

Use when:
- **A test is being written or changed.**
- **An assertion checks that a mock was called** rather than what came out.
- **A test needs heavy setup** before it can assert anything.
- **A helper is being added** to remove repetition between tests.
- **A dependency is about to be mocked.**

Do:
- **Name the production change that would break this test, before writing it.** If nothing comes to mind, the test asserts nothing.
- **Assert on results, not on interactions.** The returned value, the row written, the message published, the error raised.
- **Prefer the real implementation.** Mock only what is slow, remote, non-deterministic, or destructive.
- **Understand a dependency's side effects before replacing it.** A mock that behaves differently from the real thing tests a system nobody ships.
- **Repeat yourself in tests where it aids reading.** A test should be legible without opening a helper.
- **Arrange, act, assert, in that order and visibly separated.**
- **Name the test for the behaviour and its condition**, so a failure report reads as a sentence.

Avoid:
- **Asserting call counts and arguments as the point of the test.** That freezes the implementation and passes when the behaviour is wrong.
- **Mocking the thing under test.**
- **A shared setup that hides what a given test depends on.**
- **Snapshot assertions over a large object** where nobody can say what changed or why.
- **Test-only branches in production code.** If the code asks whether it is under test, the test is lying.
- **A name like `works` or `test 2`.**

Exceptions:
- **Interaction assertions are correct when the interaction is the behaviour.** An audit log entry, an idempotency key, an email actually sent.
- **A snapshot is fine over a small, deliberately fixed shape**, such as a serialized error contract.

Example (one instance, not the set):

```ts
// Lies: passes even if the retry logic returns the wrong value.
expect(mockFn).toHaveBeenCalledTimes(3);

// Cannot lie: names a result, and a wrong implementation fails it.
const result = await retryOperation(flakyTwiceThenSucceeds);
expect(result).toBe("success");
expect(attempts).toBe(3);
```

Verify:
- **Say which production change would fail each test.** No answer means no assertion.
- **Check assertions name results**, and that interaction checks are the behaviour itself.
- **Check the test reads top to bottom** without opening a helper.
- **Check production code contains no branch that knows it is under test.**
