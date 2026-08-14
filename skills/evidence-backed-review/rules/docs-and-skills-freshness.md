---
id: evidence-backed-review.docs-and-skills-freshness
owner: evidence-backed-review
canonical: true
severity: default
references: [Documentation as code, Architecture Decision Records]
---

# Docs and Skills Freshness

Decision: Guidance describing behaviour this change alters is updated in the same change.
Stale guidance outranks the code for the next reader who trusts it. Owns prose gone stale
behind a correct change. Code deviating from convention → `rules/standards-conformance.md`.

Use when:

- Prose here still describes behaviour this diff alters.
  - A README or a doc page. An example or a comment.
  - A stated default or command. A described flow.
- The diff alters a convention a repository-local skill or instruction file encodes.
  - Naming or layout.
  - Tooling or a forbidden pattern.
- Documentation is expected where the change lands and none is there.
- A page another team keeps outside this repository still asserts what this diff changes.
  - A usage or support page. A troubleshooting page.
  - A duty procedure.

Do:

- **Update the convention files first, inside this same change.** Left stale, the source of truth
  keeps instructing later contributors to rebuild a rule the code abandoned.
- **Report each stale assertion at exact `file:line`, both sides.** Give the claim, and the code disproving it.
- **Record a decision when all three hold.**
  - It is hard to reverse.
  - It is surprising without the context.
  - A real alternative was rejected.
- **Name in that record the rejected alternative and what was not decided.** The next reader then
  neither reopens settled ground nor assumes open ground closed.
- **Report expected-but-absent documentation as a finding.**
- **Report a page beyond this repository the same way.** Whoever owns it edits it. Name one you
  cannot reach from here, because unreachable is never a reason to stay quiet (`rules/external-sources.md`).

Avoid:

- **Accepting "docs in a follow-up"** for a convention file read on every session.
- **A decision record for an ordinary implementation choice** that is reversible and unsurprising, with no real alternative.
- **A staleness finding carrying only the document's line**, with no code line proving it stale.

Exceptions:

- Generated documentation is not its own finding. The stale generator is.
- A document deliberately describing a past release is not stale.

Example (one instance, not the set):
```text
Retries removed from the shared client; callers supply their own policy.
  <convention file>:41  "clients retry idempotent GETs three times"
  <client>:88           retries removed; policy is the caller's
Stale doc: <readme>:120 "requests are retried automatically" vs <client>:88
Decision: caller-driven retries; per-route config rejected.
  NOT decided: whether the gateway keeps its own retries.
```

Verify:

- **Search the docs, instruction, and skill files for every changed identifier.** Do the same for
  every changed flag, command, and default. Then search every declared source. Update each hit here or report it.
- **Confirm the encoding file appears in the diff** whenever a convention changed.
- **Read the produced findings.** Each one names two `file:line`, the assertion and the refutation.
