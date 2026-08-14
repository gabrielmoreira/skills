---
id: make-the-docs-trustworthy.one-place-for-a-fact
owner: make-the-docs-trustworthy
canonical: true
severity: hard-gate
references: [single source of truth, canonical reference, link-and-edit]
---

# One Place For A Fact

Decision: A fact is stated in exactly one piece of prose, and every other place links there.

- **Two copies do not make it twice as findable.** They drift and disagree, and neither is marked as the loser.
- **What you should see is one statement and any number of links.**
- **Owns duplication between two pieces of prose.** A duplicate of an artifact that already renders
  the fact → `rules/restatement-is-drift.md`.
- **Where the one place sits, and what it is called** → `rules/match-the-existing-shape.md`.

Use when:

- A sentence about to be written states a fact you did not invent.
- The same fact appears in two documents and they disagree.
- Someone asks which of two pages is the authoritative one.

Do:

- **Search on the distinctive tokens.** Identifiers, numbers, flags, error strings, proper nouns
  Never the topic word, which returns everything.
- **Search again for the concept, and say where you looked.** A token search that returns nothing is
  not a clear. The same fact in other words survives it.
- **Edit the occurrence you hit until it is right.** Link the second place to it by path and heading.
- **Pick the one place by who reads it first** at the moment the fact matters. Never by which file is
  already open.
- **Keep one sentence of orientation in the second place.** Link for the rest.
- **Resolve two disagreeing copies against the system before merging them.** Merging two wrong
  statements produces a third.
- **Delete the losing copy in the same change.** A copy left behind is the one the next reader finds.

Avoid:

- **Copying a paragraph so that a page "reads standalone".**
- **Writing a new page to answer a question the search would have answered.**
- **Keeping both copies under a "see also".** That names no source.

Exceptions:

- Material published to readers who cannot reach the one place may carry a full copy. It names the
  source it was cut from, and when.

Example (one instance, not the set):
```
Fact to write: the retry ceiling is 5 attempts.
  token search "5 attempts"      1 hit, <operations-guide>, heading "Retries"
  concept search "retry limit"   0 further statements; where I looked is recorded
Edited that one occurrence until it was right.
<onboarding-guide> now links to <operations-guide> "Retries" and states no number.
Post-edit count on "5 attempts": one statement, one link.
```

Verify:

- **Search the distinctive token after the edit and count the hits.** More than one statement of the
  fact means the change is unfinished.
- **Open every added link.** It resolves to a heading that actually states the fact.
- **Read the second place alone.** It points, and asserts nothing the first place owns.
