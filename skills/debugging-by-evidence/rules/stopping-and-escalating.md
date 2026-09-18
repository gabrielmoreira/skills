---
id: debugging-by-evidence.stopping-and-escalating
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [attempt budgets, escalation criteria, known unknowns]
---

# Stopping and Escalating

Decision: **Stop or change approach when the next step cannot inform the scoped
decision.** An investigation need not reconstruct every historical detail
before a supported handling repair can proceed.
Where the supported repair is the deliverable → `rules/fix-at-the-source.md`.

Use when:
- **Repeated runs leave the same decision unresolved.**
- **A proposed repair causes new regressions.**
- **A needed observation requires unavailable access, state or authority.**

Do:
1. **Name the decision and the missing observation.** Separate essential evidence from information that would only complete the incident story.
2. **Choose another layer when it can answer the question.** A controlled handling test may be useful while source analysis or bounded tracing investigates the trigger.
3. **Explain what repetition could change.** Measuring variability can justify repeated runs; hoping an intermittent event appears is not an unbounded plan.
4. **Revisit a repair when regressions challenge it.** Inspect which contract was broken. Several failed fixes do not, by themselves, prove the architecture is wrong.
5. **Stop when the decision is supported or further evidence cannot affect it.** Record the remaining uncertainty and the conditions that would reopen it.
6. **Hand back when an essential observation or action is inaccessible**, the investigation limit is reached, or the next step exceeds authority. Do not widen permissions or bypass protections.

Independent fronts are optional, not a quota. Keep them only while they can
answer different useful questions. A gap blocks the claims depending on it,
not unrelated observations or a separately justified repair.

Avoid:
- **Counting attempts as proof of a structural defect.**
- **Treating one successful retry as proof that the underlying defect is fixed.**
- **Continuing through an essential gap as if an assumption were an observation.**
- **Waiting for perfect certainty about facts irrelevant to the repair.**

Exceptions:
- **Urgent containment may precede complete diagnosis within explicit authority.** Label it containment and retain the unresolved defect.

Example (one instance, not the set):
```txt
Known: controlled unknown metadata makes real resolution violate its contract.
Unknown: the original OS event that produced the metadata result.
Decision: a contract-preserving repair removes that dependency on this platform.
Next: verify affected paths; stop chasing the historical event for this repair.
Reopen: if an incident persists or an untested contract changes the decision.
```

Verify:
- **State what supports the decision and what remains unknown.**
- **For a handback, name the missing observation and who can obtain it.**
- **Confirm no unsupported certainty or new authority was inferred.**
