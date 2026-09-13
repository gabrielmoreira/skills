# gabrielmoreira/skills

[![skills.sh](https://skills.sh/b/gabrielmoreira/skills)](https://skills.sh/gabrielmoreira/skills)

For coding agents. Written for my own work, published in case they help with
yours.

**A combination, not an invention.** It is an attempt to take the best of the
skill collections I use day to day and turn them into one set that fits how I
work. The credits are at the bottom, and in [CREDITS.md](CREDITS.md).

**This is a personal lab.** Expect rough edges, opinionated defaults, and a file
that changes the moment it stops earning its place.

**It can go backwards.** Some changes here have made a skill worse. That is why
every edit runs the check suite described below, which prints its numbers whether
or not they flatter the change.

**No versions, no promises.** When a skill costs more than it gives back, I cut
it instead of deprecating it.

```bash
npx skills@latest add gabrielmoreira/skills --skill '*' --global -y
```

## Install

The command above does everything. The CLI finds your agents, keeps one copy
under `~/.agents/skills/`, and links it into each agent's own folder, so editing
a skill once changes it everywhere.

**To install without the noise, name your agents.** PromptScript only takes
project-level skills, so the CLI reports that one install as a failure every
time, whether or not you have it:

```bash
npx skills@latest add gabrielmoreira/skills --skill '*' --global -y \
  -a claude-code -a codex -a cursor
```

Repeat `-a` for each agent. A comma-separated list is read as one name and
rejected, and the error prints back exactly what you passed.

## Point your agent at it

Installing is half of it. Without a routing table the agent guesses from
descriptions alone, and on a machine carrying hundreds of skills that guess is
close to a coin flip.

Copy the `## Skills` section from [`AGENTS.md`](AGENTS.md) into your own
`AGENTS.md`, at the root of your project or at `~/.agents/AGENTS.md` for one that
follows you everywhere. **Keep only the rows for skills you installed**; a row
pointing at a skill you do not have is worse than no row.

A check here fails when that table stops matching what is installed, so the two
cannot drift apart.

**Claude Code reads CLAUDE.md.** Point one file at the other instead of keeping
both in sync:

```md
@AGENTS.md
```

For a personal setup that reads outside the project:

```md
@~/.agents/AGENTS.md
```

Full walkthroughs: [`docs/agents-md.md`](docs/agents-md.md) for the instruction
file, [`docs/install.md`](docs/install.md) for project-level installs, single
skills, interactive mode, real files instead of symlinks, and the manual path
with no CLI.

## The skills

| skill | what you get |
| --- | --- |
| using-gabrielmoreira-skills | work routed to the right skill, plus my own settings |
| debugging-by-evidence | a cause you can defend, not a guess |
| bound-the-unknown | a bounded probe that stops when the shape appears |
| test-first-by-evidence | a test that was seen failing |
| maintainable-code | where code goes, and which way it points |
| typescript-skills | nine topics, forty-four rules, one opened at a time |
| evidence-backed-review | code and noncode changes judged against intent, impact and evidence |
| treat-blockers-as-incidents | a blocker that gets a name and a record |
| keep-git-work-recoverable | where you are, before anything destructive runs |
| make-the-docs-trustworthy | one home per fact |
| progressive-reading | easier to enter, never shallower |
| drop-the-model-voice | prose that reads like an engineer wrote it |
| keep-the-thread-across-boundaries | decisions that survive the boundary |
| authoring-verifiable-skills | a skill that fires when it should, and can be proved |
| optimising-skills | a change tested against a baseline, not a hunch |

## Start here

### [`using-gabrielmoreira-skills`](skills/using-gabrielmoreira-skills/SKILL.md)

**Use it when** every session starts, and again after a compaction, a model
change, a resume, or a handoff.

**You get** the work routed to the skill that owns it, plus one person's
settings: where generated files go, which agent is primary, what must never be
committed, which style is wanted. It has no row in the routing tables, because a
router does not route to itself.

**It is not a drop-in replacement for the table above.** It carries my setup, so
read it, take the routing part if you want it, and leave the rest.

## Finding out what is true

Facts before repairs. Both skills here exist to stop a fix aimed at the wrong
layer.

### [`debugging-by-evidence`](skills/debugging-by-evidence/SKILL.md)

**Use it when** something is broken, flaky, hanging, or newly slow, and the cause
is not established yet.

**You get** testable hypotheses built from reports, logs and code, evidence from
the layer that can actually answer, and a fix scoped to the real cause instead of
the symptom. You do not have to rebuild the whole incident to repair one part of
it.

### [`bound-the-unknown`](skills/bound-the-unknown/SKILL.md)

**Use it when** you are two probes in with no finding, or about to write a script
just to find out what you are dealing with.

**You get** a budget stated before the probing starts, and a stop when the shape
of the problem appears, rather than when your patience runs out.

## Changing code

Writing the change, placing it, and judging it before it lands.

### [`test-first-by-evidence`](skills/test-first-by-evidence/SKILL.md)

**Use it when** a feature or a bugfix is about to be written, or a test was
written after the code.

**You get** a test you watched fail first. A test that has never failed has not
been shown to test anything yet.

### [`maintainable-code`](skills/maintainable-code/SKILL.md)

**Use it when** a new module needs a home, a file is doing too much, or you are
about to add a second way to do something this codebase already does.

**You get** a decision about where code lives and which way it points, and the
compromise written down when the existing structure forces one. It ends on the
question its own rules cannot answer: can somebody who did not write this find
the part that matters?

### [`typescript-skills`](skills/typescript-skills/SKILL.md)

**Use it when** a decision has to be made inside TypeScript or JavaScript: what a
value may be and what happens when it is absent, what a failure means and who
handles it, what crosses a boundary, what runs at the same time.

**You get** one of nine topics opened, with forty-four rules that each carry a
decision, the conditions that trigger it, and a check.

### [`evidence-backed-review`](skills/evidence-backed-review/SKILL.md)

**Use it when** a proposed change needs review: a PR, branch, diff, or local work.
Code, pipelines, infrastructure, documentation, policies and agent skills all count.

**You get** located findings, the requirement or impact behind them, and explicit
coverage gaps, without edits or publication. It reads the PR and linked work-item
context rather than judging the diff alone.

It starts from where the change's effect lands, with overlays such as shared platform
or security-sensitive deciding what is read first. **Standard** then selects relevant
categories. **Complete** (or “full”) reads all five.
An explicit focus limits the subject, not the number of categories it can use.
The revised coverage has not yet been validated by behavioral model comparisons.

## Tooling

When the problem is the environment or the repository, not the code.

### [`treat-blockers-as-incidents`](skills/treat-blockers-as-incidents/SKILL.md)

**Use it when** a command fails for a reason that is not the change you were
asked to make. A tool that will not install, a runtime the shell cannot find, a
credential that expired, a network that is down.

**You get** the blocker named, bounded, and recorded, and any workaround reported
as a finding instead of passed off as a fix.

### [`keep-git-work-recoverable`](skills/keep-git-work-recoverable/SKILL.md)

**Use it when** a git command refused, a branch will not switch, the state is
unclear, or work might be lost.

**You get** where you are and what is safe, before anything destructive runs.
Nothing uncommitted is discarded and nothing is removed without evidence that it
landed somewhere else.

## What survives the session

The material you write, and the decisions a context window forgets.

### [`make-the-docs-trustworthy`](skills/make-the-docs-trustworthy/SKILL.md)

**Use it when** written material needs creating, correcting, moving, or removing,
or a decision is worth recording so it stops being argued.

**You get** a search before the write, so the second copy that would disagree
later never gets made. What a command already prints becomes a pointer instead of
a paragraph.

### [`progressive-reading`](skills/progressive-reading/SKILL.md)

**Use it when** an answer is correct but hard to enter: too dense, the useful
part buried, or a summary that dropped the caveat that mattered.

**You get** an answer that is easier to read without becoming shallower. A long
list is ranked rather than truncated, because a cap loses findings.

### [`drop-the-model-voice`](skills/drop-the-model-voice/SKILL.md)

**Use it when** prose leaves the session and other people read it: a review
comment, an incident write-up, a status update, a release note, an announcement.

**You get** no claims the evidence does not carry, no sales language where a
report belongs, and no wind-up before the point.

### [`keep-the-thread-across-boundaries`](skills/keep-the-thread-across-boundaries/SKILL.md)

**Use it when** a decision, a constraint, or an approval is made, or a second
request arrives before the first one closes.

**You get** what was settled surviving a compaction, a resume, and a handoff,
with the rejected alternative kept so nobody argues it again from nothing.

## Making your own

The two skills that build and improve the others.

### [`authoring-verifiable-skills`](skills/authoring-verifiable-skills/SKILL.md)

**Use it when** writing, splitting, renaming, or repairing a skill, or one that
never fires.

**You get** a skill that activates when it should and can be proved rather than
believed. It is the skill that made the checks in this repo exist.

### [`optimising-skills`](skills/optimising-skills/SKILL.md)

**Use it when** a skill already exists and there is evidence it underperforms. It
fires on work it excludes, misses work it claims, or gets read and then ignored.

**You get** the change treated as an experiment, the number that motivated it
doubted first, and what already failed here carried forward so the same idea is
not tested a third time.

## Checking it yourself

```bash
node tools/check-all.mjs --report
```

Node and nothing else. Per skill, it prints the structural checks, the mutation
results, the page shape, the frontmatter, whether the routing tables agree, how
many scenarios come from a real situation, and how many a router with no
understanding already solves.
[`docs/how-this-is-built.md`](docs/how-this-is-built.md) says what each check
protects.

The suite reports behaviour numbers but does not produce them, because a run
takes minutes and needs the network:

```bash
node tools/run-activation.mjs --backend omp --skill test-first-by-evidence --write-baseline
```

That run drives a real agent, with its own system prompt and its real tools, and
watches which files it opens. Every scenario runs twice: once with this
collection loaded, and once with no skills at all. The difference is what the
skills are worth. A scenario that passes both ways is reported on its own,
because the agent would have done it anyway.

Runs load from this working tree, never from an installed copy, so a measurement
always describes what you just edited. Start with `--dry-run`, which builds every
call and sends nothing.

## What is not proved

| | |
| --- | --- |
| Most scenarios have never been run | the baseline covers what was measured, and the suite prints its age; everything outside it is a claim |
| The measured rate separates from its control, and not much more | the gap is real, and the interval is wide enough that one edit moving a few points would be invisible; this is not a regression detector |
| Some routed scenarios are giveaways | the suite prints how many a bag-of-words router solves with no understanding, and those pass for reasons that have nothing to do with the skill |
| A behaviour run measures one agent on one day | it says nothing about another harness, another model, or the same model next month, so the baseline records all three |

The current state is always what the suite prints, never what this file claims.

**Several skills are still verbose**, and could say the same thing in fewer
tokens. Cutting them is not free. Proving a shorter version did not lose quality
takes eval scenarios covering both versions, and building those costs more than
the cut saves. The cuts wait for a run that can settle them.

## What I run it on

**omp is my main agent, by a wide margin.** Copilot, Claude, Codex, Pi and
Opencode come after it, roughly in that order. Where something here is tuned to
one harness, that harness is omp.

**Day to day the models are OpenAI's Sol, Terra and Luna generation and
Anthropic's Opus and Sonnet.** Improving the skills themselves, rather than
shipping code with them, is what Astra and Fable get used for. They are better at
it, and too expensive to drive every day.

## Credits

This collection combines what already worked elsewhere. Where a technique here
looks like one of these, they had it first:

- [superpowers](https://github.com/obra/superpowers), an agentic skills framework
  and development methodology
- [Ring](https://github.com/LerianStudio/ring), engineering practice enforced as
  skills and agents
- [everything-claude-code](https://github.com/WorldFlowAI/everything-claude-code),
  agents, commands, skills, rules and hooks as one toolkit
- [mattpocock/skills](https://github.com/mattpocock/skills), skills taken from
  another engineer's own agent directory
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills),
  engineering skills for coding agents
- [caveman](https://github.com/JuliusBrussee/caveman), the terse register this
  collection's own result-first style comes from
- [anthropics/skills](https://github.com/anthropics/skills), the reference
  catalog from the team that defined the format
- [openai/skills](https://github.com/openai/skills), the skills catalog for Codex

[CREDITS.md](CREDITS.md) is the long version: what each contributed, the
unpublished work behind some rules, and the public ideas the rules assume.

## License

MIT. See [LICENSE](LICENSE).
