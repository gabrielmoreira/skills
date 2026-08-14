# Agent Skills That Restore Context

Eight skills for coding agents, built around one idea:

> The work should restore context for whoever comes next.

Code that works can still make the reader hold too much in working memory. So can
a change with no stated reason, a failure with no reproduction, a repository in a
state nobody can name, and prose that stopped being true.

Every skill here is a router over rules. A rule opens only when its signal is
present, so a small task does not pay for a large one.

## Install

**Copy the skills you want into the directory your agent reads.** Each skill is a
self-contained folder, so you can take one or all eight.

```bash
git clone https://github.com/gabrielmoreira/skills.git
cd skills
```

**Claude Code**, user level, available in every project:

```bash
cp -r skills/* ~/.claude/skills/
```

**Claude Code**, project level, committed with the repo:

```bash
mkdir -p .claude/skills && cp -r /path/to/skills/skills/* .claude/skills/
```

**Any agent that reads a skills directory** follows the same shape: one folder
per skill, `SKILL.md` at its root. Point it at wherever it looks. Common
locations are `~/.agents/skills/` and `~/.codex/skills/`.

**Any agent that reads only `AGENTS.md`** can still use them. Copy the folders
somewhere in the repo and add the routing table below, with the paths adjusted.

**One skill only**, for example the review one:

```bash
cp -r skills/evidence-backed-review ~/.claude/skills/
```

## Wire it into your agent

**Without a routing table, activation rests on description matching alone.** On a
machine carrying hundreds of skills that is a coin flip. Paste this into your
`AGENTS.md` or `CLAUDE.md`:

```md
## Skills

**Reach for one when the work matches.** Name the one you opened and why, in one line.

| When | Skill |
| --- | --- |
| a change must be judged before it lands: a branch, a diff, uncommitted work | `evidence-backed-review` |
| something is wrong and the cause is not yet known | `debugging-by-evidence` |
| a repository operation refused, or the working state is unclear | `keep-git-work-recoverable` |
| written material must be created, corrected, or removed | `make-the-docs-trustworthy` |
| code should stay simple, testable, and sustainable | `maintainable-code` |
| TypeScript needs focused guidance | `typescript-skills` |
| an answer must be easier to start, scan, pause, and resume | `progressive-reading` |
| a skill itself must be written, split, renamed, or checked | `authoring-verifiable-skills` |

- **Not finding a match is an answer.** Do not stretch one to fit.
- **Two or more matching is normal.** Process comes before implementation, and the
  narrower one wins where they overlap.
```

**Trim the rows to the skills you installed.** A row pointing at a skill that is
not there is worse than no row.

[`AGENTS.md`](AGENTS.md) in this repo is a complete working example of the rest of
an agent instruction file. [`docs/agents-md.md`](docs/agents-md.md) walks through
it block by block and says which parts are worth copying and which are one
person's taste.

## The skills

### `evidence-backed-review`

**Judges a change before it lands.** A branch, a pull request, a diff, or
uncommitted work.

- **Says what it did not inspect**, instead of calling the whole thing clean.
- **Every finding lands at `file:line`.** It never edits.
- **Eleven axes, gated.** Security and abuse paths, whether tests prove what they
  claim, broken contracts and callers outside the repository, stale docs, and
  whether the change is what was actually asked for.
- **Reads what the repository cannot tell it.** Company standards, a team wiki, a
  consumer's own repository, where those are reachable.

Reach for it before opening a pull request, or when handed a branch to judge.

### `debugging-by-evidence`

**Finds the cause and proves it before any fix.**

- **No hypothesis before a command that already reproduces the symptom.** Reading
  the code produces theories nothing can falsify.
- **Five loop states**, and each licenses only what it names. You cannot name a
  cause from a state that has not reached it.
- **Ranks rival explanations** with what would falsify each, rather than testing
  the first idea.
- **Puts the regression test where the bug actually is**, not where it surfaced.

Reach for it when something is broken, intermittent, or newly slow.

### `keep-git-work-recoverable`

**Establishes where you are before doing anything a repository refuses.**

- **Nothing uncommitted is discarded**, and nothing is removed without positive
  evidence it landed.
- **A refusal is information.** Retrying it unchanged is the failure this prevents.
- **Every claim resting on the remote is tagged.** Observed, unverified, or
  unknown, and an unverified claim never justifies a deletion.
- **Destructive moves go to you**, with what would be lost named.

Reach for it on a blocked switch, a detached head, a branch that will not resolve,
or before cleaning up old work.

### `make-the-docs-trustworthy`

**Corrects, places, or removes written material** so a later reader can act on it
without checking it first.

- **Search before you write.** A second copy of a fact adds no source, and the two
  disagree eventually.
- **Prose nobody has read is a hypothesis, not a source.**
- **Names the change class.** Correct, add, supersede, relocate, or delete. A
  decision record is superseded, never deleted.
- **Drops what a command or a config file already prints.**

Reach for it when docs are out of date, when deciding where something goes, or
when writing a decision down.

### `maintainable-code`

**Keeps real complexity visible and removes the rest.**

- **Ten principles**, ordered, with the two that carry the most weight named at the
  top: investigate before changing, and make effects and dependencies explicit.
- **Clear main flow**, with as few layers as the problem needs.
- **No hidden I/O**, no god config, no fragmenting one decision across helpers.
- **Organised around the axis of change**, not around file type.

Reach for it when designing, reviewing, or refactoring anything.

### `typescript-skills`

**The same ideas in one ecosystem.** A router over nine topics and forty-one rules.

- **Coding standards, boundaries, composition, configs, async, error handling,
  observability, security, testing.**
- **One topic opens at a time.** The router exists to stop you reading all nine.
- **Each rule states a decision, the conditions that trigger it, what to avoid, and
  a check that can come back negative.**
- **Carries its own twenty-seven invariants** on top of the portable ones.

Reach for it on any TypeScript design, review, or debugging question.

### `progressive-reading`

**Makes an answer easier to start, scan, pause, and resume.**

- **Useful answer first**, then context, then caveats.
- **One idea per short paragraph.**
- **Cuts filler, never substance.** Security warnings, ordered procedures, and
  exact technical strings are preserved as written.
- **Stops before the answer turns wrong or too terse to follow.**

Reach for it when replies feel dense, robotic, or hard to re-enter.

### `authoring-verifiable-skills`

**How every skill here is written and proved.** Start here before adding one.

- **The activation surface first**, because a skill that never fires does nothing.
- **The gate, not a checklist.** Route on what an agent can see, never on concepts
  it would have to already know.
- **One decision per rule**, in five blocks, inside a word budget.
- **A check with no mutation is an opinion with a pass label.**

Reach for it when writing, splitting, renaming, or checking a skill.

## Checking what you installed

Everything runs on bare node. No install, no toolchain, no dependency.

```bash
node tools/check-all.mjs --report
```

It prints structural invariants, mutation results, page shape, and frontmatter
validity for every skill. [`docs/how-this-is-built.md`](docs/how-this-is-built.md)
explains what each check protects and why the collection is built this way.

## What is not proved

**Activation and routing are declared, not measured.** Every skill carries
scenarios and every rule has at least one, and none of them have been executed
against a model. The structure is checked; the behaviour is not.

The current state is always what the suite prints, never what this file claims.

## License

MIT. See [LICENSE](LICENSE).
