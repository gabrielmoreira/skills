---
id: debugging-by-evidence.fix-at-the-source
owner: debugging-by-evidence
canonical: true
severity: default
references: [root cause analysis, fault propagation, defensive programming limits]
---

# Fix at the Source

Decision: Trace backward from the symptom to the line that produced the wrong
value. Fix there, not where it surfaced. A fix at the surfacing site leaves the
producer untouched. It sends the same value down the next path instead.

- **You should see a hop chain ending at a producer.** You should not see a guard at the crash site.
- **Owns where the change goes.** Where its test goes → `rules/regression-seam.md`. A third fix that exposed a fourth problem → `rules/stopping-and-escalating.md`.

Use when:

- **The value is already wrong when it arrives** at the line that fails.
- **The candidate fix is a null check, a clamp, a retry, or a default.**
- **This symptom has been patched before** at a different call site.

Do:

1. **Walk backward one hop at a time from the symptom.** Record `file:line` at every hop. Stop at the line that produced the value rather than passing it on.
2. **Fix at that line.** State the hop count from trigger to symptom.
3. **Fix at the boundary where the value enters** for a trigger you do not own. Label the change containment, and name the real source.
   - A library.
   - A remote service.
   - A data feed.
4. **Search for the trigger's other call sites.** List what else it feeds. Fix it once there, not once per consumer.
5. **Delete the intermediate guards the old symptom motivated.** The trigger fix made them unreachable. They now hide the next wrong value.

Avoid:

- **Guarding against a bad value** without asking where the bad value came from.
- **Widening a type or loosening a check** so the wrong value becomes legal.
- **Calling a symptom-site fix the fix** when the source sits inside the repository.

Exceptions:

- **A live incident may take containment first.** The source fix then stays open as a named follow-up carrying its `file:line`.

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
- **Search for other call sites of the fixed trigger.** Confirm the report lists them.
- **Confirm any containment label names the source** outside the repository.
