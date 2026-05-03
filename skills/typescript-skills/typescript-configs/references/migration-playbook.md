# Migration Playbook

## Goal

Move from scattered config reads to a cleaner boundary without losing confidence.

## Recommended path

1. Find every raw config read.
2. Write one characterization test around the current behavior.
3. Introduce one seam that gathers the old values.
4. Keep behavior the same first.
5. Add parsing inside the seam.
6. Move callers toward validated config one module at a time.

## Watch-outs

- `||` and `??` do not mean the same thing.
- `process.env.FOO!` often hides a missing-value bug.
- a config rewrite can accidentally change behavior even if the types look better.

## Good migration sign

After each step, fewer files should read raw env directly.
