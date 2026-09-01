# What each tool answers

Twenty-one scripts is more than anyone remembers, and four of them had produced
a real finding that nobody could have found again. This is the index, grouped by
the question the tool answers rather than by what it is called.

## The gate: run before every change lands

`check-all.mjs` runs the rest and is the only one you need by hand.

| tool | answers |
| --- | --- |
| `verify-skill.mjs` | does every skill hold the structural invariants |
| `mutate-skill.mjs` | does each check fire for its own reason, or is it passing by luck |
| `check-yaml-parity.mjs` | does our frontmatter parser agree with a real one |
| `readability.mjs` | is any unit past the size a reader can hold |
| `route-baseline.mjs` | how many scenarios a router with no understanding already solves |
| `split-activation.mjs` | which half of the scenarios is held out from tuning |

A green gate proves structure and instrument integrity. It says nothing about
whether the skills change behaviour; that is what the next group is for.

## Measuring behaviour

| tool | answers |
| --- | --- |
| `run-activation.mjs` | with the skill against without it, on recorded runs |
| `omp-eval-profile.mjs` | an isolated profile, so a run measures the skill and not the machine |
| `judge.mjs` | did the answer meet the scenario's criteria — calibrated first, always |
| `outcome-check.mjs` | did the artifact get better, judged by a program rather than a model |
| `explain-run.mjs` | which failures in a run are worth reading, by confidence band |
| `fold-variant.mjs` | builds the other arm when an architecture is being compared |

## Measuring the collection itself

Each of these produced a conclusion that changed a decision. The finding is
recorded beside the tool so a reader knows what it already told us.

| tool | answers | what it found |
| --- | --- | --- |
| `work-sessions.mjs` | what real work sessions actually do | the token profile was wrong by 4.6x; reach per hop is 75% then 74% |
| `missed-activation.mjs` | where a skill should have fired and did not | activation was understated 20x by deployment window and sub-sessions |
| `model-cost.mjs` | what a model costs on our traffic, not on its price list | a skill is 4.7% of an activation, so compression saves cents |
| `scenario-balance.mjs` | positives against negatives, per skill | some topics have no negatives at all |
| `compression-headroom.mjs` | how much could be removed without losing content | 15% ceiling; only 3% of the corpus is repeated text |
| `depth-economics.mjs` | what a level of depth costs and delivers | read the reach column; the cost half is 0.3% of a bill |
| `rule-anatomy.mjs` | does a rule carry a smell, a consequence and a technique | 238 names are declared in `references:` and used nowhere |
| `scenario-confidence.mjs` | how much a scenario's result deserves to be believed | most of the corpus scores low, so single results are weak |
| `word-frequency.mjs` | which words the collection leans on | a vocabulary check, no standing conclusion |

## Two that can destroy something

`fold-variant.mjs` deletes its `--out` directory before rebuilding it. It refuses
anything that is not under the temp directory or already marked as its own.

`omp-eval-profile.mjs` copies the credential store into each profile it builds,
so a run has access without touching your real settings. Those copies persist
until `--prune` removes them. Run it when you finish; sixteen were left behind
in one session before anyone noticed.
