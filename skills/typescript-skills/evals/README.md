# Evals

Eval system for the typescript-skills tree. Two layers:

- **Structural invariants** (`check-invariants.ts`) — programmatic checks of file shape, routing, ownership uniqueness, demarcation, and known-regression invariants. Runs in <100 ms. Pass/fail.
- **Behavioral evals** (`evals.json`) — adversarial prompts that subagents must answer. Scored 0-3 against per-eval `assertions` by an LLM grader subagent.

## Quick run — structural

```bash
node evals/check-invariants.ts
```

Exit 0 = all 21 invariants pass. Exit non-zero = print failures with detail. Any failure blocks promotion to `~/.agents/skills`.

## Quick run — behavioral

The behavioral layer is run on demand and produces workspace artifacts that are intentionally not committed (they leak harness session paths and grow stale fast).

For each prompt in `evals.json`:

1. Spawn one subagent with the skill tree available (with-skill arm) and one without (baseline arm). Same prompt, same JSON output format.
2. An LLM grader subagent reads each response and scores it against the `assertions` array (0-3 per the rubric below).
3. Aggregate per-eval and across all 25 prompts. Compare with-skill vs baseline.

Recommended N=1 for an iteration check, N=3 if you want variance bands. Legacy promotion gate: every scenario scores at least 2/3, hard-gate prompts score 3/3, and the with-skill mean is at least 2.5/3. The mean is an aggregate health signal, not a substitute for the per-scenario floor.

The full subagent run + grading workflow follows `skill://skill-creator` conventions. Generated artifacts now have one local home only: `evals/workspace/`.

The durable part we keep in source control is the scenario/control definition surface:
- `evals.json` for the legacy behavioral suite
- `typescript-*/evals/*.scenarios.ts` for successor scenarios
- `evals/control-matrix.ts` for committed control coverage carried forward from the legacy local workspace
## Scoring rubric

| Score | Meaning |
|---|---|
| 0 | Wrong direction, or <30% of assertions passed |
| 1 | Right area but missed canonical decision; ≥30% assertions |
| 2 | Right primary skill and mostly correct; ≥60% assertions |
| 3 | Right primary skill, correct decision, ≥85% assertions |

The legacy behavioral suite above still uses this 0-3 rubric. The next-generation local scorer below uses derived 0-5 scores from atomic `must` / `mustNot` checks, so keep those two score scales separate during the migration.

## What `evals.json` contains

25 adversarial prompts across several categories:

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

## Next-generation pilot

The successor harness is being introduced incrementally. It does not replace `evals.json` yet.

Layout now has four layers:

```txt
evals/
  evals.types.ts        # shared scenario types + JSDoc mini-doc
  control-matrix.ts     # committed legacy control coverage
  run-evals.ts          # simple top-level runner
  check-invariants.ts   # structural gate
  lib/                  # report / scoring / grading helpers
  workspace/            # local generated artifacts (gitignored)

typescript-configs/
  evals/configs.scenarios.ts
typescript-boundaries/
  evals/boundaries.scenarios.ts
... one sibling evals/ folder per skill bundle
```

Simple run from `skills/typescript-skills/`:

```bash
node evals/run-evals.ts
```

That command:
- discovers all `typescript-*/evals/*.scenarios.ts`
- validates and summarizes them
- runs structural invariants too

Direct helper examples:

```bash
node evals/lib/report.ts typescript-configs/evals/configs.scenarios.ts
node evals/lib/report.ts typescript-boundaries/evals/boundaries.scenarios.ts
node evals/lib/prepare-grading.ts \
  --scenarios typescript-configs/evals/configs.scenarios.ts \
  --responses evals/workspace/runs/pilot-001/gold/responses.json \
  --out evals/workspace/runs/pilot-001/prompts
node evals/lib/score-local.ts \
  --scenarios typescript-configs/evals/configs.scenarios.ts \
  --grades evals/workspace/runs/pilot-001/gold/grades.json
```

`evals/lib/grading.ts` defines the atomic grader contract and prompt builder. `evals/lib/prepare-grading.ts` turns saved local responses into inspectable grading prompts. `evals/lib/score-local.ts` scores saved grade JSON against scenario manifests. None of these files call subagents or LLMs.

Design choices:
- scenario manifests live beside their owning skill bundles under `typescript-*/evals/*.scenarios.ts`
- scenario checks are atomic (`must` / `mustNot`) so regressions identify the lost behavior
- tiers (`P0`, `P1`, `P2`) keep gates proportional
- modes (`router`, `apply`, `bypass`, `exception`, `complexity`, `simplification`) map to real skill-use pressure
- the long-term benchmark compares baseline, gold, and candidate trees so rule simplification is measured against current good behavior, not only against no-skill baseline
- scenarios may declare difficulty (`obvious`, `mixed`, `hard`) so smoke gates can weigh easy vs grey-area prompts differently
- committed control coverage lives in `evals/control-matrix.ts`; raw prompts/responses/grades stay local under `evals/workspace/`

Keep the pilot small until `typescript-configs` and `typescript-boundaries` prove the shape is useful.
## Local run directory convention

The next harness keeps local artifacts inside the gitignored eval workspace:

```txt
evals/workspace/runs/<run-id>/
  baseline/
    responses.json
    grades.json
  gold/
    responses.json
    grades.json
  candidate/
    responses.json
    grades.json
  prompts/
  summary.json
  summary.md
```

`evals/lib/run-layout.ts` is the single place that defines these paths. Keep the first smoke runs manual and file-based before adding any subagent orchestration.

## Calibration and control checks

Do not trust a scenario only because the gold answer passes.
Committed control coverage now lives in `evals/control-matrix.ts`:

- gold control — should score high
- weak/plausible control — should score clearly lower
- wrong-owner control for P0 — should fail hard
- assertion-heavy control — catches answers that choose the right headline but still bless forbidden details

When a result is weak, triage in this order:
1. scenario wording
2. grader `must` / `mustNot`
3. rule wording
4. only then decide whether the skill needs more or less text
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

1. `node evals/check-invariants.ts` exits 0.
2. LLM-graded behavioral evals: every scenario scores at least 2/3.
3. Hard-gate prompts (any prompt tagged `hard-gate-bypass-attempt`) score 3/3.
4. With-skill mean is at least 2.5/3 as an aggregate health signal.
5. No new conflicts introduced since the last promotion (`git diff` against the last promoted snapshot).
