---
id: debugging-by-evidence.rival-hypotheses
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [strong inference, falsifiability, differential diagnosis]
---

# Rival Hypotheses

Decision: **Use falsifiable hypotheses to choose useful experiments, including
before a local reproduction.** A hypothesis is a candidate explanation, not
permission to claim the cause or apply an unsupported fix.

Use when:
- **One explanation already feels obvious.**
- **A report or code path suggests a mechanism but the symptom is absent locally.**
- **New evidence challenges the current explanation.**

Do:
1. **Separate the claims.** What happened, how the code handles a condition, and what triggered the historical incident may need different evidence.
2. **Name plausible alternatives that change the decision.** Consider inputs, dependencies, environment, shared state and the measurement itself where relevant. Do not fill a quota with invented rivals.
3. **Give each a prediction and an observation that would weaken or reject it.** Code inspection can supply this prediction; a controlled run can test it.
4. **Choose by relevance, discriminating power and cost.** A cheap check is useful only if its result informs the decision.
5. **Work independent questions at different layers when useful.** A contract test need not wait for capture of the original transient. Shared experimental state still requires coordination.
6. **Update the hypotheses when evidence changes.** Keep why an explanation was added, weakened or rejected. Do not label absence in a small or different sample as impossibility.

Several causes may coexist. Separate their predictions rather than forcing
them to be mutually exclusive. If alternatives would justify the same scoped
repair, state what remains unresolved instead of eliminating them for its own
sake. Historical attribution remains a separate claim.

Avoid:
- **Calling the first plausible explanation confirmed.**
- **Requiring a fixed number of candidates.**
- **Waiting for perfect incident reconstruction before testing a handling defect.**
- **Inventing a new explanation solely to protect a preferred fix from contrary evidence.**

Example (one instance, not the set):
```txt
Observed: a resolver sometimes returns a path containing a selector suffix.
Handling hypothesis: an uncertain metadata result keeps the raw path.
Test: force that documented result and execute the resolver.
Trigger hypotheses: a transient I/O error or another metadata outcome.
Separate question: which happened in the original incident?
```

Verify:
- **Check each proposed experiment has a prediction it could contradict.**
- **Distinguish rejected, unsupported and still-plausible explanations.**
- **State which uncertainty matters to the next action**, rather than demanding every question be closed.
