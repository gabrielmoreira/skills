# ADHD-friendly Agent Skills

This repository collects agent skills shaped around one idea:

> Code should help the reader recover context.

Concentration, fatigue, interruption, and ADHD-like friction change how expensive code feels to read. Some code works, but still makes the reader hold too much in working memory. These skills push agents toward code that is easier to enter, scan, review, and resume.

## The core idea

ADHD-friendly code tends to be:

- interruption-friendly;
- review-friendly;
- maintenance-friendly.

Not because it is simplified or shallow, but because it externalizes context the reader would otherwise have to remember.

The structure should answer orientation questions directly:

```txt
Where is the main flow?
What level am I reading?
Which details can wait?
What effects can happen?
How do I resume after losing the thread?
```

When the code answers those questions, the reader does not need to reload the whole system in their head.

## The style

The skills in this repo prefer:

- visible main flow;
- progressive disclosure;
- explicit effects;
- fewer, stronger names;
- feature-oriented folders;
- top-down files;
- practical examples over abstract rules;
- readable depth over shallow brevity.

The goal is not minimal code. The goal is to keep real complexity visible while removing avoidable cognitive load.

## Why this matters

A maintainer is often tired, interrupted, or reading unfamiliar code under pressure.

Good code should reduce defensive reading. A function that looks pure should not secretly read the clock, mutate globals, write caches, or change caller-owned objects. A name should not create a new question unless it marks a real concept.

## Main skills

### `maintainable-code`

The center of this repo.

It captures the coding philosophy: clear business flow, explicit effects, no hidden dependencies, no unnecessary fragmentation, progressive disclosure, and vocabulary that earned its place.

Use it when designing, implementing, reviewing, or refactoring code.

### `progressive-reading`

The companion communication skill.

It applies the same reader-first idea to answers: useful answer first, details later, clear headings, short paragraphs, and no dense blocks.

Use it when the explanation itself needs to be easier to start reading.

### `typescript-skills`

A TypeScript skill set organized as a router plus nine focused bundles (coding standards, boundaries, composition, configs, async, error handling, observability, security, testing).

Each rule is compact and operational: Decision, Use when, Do, Avoid, one example, Verify. Structural invariants and behavioral evals live in `skills/typescript-skills/evals/`; authoring history lives in `docs/typescript-skills/`.

## In short

```txt
Show the main path first.
Hide secondary detail by level.
Make effects visible.
Use fewer names.
Prefer familiar structure.
Let the code restore context for the reader.
```

These skills are not trying to make agents write clever code.

They are trying to make agents write code a human can return to without starting over.
