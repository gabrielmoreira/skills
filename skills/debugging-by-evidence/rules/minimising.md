---
id: debugging-by-evidence.minimising
owner: debugging-by-evidence
canonical: true
severity: default
references: [delta debugging, test case reduction, one-factor-at-a-time]
---

# Minimising

Decision: **Remove setup that obscures the demonstrated defect, and stop when
the experiment is clear enough to support the decision.** An irreducible example
is useful when needed, not a prerequisite for every repair.

Use when:
- **A failing check includes unrelated files or setup.**
- **A long sequence hides which conditions matter.**
- **Several failures prevent interpreting the result.**

Do:
1. **State the contract violation the reduced experiment must retain.**
2. **Remove a likely irrelevant element and run again.** Keep the reduction only if the same defect remains, not merely another red result.
3. **Preserve relevant ordering and dependency semantics.** A smaller setup with an impossible input is not the same experiment.
4. **Replace a collaborator only when the stand-in preserves the needed contract.** Label controlled outcomes; keep the faulty handling real.
5. **Stop when further reduction would not change the diagnosis or repair.** Keep a larger understandable test if shrinking it costs more than it teaches.

For an intermittent check, a pass after removing an element does not by itself
prove that element was required. Control the schedule or gather comparable
observations before drawing that conclusion. Signal selection belongs to
`rules/runnable-signal.md`.

Avoid:
- **Deleting the assertion that observes the defect.**
- **Shrinking away the boundary or ordering that causes it.**
- **Delaying a supported repair until every remaining element is proven necessary.**

Exceptions:
- **A long sequence may itself be the relevant condition.** Keep it and explain what it exercises.

Example (one instance, not the set):
```txt
Start: a request fixture, a real resolver and filesystem metadata.
Reduce: unrelated request fields and service setup.
Control: supply a contract-valid unknown metadata outcome.
Keep: the real resolver and its caller-visible path assertion.
Stop: the handling defect and affected contract are now clear.
```

Verify:
- **Confirm the reduced check still demonstrates the relevant defect.**
- **State what was controlled and what remains unverified.**
- **Do not claim minimality unless it was actually established.**
