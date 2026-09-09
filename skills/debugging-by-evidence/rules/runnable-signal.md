---
id: debugging-by-evidence.runnable-signal
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [minimal reproducible example, deterministic replay, flake rate measurement]
---

# Runnable Signal

Decision: **Choose a runnable check that can answer the current question.** It
may reproduce the incident or expose a handling defect under a controlled
condition. Record which claim it supports; these are not interchangeable.

Use when:
- **The reported failure does not recur locally**, or needs an unavailable environment.
- **A loop is intermittent, slow or noisy.**
- **A dependency outcome or ordering could explain a recorded failure.**

Do:
1. **Start with the available evidence.** Preserve the reported symptom, relevant inputs and incident records. A local pass is not a refutation of someone else's failure.
2. **Name the question and choose the seam.**
   - Reproduction or replay: can these inputs produce the failure?
   - Controlled fault injection: does real handling violate its contract under this dependency outcome or schedule?
   - Tracing: which event actually occurred, or which condition should the experiment model?
3. **Check the environment and the dependency contract.** Missing access may rule out capture but leave a useful local experiment. Do not simulate outcomes the dependency cannot produce.
4. **Run the check and preserve its conditions and output.** A test that cannot start supplies no evidence about the handling.
5. **If the symptom stays absent, reconsider the question before repeating.** Inspect a narrower layer or obtain missing evidence; do not require a local failure rate before forming hypotheses.
6. **Repeat when variability matters to the decision.** Record attempts, conditions and uncertainty. There is no universal run count, duration or minimum failure rate.

Independent source analysis, a handling experiment and environment observation
may proceed together if useful. Keep their results separate and do not mutate
the same experimental state concurrently. A hypothesis is not confirmed merely
because another front also regards it as plausible.

Avoid:
- **Calling a proposed command an observed result.**
- **Using fault injection to claim the injected trigger happened in production.**
- **Starting indefinite tracing when a contract-level test could answer the repair question.**
- **Insisting on injection when the missing fact is the real dependency behaviour.**

Exceptions:
- **An interactive or slow surface may be the relevant observation.** Record the steps and state; automate only where it improves repeatability or cost.

Example (one instance, not the set):
```txt
Observed: an intermittent read passes a selector through as part of a path.
Question: does uncertain path metadata cause that invalid result?
Experiment: make the metadata dependency return its documented unknown outcome;
            run the real resolver and assert path and selector remain separate
            where the platform's contract requires it.
Not shown: which metadata result occurred in the historical incident.
```

Verify:
- **Read the result against the named question.** State whether it shows occurrence, conditional handling or the historical trigger.
- **Confirm the handling is real and the injected condition is justified.**
- **Name what another run could change**, or move to the next supported decision.
