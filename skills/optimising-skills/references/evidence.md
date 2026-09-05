# Evidence

What each source established, what it did not, and where independent sources
arrived at the same place. Names sit inside fenced blocks so the instruction
prose stays portable.

## The sources

```
A  vendor guidance, model provider one     current model and prompting guides
B  vendor guidance, model provider two     context engineering and eval guides
C  four public skill collections           their own skill-authoring skills
D  requirements engineering, public        NASA Systems Engineering Handbook, Appendix C
E  qualitative content analysis, academic  Mayring, 2000
F  long-context research, public           RULER; independent context-degradation work
G  this collection, measured               two days of activation runs and textual audit
```

`G` is the only source that measured this collection. Everything else describes
other corpora, other models, or a method. A recommendation from `A` through `F`
is a hypothesis here until `G` has a number for it.

## What each established

### A and B, converging

Both arrived at nearly the same guidance in different vocabulary.

```
smallest prompt that preserves the contract  <->  smallest set of high-signal tokens
outcome, constraints, success criteria       <->  the right altitude, not procedural logic
state each instruction once                  <->  remove over-prompting
reasoning effort is a dial beside the prompt  <->  effort is the channel for thinking volume
revalidate scaffolding when the model changes <->  revalidate workarounds built for older models
expose only the tools the task needs          <->  bloated tool sets create ambiguity
```

**Established:** removing instructions written for an earlier model is a real
and reported gain, with score, token and cost figures from one vendor's internal
coding-agent evals, marked directional by the vendor itself.

**Not established:** that the same holds for a skill collection. A system prompt
is always present; a skill is loaded on demand, and the cost model differs.

**The line that carries the most weight and is easiest to skim past:** minimal is
not short. Without it, subtraction becomes the same defect it was meant to cure.

### B on evals, which is the precondition for all of it

```
representative of production traffic     an eval that does not reproduce real traffic is an anti-pattern
class balance                            testing only when a behaviour should fire produces one that always fires
task solvability                         a reference solution proves the task can be done
grade outcome, not trajectory            a correct answer by another route is not a failure
prod-like harness, isolation per trial    the harness must not be what the score measures
multiple trials                          a single run decides nothing when variance is unmeasured
grader bugs                              confirm a failure is the agent's before repairing the skill
eval saturation                          a suite near 100% measures regression, not capability
transcript inspection                    read trajectories, not only scores
false confidence                         automated evals mislead when they miss real usage patterns
```

**Established:** every failure mode this collection hit in two days is named
here, in advance, by a source that had never seen it.

### C, the four authoring collections

```
three-level loading                    metadata always, body on trigger, resources on demand
the description is the trigger         it is the only text read before loading
explain why, not heavy keywords        capitalised absolutes are a yellow flag
generalise, do not fit the examples    a skill that works only on its test cases is useless
read transcripts, not outputs          repeated work across runs is a signal to bundle a script
context is a public good               only add what the model does not already have
degrees of freedom                     match specificity to fragility, prose to script
no skill without a failing test first  baseline before writing, the discipline borrowed from tests
match the form to the failure          measured head to head, see below
```

**The strongest single item, and it is measured:** in head-to-head wording tests
on one collection's own guidance, the prohibition arm produced more of the
unwanted content than the recipe arm, with fully separated distributions, and
trended worse than the no-guidance control. Appending one nuance clause to the
winning recipe degraded it from consistent to noisy.

**Not established:** that the ranking transfers to another failure class, another
model, or this collection. The source says to micro-test rather than assume.

### D and E, the method

```
D  what fails if this requirement disappears
D  is a tight tolerance defendable and cost-effective
D  clarity, consistency, traceability, necessity, assumptions, verifiability
E  explicit analysis units, a category system fixed before reading
E  context-sensitive interpretation, transparent coding rules
```

**Established:** a close reading can show that an instruction is contradictory,
underspecified, or infeasible under its own assumptions. **Not established:** how
often a model follows it, or that a rewrite improves anything.

### F, long context

**Established:** a model near perfect on simple retrieval across a large window
can degrade sharply when the same window requires several items, distractors,
multi-hop tracing, or aggregation. Focused inputs beat large ones carrying
irrelevant history.

**Why it belongs here:** it is the laboratory version of the fear that motivates
this whole skill. An eval can be correct and still measure a simplified version
of the capability it is believed to protect.

## What this collection measured

```
seven instrument defects in one day     each produced a plausible wrong number
four text changes, all falsified        description twice, a rule inside an opened skill, a router gate row
noise floor plus or minus one of three  demonstrated on two untouched skills between runs
state announced in 32% of openings      a keyword did not move it detectably
one trigger architecturally unreachable its condition arrives after routing, which is never revisited
seven scenarios against an empty tree   the honest refusal scored as failure
positives to negatives, 4.5 to 1        the imbalance the eval guidance warns about
derived scenarios measure less          held twice, intervals overlapping
structural suite saturated              350 of 350 and 231 of 231, so it cannot report capability
```

**The pattern under all seven instrument defects:** something that looked like
data and was not. None was caught by the number looking wrong. Each was caught by
an independent witness: reading the worst-scoring file, a second field
disagreeing, a gate refusing a commit, a row passing for the reason another
failed, a timestamp, and a planted transcript.

## The textual audit of this collection

An independent close reading of all instruction files, using `D` and `E`, found
patterns that no activation run can see.

```
endings erase exceptions       six skills ended with a check stricter than their body
thresholds presented as laws   numeric limits with no population, model, or interval
universal openings             an absolute first, its qualification several lines later
causation from one observation a single before-and-after read as a general law
```

**It also found four factual errors** that no structural gate could reach: a
statistic whose percentile exceeded both its own peak and its cap, a claim about
version-control default behaviour contradicted by the tool's documentation, an
example that can leave a rejection unobserved, and a rule whose approved example
does the thing a neighbouring rule forbids.

**What it could not establish, and said so:** any runtime behaviour at all.

## Where the two methods converge

Independent arrival is the strongest evidence available here.

```
the chronology defect        found by reading the text, and separately by watching a run
                             use the recovery path that licenses a first-run pass to
                             justify tests chosen by which lines were uncovered

held-out discipline          named by the textual audit, and by vendor eval guidance
                             selecting on the held-out half makes it validation data

outcome over route           recorded by this collection on its own, named by the
                             authoring collections, and named by vendor eval guidance
```

## What none of them establishes

- **That any repair improves task outcomes.** Every source that measured
  anything measured a different corpus, a different model, or a structural
  property.
- **That shorter is better.** One source explicitly denies it.
- **That a wording change moves behaviour in this collection.** Four attempts,
  four falsifications. See `falsified.md`.
