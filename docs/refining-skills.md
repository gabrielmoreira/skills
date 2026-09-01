# Refining Skills

How a rule earns its place, how a scenario proves it, and what to measure before
believing either. Everything here was derived from measurement on this
collection and on one long-lived production service, and the numbers are kept so
a later reader can tell whether a claim still holds.

**This is the refinement discipline, not the compression one.** Compression is
parked in `.local/rule-compression-plan.md` and waits on this. Coherence,
adjustment and quality come first, because compressing something whose quality
is unmeasured only makes the unknown smaller.

---

## 1. What a rule must carry

A rule that only states a decision leaves the reader to supply the hard parts.
Three components, and a rule is worth its words when it has all three.

| Component | The question it answers | Measured, 44 rules |
| --- | --- | --- |
| **Smell** | what would I see in the file? | 44 of 44 |
| **Consequence** | what does it cost when I see it? | **3 of 44** |
| **Technique with its condition** | what do I do, and when does that stop applying? | **10 of 44** |
| all three | | **1 of 44** |

The collection knows how to recognise. It rarely explains the cost, and it
seldom says which technique applies and when. That is the gap refinement closes.

**Consequence is what turns a smell into an argument.** A bare prohibition is a
preference; the same line with its cost is a finding someone can act on or
dispute.

```md
Avoid:
- **A thin wrapper that renames an existing call.**          <- preference
- **Ceremony without a seam.** `new` where a function reads   <- finding
  as well, so the caller pays construction for a boundary
  that is not there.
```

**A technique ladder answers "improve this".** Open-ended requests — make it
cohesive, improve the layering, make it easier to test — have no answer unless
the rule supplies a way to measure what is wrong and a named move that addresses
it. `abstraction-and-local-reasoning` does this already and is the model to
copy: four escalating techniques with the instruction to stop at the first that
works.

---

## 2. Naming, and when not to

**A name the industry already uses is the cheapest compression available.** Two
words reach knowledge the reader already carries, instead of thirty rebuilding
it. Two vocabularies, one per side of the rule:

- **Smell names**, for what is wrong: Utility Class, Speculative Generality,
  Refused Bequest, Primitive Obsession, Shotgun Surgery, Feature Envy, God
  Object, Boolean Trap, Stringly Typed.
- **Principle expressions**, for what is right: Tell Don't Ask, Parse Don't
  Validate, Make Illegal States Unrepresentable, Composition over Inheritance,
  Fail Fast, DAMP, Law of Demeter, Errors are Values.

**Never force one.** A borrowed label that nearly fits teaches a false
classification, which is worse than no label. Where nothing fits, write a plain
expression of our own — descriptive, and not pretending to be canon. *Ceremony
without a seam* and *State the object cannot defend* are ours, and read as ours.

**The vocabulary is mostly already chosen.** Measured: **36 of 44 rules cite a
named idea in `references:` and never use it in the body.** Anti-Corruption
Layer, Parse don't validate, Strangler Fig, Branch by Abstraction, Ubiquitous
Language, YAGNI, Rule of Three. Curated, correct, and filed in frontmatter where
the model does not act on it. Moving a name into the bullet is the cheapest
improvement in the collection.

**It costs words.** Adding names and consequences to one rule ran +103 words and
came to 449 against a 450 cap. Names and consequence fit, but only just, which is
where the parked compression pays for them: fusing `Verify` into the bullets
frees roughly what the consequences consume. The two edits finance each other.

---

## 3. Writing a prompt that measures something

**A prompt that narrates the problem has already solved it.** This is the worst
bias, worse than shared vocabulary, and it is easy to write without noticing:

> *"Three modules each define their own error for the same upstream timeout,
> with different names and different fields."*

Nobody types that. Whoever wrote that sentence did the analysis; the agent only
has to agree. A scenario built that way measures assent.

**What people actually type is short and points at code.** Fix this. Implement
X. Review before I raise it. What would you improve. Where is the problem. Why is
this slow. Make this easier to test. Improve the layering.

**Short prompts need files.** A one-line request has no content unless the code
is there, which is why prompt-only scenarios drift into narration. The runner
copies `evals/fixtures/<scenario-id>/` into a throwaway workspace before the
agent sees it, and a fixture may ship `setup.sh` when the scenario needs history
rather than files.

**Three scenario shapes, chosen by what the rule governs.**

1. **Prompt only.** The question is about approach and code would add nothing.
   *"Should a lookup by id throw, or return null?"*
2. **Fixture, code to change.** The dominant real case. The agent reads, decides
   and edits, and the runner observes the writes, so the grading is about what it
   did rather than what it said.
3. **Fixture, code to judge.** Read and report without editing. Review-shaped.

**The strongest positive is a request that is not about the rule.** Ask for a
feature; leave the defect in the file. A rule that only fires when someone
describes the defect fires when it is not needed.

**The hardest is the open-ended one**, and it is the one that tests whether the
rule supplies a measure. Grade it on counted, located observations — *this
failure path cannot be reached from a test because the catch returns an empty
list* — and fail it for general design advice that would fit any file.

---

## 4. The four biases, and what each one costs

| Bias | What it looks like | What it costs |
| --- | --- | --- |
| **Shared vocabulary** | the prompt repeats the gate row's words | measures word overlap, not the gate |
| **Narrated finding** | the prompt states the diagnosis | measures assent |
| **Teaching to the test** | scenarios written with the rule open | the rule and its test share one author's blind spot |
| **Absent control** | no without-arm | a high pass rate that the agent would reach anyway |

The first is measured by `tools/route-baseline.mjs`, which reports how many
scenarios a router with no understanding already solves. `typescript-skills` sat
at 55%, the worst in the collection.

**The train/validation split does not fix the third.** It controls the rule
overfitting to the scenarios. A held-out half written by the same process carries
the same blind spot entirely. What addresses it is a grader whose job includes
attacking the assertions, and a blind comparison that does not know which arm
produced which output.

---

## 5. What to measure, and the bar

**The unit of judgement is the rule, not the scenario.** One scenario at three
samples decides nothing: 3/3 and 0/3 are both inside the noise of a coin. Three
scenarios pooled give nine samples an arm, which is the smallest set that can
produce a verdict.

**The metric is the gap, never the rate with the skill loaded.** A rule at 90%
that also reaches 90% without is worth nothing, and the runner reports that as
`passed both ways  the agent did this anyway`.

**Acceptance is a non-overlap test, not a chosen percentage:** the with-arm's
Wilson lower bound must clear the without-arm's upper bound. It needs no invented
number and tightens on its own as samples are added. `acceptance()` in
`tools/run-activation.mjs` implements it. Calibrated:

| Samples per arm | Result | Verdict |
| --- | --- | --- |
| 3 | 3/3 against 0/3 | **UNSTABLE** |
| 9 | 9/9 against 0/9 | ACCEPT |
| 9 | 8/9 against 2/9 | ACCEPT, at the edge |
| 9 | 7/9 against 3/9 | UNSTABLE |
| 27 | 21/27 against 6/27 | ACCEPT |
| 9 | 6/9 against 6/9 | NO EFFECT |

Read the first row twice. **A perfect score on one scenario is not a result.**
Every conclusion drawn from a single sample in the session that produced this
document was noise, including one that briefly looked like a skill failing.

**To accept a smaller effect, add scenarios rather than lowering the bar.**
Twenty-seven samples accept 78% against 22%; nine do not.

---

## 6. What leaks into a run

A measurement inherits the environment unless it is stopped, and every one of
these was found by looking at a recorded run rather than by reading config.

- **The user's global config.** `omp --profile <name>` isolates settings. It
  isolates credentials too, so the profile is built empty, given our config, and
  handed a copy of the credential store. `tools/omp-eval-profile.mjs` does this,
  prefixes every profile it makes, and can prune only its own.
- **Tool sources, which a profile does not isolate.** A first run through an
  isolated profile still mounted fifteen MCP tools from the user's environment
  and behaved differently. `tools.xdev` and `mcp.enableProjectConfig` are the
  switches.
- **Model roles.** Pinning `--model` pins the main loop and nothing else. A
  scenario that delegates runs its subagent on whatever the user's `task` role
  names, and `degraded` never sees it, because that watches for quota fallback
  and not for a role resolving elsewhere. Pin every executable role.
- **Provider fallback.** omp retries onto another provider when one stops
  serving. Right for work, wrong for measurement: the run reports a model it did
  not use. Off in the overlay; fallback belongs to the runner, at whole-run
  level, and is recorded.
- **The instruction file.** `--no-rules`, because the routing table in a personal
  `AGENTS.md` already names these skills.

**Prove isolation from evidence, not from config.** The decisive check in this
session was a rule that existed in the repository and not in the installed copy:
the recording cited it twelve times, so the run was reading the working tree.

---

## 7. What a failing check must say

Three questions cost the most time when a run goes red, and a check that answers
them turns a debugging session into a reading.

- **Which file.** Nine topic indexes all end in `INDEX.md`; a bare basename
  names a failure without locating it.
- **What was compared.** A printed column that is not the value the target is
  checked against cannot be compared to the target by the reader.
- **What was expected, and how the target was derived.** `bullets+rows is 31,
  needs at least 33 (11 rules x 3, capped at 40)`.

`node tools/mutate-skill.mjs skills/* --diagnose` breaks every check on purpose
and reports whether each one's own message names the unit and gives a value. It
runs 231 mutations across 16 checks and currently finds none that fail this.

---

## 8. When an eval and an invariant disagree

**The eval wins.** Scenarios are the practical test of activation and quality;
invariants test form. A checker that cannot express a real scenario is the thing
to widen — in this session a genuine cross-topic scenario was contorted to fit a
checker, and reverting that was correct.

**Invariants are how a scenario's lesson gets cheap.** What a run establishes can
often be promoted into a check that costs nothing to run, so the expensive
measurement is not repeated for something already settled. Running invariants and
running scenarios are different moments: one on every save, the other
deliberately.

**A check can pass for the wrong reason.** Two found here: a mutation that no
longer matched anything reported success, and a gate row containing `||` was
truncated by a naive cell split, so every row carrying a pipe was invisible to
the check that measured it.

---

## 9. Where the real problems are

Scenarios drawn from imagination cluster on algorithmic puzzles. Measured across
1285 TypeScript files of a long-lived service:

| Shape | Count |
| --- | --- |
| suppressions, 644 of them carrying an expiry date | 651 |
| optional chains | 1132 |
| `as any` | 229 |
| `process.env` read directly | 213 |
| `: any` | 177 |
| `console.*` | 118 |
| `as unknown as` | 100 |
| **empty catch** | **2** |

**The swallow that matters is not the empty catch.** Two exist in the whole
service. The real shape is a catch that writes a line to console and returns a
stand-in, which no reviewer flags because it looks like care.

**Scale is part of the situation.** Six hundred suppressions is a different
problem from six, and a prompt that carries the scale reads like the work.

**Read the context before judging it.** Those 644 dated suppressions are a
managed migration with an agreed grace period, not neglect. Written as neglect,
the scenario would have taught that clearing an unexpired one is progress.

---

## 10. The tooling is under improvement too

**A measurement existing is not evidence that it is right, or that it suits this
question.** Every tool here was written for a narrower problem than the one it is
now asked about, and each of these was found while using it rather than while
reading it.

- **The runner discovered 17 of 79 scenarios** for the largest skill, because it
  read only each skill's root `evals/` and that skill keeps scenarios beside each
  topic. Every baseline ever written covered a fifth of what it appeared to.
- **A check went quiet on the rows most worth measuring.** A gate row containing
  `||` was truncated by a naive cell split, leaving one term, and the check skips
  rows with fewer than two.
- **A mutation reported success for the wrong reason.** After a regex change it
  matched nothing, so the check it was meant to exercise was never exercised.
- **A gate asked which field carried the answer instead of what shape it had.**
  The observed arm decides a scenario by the files the agent opened, so it needs
  a path. It admitted a scenario carrying `expectedAll` and turned away one
  carrying the identical path as `expectedPrimary`. Sixty positives were
  decidable all along, and two skills — `debugging-by-evidence` and
  `make-the-docs-trustworthy` — had never had a single positive measured. Every
  run of both had reported only on whether they stayed quiet.
- **Two of our own tools disagree.** `verdictOf` calls a scenario PASS at three
  passes from three samples; `acceptance` calls the same evidence UNSTABLE, and
  the statistics are on the second one's side. One of them has to move.

**Two symptoms worth hunting, both found here in one afternoon.**

- **A number that is clean beyond belief.** Nine topics reported zero percent
  bias, and a parser reported total agreement. The first was a comparison that
  never matched, counting every miss as a pass. The second compared verdicts
  rather than values, so two parsers agreed on accepting a block while
  disagreeing about what was in it.
- **A denominator smaller than the set.** Three tools read only each skill's
  root evals directory and reported on 17, 102 and 195 scenarios of a
  collection holding 373. Each described less than it claimed, and none said
  so.

- **A skip list nobody subtracts.** The runner named every scenario it declined
  to grade, honestly and in full, on every run. Nobody ever counted that list
  against the set, so eighteen of a skill's twenty positives were dropped in
  plain sight. A tool that reports its own omissions has not protected you; the
  number is only load-bearing once something compares it to the whole.

- **The headline number had the narrowest denominator of all.** The suite's
  behaviour line — the one number claiming the collection works — reported the
  model and the baseline's age, so a stale result could not pass for a current
  one. It never reported coverage. The baseline behind `60% with the skills, 0%
  without` held 15 scenarios of 373, all from a single skill, and had been read
  as a statement about fourteen. A wide interval hints at a small sample; it
  says nothing about which scenarios were never in it. Report age and coverage
  together, because both are ways a baseline quietly stops standing for the
  collection.

- **Two denominators in one row.** The result object reported `samples - lost`
  and computed its verdict from `samples`, four tokens apart on the same line.
  A scenario with no recording at all therefore published `0/0` beside a verdict
  of FAIL, and the summary above it counted twelve never-run negatives as twelve
  the skill had fired on. When a row carries both a count and a judgement, they
  have to be derived from the same number, or the row disagrees with itself and
  the more confident half wins the reader.

**Truncation is never uniform, so ordering is a measurement decision.** When a
run is cut short — a spent quota, a `--limit`, an interrupt — the loss lands
entirely on whatever ran last. Measured here: the last 18 recordings of 84 were
empty and contiguous. Because negatives had been queued first, the cut fell
precisely on the two positives, and the run that survived could say only that
the skill stays quiet. Only a positive can show the gap, since a negative passes
for free in the arm where the skill was never loaded. So positives run first,
sorted stably enough to keep each scenario's two arms adjacent — a positive
whose control arm was cut measures nothing at all.

**Which model you measure on is part of the measurement, and one number does
not settle it.** Public boards rank the same models differently by axis, and the
disagreement is systematic rather than noisy. From a coding board to an agentic
one, every OpenAI model loses ground — GPT-5.5 by ten places, Terra by seven,
Sol by five, gpt-5.4 out of the top twenty — while the open Chinese models gain
as much: glm-5.3-flash and Qwen3.8 Max by eleven places each. An eval like this
one exercises the agentic axis, since it asks whether an agent routes, opens the
right file and holds a procedure across many tool calls. Picking the model on a
coding score, or on a general intelligence index, measures the wrong thing well.

Two traps sit next to this. The boards quote different effort levels for the
same model, so joining them by name compares two configurations and calls it one.
And they publish a top twenty at high or max, while a cheap role runs at medium —
absent from every board, so any number you assign it is invented.

**A question the fixture cannot stage has no answer to grade.** Three arms were
run on the same scenarios — no skill, the rules a hop away, the rules inlined —
and they scored 45%, 49% and 45%. The middle arm delivered its guidance to 17%
of samples and the last to 75%, a 4.4x difference that moved nothing. That reads
as a devastating verdict on the rules until the criteria are crossed item by
item: 38% were met by every arm, 5% won by the skill, 5% lost, and 51% met by
none of them.

The unmet half asks for the repository. "Reads the written standard before
calling either shape wrong." "Names the written guidance that now describes
behaviour the change removed, with file:line on both sides." "Checks whether the
pipeline runs what this change now needs." The workspace each scenario ran in
contained `package.json` and `src/`. There was no standard, no guidance, no
pipeline, and no history — and 0 of 133 positive scenarios carry a fixture, with
one setup.sh in the whole collection and nothing referencing it.

So the comparison measured nothing about the rules. Every arm failed the same
impossible half, and the half that remained was work a competent agent does
unprompted. The instrument was sound, the judge was calibrated, the arms were
matched, the scenarios were identical — and the ground they stood on was empty.

**What that invalidates, and what it leaves standing.** Traversal survives: which
file was opened, how far a session descended, how often a skill fired. None of
that needs a repository, which is why those numbers held up all day. Cost
survives. What falls is every claim about whether guidance improves an answer,
because that question begins with a situation and the situation was never built.

Fixtures are not a refinement to add once the harness works. They are the
difference between measuring a skill and measuring an empty directory.

**Price a model on your traffic, not on its price list.** A list leads with
input and output, and an agentic harness spends neither. Measured across 541 of
our own model turns: 1,536 input tokens, 34,064 cache reads, 279 output. Cache
read outweighs input twenty-two to one and output by a hundred and twenty, so
the cached-input column — the one nobody quotes — is half to three-quarters of
every bill. Two conclusions inverted when that was computed instead of eyeballed:
a model whose output was half the incumbent's turned out 65% dearer, because its
cache reads cost two and a half times as much; and the model being reached for to
economise was 25% more expensive than the one it replaced. Measure the profile
from recordings you already have, then rank.

**An index can be reached and still deliver nothing, and the tool sequence says
which.** Measured over 90 runs of one skill: the index was opened 88 times and a
rule file 4 times. That is not a rule nobody wants — the verdict line said "the
agent does this anyway", which asserts the arm without the rule succeeded, when
in fact neither arm had. Both arms at zero is a different finding and now prints
as NEVER REACHED.

The cause was visible in the order of the calls: index, then the working
directory, then a source file, then the answer. The index told the reader to
open every rule whose signal is present *in the range*, and those signals are
properties of the diff, so the instruction sent the reader into the code to find
out which applied. Nothing brought it back. A detour with no named return is
where guidance is lost, whatever is written at the end of it.

That reading was wrong, and the eval said so. A line was added telling the
reader to choose its rows from the request before opening the range, and descent
went from 30% to 28% — the same number, on 60 positives against 90. The
mechanism was visible and the repair aimed at it did nothing, so the mechanism
was not the cause, or not a cause an instruction can reach. The line came out
again: text that was measured not to work is cost on every activation, and
keeping it because it still sounds right is the failure this whole document is
about.

Two smaller corrections came with it. The first report of this said 22% descent;
recomputed it is 30%, because two metrics had been used interchangeably —
"opened any rule" and "opened the rule this scenario expected" are different
questions and only one was in the number. And a negative result at n=60 against
n=90 with intervals that overlap almost entirely is "no effect detected", not
"no effect": what it rules out is an effect large enough to matter.

**Report findings where findings live.** The measurement above belongs here. It
does not belong in the skill, which carries the decision that came out of it and
nothing else. A skill is applied policy: a run count inside it dates the file,
invites a reader to weigh evidence instead of following the rule, and describes
a measurement nobody will repeat.

**Fidelity constrains the provider, not the model.** Those are easy to collapse,
and collapsing them manufactures a dilemma. Measuring on the fleet looked like it
forced the weak end of the agentic axis, until the question was put properly:
what does that subscription actually serve? Ranked agentically, the provider in
question offered three models above the one in use, one of them top three on
every public board and eight points clear of the incumbent. The constraint was
never the provider — it was the model picked inside it, and nobody had checked
the rest of the shelf. Before accepting a trade between fidelity and capability,
enumerate what fidelity actually costs; often it costs nothing.

**So run two arms, and let them answer different questions.** The fleet model —
whatever the skills actually meet in use — answers *what do people get today*. A
strong agentic model answers *is this rule followable at all*. The pair
disentangles the confound that otherwise sits inside every failure: a rule that
fails on both is unclear and should be rewritten, while one that fails only on
the fleet model is clear but too demanding, and wants simplifying or an
acknowledged limit. Measured on one model alone, those two are the same red line.

**A child process with no deadline of its own is an unbounded wait.** The runner
passed `--max-time` to the agent it spawned and waited on the process closing.
That is a request, not a guarantee: a model that accepts the connection and never
answers leaves the process alive, the promise unsettled, and the worker holding
its slot. Measured: ten workers sat on a free model for fourteen hours at two
seconds of CPU each, and the run reported nothing because it never reached the
end. The only reliable timeout is the one on your side of the boundary. Bound it,
kill the child, and record the kill as a lost sample — then escalate, because a
provider answering nothing would otherwise spend the full deadline on every
remaining launch: 192 of them at three and a half minutes is eleven hours to
learn what the first three already showed.

**A spent provider is not a bad sample.** The two are worth separating because
they call for opposite responses: a sample that came back empty is dropped and
the run continues, while a provider out of quota means nothing after it can
succeed. Carrying on there spends wall-clock to manufacture scenarios that look
failed and were never asked. Detect it by name, stop, and say which it was.

**So the tooling improves alongside the thing it measures**, and the test of a
check is not that it fires but that it fires for its own reason and says
something a reader can act on. `--diagnose` exists for the second half of that.

## 11. The order of work

**Coverage first.** Not because the rules are fine, but because without scenarios
there is nothing to tell whether an edit to a rule helped, hurt, or did nothing.
Editing first and measuring after means every improvement is a belief.

1. **Scenarios and fixtures**, in the shapes above, until every rule has enough to
   pool. Six as an average, fewer where the rule is narrow, more where it is
   contested.
2. **Measure the current rules** against them, on the validation half, at nine
   samples an arm or more. This is the line everything after is compared to.
3. **Then coherence and adjustment.** Consequence and technique into the rules,
   names moved out of `references:` and into the bullets, each change measured
   against the line from step two.
4. **Then compress**, with the scenarios as the net that says the rule still
   fires and the baseline as the check that it still works.

Measuring before step one produces a number for a set that is about to change.
Editing before step two produces a change nobody can defend.
