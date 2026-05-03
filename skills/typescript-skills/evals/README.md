# Evals

Eval system for the typescript-skills tree. Two layers:

- **Structural invariants** (`check-invariants.mjs`) — programmatic checks of file shape, routing, ownership uniqueness, demarcation, and known-regression invariants. Runs in <100 ms. Pass/fail.
- **Behavioral evals** (`evals.json`) — adversarial prompts that subagents must answer. Scored 0-3 against per-eval `assertions` by an LLM grader subagent.

## Quick run — structural

```bash
node evals/check-invariants.mjs
```

Exit 0 = all 21 invariants pass. Exit non-zero = print failures with detail. Any failure blocks promotion to `~/.agents/skills`.

## Quick run — behavioral

The behavioral layer is run on demand and produces workspace artifacts that are intentionally not committed (they leak harness session paths and grow stale fast).

For each prompt in `evals.json`:

1. Spawn one subagent with the skill tree available (with-skill arm) and one without (baseline arm). Same prompt, same JSON output format.
2. An LLM grader subagent reads each response and scores it against the `assertions` array (0-3 per the rubric below).
3. Aggregate per-eval and across all 25 prompts. Compare with-skill vs baseline.

Recommended N=1 for an iteration check, N=3 if you want variance bands. Promotion threshold: with-skill mean ≥ 2.5/3, hard-gates 3/3.

The full subagent run + grading workflow follows `skill://skill-creator` conventions. Workspace layout (gitignored):

```
typescript-skills-workspace/
  iteration-N/
    raw-results.json
    grading.json
    benchmark.md
```

## Scoring rubric

| Score | Meaning |
|---|---|
| 0 | Wrong direction, or <30% of assertions passed |
| 1 | Right area but missed canonical decision; ≥30% assertions |
| 2 | Right primary skill and mostly correct; ≥60% assertions |
| 3 | Right primary skill, correct decision, ≥85% assertions |

## What `evals.json` contains

25 adversarial prompts across five categories:

- **router-disambiguation** — prompts ambiguous between 2-3 skills; agent must pick the correct primary
- **behavior** — prompts where the agent must apply a specific rule
- **hard-gate-bypass-attempt** — prompts with plausible-sounding justifications for hard-gate violations; agent must refuse and explain why
- **progressive-complexity** — prompts where the smallest correct answer is the right one
- **gap-detection** — prompts about areas the tree does not cover; agent must say so honestly
- **error-handling** — prompts about class-vs-Result, retryability, metadata, and boundary translation
- **async** — prompts about parallelization, cancellation, backoff, and process lifecycle

Design rules (enforced by `INV-21`):

- No prompt names the expected skill or rule file (no leaking the answer).
- Several prompts present the wrong cause as plausible — agents must not be steered.
- Several prompts are silent on a specific aspect — agents should not invent a rule.

## Add prompts when

- A new rule is introduced.
- A new conflict is corrected (regression test).
- A new gap from `references/roadmap.md` is closed.
- A real-world bypass attempt arose; capture it as a `hard-gate-bypass-attempt`.

## Add invariants when

- A behavioral eval surfaces a tree-shape problem that can be checked statically.
- A `references/ownership.md` change requires a uniqueness or routing check.
- A known regression must never recur (codify the invariant as the regression test).

## Grader choice

The grader is an LLM subagent — semantic, slow (~3 min per batch), accurate. It reads each response and scores it against per-eval `assertions` using the rubric above.

An earlier attempt used a deterministic keyword-coverage script (count strong words from the assertion that appear in the response, mark passed at ≥40% coverage). It was discarded: on iteration-1 data it produced ~30pp lower scores than the LLM grader because semantically correct answers using different vocabulary fail the keyword check. Mentioned here so future iterations don't reinvent the same proxy.

## Promotion criteria

Before copying this tree into `~/.agents/skills`:

1. `node evals/check-invariants.mjs` exits 0.
2. LLM-graded behavioral evals: with-skill mean ≥ 2.5/3.
3. Hard-gate prompts (any prompt tagged `hard-gate-bypass-attempt`) score 3/3.
4. No new conflicts introduced since the last promotion (`git diff` against the last promoted snapshot).
