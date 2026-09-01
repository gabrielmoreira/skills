---
id: evidence-backed-review.security-and-abuse-paths
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [threat modelling by trust boundary, object-level authorization, taint tracking]
---

# Security and Abuse Paths

Decision: Establishing who the caller is does not establish what they may reach. The defect
that survives review is a valid-looking request from a real identity. It arrives at someone
else's object. Owns whether the change can be abused. Code departing from a written
convention → `rules/standards-conformance.md`.

Use when:

- The diff touches authentication, a permission or role check, or an ownership lookup.
- A user-controlled value reaches one of these.
  - A query or a path.
  - A command or a template.
  - An outbound address.
- The change adds an upload, a new external call, or a credential-shaped literal.

Do:

1. **Check house patterns first.** Audit against this repository's established authorization, sanitization, and guard conventions before applying generic external categories.
2. **Name the identity each changed route or handler trusts.** Read whether returned objects are scoped to that identity. An authenticated caller reaching another caller's record is the finding.
3. **Trace each user-controlled value from entry to sink.** Cite the line where it is validated or encoded. Untraced is a Gap, not a pass.
4. **Walk one concrete abuse path per changed surface.** Name the invariant it breaks (substituted identifier, replayed transition, unmetered retry).
5. **Apply the security confidence bar and false-positive catalogue.** Distinguish confirmed exploit paths from speculative risks; catalog known safe shapes (example values, marked test fixtures, public checksums/hashes).
6. **Report a Critical before remaining axes.** Name rotation as the next action, and never perform it.

Avoid:

- **A generic threat model applied over the repository's own patterns**, so the finding names a boundary this system does not have.
- **A speculative finding with no path from user input to an unguarded sink.** Taint tracking is what separates a finding from a worry, and a worry costs the author a day.
- **A dismissal resting on the presence of a login.** Authentication says who is calling; object-level authorization says whether they may touch this row.
- **Dismissing constrained user input without naming the guard you read.**
- **Accepting a framework default as the authorization check** without reading what it actually checks.

Example (one instance, not the set):
```
Critical: <route>:34 loads the record by the id in the path and checks only
that a session exists. A signed-in caller substituting another id reads it.
  Guard read: the middleware at <auth>:20 authenticates and stops there.
Gap: the upload at <upload>:12 is size-limited; no line validates type.
  Next: read what the storage layer does with a mismatched content type.
```
Verify:

- **Confirm house security patterns were checked before external lists.**
- **Verify every reported finding clears the confidence bar with an end-to-end path.**
- **Confirm each changed route names its trusted identity and returned object.**
- **Check each user-controlled value has a validating line, or a stated Gap.**
- **Read each dismissal.** It names the guard read, not the absence of a worry.
