---
id: evidence-backed-review.motivation-and-necessity
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [Architecture decision records, Five whys, Frontier-ordered questioning]
---

# Motivation and Necessity

Decision: Locate the recorded source of the outcome a change promises, before judging its
content. An untraceable motivation makes the change unreviewable. You would be checking an
implementation of an unknown requirement. A good outcome names that source, or records a Gap.
Conformance to a written spec → `rules/spec-conformance.md`.

Use when:

- The change adds an abstraction, pattern, dependency, or layer.
- The description asserts an outcome ("faster", "safer") with nothing cited.
- No line of the request, issue, or spec asks for a capability the diff adds.

Do:

- **State the claim as *this change does X so that Y*.** Find Y's source yourself.
  - A decision record.
  - An incident.
  - A metric.
- **Record a Gap where no source exists.** List what the change treats as given. Mark each
  assumption sourced or unsourced.
- **Name the smallest path that delivers Y.** Check the change says why it rejected that path.
- **Then question in rounds.**
  1. Ask only questions whose prerequisites are settled. The rest wait.
  2. Ask nothing where that frontier is empty. The motivation stands. Move on.
  3. Otherwise send one numbered round. Each question carries your recommended answer, so the
     reply is confirm or correct, never compose. Then recompute the frontier.
  4. Stop at three rounds. Escalate what is still unresolved. That escalation is itself
     evidence the change is not ready.

Avoid:

- **Supplying the missing requirement yourself** ("so that we can scale later").
- **Asking the user for a fact you could look up.**
- **Re-running this rule on an artifact unchanged since the last round.**
- **Accepting "cleaner" or "future-proof" as Y**, or a structural claim with no measured numbers.

Exceptions:

- A revert restoring a known-good state. The incident is the source.
- A declared spike that will not merge.

Example (one instance, not the set):
```text
Claim: this change adds a shared cache so that checkout latency meets budget.
Source found: the epic states a 400 ms budget; p95 measured at 910 ms.
Round 1 (frontier settled):
1. Is the budget current after the redesign?  -> recommend: yes, per the epic.
2. Why is memoization insufficient?           -> recommend: lookups cross requests.
Deferred to round 2 (depends on Q2): the invalidation window.
```

Verify:

- **Search the description and the source for a sentence stating Y.** Absent and unrecorded, the Gap was skipped.
- **Read the produced round.** It is numbered. Each question carries a recommendation. None depends on another open one.
- **Check a fourth set appears as an escalation.**
- **Check each listed assumption names a source**, or is marked unsourced.
