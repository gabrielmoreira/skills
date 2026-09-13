---
id: evidence-backed-review.defects-in-the-change
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [line-by-line hunk reading, removed-invariant audit, root cause analysis, cohesion and coupling]
---

# Correctness and Maintainability of the Change

Decision: Judge the changed artifact in its surrounding context, including what was removed and the complexity a maintainer now inherits. Owns local correctness and structure. Consumer compatibility belongs to `rules/contracts-and-rollout.md`; adversarial paths to `rules/security-and-abuse-paths.md`; concurrent and operational behavior to `rules/runtime-and-resources.md`; claims and written intent to `rules/claims-and-proof.md`.

Use when:
- Logic, conditions, defaults, configuration values, UI states or error paths change.
- Lines, files, dependencies, generated outputs or controls are added, removed, moved or replaced.
- A new helper, wrapper, service, type, factory or shared module appears.
- A document or procedure changes an actionable instruction, order, precondition or exception.

Do:
1. **Read the actual change and its enclosing unit.** For code, read the function and affected callers; for configuration, its merge and override context; for prose, the section and procedure it belongs to. State what makes a changed condition or instruction wrong. Do not confuse understanding the summary with reading the hunks.
2. **Account for removed guarantees.** A deleted guard, permission, field, test, prerequisite or exception was re-established, intentionally retired, or lost. Read moved content at the destination: imports, scope, execution order and surrounding instructions can change its meaning. For a revert, check later changes that now depend on the behavior being undone.
3. **Trace ordinary and boundary cases.** In code: inverted conditions, bounds, absent values versus valid zero or empty input, wrong bindings, fallthrough, stale closures, missing awaits, and changed return or error contracts. In configuration: precedence, unset versus empty, environment substitution and defaults. In procedures: unavailable prerequisites, wrong ordering and what happens after a failed step.
4. **Check error behavior at the owner.** A catch must propagate, recover deliberately or expose degradation to the party that can act. Do not demand logging at every layer. A caller must know whether a returned success means completion, acceptance or partial work. Follow the changed error path through its actual consumers.
5. **Judge structure through concrete maintenance cost.** Read existing helpers and conventions before proposing a new way. Does the change duplicate behavior that must now be fixed twice, mix responsibilities with different reasons to change, invert dependency direction, hide I/O or widen shared state? Does a wrapper reduce what its caller must understand, or merely move the same concepts into more files? Name the callers and likely change affected, not a fashionable principle.
6. **Check whether an abstraction is earned.** A speculative extension point, factory with one meaningful case, catch-all context object or generic type can cost more than it saves. Conversely, do not remove a boundary protecting independent consumers or policy just because it has one implementation. Prefer an existing helper or platform facility when it meets the actual contract. Do not impose arbitrary function-length or duplication quotas.
7. **For a fix, reach the cause.** A guard at one caller can leave sibling callers broken. Compare the proposed repair with the shared invariant; verify that moving it inward would not change unrelated callers' contracts. A broader repair can be necessary, but a review is not permission to apply it.
8. **For UI and mobile changes, inspect observable states.** Loading, empty, error, retry, disabled and repeated actions; focus and keyboard access; screen-reader names; localization and formatting; effects, cleanup and state ownership. Check render or list cost where the interaction makes it relevant. Ask for suitable visual or interaction evidence when behavior cannot be established from source, rather than judging a screenshot as accessibility proof.
9. **For dependencies and generated artifacts, trace the source of truth.** Check manifest and resolved version together, supported runtimes, public exports, type output and install or build hooks. Read the generator or template and a representative output; a generated label is not a waiver. A dependency bump needs the applicable release notes and consumer impact, not only the lockfile diff. Use the security category for provenance and licensing obligations.
10. **Judge a widespread construct as a pattern, not as this instance.** Check whether the shape already exists elsewhere in the repository before filing it. Common and harmless is the house pattern: follow it and file nothing. Common and worth improving is an optional observation that says where else it lives. Common and wrong still gets fixed here, and the other sites are named for a change of their own. A correction whose reach goes beyond this diff gets a vehicle: a separate change, named in the finding, rather than holding this one until an unrelated refactor lands.

Avoid:
- **A style preference promoted to a defect.** Show the violated requirement or concrete maintenance consequence; otherwise make it an optional observation.
- **Assuming a guard exists without opening it**, or accepting a type assertion as external-input validation.
- **Treating every new abstraction, feature flag or dependency as wrong.** Judge its actual job and cost.
- **Using test success to excuse unread changed lines**, or demanding executable code evidence for a prose-only defect.
- **Turning a focused review into unrelated cleanup.** Follow dependencies to answer the scoped question, not to harvest old debt.
- **Accepting unexplained churn as part of the change.** A regenerated lockfile with no manifest change, a formatter or import pass over untouched files, or an editor re-save is its own finding once the description and commits state no reason for it. Read them first: a named security or vulnerability update is a reason, an unstated regeneration is not. Ask for the reason or the split, and do not demand a split of concerns the author already stated and you can read apart.

Example (one instance, not the set):
```
Important: handler:41 treats count=0 as missing and selects the fallback.
The caller accepts zero; the existing type does not exclude it.
Optional: settings:58 wraps the existing reader but adds a second default map.
Both maps need editing for one setting; reuse the reader's existing defaults.
Important: recovery-guide:24 removes the stop-writes prerequisite while the
next step still restores a snapshot over a live writer.
```

Verify:
- Every in-scope hunk has been read in context, including meaningful deletions and generated changes.
- Each candidate identifies the input, state, reader or maintainer that encounters the consequence.
- Relevant callers, existing helpers and counterexamples were checked before recommending a correction.
- New structure and removed controls were judged by their purpose, not by size or preferred syntax.
