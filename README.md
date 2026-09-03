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

**Each skill opens only the parts that apply.** A three-line change does not pay
for a nine-hundred-line review.

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
coin flip. This is the step that makes them fire.

**Copy the `## Skills` section from [`AGENTS.md`](AGENTS.md) in this repository**
into your own `AGENTS.md`, at the root of your project or at `~/.agents/AGENTS.md`
for a personal one that follows you everywhere. It is one table, one row per
skill, and a check in this repository fails if it ever stops matching what is
installed here.

**Trim the rows to what you installed.** A row pointing at a skill that is not
there is worse than no row.

**A skill in here also does this job, and measurably.** Across 57 recorded runs
with the collection loaded, the agent opened `using-gabrielmoreira-skills` in all
57 and opened it first in 56. It works as a master router in practice, not just
by intention.

**It is still not a drop-in replacement for that table.** Alongside the routing
it carries one person's configuration: where generated files go, which agent is
primary, what must never be committed, which style is wanted. It is named after
him so nobody adopts it by accident. Read it, take the routing table out of it if
you want that mechanism, and leave the rest.

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

## Finding out what is true

### [`debugging-by-evidence`](skills/debugging-by-evidence/SKILL.md)

**Something is wrong and the cause is not established.**

No hypothesis before a command that reproduces the symptom. Rival explanations
get ranked and separated by evidence rather than by which was thought of first.

### [`bound-the-unknown`](skills/bound-the-unknown/SKILL.md)

**Ground you cannot name yet.** Two probes in with no finding, or a script about
to be written to find something out.

A budget stated before the probing starts, and a stop when the shape appears
rather than when patience runs out.

## Changing code

### [`test-first-by-evidence`](skills/test-first-by-evidence/SKILL.md)

**A feature or a bugfix about to be written**, or a test written after the code.

The test comes first and has to be seen failing. A test that has never failed has
not been shown to test anything.

### [`maintainable-code`](skills/maintainable-code/SKILL.md)

**Where code goes and which way it points.** Whether a module belongs here,
whether a dependency may flow that way, whether an abstraction has been earned.

Language neutral. It closes by asking the question its own sections cannot: can
somebody who did not write this find the important behaviour.

### [`typescript-skills`](skills/typescript-skills/SKILL.md)

**A decision inside TypeScript or JavaScript.** What a value may be and what
happens when it is absent, what a failure means and who handles it, what crosses
a boundary, what runs concurrently, what a test proves.

Nine topics, forty-four rules, and the router opens the one that applies.

### [`evidence-backed-review`](skills/evidence-backed-review/SKILL.md)

**A change you want judged before it lands.** Uncommitted work you just made, a
diff, a branch, a pull request.

It says what it did not look at, instead of calling something clean because it
never opened it. Every finding carries a file and a line, and it edits nothing.

## When the tooling gets in the way

### [`treat-blockers-as-incidents`](skills/treat-blockers-as-incidents/SKILL.md)

**A command failed for a reason that is not the change you were asked to make.**
A tool that will not install, a runtime the shell cannot find, an expired
credential.

The blocker gets its own name and its own record. A workaround is reported as a
finding, not as a fix.

### [`keep-git-work-recoverable`](skills/keep-git-work-recoverable/SKILL.md)

**A repository operation refused, or the state is unclear**, and something might
be lost.

Establish where you are before doing anything. Nothing that destroys work runs
until the work is recoverable.

## What gets written and read

### [`make-the-docs-trustworthy`](skills/make-the-docs-trustworthy/SKILL.md)

**Written material to correct, create, place, or remove.**

Look for the fact before writing it, because a second copy of a fact is the one
that will disagree later. Write only what cannot be found by looking.

### [`progressive-reading`](skills/progressive-reading/SKILL.md)

**An answer that is correct and hard to get into.** Too dense to start, the useful
part buried, or a summary that dropped the caveat that mattered.

Easier to read, never shallower. Ranking a long list rather than truncating it,
because a cap loses findings.

### [`drop-the-model-voice`](skills/drop-the-model-voice/SKILL.md)

**Prose that leaves the session and gets read by somebody else.** A review
comment, an incident write-up, a status update, a release note, an announcement.

It removes claims the evidence does not carry, sales language where a report
belongs, and the run-up before the point. A tone you ask for outranks all of it.

## Across turns

### [`keep-the-thread-across-boundaries`](skills/keep-the-thread-across-boundaries/SKILL.md)

**A decision, a constraint, an approval, or a second request arriving before the
first one closes.**

What was settled survives a compaction, a model change, a resume, or a handoff.
Every decision keeps the alternative it rejected, so it is not re-argued from
nothing.

## Making your own

### [`authoring-verifiable-skills`](skills/authoring-verifiable-skills/SKILL.md)

**A skill to write, split, rename, or repair**, or one that never fires.

A skill has to be provable rather than believed. This is the one that made the
checks in this repository exist.

## Checking what you installed

```bash
node tools/check-all.mjs --report
```

Bare node, no install. It prints structural invariants, mutation results, page
shape, frontmatter validity, whether the routing tables agree, how much of the
scenario set describes a situation somebody was actually in, and how many
scenarios a router with no understanding already solves.
[`docs/how-this-is-built.md`](docs/how-this-is-built.md) explains what each check
protects.

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

**The measured rate separates from its control and not much more.** The suite
prints both arms with their intervals. The gap is real; the interval is wide
enough that a single edit moving it a few points would be invisible. It is
evidence the skills do something, not a regression detector.

**Some routed scenarios are giveaways.** The suite reports how many a
bag-of-words router solves with no understanding at all. Those pass for reasons
that have nothing to do with the skill.

**A behaviour run measures one agent on one day.** It says nothing about a
different harness, a different model, or the same model next month, which is
why the baseline records all three.

The current state is always what the suite prints, never what this file claims.

## License

MIT. See [LICENSE](LICENSE).
