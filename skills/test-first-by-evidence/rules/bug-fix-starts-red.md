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
- **Confirm the failure exposes the relevant contract violation.** A controlled dependency failure or schedule may demonstrate faulty handling without recreating the whole incident or printing its exact error text. Keep the handling real and justify the injected condition.
- **Where the fix is already written, make it prove itself.** Remove it, watch the test go red, put it back. That is the only way to earn the red you skipped.
- **Keep the test after the fix lands.** It is the entire return on this work.
- **Where the cause is not established, stop and establish it.** A fix without a cause is a guess that happened to go green.

Avoid:
- **Fixing first and adding a test after.** It passes on its first run and has never shown it can catch anything.
- **Asserting the buggy output** so the suite goes green without anything being fixed.
- **Claiming a forced condition identifies the historical trigger.** The test can prove defective handling while that trigger remains unknown.
- **Deleting the test once the fix is merged.**

Exceptions:
- **When the original incident cannot recur locally, test a justified narrower contract.** If even that cannot be exercised, state the missing evidence rather than treating speculation as a red run.
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
- **Check the failure demonstrates the relevant defect**, not a setup error, a copied implementation or an impossible dependency outcome.
- **Check the test survives into the merged change.**
