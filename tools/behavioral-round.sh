#!/usr/bin/env bash
# The behavioral round the corpus is still missing, throttle-safe for a free
# stealth model. Run when the quota window resets -- a 429 that asks for days
# is a closed window, not a burst to space out.
#
#   bash tools/behavioral-round.sh [model]     default openrouter/stealth-alpha
#
# Three fixtures, both arms, one sample each, strictly sequential: the arm
# without the skill is the control that says whether the skill earns its load.
# Afterwards the streams are graded by the Jev backend of the scenario judge,
# so the only paid calls are cents of calibration.
set -euo pipefail
cd "$(dirname "$0")/.."

MODEL="${1:-openrouter/stealth-alpha}"
IDS=(pipeline-approval-removed-with-stale-runbook guard-removed-with-two-callers-left-behind correct-change-that-should-end-with-no-findings)
OUT=".local/astra/behavioral-round/$(date +%Y-%m-%d)"
mkdir -p "$OUT"

for id in "${IDS[@]}"; do
  echo "=== $id ==="
  node tools/run-activation.mjs --id "$id" --arm both --model "$MODEL" --samples 1 --concurrency 1 --record "$OUT"
done

echo "=== grading with Jev ==="
for arm in with without; do
  echo "--- $arm arm ---"
  node tools/judge.mjs --replay "$OUT" --arm "$arm" --backend jev
done

echo "recorded streams: $OUT"
echo "A screen or a grade is not a claim that the skill improves work; the two
arms on the same fixtures, read side by side, are the claim."
