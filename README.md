# My agent skills

Personal skills for coding agents, which I use at work and on my own projects and
change whenever something goes wrong often enough to be worth writing down.

Each one covers a moment you already recognise: a feature about to be written, a
branch to review, a bug with no reproduction, a git command that refuses, docs
that went stale.

**Not a product.** No stability commitment, no versioning policy, no promise
about token cost. What there is instead is an attempt at a balance I can live
with between what comes back and what it costs to get it. They will be good in
some situations and bad in others, and I find out which by using them and reading
back what happened.

[Where this is at](docs/where-this-is-at.md) says what I have not settled, which
is more than I would normally put in a README. Prior work these are built on is
credited in [CREDITS.md](CREDITS.md).

> The work should leave enough behind that the next person can pick it up cold.

That next person is usually you, on Monday.

**Each skill opens only the parts that apply.** A three-line change does not pay
for a nine-hundred-line review.

## What is in here

| Skill | Helps you with |
| --- | --- |
| [`evidence-backed-review`](#evidence-backed-review) | judging a branch or a pull request before it lands |
| [`test-first-by-evidence`](#test-first-by-evidence) | writing the test before the code, and proving it can fail |
| [`debugging-by-evidence`](#debugging-by-evidence) | finding the cause of a bug instead of guessing at it |
| [`treat-blockers-as-incidents`](#treat-blockers-as-incidents) | tool, install, auth, and environment failures that block the task |
| [`keep-git-work-recoverable`](#keep-git-work-recoverable) | getting unstuck when git refuses, without losing work |
| [`make-the-docs-trustworthy`](#make-the-docs-trustworthy) | docs that went stale, and where to put what you write |
| [`maintainable-code`](#maintainable-code) | code someone can come back to |
| [`typescript-skills`](#typescript-skills) | the same, specifically for TypeScript |
| [`progressive-reading`](#progressive-reading) | answers that are readable instead of exhausting |
| [`drop-the-model-voice`](#drop-the-model-voice) | written output that sounds like the engineer who did the work |
| [`bound-the-unknown`](#bound-the-unknown) | probing unfamiliar ground on a stated budget before it eats the session |
| [`keep-the-thread-across-boundaries`](#keep-the-thread-across-boundaries) | holding what a session settled across compactions, resumes, and handoffs |
| [`authoring-verifiable-skills`](#authoring-verifiable-skills) | writing your own skill, and proving it works |

## Install

Everything, for every agent you have, available in all your projects:

```bash
npx skills@latest add gabrielmoreira/skills --skill '*' --global -y
```

**That is it.** It detects your agents, puts one copy under `~/.agents/skills/`,
and symlinks it into each agent's own directory. Editing a skill once changes it
everywhere.

**It will print eight lines about PromptScript.** They are harmless: PromptScript
only supports project-level skills, and the CLI adds it to every global install
whether you have it or not. To silence them, name your agents instead:

```bash
npx skills@latest add gabrielmoreira/skills --skill '*' --global -y \
  -a claude-code -a codex -a cursor
```

**Repeat `-a` for each one.** A comma-separated list is read as a single name and
rejected, with an error that lists back the exact names you passed.

## Then set up your AGENTS.md

**Installing is only half of it.** Without a routing table, an agent has to guess
from descriptions alone, and on a machine carrying hundreds of skills that is a
coin flip. This is the step that makes them actually fire.

**Write an `AGENTS.md`** at the root of your project, or at `~/.agents/AGENTS.md`
for a personal one that follows you everywhere:

```md
## Skills

**Reach for one when the work matches.** Name the one you opened and why, in one line.

| When | Skill |
| --- | --- |
| a change must be judged before it lands: a branch, a diff, uncommitted work | `evidence-backed-review` |
| a feature or a bugfix is about to be implemented, or a test was written after the code | `test-first-by-evidence` |
| something is wrong and the cause is not yet known | `debugging-by-evidence` |
| a tool, runtime, install, auth, or network failure that is not the change being made | `treat-blockers-as-incidents` |
| a repository operation refused, or the working state is unclear | `keep-git-work-recoverable` |
| written material must be created, corrected, or removed | `make-the-docs-trustworthy` |
| code should stay simple, testable, and sustainable: boundaries, cohesion, layering | `maintainable-code` |
| TypeScript needs focused guidance: standards, boundaries, async, errors, testing | `typescript-skills` |
| an answer must be easier to start, scan, pause, and resume | `progressive-reading` |
| something is about to be posted, filed, or published and must not read as generated | `drop-the-model-voice` |
| ground you cannot name yet: two probes in with no finding, or a script about to be written to find out | `bound-the-unknown` |
| a decision, a constraint, an approval, or a second request before the first closes | `keep-the-thread-across-boundaries` |
| a skill itself must be written, split, renamed, or checked | `authoring-verifiable-skills` |

- **Not finding a match is an answer.** Do not stretch one to fit.
- **Two or more matching is normal.** Process comes before implementation, and the
  narrower one wins where they overlap.
```

**Trim the rows to what you installed.** A row pointing at a skill that is not
there is worse than no row.

### Claude Code reads CLAUDE.md, not AGENTS.md

Rather than keeping two files in sync, make one a redirect. A line starting with
`@` imports another file, so this is the entire contents of `CLAUDE.md`:

```md
@AGENTS.md
```

For a personal setup, the global `~/.claude/CLAUDE.md` can point outside any
project:

```md
@~/.agents/AGENTS.md
```

Now every agent reads the same instructions and there is one file to edit.

### Going further

[`AGENTS.md`](AGENTS.md) here is a complete working example of the rest of an
agent instruction file. [`docs/agents-md.md`](docs/agents-md.md) walks through it
block by block and says which parts are worth copying and which are one person's
taste.

[`docs/install.md`](docs/install.md) has the rest: project-level installs, one
skill at a time, interactive mode, real files instead of symlinks, and the
manual path with no CLI at all.

## The skills

### [`evidence-backed-review`](skills/evidence-backed-review/SKILL.md)

**Use it before you open a pull request, or when someone hands you a branch.**

It reads the change and tells you what is wrong with it. The point is that it also
tells you what it did not look at, instead of saying "looks good" about parts it
never opened.

- **Every finding has a file and a line.** It never edits your code.
- **It checks the things people skip.** Does this match what was actually asked
  for. Can it be abused. Do the tests prove what they claim. Does it break someone
  else's caller. Are the docs now wrong.
- **It reads outside the repo when it can.** Your company's standards, another
  team's wiki, the repository of whoever consumes your API.
- **It only opens the checks that apply.** A three-line change does not pay for a
  nine-hundred-line review.

### [`test-first-by-evidence`](skills/test-first-by-evidence/SKILL.md)

**Use it when you are about to implement a feature or a bugfix.**

It writes the test first and makes the agent actually run it and watch it fail.
A test you never saw fail might be testing the wrong thing, and you would have no
way to know.

- **A test that passes on its first run is not a test yet.** It describes what the
  code already does.
- **A test that errors is not a red either.** A broken test proves nothing about
  the code.
- **Code written before its test is unproven.** It gets re-derived from a red, and
  only after the original is committed somewhere safe. Discarding work you did not
  agree to discard is never the agent's call.
- **It knows where the test goes.** The narrowest seam that can see the behaviour,
  chosen by what the test needs to run rather than by a label.
- **It stops you writing tests that cannot fail.** Assert on results, not on
  whether a mock got called, and be able to name the production change that would
  break each test.
- **A test that is hard to write is a design report.** Mocking six things means the
  code takes its dependencies from the wrong place.

### [`debugging-by-evidence`](skills/debugging-by-evidence/SKILL.md)

**Use it when something is broken and you do not know why yet.**

It stops the agent from guessing. No theory is allowed until a command has
actually reproduced the problem in front of it.

- **Reading code produces theories nothing can disprove.** So it runs something
  first.
- **It says which stage it is in**, and each stage allows only certain moves. It
  cannot name a cause before it has one that survived a test.
- **It writes down the rival explanations** and what would kill each one, instead
  of trying the first idea that came to mind.
- **The regression test goes where the bug is**, not where you noticed it.

Good for intermittent failures, "it works on my machine", and anything that got
slow.

### [`treat-blockers-as-incidents`](skills/treat-blockers-as-incidents/SKILL.md)

**Use it when a command fails for a reason that is not the change you were asked to make.**

A tool that will not install, a runtime the shell cannot find, expired authentication, a permission error, or a broken registry.

- **The stone in your shoe is not the walk.** It separates environment blockers from application defects.
- **It bounds the search before it eats the session.** A stated probe or time budget, announced up front.
- **It reports its state explicitly.** `blocker/BLOCKED`, `blocker/REPRODUCED`, `blocker/EXPLAINED`, `blocker/CLEARED`, or `blocker/HANDED BACK`.
- **A workaround that needs contortions is a finding, not a fix.**

### [`keep-git-work-recoverable`](skills/keep-git-work-recoverable/SKILL.md)

**Use it when git refuses and you are not sure what is safe to do.**

A blocked branch switch, a detached head, a branch name that will not resolve, or
old worktrees you want to clean up.

- **Nothing uncommitted gets thrown away.** Ever.
- **Nothing gets deleted without proof it landed somewhere.** "It looks merged" is
  not proof, and squashed work is not an ancestor.
- **A refusal is information, not an obstacle.** It reads the error instead of
  retrying with more force.
- **Anything destructive comes back to you** with what you would lose, spelled out.

### [`make-the-docs-trustworthy`](skills/make-the-docs-trustworthy/SKILL.md)

**Use it when the docs say something that is no longer true**, or when you are
about to write something down and do not know where it goes.

- **It searches before it writes.** A second copy of a fact is not extra
  documentation. It is a future contradiction, and nobody will know which copy is
  the stale one.
- **It deletes what a command already prints.** If `--help` says it, the page
  restating it is just something else to keep in sync.
- **It names what kind of change it is making**, so a decision record gets
  superseded with a pointer forward rather than quietly deleted.
- **Prose nobody has read is treated as a guess**, not as a source.

### [`maintainable-code`](skills/maintainable-code/SKILL.md)

**Use it whenever you are writing, reviewing, or restructuring code.**

Ten principles for code that someone can come back to. The two that matter most
are named at the top so you can stop after those.

- **Look at what is already there before changing it.** Most of the cost is
  building a second way to do something the codebase already does.
- **Keep the effects visible.** Network, files, time, randomness, and anything
  stateful goes through the front door.
- **The main path should read top to bottom.** Fewer layers, and the important
  decision where you would look for it.
- **It will not make you split things for the sake of splitting them.** A helper
  that only makes a file shorter is not an improvement.

### [`typescript-skills`](skills/typescript-skills/SKILL.md)

**Use it when the question is specifically about TypeScript.**

Forty-four rules across nine topics: coding standards, boundaries, composition,
config, async, error handling, observability, security, testing.

- **It opens one topic, not nine.** The router exists to keep the cost down.
- **Every rule tells you what to choose, when, what to avoid, and how to check it
  afterwards.**
- **Real examples with real code**, including the wrong version next to the right
  one.
- **Covers the things that bite in production.** Cancellation, cleanup order,
  retry storms, secrets in logs, provider types leaking into your domain.

### [`progressive-reading`](skills/progressive-reading/SKILL.md)

**Use it when the agent's answers are exhausting to read.**

Dense walls of text or buried conclusions. A reply that sounds like a press
release is the other skill below.

- **Answer first, then context, then caveats.**
- **One idea per paragraph**, short enough to stop between.
- **It cuts filler and keeps substance.** Security warnings, ordered steps, and
  exact commands or error strings stay exactly as they were.
- **It knows when to stop.** Shorter is not better once the answer becomes wrong
  or too terse to follow.

### [`drop-the-model-voice`](skills/drop-the-model-voice/SKILL.md)

**Use it for prose that leaves the session: a review comment, an incident
write-up, a status update, a release note, a wiki page, an announcement.**

- **A claim of impact names its number, artifact, or person**, or the sentence
  goes.
- **It removes the run-up, the sales vocabulary, the defence against objections
  nobody raised**, and formatting that encodes nothing.
- **Each kind of message has a shape**, and the skill carries the fallback set
  for teams without one.
- **One tell proves nothing.** Polish, a dry register, and a single formal word
  are how many people write.

Built on prior work by others, credited in [CREDITS.md](CREDITS.md).

### [`bound-the-unknown`](skills/bound-the-unknown/SKILL.md)

**Use it when you are two probes in with no finding, or about to write a script to find something out.**

For the state before anything is a task, where you cannot yet say whether something is a bug, a feature, or nothing.

- **Looking is not the hard part. Stopping is.** It announces how far it will go before the first probe.
- **Probe without changing anything.** Read-only exploration so the probe does not destroy its own evidence.
- **Keeps intermediates in temporary files.** Large extracts stay on disk rather than flooding the context window.
- **Stopping on a named boundary is a result**, not a failure.

### [`keep-the-thread-across-boundaries`](skills/keep-the-thread-across-boundaries/SKILL.md)

**Use it to hold what a session settled across compactions, resumes, and handoffs.**

The objective in hand, the requests parked behind it, and every decision with the alternative it rejected.

- **A boundary does not lose the work. It loses the reasons.**
- **An entry stands alone.** Written at settle time in words that need no previous turn to understand.
- **Decisions survive; authorizations do not.** A recorded choice persists, but actions require fresh approval on the other side.
- **Push and pop for interrupted work.** Park the previous request with its state intact when a new request arrives.

### [`authoring-verifiable-skills`](skills/authoring-verifiable-skills/SKILL.md)

**Use it when you want to write your own skill**, or figure out why one you wrote
never fires.

- **Start with the description**, because a skill that never activates does
  nothing, and that failure is invisible.
- **Route on what the agent can actually see** in the code, not on concepts it
  would have to already know to match.
- **One decision per rule**, with a word budget, so nothing turns into an essay.
- **A check nobody has watched fail proves nothing.** It shows you how to break
  your own skill on purpose and confirm the right check catches it.

## Checking what you installed

Everything runs on bare node. No install, no toolchain, no dependency.

```bash
node tools/check-all.mjs --report
```

It prints structural invariants, mutation results, page shape, frontmatter
validity, and how many scenarios a router with no understanding already solves.
[`docs/how-this-is-built.md`](docs/how-this-is-built.md) explains what each check
protects and why the collection is built this way.

The suite reports the behaviour numbers but does not produce them, because a
behaviour run costs minutes and a network. To produce them:

```bash
node tools/run-activation.mjs --backend omp --skill test-first-by-evidence --write-baseline
```

That drives a real agent, with its own system prompt and its real tools, and
watches which files it opens. Every scenario runs twice: once with this
collection loaded, once with no skills at all. The difference between the two is
what the skills are worth, and a scenario that passes both ways is reported
separately because the agent would have done it anyway.

Skills are loaded from this working tree, never from an installed copy, so a run
always measures what you just edited. Start with `--dry-run`, which assembles
every call and sends nothing.

## What is not proved

**Most scenarios have still never been run.** The baseline covers what has been
measured and the suite prints its age. Everything outside it is a claim.

**The measured rate separates from its control and not much more.** With the
collection loaded the scenarios pass 60% of the time, and without it 0%, which
is a real gap. The interval around that 60% is wide enough that a single edit
moving it a few points would be invisible, so the number is evidence the skills
do something and not yet a regression detector.

**Under a fifth of the routed scenarios are giveaways.** The suite reports how many
a bag-of-words router solves with no understanding at all. Those pass for
reasons that have nothing to do with the skill.

**A behaviour run measures one agent on one day.** It says nothing about a
different harness, a different model, or the same model next month, which is
why the baseline records all three.

The current state is always what the suite prints, never what this file claims.

## License

MIT. See [LICENSE](LICENSE).
