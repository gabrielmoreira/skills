# Agent Skills That Restore Context

This repository collects agent skills shaped around one idea:

> The work should restore context for whoever comes next.

Concentration, fatigue, interruption, and ADHD-like friction change how
expensive it is to pick something up again. Code that works can still make the
reader hold too much in working memory. So can a change with no stated reason, a
failure with no reproduction, a repository in a state nobody can name, and prose
that stopped being true.

These skills push an agent toward work a tired human can return to without
starting over.

## The skills

**Writing and judging code.**

- **`maintainable-code`** keeps real complexity visible and removes the rest.
  Clear business flow, explicit effects, no hidden dependencies, no
  fragmentation for its own sake.
- **`typescript-skills`** is the same idea in one ecosystem: a router over nine
  topics, forty-one rules, each with a decision, conditions, and a check.

**Judging and repairing work.**

- **`evidence-backed-review`** judges a change before it lands, and says what it
  did not inspect rather than calling it clean.
- **`debugging-by-evidence`** refuses a hypothesis before a command that already
  reproduces the symptom.
- **`keep-git-work-recoverable`** establishes where you are before doing
  anything a repository refuses, and never destroys what cannot be recovered.

**Keeping the written parts true.**

- **`make-the-docs-trustworthy`** corrects, places, or removes prose so a later
  reader can act on it without checking it first.
- **`progressive-reading`** applies the same reader-first idea to answers:
  useful answer first, one idea per paragraph, nothing dense for its own sake.
- **`authoring-verifiable-skills`** is how every skill here is written and
  proved. Start there before adding one.

## What makes a skill here

Every skill is a router plus rules. The router is a gate: it maps something an
agent can actually see to the one rule that decides. A rule is read when its
row's signal is present, and an absent signal is reported as not-applicable
rather than skipped in silence.

Each rule states one decision in five blocks:

```txt
Decision:   what to choose, in one sentence
Use when:   the conditions, as things you can see
Do:         the choice
Avoid:      the failure it prevents
Verify:     a check that can come back negative
```

## Checking the collection

Everything runs on bare node. No install, no toolchain, no dependency.

```bash
node tools/check-all.mjs --report
```

| Script | What it proves |
| --- | --- |
| `check-all.mjs` | the whole suite, with totals that compare between runs |
| `verify-skill.mjs` | structural invariants, frontmatter validation included |
| `mutate-skill.mjs` | that each invariant fires for its own reason |
| `readability.mjs` | prose share, bullets, bold, clause density, paragraph length |
| `check-yaml-parity.mjs` | the built-in frontmatter parser against a full YAML one |

Frontmatter validation is built in. A strict parser ships inside the checker and
fails on anything it does not understand, because a parser that skips the line
it cannot read reports a valid document while the key nobody validated quietly
does nothing. That check found three skills whose descriptions did not parse at
all, which is a skill that silently never loads.

## What is not proved yet

Activation and routing are declared, not measured. The scenarios exist and none
of them have been executed against a model. `typescript-skills` has no scenarios
at all, and its remaining gaps are listed in `docs/typescript-skills/`.

The current state is always what the suite prints, never what this file claims.

## In short

```txt
Show the main path first.
Make effects visible.
Say what you did not check.
Prove the cause before the fix.
Never destroy what cannot be recovered.
Let the work restore context for whoever comes next.
```

These skills are not trying to make an agent look clever. They are trying to
make it leave behind something a human can pick up cold.
