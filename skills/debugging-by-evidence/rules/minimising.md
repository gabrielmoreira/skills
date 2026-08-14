---
id: debugging-by-evidence.minimising
owner: debugging-by-evidence
canonical: true
severity: default
references: [delta debugging, test case reduction, one-factor-at-a-time]
---

# Minimising

Decision: Cut one element from a red loop and re-run. Keep the cut only while
the loop stays red. A loop that fails for four reasons at once names none of
them. One cut per run is what makes each result attributable.

- **You should see a survivor set where removing any one element turns the run green.** You should not see a batch of cuts scored by a single run.
- **Owns shrinking a loop that already reproduces.** A loop that does not reproduce or cannot be trusted → `rules/runnable-signal.md`. Moving one variable inside the code rather than removing one from the loop → `rules/probing.md`.

Use when:

- **The red loop spans more than 3 files**, or runs a whole suite to show one failure.
- **A long setup sequence precedes the failure** and no step is known to matter.
- **Two independent assertions go red in the same run.**

Do:

1. **List the loop's elements.**
   - Each setup step.
   - Each input field.
   - Each collaborator.
   - Each assertion.
2. **Remove the element furthest from the symptom, then re-run.** Still red → leave it out. Green → put it back and mark it required.
3. **Repeat until every survivor is marked required.** The loop is minimal when removing any one of them makes the run pass.
4. **Replace a required collaborator with the smallest stand-in that keeps the run red.** Then resume cutting against the stand-in.
5. **Count the elements before and after, and state both.** 34 steps down to 3 is the result you report.

Avoid:

- **Removing two elements in one run.** A still-red result tells you nothing about either.
- **Deleting an assertion to shrink the loop.** The assertion is the symptom.
- **Declaring a loop minimal because it looks smaller**, without testing each survivor.

Exceptions:

- **A failure that appears only under the full sequence is a finding about ordering.** Keep the sequence and name the two steps that must stay adjacent.

Example (one instance, not the set):

```
34 elements at the start. One cut per run.
  drop <seed-fixture>          still red   out
  drop <auth-middleware>       still red   out
  drop <currency-preference>   green       required, put back
  swap <payment-client> for a 3-line stand-in, still red   out
3 elements left: <currency-preference>, one input row, one assertion.
Removing any one of the three turns the run green.
```

Verify:

- **Remove each surviving element once more.** Every one of those runs goes green.
- **Compare the before and after element counts** in the report.
- **Read the run history** for one cut per run and no batched cuts.
