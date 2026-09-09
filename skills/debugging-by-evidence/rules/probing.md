---
id: debugging-by-evidence.probing
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [single-variable experiment, tracer tokens, instrumentation hygiene]
---

# Probing

Decision: **Choose observation or controlled intervention deliberately.** Name
the prediction and vary the condition needed to test it, without replacing the
handling whose correctness is in question.

Use when:
- **Adding a log, breakpoint or temporary instrument.**
- **A rare dependency outcome or ordering cannot be reproduced on demand.**
- **Several changes in an experiment make its result hard to attribute.**

Do:
1. **State the prediction and what would count against it.** Choose the unit, adapter or integration boundary that can observe the relevant contract.
2. **Distinguish two kinds of probe.**
   - Observation records existing behaviour without intentionally changing it.
   - Intervention controls an input, dependency result, clock or schedule. Label what was forced and why it is possible.
3. **Keep the code under test real.** Use an existing substitution seam where possible. A fake error returned directly by the handler tests the fake, not error handling.
4. **Keep the experiment attributable.** Vary one relevant condition when feasible; if a coupled schedule or input set must change together, report the bundle rather than crediting one part.
5. **Isolate and restore experimental state.** Scope mocks and clocks to the test. Tag temporary instrumentation and remove it after preserving the evidence.
6. **Inspect unexpected results before choosing a repair.** Revisit the dependency contract or add a new hypothesis when evidence warrants it.

A dependency can fail before returning, reject later, or produce an uncertain
result. Select conditions relevant to its real contract rather than generating
arbitrary mock values. Returned values, errors and required effects are useful
assertions; a count of mock calls alone rarely establishes the defect.

Avoid:
- **Changing the faulty branch while trying to demonstrate its defect.**
- **Treating an injected schedule as proof of its production frequency.**
- **Overlapping experimental writes from independent investigation fronts.**
- **Keeping diagnostic logging merely because it might help later.**

Exceptions:
- **Instrumentation may perturb a race.** Record that limitation and use a controlled schedule or another observation point when appropriate.

Example (one instance, not the set):
```txt
Prediction: an unknown metadata result makes the resolver keep an invalid path.
Intervention: substitute only the metadata call's outcome.
Real code: resolver and error propagation.
Assertion: the returned path/selector obey the platform contract.
Boundary: this tests the reaction, not which OS event caused the incident.
```

Verify:
- **Identify what was observed, what was forced and what stayed real.**
- **Check the result could contradict the prediction**, not merely echo the mock.
- **Confirm temporary changes were removed or retained as isolated regression tests.**
