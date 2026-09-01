---
id: make-the-docs-trustworthy.match-the-existing-shape
owner: make-the-docs-trustworthy
canonical: true
severity: default
references: [local consistency, convention over configuration, naming scheme]
---

# Match The Existing Shape

Decision: New written material continues the location, numbering, headings, and file extension
already in use.

- **A directory or file is created only when there is something to write in it now.**
- **A second scheme splits the set.** Neither half is then the place a reader looks.
- **What you should see is a new entry that sorts and reads like its neighbours.**
- **What you should not see is a scheme chosen silently where two already disagree.**
- **Owns fitting into what is already there.** Which single place the fact belongs in at all
  → `rules/one-place-for-a-fact.md`.

Use when:

- A file or directory is about to be created for written material.
- The existing material carries a numbering, prefix, or date scheme.
- Two existing files answer the same structural question differently.

Do:

- **Open two or three neighbours before writing.** Read where they sit, how they are named and
  numbered, their heading depth, their extension.
- **Continue the scheme down to the boring parts.** Zero padding, separators, frontmatter keys,
  heading capitalisation.
- **Report the conflict with both paths where the material contradicts itself** about its own scheme
  Pick nothing silently.
- **Create a directory in the same change that puts the first real file into it.**
- **Add to the location whose entries answer the same kind of question.** That is the tiebreak where
  more than one could hold the material.
- **State the scheme you are starting where none exists yet.** Give the range it applies to.

Avoid:

- **An empty directory holding a placeholder for a later change**, which every reader has to open once to learn it holds nothing.
- **A second numbering series started because the first looked inconsistent**, so both are now wrong and neither can be trusted to be complete.
- **One file introducing a new extension or frontmatter shape for the set**, which breaks whatever reads the set as a set.

Exceptions:

- A scheme that cannot express the new material is replaced wholesale. Do it in one change, migrating
  every existing entry. A partial migration is the split it was meant to avoid.

Example (one instance, not the set):
```
Neighbours opened first: 0006-<topic>, 0007-<topic>, 0008-<topic>
  4-digit zero pad, hyphen separator, one top-level heading
  frontmatter keys: date, status
New entry 0009-<new-topic>: same padding, same separator, same two keys.
Conflict found and reported, nothing picked silently:
  <records>/0012-<topic>   padded, carries status
  <records>/12-<topic>     unpadded, no status
```

Verify:

- **List the directory.** The new entry sorts and reads like its neighbours.
- **Compare the new file's frontmatter keys and heading levels against an existing one.**
- **Read the output.** Any scheme conflict found appears with both conflicting paths.
