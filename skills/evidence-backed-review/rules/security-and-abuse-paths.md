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

1. **Name the identity each changed route or handler trusts.** Name the object it returns. Then
   read whether that object is scoped to that identity. An authenticated caller reaching another
   caller's record is the finding. A credential check never shows it.
2. **Trace each user-controlled value from entry to use.** Cite the line where it is validated or
   encoded. Untraced is a Gap, not a pass.
3. **Walk one abuse path per changed surface.** Name the invariant it breaks. These are illustrative, not the set.
   - The same request with a substituted identifier.
   - A state transition taken twice.
   - A retry after a failure.
4. **Read a credential-shaped literal against what produced it.** Three shapes are not secrets
   Name which one it is rather than dropping it silently.
   - An example value.
   - A marked test credential.
   - A checksum.
5. **Report a Critical before the remaining axes.** A reader who stops early still sees it. Name
   rotation as the next action, and never perform it.

Avoid:

- **A dismissal resting on the presence of a login.**
- **Dismissing constrained user input without naming the guard you read.** The constraint may be
  a type, a parameterised query, or an upstream caller.
- **Accepting a framework default as the authorization check**, without reading what it checks.
- **Passing over an error message.** Say what it discloses about identity, path, or query shape.

Example (one instance, not the set):
```
Critical: <route>:34 loads the record by the id in the path and checks only
that a session exists. A signed-in caller substituting another id reads it.
  Guard read: the middleware at <auth>:20 authenticates and stops there.
Gap: the upload at <upload>:12 is size-limited; no line validates type.
  Next: read what the storage layer does with a mismatched content type.
```
Verify:

- **Confirm each changed route names its trusted identity and returned object.**
- **Check each user-controlled value has a validating line**, or a stated Gap.
- **Read each dismissal.** It names the guard read, not the absence of a worry.
