---
id: debugging-by-evidence.fix-at-the-source
owner: debugging-by-evidence
canonical: true
severity: default
references: [root cause analysis, fault propagation, defensive programming limits]
---

# Fix at the Source

Decision: Trace backward from the symptom to the first violated contract.
Fix the code responsible for that violation, not merely the place its effects
surface. A valid dependency failure can expose defective handling in its caller.

- **You should see a causal chain ending at a contract violation.** A guard is a fix when it enforces that contract, not when it merely hides the symptom.
- **Owns where the change goes.** Where its test goes → `rules/regression-seam.md`. A third fix that exposed a fourth problem → `rules/stopping-and-escalating.md`.

Use when:

- **The value is already wrong when it arrives** at the line that fails.
- **A documented dependency failure or unknown result leads to invalid caller behaviour.**
- **The candidate fix is a null check, a clamp, a retry, or a default.**
- **This symptom has been patched before** at a different call site.

Do:

1. **Walk backward from the symptom.** Record the relevant `file:line` links and the contract each boundary promises. Distinguish an invalid dependency result from valid input handled incorrectly.
2. **Fix the code that first violates its contract.** Correcting our handling of a legitimate dependency failure is a source fix, even if the failure's historical trigger remains unknown.
3. **Label a boundary change containment when it only limits the effects of an unresolved upstream defect.** Name that defect and its source. An external trigger alone does not make a repair containment.
4. **Find the changed code's callers before applying the repair.** For each affected contract, record changed, unaffected with a reason, or unverified. Do not assume a fix for one platform or consumer is safe for the others.
5. **Remove intermediate guards only when their protected contract is obsolete.** A newly passing path does not prove every consumer no longer needs them.

Avoid:

- **Guarding against a bad value** without asking where the bad value came from.
- **Widening a type or loosening a check** so the wrong value becomes legal.
- **Calling symptom suppression a source fix** while the demonstrated contract violation remains.

Exceptions:

- **A live incident may take containment first.** Keep the unresolved defect as a named follow-up, with its location when known.

Example (one instance, not the set):

```
symptom  <render>:88   divides by zero
   <-    <cart>:140    quantity arrives as 0
   <-    <parser>:52   empty string coerced to 0, no error raised
trigger  <parser>:52   3 hops. Fix here.
also fed by <parser>:52 -> <invoice>:31, <export>:19
```

Verify:

- **Read the backward chain.** Each hop cites `file:line` and explains the next.
- **Check affected callers and platform contracts have a disposition**, including what remains unverified.
- **Confirm any containment label names the unresolved defect**, rather than merely an external dependency or unknown historical trigger.
