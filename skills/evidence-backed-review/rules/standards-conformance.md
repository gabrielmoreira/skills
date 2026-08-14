---
id: evidence-backed-review.standards-conformance
owner: evidence-backed-review
canonical: true
severity: default
references: [Refactoring code smells, style-guide authority precedence]
---

# Standards Conformance

Decision: Only a documented standard makes a hard violation, and the finding cites that
standard's file and rule. A standard the organisation keeps outside this repository is
documented too, reached through `rules/external-sources.md`.

Where no document covers it, a smell baseline still applies. Each baseline observation is a
labelled judgement call ("possible X"), never a violation. Owns code deviating from written
convention. Neighbours:

- Size → `rules/scope-and-slicing.md`.
- The ask → `rules/spec-conformance.md`.
- Stale prose → `rules/docs-and-skills-freshness.md`.
- A surface a caller can abuse → `rules/security-and-abuse-paths.md`.
- Whether the changed lines work → `rules/correctness-in-the-diff.md`.

Use when:

- New code departs from a pattern this repository uses or has written down.
- New code departs from one the organisation documents elsewhere.
- The change adds a second way to do something the repository already does.
- A shape in the diff looks like a smell and no repository document endorses it.

Do:

- **Read the standard first.** Drop any baseline observation that standard endorses.
- **Cite file plus rule for a hard violation.** Name the smell and quote the hunk for a baseline one.
- **Match the diff against the baseline, each as "possible X".** These illustrate the shape. They are not the set.
  - A duplicated logic shape.
  - A primitive standing for a domain concept.
  - One change forcing scattered edits.
  - An abstraction for a need this change lacks.
- **Detect redundancy by domain concept, never by textual similarity.** Say where you looked.
- **Apply the deletion test.** If removing it breaks nothing observable, it should not exist.

Avoid:

- **Re-reporting what the declared lint, format, or type-check command enforces.**
- **Citing "best practice"** where a file and rule should be.
- **Reading a shape as a defect** before checking what already handles it.
- **Accepting a new convention beside the existing one.** A second convention is itself the defect.

Exceptions:

- When the diff amends the standard itself, review the amendment, not the replaced rule.

Example (one instance, not the set):
```
Important: <errors standard> §3 "exported functions return a typed Result":
<charge>:41 throws a bare Error.
Optional: possible primitive obsession: <charge>:12 takes `currency: string`
where Currency exists; undocumented, so a judgement call.
```
Verify:

- **Run the declared lint and type-check commands.** Drop what they report.
- **Search for the document backing each hard violation**, here and in every declared source.
- **Turn each unbacked one into a judgement call.**
- **Read the report.** Hard findings carry file and rule. Baseline ones carry "possible" and a hunk.
- **Confirm each "already exists" claim names the concept searched.**
