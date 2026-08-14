# Agent Skills That Restore Context

Eight skills for coding agents. Each one covers a moment you already recognise: a
branch to review, a bug with no reproduction, a git command that refuses, docs
that went stale.

> The work should leave enough behind that the next person can pick it up cold.

That next person is usually you, on Monday.

**Each skill opens only the parts that apply.** A three-line change does not pay
for a nine-hundred-line review.

## What is in here

| Skill | Helps you with |
| --- | --- |
| [`evidence-backed-review`](#evidence-backed-review) | judging a branch or a pull request before it lands |
| [`debugging-by-evidence`](#debugging-by-evidence) | finding the cause of a bug instead of guessing at it |
| [`keep-git-work-recoverable`](#keep-git-work-recoverable) | getting unstuck when git refuses, without losing work |
| [`make-the-docs-trustworthy`](#make-the-docs-trustworthy) | docs that went stale, and where to put what you write |
| [`maintainable-code`](#maintainable-code) | code someone can come back to |
| [`typescript-skills`](#typescript-skills) | the same, specifically for TypeScript |
| [`progressive-reading`](#progressive-reading) | answers that are readable instead of exhausting |
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

<details>
<summary><b>Other ways to install</b></summary>

**Project level**, committed with the repo, instead of global:

```bash
npx skills@latest add gabrielmoreira/skills --skill '*' -y
```

**One skill only:**

```bash
npx skills@latest add gabrielmoreira/skills --skill evidence-backed-review
```

**Interactive**, which asks you which skills and which agents:

```bash
npx skills@latest add gabrielmoreira/skills
```

**See what is in here first**, without installing:

```bash
npx skills@latest add gabrielmoreira/skills --list
```

**Real files instead of symlinks:** add `--copy`.

**Afterwards:** `npx skills list` shows what you have, `npx skills update` pulls
newer versions, `npx skills remove` takes one out. Running the install twice is
fine; the second run reports overwrites, which is the same skills replacing
themselves.

**About `--all`:** it expands to `--skill '*' --agent '*' -y`, and that `'*'`
means all 76 agents the CLI knows rather than the ones you have. It will try
tools you never installed and print a larger failure block. Prefer the commands
above.

### Manual install, without the CLI

Each skill is a self-contained folder with `SKILL.md` at its root. Copy the ones
you want into the directory your agent reads.

```bash
git clone https://github.com/gabrielmoreira/skills.git

# Claude Code, user level
cp -r skills/skills/* ~/.claude/skills/

# Claude Code, project level
mkdir -p .claude/skills && cp -r skills/skills/* .claude/skills/
```

`~/.agents/skills/` is the shared location many agents read, and is where the CLI
puts the real files before symlinking them out.

</details>

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
