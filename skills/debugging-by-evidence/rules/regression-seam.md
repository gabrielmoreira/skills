---
id: debugging-by-evidence.regression-seam
owner: debugging-by-evidence
canonical: true
severity: default
references: [regression testing, test seams, characterization tests]
---

# Regression Seam

Decision: Put the test at the real call site, not where a test is convenient to
write. The caller never reaches the helper with the failing shape. A test there
proves the helper, not the bug.

- **You should see a recorded failure with the fix absent.** You should not see a green test nobody has watched go red.
- **Owns where the test goes and what it must have been seen doing.** Where the fix itself goes → `rules/fix-at-the-source.md`. The throwaway command that first showed the symptom → `rules/runnable-signal.md`.

Use when:

- **The cause is explained and the fix is written.**
- **The only convenient test point is a private function**, or a stand-in the real path never uses.
- **The bug crossed a boundary the existing tests step over:** a queue, a serialiser, a transaction.

Do:

1. **Name the call site the bug occurs at, at `file:line`.** Pick the closest seam that actually runs it.
2. **Assert the behaviour the caller sees.**
   - The returned value.
   - The row written.
   - The message emitted.
3. **Carry the minimised loop's inputs into the test.** Those inputs are already known to be the ones that matter.
4. **Revert the fix, run the new test, and record the failure output.** Then restore the fix and run it again. Reverting to observe is permitted here, because this skill runs experiments. A read-only review may not, and records a Gap instead of manufacturing the observation.
5. **Report the absence as a finding where no seam reaches the real call site.** Name the coupling that prevents it. Say what the shallower test leaves uncovered.

Avoid:

- **Testing a private helper** because the public path needs setup.
- **Asserting a log line or an internal call count** as a stand-in for behaviour.
- **Claiming the test holds the bug down** without watching it fail with the fix absent.

Exceptions:

- **Code with no test harness at all.** Report that, rather than building a harness inside the same run.

Example (one instance, not the set):

```
Bug occurs at <checkout-handler>:212, where the total is written to the order row.
Seam:      the handler's public entry, the closest point that runs :212.
Rejected:  a unit test on <total-helper>; the real path never calls it with 0.
Assertion: the written order row carries total 1200 for the minimised cart.
Fix reverted, test run, output recorded:
  expected 1200, got 0     the original symptom, not a setup error
Fix restored, test green.
```

Verify:

- **Read the test for the asserted behaviour** and the `file:line` it names.
- **Confirm the recorded fix-absent output exists** and matches the original symptom.
- **Read that failure message.** It must fail for the bug's reason, not a setup error.
