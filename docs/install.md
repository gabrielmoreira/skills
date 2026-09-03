# Installing these

The README covers the one command most people need. This is everything else.

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
