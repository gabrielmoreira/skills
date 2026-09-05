---
id: authoring-verifiable-skills.order-and-strength
owner: authoring-verifiable-skills
canonical: true
severity: default
references: [RFC 2119 keyword strength, measured ceremony escalation under absolute phrasing]
---

# Order And Strength

Decision: **A reader who stops after the first item SHOULD have got the most valuable thing in the file, and an uppercase keyword MUST mean what it says.**

Use when:
- **A file is ordered by the sequence the author thought of things.**
- **Every line is marked MUST**, so nothing tells the reader where judgement is allowed.
- **A router, an index, or a `Do:` block is being written or reordered.**
- **A rule has no latitude anywhere in it.**

Do:
- **Order by expected impact, highest first.** Router sections, gate rows, bullets inside a block.
- **Estimate impact as how often it fires multiplied by what it costs when missed.** A rule that fires rarely and prevents unrecoverable loss outranks one that fires constantly and prevents a nit.
- **Say which of the two you weighted** when the order is not obvious.
- **Let dependency win where it is real, and only there.** A mode chosen before work begins, a range resolved before anything is read. Name those, and let the rest fall by impact.
- **Budget the keywords.** At most two or three MUSTs in a rule.
- **Give every rule at least one SHOULD or MAY.**
- **Pick the keyword for the cost of violation. Which form repairs which failure is measured in `optimising-skills`**, where a prohibition beats a recipe on a rule broken under pressure and loses to it on output of the wrong shape.

| Keyword | Means | The reader may |
| --- | --- | --- |
| MUST, MUST NOT, NEVER | non-negotiable; the rule fails without it | not decide otherwise |
| SHOULD, SHOULD NOT | the default; a stated reason overrides it | override, and say why |
| MAY | genuine latitude | choose freely |

Avoid:
- **Marking everything MUST.** The value is in the contrast, and it is measurable: an absolute phrasing pushed a model to apply full ceremony to a small task five times out of five, while the same task with no guidance at all was classified correctly five times out of five.
- **A keyword used for emphasis** rather than for strength.
- **A rule with no latitude at all.** A decision nobody may vary is a fact, and facts belong in a table.
- **Recording the order the work happened in.** That order is invisible to the author and expensive for every later reader.

Exceptions:
- **A reference sequence MAY follow execution order** rather than impact, provided the highest-impact statement sits at the top where the reader meets it first.

Example (one instance, not the set):

```md
- **You MUST NOT discard work to make an operation succeed.**
- **You SHOULD stop after five attempts** and report no signal instead.
- **You MAY read state freely.**
```

Verify:
- **Read only the first item of each block.** If it is not the most valuable one, reorder.
- **Count the MUSTs.** Past three in one rule, the strength has stopped carrying information.
- **Find the SHOULD or MAY.** Its absence means the scope is wrong.
