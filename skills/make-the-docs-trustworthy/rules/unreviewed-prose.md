---
id: make-the-docs-trustworthy.unreviewed-prose
owner: make-the-docs-trustworthy
canonical: true
severity: hard-gate
references: [provenance tracking, source criticism, peer review]
---

# Unreviewed Prose

Decision: A document carries weight only once a human has read it.

- **A citation is either re-derived from the system, or labelled unreviewed where it is used.**
- **Agent-written prose accumulates faster than any other kind and is trusted first.** That turns one
  wrong sentence into a convention nobody chose.
- **What you should see is a provenance label on every citation.**
- **Owns whether a document may be leaned on as a source at all.** Whether its individual sentences
  are still true → `rules/staleness-without-a-diff.md`.

Use when:

- A choice is being justified by a document rather than by the system.
- Material cited as authority was generated, with no review or approval visible on it.
- A convention is asserted and the only evidence offered is a page.

Do:

- **Establish provenance before weight.** Human-authored or human-approved carries weight. Generated
  carries none until re-derived.
- **Re-derive the cited claim.** Run it, read the source, check the identifier.
- **Or label the citation unreviewed in the output.**
- **Mark generated prose as generated on the page**, at the moment it is written.
- **Drop the unreviewed page when it conflicts with a reviewed one.** It loses without further argument.
- **Treat descent as inherited status.** A page whose only source is an unreviewed page is itself
  unreviewed, however many times it has been repeated.

Avoid:

- **Quoting an unreviewed page as authority and naming no other evidence.**
- **Counting three pages that descend from one generated original as corroboration.**
- **Dropping the unreviewed label once the claim has been restated a few times.**

Exceptions:

- Generated material cited as raw evidence rather than as authority carries no review status: a
  listing, a captured output. It is an artifact, not a claim.

Example (one instance, not the set):
```
Cited: <conventions-page> says handlers must not call the store directly.
  provenance   generated; no review mark anywhere on the page
  re-derived   read the handlers: 9 of 11 call the store directly
Reported as unreviewed, and refuted by the code it claims to describe.
Descent: <team-notes> repeats it and cites only <conventions-page>.
         Also unreviewed. Two pages, one origin, no corroboration.
```

Verify:

- **Read each citation in the output.** It is marked reviewed, re-derived, or unreviewed.
- **Name the command or the file that confirmed each re-derived claim.**
- **Trace one cited page back to its origin.** Report the chain when it terminates in unreviewed material.
- **Read the output again.** No convention is attributed to a page whose provenance goes unstated.
