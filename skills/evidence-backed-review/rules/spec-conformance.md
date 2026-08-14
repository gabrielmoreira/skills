---
id: evidence-backed-review.spec-conformance
owner: evidence-backed-review
canonical: true
severity: default
references: [acceptance criteria review, plan-alignment review]
---

# Spec Conformance

Decision: Judge the change against the requirement that caused it. Find that requirement.
Never infer it. A change can be conventional and still not be the thing that was asked for.
Owns the ask. Why the ask exists → `rules/motivation-and-necessity.md`. Whether the code
follows written convention → `rules/standards-conformance.md`.

Use when:

- A requirement, spec, or decision record covers this range.
- The diff implements behaviour you cannot trace to a request.
- Delivered behaviour has to be compared with what was requested.

Do:

1. **Find the originating requirement.** First hit wins, in this order.
   - A path the user supplied.
   - The commit messages, where commits exist.
   - Otherwise the branch name and the task the author stated.
   - A spec or decision record matching the branch or feature.
   - A requirement a declared source holds (`rules/external-sources.md`).
2. **Ask the user when that search returns nothing.**
3. **Record "no specification available" as a Gap when the user says none exists.** Stop this
   axis. Acceptance criteria you invent are not the ask.
4. **Sort findings into three buckets and report them separately.**
   - Required behaviour missing or partial.
   - Behaviour present that was never asked for. That is scope creep.
   - Behaviour that looks implemented but is implemented wrongly.
5. **Quote the requirement line beside every finding.**
6. **Name the proof offered for each delivered behaviour, and what that proof establishes.**
   Weigh proof against the risk the change carries. Never count it. Each of these is itself the finding.
   - A test asserting only that nothing threw.
   - A test exercising a mock where the risk is the real path.
   - No test at all.
7. **Keep convention and specification as two verdicts.** Never merge them and never rerank
   them. Merging lets one mask the other.
8. **Approve a full mode once no Critical or Important finding remains.** Open Optional and Nit
   findings do not hold it.

Avoid:

- **Blocking because you would have written it differently.**
- **Reading acceptance criteria off the diff or the change's own tests.**
- **Treating the tests in the diff as a surface.** They are the author's evidence for the claim, not an independent check of it.

Example (one instance, not the set):
```
Missing: <spec>:18 "a failed charge must be retryable": <charge>:41 returns
void on failure and nothing exposes a retry.
Scope creep: no requirement mentions conversion; <convert>:1 is unasked.
Wrong: <spec>:24 "idempotent per request id": <charge>:55 keys on timestamp,
so a retry double-charges.
```
Verify:

- **Confirm the cited requirement is reachable where step 1 looked.**
- **Read the report.** Every finding quotes a requirement line.
- **Check the three buckets stayed separate.**
- **Check the two verdicts appear unranked against each other.**
