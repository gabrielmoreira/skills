---
id: test-first-by-evidence.bug-fix-starts-red
owner: test-first-by-evidence
canonical: true
severity: hard-gate
references: [Defect-driven testing, Regression testing]
---

# Bug Fix Starts Red

Decision: **A fix waits for a test that fails because of the defect, even when the cause is already obvious.** Where that test goes, what it asserts, and how to make an existing fix prove itself belong to `debugging-by-evidence/rules/regression-seam.md`.

Use when:
- **A bug is reported** and the cause is plain enough to fix immediately.
- **A one-line fix is about to be applied.**
- **A fix already exists** and a test is being added behind it.
- **A regression appeared** in something that used to work.

Do:
- **Write the failing test first, however small the fix looks.** A one-line fix to the wrong line is still wrong, and only a red proves you found the right one.
- **Confirm the failure is the reported symptom.** A different red line is a different bug.
- **Where the fix is already written, make it prove itself.** Remove it, watch the test go red, put it back. That is the only way to earn the red you skipped.
- **Keep the test after the fix lands.** It is the entire return on this work.
- **Where the cause is not established, stop and establish it.** A fix without a cause is a guess that happened to go green.

Avoid:
- **Fixing first and adding a test after.** It passes on its first run and has never shown it can catch anything.
- **Asserting the buggy output** so the suite goes green without anything being fixed.
- **A test that reproduces a symptom you cannot explain.** You may be pinning a coincidence.
- **Deleting the test once the fix is merged.**

Exceptions:
- **A defect that cannot be reproduced in a test is reported as such**, with what would be needed to reproduce it, rather than fixed blind.
- **An urgent production fix MAY ship before its test**, provided the test follows in the same change and the gap is stated.

Example (one instance, not the set):

```txt
Report: empty email accepted at signup. The cause is obvious.

Tempting: add the check, then a test. The test passes first run
          and has never demonstrated it can fail.

Instead:  write the test, watch it fail on the missing check,
          then add the check.

Already fixed? Remove the check, watch the test go red, restore it.
          Now the red exists, just later than it should have.
```

Verify:
- **Quote the red run that reproduced the defect**, with the fix absent.
- **Check the failure matched the reported symptom**, not merely something red.
- **Check the test survives into the merged change.**
