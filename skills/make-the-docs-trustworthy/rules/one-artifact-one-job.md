---
id: make-the-docs-trustworthy.one-artifact-one-job
owner: make-the-docs-trustworthy
canonical: true
severity: default
references: [separation of concerns, information architecture, cohesion]
---

# One Artifact One Job

Decision: A file holds one kind of content, statable in a single line with no "and".

- **Whatever fails that line moves to the file whose line already covers it.**
- **A file carrying a second job is found by neither audience.** It is edited confidently by people
  who never read the other half.
- **Size is a symptom of a missing home, not the disease.** Splitting a bloated file without finding
  the home yields several bloated files.
- **Owns a file whose job cannot be stated.** An individual sentence inside it asserted to be untrue
  → `rules/staleness-without-a-diff.md`.

Use when:

- A file's name predicts a fraction of what is inside it.
- Two people describe the same file's purpose differently.
- Content landed in a file because it was open, not because it belonged.

Do:

- **Write the one line first.** "This file holds X". Needing "and" means the file holds two jobs.
- **Name the destination before cutting anything.** Move the failing content to the file whose one
  line already covers it.
- **Create a new file only where no existing line covers the content**, following
  `rules/match-the-existing-shape.md`.
- **Move the content's inbound links with it.** Leave no copy at the origin.
- **Delete content that has no audience at all** rather than rehousing it.
- **Merge two files that each hold half of one job.** Fragmentation costs a hop on every read, and
  hides half the answer.

Avoid:

- **Splitting by length into a part one and a part two.**
- **A file named for one topic that also carries setup steps, release notes, and a glossary.**
- **Leaving a stub at the origin that repeats the moved content's opening paragraph.**

Exceptions:

- An entry point whose one job is routing holds pointers to everything. Length there is not a symptom
  of a second job.

Example (one instance, not the set):
```
<setup-guide>. The one line, attempted:
  "holds the install steps AND the release notes AND the glossary"
Three jobs. Destinations named before anything was cut:
  release notes -> <changelog>, whose line already covers them
  glossary      -> <terms>, whose line already covers it
  install steps stay. The line is now "holds the install steps".
Inbound links moved with the content. No stub left at the origin.
```

Verify:

- **State the one line for each touched file.** No "and", no "misc", no trailing "etc".
- **Search the moved headings.** Each appears once, at the destination.
- **Open every inbound link to the moved content.** It still resolves.
