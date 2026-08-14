---
id: debugging-by-evidence.probing
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [single-variable experiment, tracer tokens, instrumentation hygiene]
---

# Probing

Decision: One probe tests one named prediction and moves one variable. Its
result then has one reading. Every probe carries a tag unique to the run, so
removal is one search.

- **You should see a tag count that matches the probes you placed.** You should not see instrumentation outliving its candidate.
- **Owns instrumentation mechanics.** Producing and ranking the predictions a probe tests → `rules/rival-hypotheses.md`. Removing an element from the loop rather than adding an instrument to the code → `rules/minimising.md`.

Use when:

- **You are about to add a log line, a breakpoint, or a temporary edit.**
- **A probe already in the tree answers a question you no longer have.**
- **You want to change an input and add an instrument in the same run.**

Do:

1. **Name the candidate and its prediction before writing the probe.** A probe with no prediction prints output nobody can score.
2. **Tag every inserted line with one token unique to this run.** One search then returns all of them at removal time.
3. **Print the value, its type, and object identity where sharing is in question.** A bare value hides aliasing.
4. **Keep the probe read-only until the cause is `EXPLAINED`.** A probe is the only write on the table, and one that alters behaviour has spent the signal it was placed to read.
   - No changed return.
   - No reordered call.
   - No swallowed error.
5. **Move one variable per run.** Changing the input and the instrument together makes the difference unattributable.
6. **Remove a candidate's probes in the same run that kills the candidate.**

- **Capture what a probe printed. Never recall it.** A remembered result is a hypothesis wearing an observation's clothes.
- **Never route around a surprise.** Something unexpected is captured, noted, and then judged: it is either the cause or a second bug, and both matter.

Avoid:

- **Keeping a probe because it might be useful later.**
- **Printing inside an unbounded loop.** 10000 lines bury the one that matters.
- **Reusing a tag from an earlier run**, which makes removal ambiguous.

Example (one instance, not the set):

```
// PROBE-4f2a  candidate 2: discount read from a stale cache entry
log("PROBE-4f2a", entry.value, typeof entry.value, entry === cached)
```

Verify:

- **Search the tree for the tag.** The count matches the probes you placed.
- **Read each probe against the candidate it names.** An unnamed probe is a fishing trip.
- **Check the diff for one variable moved per recorded run.**
