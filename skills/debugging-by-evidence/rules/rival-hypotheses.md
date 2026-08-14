---
id: debugging-by-evidence.rival-hypotheses
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [strong inference, falsifiability, differential diagnosis]
---

# Rival Hypotheses

Decision: Write 3 to 5 ranked explanations before testing any of them. Each
carries the observation that would kill it. One explanation is anchoring, and
every later result gets read as confirming it.

- **You should see a list where every entry can die.** You should not see one hypothesis under test.
- **Owns producing, ranking and striking candidates.** Running an instrument against one named candidate → `rules/probing.md`.

Use when:

- **An explanation arrived within seconds of reading the failure.**
- **You are about to check the first thing that came to mind.**
- **The loop is red and no candidate list exists yet.**

Do:

1. **Write 3 to 5 candidates across layers:** the changed code, its inputs, its dependencies, the environment, the loop itself.
2. **Include one divergence candidate before inventing others.** Divergence is the most common cause of a failure outside where you look.
   - Two paths that should agree and do not.
   - A stub standing in for the real call.
   - Cached against fresh.
   - One branch of a copied pair edited, the other not.
3. **Make them rivals.** Two candidates that can both hold are separated by no single observation. Split or merge them until each excludes the others.
4. **Give each one line: if this is the cause, then `<observation>`.** Seeing `<the opposite>` kills it.
5. **Strike any candidate carrying no falsifying observation.** It is a story, and it survives every test you run.
6. **Rank by how cheaply the falsifying observation can be made.** A 1-minute check on the third candidate runs before an hour on the first.
7. **Cross each dead candidate off with the observation that killed it.** Keep it in the report rather than deleting it.

Avoid:

- **Filling the list with rewordings of one idea.** Three phrasings are one candidate.
- **Ranking by plausibility**, which rebuilds the anchor the list exists to break.
- **Adding a candidate after a result arrives** to fit that result.

Exceptions:

- **A symptom whose loop already names an exact line and value may carry 2 candidates.** Below 2 there is no comparison.

Example (one instance, not the set):

```
1 Rounding applied twice in the total helper.
  Dead if a single-item cart also comes out low.
2 Discount read from a stale cache entry.
  Dead if the first request after a cold start is also wrong.
3 Conversion uses the request locale, not the order locale.
  Dead if both locales match in the failing run.
Struck: "something off in the totals", nothing would falsify it.
```

Verify:

- **Count the candidates.** Under 3 or over 5 is out of band.
- **Read each line for a stated observation that would kill it.**
- **Check the first candidate tested was the cheapest to falsify**, not the first written.
