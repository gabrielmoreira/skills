# Agent Skills That Restore Context

Eight skills for coding agents. Each one covers a moment you already recognise: a
branch to review, a bug with no reproduction, a git command that refuses, docs
that went stale.

They are built around one idea:

> The work should leave enough behind that the next person can pick it up cold.

That next person is usually you, on Monday.

**Each skill opens only the parts that apply.** A three-line change does not pay
for a nine-hundred-line review.

## The skills

### `evidence-backed-review`

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

### `debugging-by-evidence`

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

### `keep-git-work-recoverable`

**Use it when git refuses and you are not sure what is safe to do.**

A blocked branch switch, a detached head, a branch name that will not resolve, or
old worktrees you want to clean up.

- **Nothing uncommitted gets thrown away.** Ever.
- **Nothing gets deleted without proof it landed somewhere.** "It looks merged" is
  not proof, and squashed work is not an ancestor.
- **A refusal is information, not an obstacle.** It reads the error instead of
  retrying with more force.
- **Anything destructive comes back to you** with what you would lose, spelled out.

### `make-the-docs-trustworthy`

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

### `maintainable-code`

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

### `typescript-skills`

**Use it when the question is specifically about TypeScript.**

Forty-one rules across nine topics: coding standards, boundaries, composition,
config, async, error handling, observability, security, testing.

- **It opens one topic, not nine.** The router exists to keep the cost down.
- **Every rule tells you what to choose, when, what to avoid, and how to check it
  afterwards.**
- **Real examples with real code**, including the wrong version next to the right
  one.
- **Covers the things that bite in production.** Cancellation, cleanup order,
  retry storms, secrets in logs, provider types leaking into your domain.

### `progressive-reading`

**Use it when the agent's answers are exhausting to read.**

Dense walls of text, buried conclusions, or replies that sound like a press
release.

- **Answer first, then context, then caveats.**
- **One idea per paragraph**, short enough to stop between.
- **It cuts filler and keeps substance.** Security warnings, ordered steps, and
  exact commands or error strings stay exactly as they were.
- **It knows when to stop.** Shorter is not better once the answer becomes wrong
  or too terse to follow.

### `authoring-verifiable-skills`

**Use it when you want to write your own skill**, or figure out why one you wrote
never fires.

- **Start with the description**, because a skill that never activates does
  nothing, and that failure is invisible.
- **Route on what the agent can actually see** in the code, not on concepts it
  would have to already know to match.
- **One decision per rule**, with a word budget, so nothing turns into an essay.
- **A check nobody has watched fail proves nothing.** It shows you how to break
  your own skill on purpose and confirm the right check catches it.

## Install

Use the [`skills`](https://github.com/vercel-labs/skills) CLI. It detects which
agents you have and installs into each one's directory.

```bash
npx skills@latest add gabrielmoreira/skills
```

That installs into the current project and asks which skills and which agents.

**Everything, every agent, no prompts:**

```bash
npx skills@latest add gabrielmoreira/skills --all
```

**User level instead of project level**, so it is available everywhere:

```bash
npx skills@latest add gabrielmoreira/skills --all --global
```

**One skill only:**

```bash
npx skills@latest add gabrielmoreira/skills --skill evidence-backed-review
```

**See what is in here before installing anything:**

```bash
npx skills@latest add gabrielmoreira/skills --list
```

**Where it lands.** One copy under `~/.agents/skills/`, symlinked into every agent
directory you have. Editing the skill once changes it everywhere. Add `--copy` if
you would rather have independent real files.

**`--all` means every agent the CLI knows about**, currently 76, not the ones you
happen to have. So it will try tools you have never installed, and two of them,
Eve and PromptScript, are project-only by design and cannot accept a global
install at all. Those lines are noise. Nothing failed that mattered.

**Running it twice is fine.** The second run reports overwrites everywhere,
which is the same skills replacing themselves.

Useful afterwards: `npx skills list` shows what you have, `npx skills update`
pulls newer versions, and `npx skills remove` takes one out.

### Manual install

**If you would rather not use the CLI**, each skill is a self-contained folder
with `SKILL.md` at its root. Copy the ones you want into the directory your agent
reads.

```bash
git clone https://github.com/gabrielmoreira/skills.git

# Claude Code, user level
cp -r skills/skills/* ~/.claude/skills/

# Claude Code, project level
mkdir -p .claude/skills && cp -r skills/skills/* .claude/skills/
```

**Other agents follow the same shape.** Point them at wherever they look.
`~/.agents/skills/` is the shared location many of them read, which is where the
CLI puts the real files before symlinking them out.

## Then wire it up

**Installing is not enough.** Without a routing table, activation rests on
description matching alone, and on a machine carrying hundreds of skills that is
a coin flip.

**Write an `AGENTS.md`** at the root of your project, or at `~/.agents/AGENTS.md`
for a personal one that follows you everywhere. Start with this:

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

### Point Claude Code at it

**Claude Code reads `CLAUDE.md`, not `AGENTS.md`.** Rather than keeping two files
in sync, make one a redirect. A line starting with `@` imports another file:

```md
@AGENTS.md
```

That is the entire contents of `CLAUDE.md`. For a personal setup, the global
`~/.claude/CLAUDE.md` can point at a file outside any project:

```md
@~/.agents/AGENTS.md
```

Now every agent reads the same instructions, and there is one file to edit.

### Going further

[`AGENTS.md`](AGENTS.md) in this repo is a complete working example of the rest of
an agent instruction file. [`docs/agents-md.md`](docs/agents-md.md) walks through
it block by block and says which parts are worth copying and which are one
person's taste.

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
