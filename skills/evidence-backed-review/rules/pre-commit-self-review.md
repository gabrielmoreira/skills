---
id: evidence-backed-review.pre-commit-self-review
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [Definition of done, Red-green-refactor, Conventional commit messages]
---

# Pre-Commit Self-Review

Decision: Reshaping is nearly free before publication and expensive after. So on your own
change the axes run in order of how much they can still move, not in the reader-facing order.
Owns that ordering principle only. Every axis stays owned by the sibling it names, starting
with shape at `rules/scope-and-slicing.md`.

Use when:

- You are about to commit, or to hand the change to a reviewer.
- The working tree carries edits from more than one sitting.
- You are about to write "done", "should work", "the linter passed", or "looks good".

Do:

1. **Rank each axis by what it can still change.** Then run it in that rank.
2. **Run shape first**, because it moves whole hunks.
   - `rules/scope-and-slicing.md`, which also decides what an uncontained edit does.
3. **Run content next**, because it rewrites lines.
   - `rules/motivation-and-necessity.md`.
   - `rules/standards-conformance.md`.
   - `rules/external-sources.md`.
   - `rules/spec-conformance.md`.
4. **Run record last**, because it only describes what landed.
   - `rules/docs-and-skills-freshness.md`.
   - `rules/dependent-teams.md`.
5. **Place an index row not named here by that same test.**
6. **Run the declared test and build commands after every axis that moved code.** Each one
   invalidates the last run. Read the exit code and the failure count off a fresh complete run.
7. **Record a Gap for a regression test never seen failing while the fix was absent.** Only a seen
   failure earns the claim. Do not manufacture that observation by undoing the fix; this rule reports.
8. **Produce the actions in the order the axes raised them.** Add a draft description.
   - The claim.
   - Its source.
   - The alternative rejected.
   - What is out of scope.
   - The recipients `rules/dependent-teams.md` scopes.

Avoid:

- **Deferring a fix you could make inside this change.** It costs a rebase.

Exceptions:

- A declared throwaway spike nobody consumes may stop after the shape axis. It must not merge.

Example (one instance, not the set):
```text
Draft description
  Claim: tier read from the order, so a mid-session change cannot mis-price.
  Source: incident report, two mis-priced carts.
  Rejected: refreshing the session, the stale window stays open.
  Out of scope: duplicated tier lookup in reporting.
```
Verify:

- **Confirm the recorded exit code and failure count came from this session's complete run.**
- **Read the draft description.** Claim, source, rejected alternative, and out-of-scope are all present.
- **Check no axis that can move code ran after the verification command.**
