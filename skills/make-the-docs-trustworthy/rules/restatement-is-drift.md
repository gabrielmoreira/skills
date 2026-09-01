---
id: make-the-docs-trustworthy.restatement-is-drift
owner: make-the-docs-trustworthy
canonical: true
severity: hard-gate
references: [generated reference, self-documenting artifacts, pointer indirection]
---

# Restatement Is Drift

Decision: Prose never restates what an artifact already renders.

- **The artifact changes without the prose, and the copy becomes a confident lie.**
- **Write the pointer, and keep only what cannot be found by looking.**
- **Owns duplication of a machine-readable source.** A manifest, a configuration file, a generated
  region, a command's own help.
- **Duplication between two pieces of prose** → `rules/one-place-for-a-fact.md`.
- **The unwritten reasons no artifact carries, and so must be written**
  → `rules/record-what-code-cannot-show.md`.

Use when:

- A paragraph lists flags, defaults, versions, keys, or a directory layout that a file or command
  already emits.
- Text sits inside or beside a generated region.
- A procedure step spells out what running one named command would print.

Do:

- **Replace the copy with the exact path, command, or query that produces it.**
- **Keep the sentence that carried something extra.** A caveat, an ordering, a reason it is that way.
- **Drop the rest of the paragraph.**
- **Edit the generator for a generated region.** Name which generator owns it.
- **Add one sentence where a pointer alone strands the reader.** Name what to look for in the output,
  not the output itself.
- **Fix the artifact when it is unreadable to the reader who needs it.** Prose that compensates for
  bad help text hides the defect.

Avoid:

- **A table of keys and defaults mirrored from the configuration file**, which is correct on the day it is written and wrong from the next change onward.
- **Usage text pasted under a heading called "Usage"**, so the documented flags and the real ones part company silently.
- **Hand-editing inside a generated block** because it was faster than editing the generator, which the next generation quietly discards.

Exceptions:

- Output quoted as evidence of a trap is not restatement. Label it with what produced it, and when it
  was captured.

Example (one instance, not the set):
```
Before  a 14-row table of keys and defaults, copied from <config-schema>
After   "The keys and their defaults live in <config-schema>. Read the timeout
        group first: the three settings there interact."
Kept    the one caveat the table carried, that timeout is per attempt, not total
Dropped the 14 rows. Adding a key to <config-schema> now needs no edit here.
```

Verify:

- **Compare each retained value against the artifact it came from.** An exact match is a copy, and goes.
- **Run the named command, or open the named path.** It yields what the pointer promises.
- **Add one option to the artifact in your head.** A produced page that would then need an edit shows
  the pointer was not written.
