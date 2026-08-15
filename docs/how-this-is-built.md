# How this is built

Why the skills in this repository have the shape they do, and what the checks
protect. You do not need any of this to use them. Read it before adding one.

The rules themselves live in the `authoring-verifiable-skills` skill. This is the
reasoning behind them.

## Two failures, both silent

**A skill that does not activate does nothing.** A skill nobody has watched fail
proves nothing. Neither one announces itself: both look exactly like a skill that
works, which is why everything here is arranged around catching them.

## The anatomy

**A skill is a router over rules.**

```txt
SKILL.md              frontmatter, core principle, and the gate
rules/<name>.md       one decision each, in five blocks
evals/*.scenarios.*   activation scenarios, positive and negative
```

**Each rule states one decision, in this order.**

```txt
Decision:   what to choose, in one sentence
Use when:   the conditions, as things you can see
Do:         the choice
Avoid:      the failure it prevents
Verify:     a check that can come back negative
```

**Three file shapes are legal**, and the checker knows all three.

- **Routed.** An entry file plus `rules/`, one rule per gate row. The default.
- **Flat.** An entry file alone, for a skill with a single topic.
- **Multi-topic.** An entry routing to topic directories, each of them routed.
  This is the one case where a separate `INDEX.md` earns its extra hop.

## The gate is not a checklist

**The table maps something an agent can see to the one file that decides.** A rule
opens when its row's signal is present, and not otherwise.

**An index whose default is "read them all" is a table of contents with extra
steps.** Measured before this repository folded its indexes in, reaching a
decision cost three reads, and walking every rule of the largest skill cost
eleven reads and roughly 8,600 tokens. A three-line change paid exactly what a
nine-hundred-line change paid. That unconditional walk is the waste.

**An axis whose signal is absent is reported as not-applicable, naming the signal
that would have triggered it.** That keeps a run honest without paying for the
rule.

**The left column carries evidence, not vocabulary.**

| Bad, a concept | Good, something visible |
| --- | --- |
| anti-corruption layer | a provider SDK type appearing in business logic |
| lifecycle management | `SIGTERM` arriving while jobs are in flight |
| error taxonomy | a retry loop that retries a stable 400 |

## Shape carries readability, not vocabulary

**Measured against the two most-used reference collections**, this collection
already used shorter words, fewer long words, and fewer abstract nouns, and still
read heavier. Shape was the entire difference.

| | prose share | bullets | bold spans | clauses per sentence |
| --- | --- | --- | --- | --- |
| the references | 37 to 57% | 15 to 97 | 22 to 50 | 1.04 to 1.12 |
| this collection, before | 56 to 99% | 9 to 20 | 0 to 7 | 1.53 |

**A paragraph listing things is a list.** Items joined by "and", "or", or a
semicolon are rows, and converting them is most of the work. It costs almost no
words and removes four clause marks at a time.

**Every bullet opens with a bold lead-in.** A reader who reads only the bold must
still get the argument.

## What the checks are

Everything runs on bare node. No install, no toolchain, no dependency.

| Script | What it proves |
| --- | --- |
| `check-all.mjs` | the whole suite, with totals that compare between runs |
| `verify-skill.mjs` | 16 structural invariants, frontmatter validation included |
| `mutate-skill.mjs` | that each invariant fires for its own reason |
| `readability.mjs` | prose share, bullets, bold, clause density, paragraph length |
| `check-yaml-parity.mjs` | the built-in frontmatter parser against a full YAML one |
| `route-baseline.mjs` | how many scenarios a router with no understanding solves |
| `run-activation.mjs` | activation and routing against a real agent, two arms |
| `tests/grading.test.mjs` | the graders, which are the code most able to lie |
| `tests/no-local-paths.test.mjs` | that no committed file names the machine that wrote it |

**A skill may add its own invariants on top of the portable ones.** Two do. They
run from the same entry point, whatever they are written in.

## An eval that passes without the skill never failed

**Every routing scenario runs twice.** Once with the router in context, once
with only the list of file names. The second run is the control, and without it
a pass says nothing about whether the writing did any work.

- **A scenario that passes both ways was routed by the file name.** It is
  reported separately rather than counted, because counting it inflates a score
  the skill did not earn.
- **This is `watch-it-fail` pointed at the eval itself.** A test nobody watched
  fail proves nothing, and an eval that passes with the skill removed is exactly
  that test.

**`route-baseline.mjs` asks the same question for free.** A bag-of-words router
scores each gate row against the prompt and picks the best. Where it already
lands on the expected rule, the scenario measures shared vocabulary rather than
routing. It solves 26% of them today, and `typescript-skills` is the worst at
55%.

**One sample is a coin toss reported as a fact.** Scenarios run `--samples`
times, and a split result is `UNSTABLE`, which is neither a pass nor a failure
but a statement that the routing is not reliable.

**Only objective checks are graded.** A path either appears in the answer or it
does not. The `must` and `mustNot` lists need a judge model, a judge is a weaker
instrument than a string match, and scoring both together hides which one
produced the number.

## Watch what it does, not what it says

**The runner drives a real agent** with its own system prompt and its real
tools, because a stripped one measures a situation nobody is in.

- **That rules out hiding files from the control arm.** An agent with a read
  tool opens whatever it likes, so the arm hides the skill instead: both arms
  get the same prompt and the same tools, and differ only in whether the
  collection is loaded.
- **Grading moved from self-report to observation.** Asking which file it would
  open measures what it says. Watching which files it opens measures what it
  does, and only the second is evidence.
- **Skills load from the working tree**, so a run measures what was just
  edited rather than an installed copy that may be months behind.
- **The agent gets a throwaway directory.** It writes real files, so it is given
  one it is welcome to ruin.

**The user's own instruction file has to be excluded.** A machine already using
these skills has an `AGENTS.md` that names them, and loading it measures the
instructions rather than the skill. Proved rather than assumed: with that file
loaded the agent recites the routing table when asked what skills it has, and
without it says it has none.

## Asking whether more context would have helped

**A model asked whether reading more would have improved its work says yes.**
Agreeing is cheaper than disagreeing, so the question measures acquiescence and
returns the answer whoever asked it was hoping for.

So the question was settled by running it instead. The same six scenarios ran
twice against the same model, once normally and once with one extra line, *read
every rule file in the skill you are using*, and the two were compared on facts
about the transcript rather than on anyone's opinion of it.

| | routed | every rule |
| --- | --- | --- |
| wrote a test | 13/18 | 12/18 |
| touched the implementation | 13/18 | 12/18 |
| test before the implementation | 10/18 | 9/18 |
| ran the tests before it | 13/18 | 12/18 |
| ran the tests after it | 13/18 | 12/18 |
| rule files read | 3.8 | 13.8 |
| turns | 10.4 | 13.4 |
| cost | $1.68 | $2.50 |

**The instruction took hold and changed nothing.** Rule reads more than tripled,
cost rose by half, and no outcome improved. Across all six scenarios exactly one
cell differs, on the most ambiguous prompt in the set, by one run out of three.

**The routed arm already reads 3.8 rule files.** Reading one rule and stopping
was never what the agent did, so an instruction telling it to stop being lazy
was answering a question nobody had.

**The measures had to be repaired twice before they could say this.** The first
run used one generic workspace for every scenario, and four of six wrote no test
in either arm because the state they describe, an implementation with no test, a
bug with a trace, a red waiting for code, was not there to find. The second run
reported three measures with identical numbers, which was the tell: the `edit`
tool names its target inside a patch header rather than in `path`, and `bash`
carries a command and no path at all, so every edit and every command was
invisible and two of the ordering measures could not be false.

## Nothing may name the machine that produced it

**Results are built from absolute paths**, a working directory and a skills
directory, and both are personal. Stripping them by hand is a discipline, and a
discipline that has to be remembered fails on the run nobody was watching.

- **Paths are derived at runtime**, never stored, so the overlay a run needs is
  generated from the script's own location.
- **Results are redacted before they are written.**
- **A check scans every tracked file** for anything shaped like a home
  directory, and fails the suite naming the file and the line.

## Frontmatter validation is built in

**A strict parser ships inside the checker and fails on anything it does not
understand.** A parser that skips the line it cannot read reports a valid document
while the key nobody validated quietly does nothing.

That check found three skills whose `description` did not parse at all. Each
contained an unquoted `": "`, which YAML reads as a nested mapping and rejects.
Whether those skills loaded depended on how forgiving each harness parser
happened to be, which is a skill that silently never fires.

**The fix was the folded block form**, which handles colons and quotes without
escaping:

```yaml
description: >-
  Judge a change before it lands: a branch, a pull request, or uncommitted work.
  Use when the user says "review this" or hands over a branch.
```

**`check-yaml-parity.mjs` cross-checks the built-in parser** against a full
implementation over every block in the collection, and skips cleanly when that
package is not installed. Hand-rolling a parser is only defensible while it
agrees with one that implements the whole spec.

## A green suite proves nothing

**Every check has a mutation that injects exactly the defect it exists to catch**,
and asserts that check, not merely something, turns red.

**A mutation reports one of three things.**

- **Applied.** The check must now be red.
- **Not applicable.** There was nothing of this kind here to break.
- **Stale.** It should have applied and could not, which means the anchor moved.

Collapsing the middle case into the third buried the one genuinely broken
mutation under nine copies of a non-problem, per run.

## The instrument lies if you let it

**A metric written to score a rewrite gets gamed by that rewrite.** Several
defects appeared in the scorer during this work, each of which made a file look
better without being better.

- **A paragraph opening with a bold span starts with an asterisk**, so a filter
  skipping list markers skipped it, and bold-led prose scored as zero prose.
- **Splitting paragraphs on blank lines let layout decide the score.** The same
  content measured 4% prose or 99% prose depending on whether a blank line sat
  between a block label and its bullets.
- **A colon inside an inline code span counted as a clause mark**, so naming
  `Do:` and `Verify:` scored as density nobody reads.
- **A script that terminated every bullet** added a stop to the continuation line
  of every wrapped bullet, cutting 91 sentences in half while every structural
  check stayed green.

**Each was found by reading. None was found by the suite.** Read the output before
believing the number.

## Ordering and strength

**Order everything by expected impact, highest first.** A reader who stops after
the first item should have got the most valuable thing in the file.

**Estimate impact as how often it fires multiplied by what it costs when missed.**
A rule that fires rarely and prevents unrecoverable loss outranks one that fires
constantly and prevents a nit.

**Budget the uppercase keywords.** The value is in the contrast, and that is
measured rather than felt: an absolute phrasing pushed a model to apply full
ceremony to a small task five times out of five, while the same task with no
guidance at all was classified correctly five times out of five. The absolute
suppressed a discrimination the model made natively.

## Naming

**Where a name refuses to come, check the scope rather than the thesaurus.** The
difficulty is the diagnosis.

**Collision costs more than abstraction.** Being the fifth skill named around
"review" on a machine carrying hundreds is what loses activation, not failing to
state an outcome. That is why two skills here carry a category name with the word
that separates them, and two carry a verb and an outcome. The set runs two
conventions on purpose.

## What is not proved

**Activation and routing are declared, not measured.** Every skill carries
scenarios and every rule has at least one, and none of them have been executed
against a model.

The structure is checked. The behaviour is not.
