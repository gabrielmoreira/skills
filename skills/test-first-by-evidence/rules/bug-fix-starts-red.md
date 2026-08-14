---
id: test-first-by-evidence.bug-fix-starts-red
owner: test-first-by-evidence
canonical: true
severity: hard-gate
references: [Regression testing, Defect-driven testing]
---

# Bug Fix Starts Red

Decision: **A bug fix begins with a test that reproduces the defect and fails for that reason.** Establishing the cause in the first place belongs to `debugging-by-evidence/rules/runnable-signal.md`.

Use when:
- **A bug is reported**, with or without a reproduction.
- **A stack trace or a failing run** is the starting point.
- **A regression appeared** in something that used to work.
- **A fix is already written** and a test is being added behind it.

Do:
- **Turn the report into a failing test before touching the code.** The test is the reproduction, in a form that runs again next year.
- **Put it where the defect actually is**, not where it surfaced. A wrong value arriving from three layers away gets its test at the source.
- **Assert the correct behaviour**, so the test fails now and passes after the fix.
- **Confirm the failure matches the report.** A different red line is a different bug.
- **Keep the test after the fix lands.** It is the regression guard, and it is the whole return on this work.
- **Where the cause is not yet known, establish it first.** A fix without a cause is a guess that happened to go green.

Avoid:
- **Fixing first and adding the test after.** It passes on the first run and has never shown it can catch the defect.
- **A test that reproduces a symptom you cannot explain.** You may be pinning a coincidence.
- **Asserting the buggy output** so the suite goes green without anything being fixed.
- **Deleting the test once the fix is merged.**
- **A test at the point of the crash** when the bad value was created elsewhere.

Exceptions:
- **A defect that cannot be reproduced in a test** is reported as such, with what would be needed to reproduce it, rather than fixed blind.
- **An urgent production fix MAY ship before the test**, provided the test follows in the same change and the gap is stated.

Example (one instance, not the set):

```txt
Report:   empty email is accepted at signup.

RED       rejects an empty email
          expected "Email required", received undefined
          Fails because the check does not exist. Matches the report.

GREEN     add the check. Test passes, suite passes.

KEEP      the test stays. Next year it is the reason this cannot come back.
```

Verify:
- **Quote the red run that reproduced the defect**, before the fix existed.
- **Check the test sits where the defect originates.**
- **Check the failure matched the reported symptom**, not merely something red.
- **Check the test survives into the merged change.**
