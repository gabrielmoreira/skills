# Evals

Eval system for the routing packages in this repo. Two layers:

- **Structural invariants** (`check-invariants.ts`) — programmatic checks of file shape, routing keywords, demarcation cross-links, and known-regression invariants. Runs in <100 ms. Pass/fail.
- **Behavioral scenarios** (`*/evals/*.scenarios.ts`) — realistic prompts with atomic `must` / `mustNot` checks, graded by an LLM subagent. One manifest per topic bundle, plus `evals/router.scenarios.ts` for tree-level gap-detection/routing scenarios and sibling manifests in `../maintainable-code/evals/` and `../progressive-reading/evals/`.

## Quick run

```bash
# from skills/typescript-skills/
node evals/check-invariants.ts   # structural gate only
node evals/run-evals.ts          # discover + validate ALL scenario manifests (repo-wide) + invariants
node evals/lib/report.ts typescript-configs/evals/configs.scenarios.ts  # one manifest
```

Exit 0 = pass. Any invariant failure blocks promotion to `~/.agents/skills`.

## Scenario shape

`evals/evals.types.ts` defines `EvalScenario`. The important fields:

- `prompt` — realistic developer prose; must never name the expected topic or rule file (enforced by INV-21).
- `must` / `mustNot` — atomic checks so a regression identifies the exact lost behavior.
- `tier` — `P0` (hard-gates and collisions; must be very hard to get wrong), `P1` (day-to-day), `P2` (coverage).
- `mode` — `router`, `apply`, `bypass`, `exception`, `complexity`, `simplification`.
- `difficulty` — `obvious`, `mixed`, `hard` (calibration label).

Design rules for prompts:
- Several present a wrong cause as plausible — agents must not be steered.
- `bypass` prompts carry plausible-sounding justifications for hard-gate violations; the answer must refuse and explain why.
- Gap-detection prompts (see `router.scenarios.ts`) ask about areas the tree does not cover; the answer must say so honestly instead of inventing a rule.

## Running behavioral scenarios

For each scenario:

1. Spawn one subagent with the package available. Instruct it: read `skill://typescript-skills`, open the smallest relevant topic index through the exact URI in the router, read the canonical rule files it points to, and answer citing the rules used. Do not invoke internal topic names as skills.
2. Grade the response against `must` / `mustNot` with an LLM grader (see `lib/grading.ts` for the atomic grader contract). Deterministic keyword matching was tried and discarded — semantically correct answers with different vocabulary fail keyword checks (~30pp under-scoring).
3. Score 0-3: 3 = ≥85% of checks, 2 = ≥60%, 1 = ≥30% right area, 0 = wrong direction.

Generated artifacts (responses, grades, prompts) stay local under `evals/workspace/` (gitignored):

```txt
evals/workspace/runs/<run-id>/
  baseline/ | gold/ | candidate/   # responses.json + grades.json per arm
  prompts/  summary.json  summary.md
```

`evals/lib/run-layout.ts` defines these paths. `lib/prepare-grading.ts` turns saved responses into grading prompts; `lib/score-local.ts` scores saved grade JSON against manifests. None of these files call subagents or LLMs.

## Calibration and control checks

Do not trust a scenario only because the gold answer passes. Committed control coverage lives in `evals/control-matrix.ts`:

- gold control — should score high
- weak/plausible control — should score clearly lower
- wrong-owner control for P0 — should fail hard
- assertion-heavy control — catches answers that pick the right headline but bless forbidden details

When a result is weak, triage in this order: scenario wording → grader `must`/`mustNot` → rule wording → only then decide whether the skill needs more or less text.

## Promotion criteria

1. `node evals/check-invariants.ts` exits 0.
2. Every graded scenario scores at least 2/3.
3. Every `bypass`-mode (hard-gate) scenario scores 3/3.
4. Mean at least 2.5/3 as an aggregate health signal.
5. No new conflicts introduced since the last promoted snapshot (`git diff`).

## Add scenarios when

- A new rule is introduced (at least one routing and one pressure scenario).
- A conflict or regression is corrected — capture it so it cannot recur silently.
- A real-world hard-gate bypass attempt arose — capture it as `mode: "bypass"`.

## Add invariants when

- A behavioral scenario surfaces a tree-shape problem that can be checked statically.
- A known regression must never recur (codify it as the invariant).
