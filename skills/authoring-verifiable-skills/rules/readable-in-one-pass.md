---
id: authoring-verifiable-skills.readable-in-one-pass
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [shape measurements against two most-used reference collections]
---

# Readable In One Pass

Decision: **Shape carries readability, not vocabulary, so a reader who reads only the bold lead-ins MUST still get the argument.** Whether a file holds one decision belongs to `rules/one-rule-one-decision.md`.

Use when:
- **A file reads as a wall**, even though every sentence in it is correct.
- **A paragraph lists things** joined by "and", "or", or a semicolon.
- **A file has no bold spans**, so there is nothing to skim to.
- **Sentences carry four or five commas each.**
- **A file is being compressed**, which is where shape is usually lost first.

Do:
- **Open every bullet and every paragraph with a bold lead-in**, then the detail.
- **Turn a listing paragraph into a list.** Items joined by "and", "or", or a semicolon are rows. This is most of the work.
- **Bold the lead-in only**, roughly one bold span per 25 words.
- **Give sub-items one convention:** a capital and a full stop. They are items, not continuations of the line above.
- **Keep the blank line before every heading and every fenced block.**
- **Hold the measured targets.** Prose under 40 percent. Bullets 40 or more in a router and 12 or more in a rule. Bold spans 20 or more in a router and 4 or more in a rule. Clauses per sentence under 1.2. Longest paragraph under 60 words.
- **Prefer the plain word.** The reader may not have sophisticated English, and nothing here needs it.

Avoid:
- **Bolding whole sentences.** Where everything is bold, nothing is.
- **Reaching for shorter words to fix density.** Measured against the two most-used collections, this collection already used shorter words and fewer abstract nouns and still read heavier. Shape was the whole difference.
- **Stripping blank lines to fit a line ceiling.** That buys line count and costs exactly the skimmability the ceiling exists to protect.
- **A sentence that packs five items behind commas.** Split it, which costs almost no words and removes four clause marks.

Exceptions:
- **A code example MAY be dense.** It is bounded by the read budget rather than by the prose targets.

Example (one instance, not the set):

Before, one sentence with five clause marks:

```md
- Log at meaningful boundaries: operation outcomes, branch decisions, retries, external calls, and failures.
```

After, the same words as rows:

```md
- **Log at meaningful boundaries.**
  - Operation outcomes.
  - Branch decisions that matter operationally.
  - Retries and fallbacks.
  - External calls.
  - Failures.
```

Verify:
- **Run the shape script and read the output**, in that order.
- **Read the bold spans alone.** If the argument survives, the shape works.
- **Distrust a metric written to score the rewrite it is scoring.** Three separate defects in that scorer each made a file look better without being better, and reading found every one of them while the suite found none.
