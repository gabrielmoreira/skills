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
# Hub-spawned shells can be WSL bash without node; git-bash can lack the mise
# shims. Resolve once, fall back to the Windows install through /mnt/c.
NODE="$(command -v node || true)"
[ -n "$NODE" ] || NODE="/mnt/c/mise/node/26.9.0/node.exe"
[ -x "$NODE" ] || NODE="/c/mise/node/26.9.0/node"
command -v node >/dev/null 2>&1 || export PATH="$(dirname "$NODE"):$PATH"
# The hub spawn does not carry the user's shell profile; the grading step
# needs the Typesafe key, so lift it from the PowerShell profile if missing.
[ -n "${TYPESAFE_AI_API_KEY:-}" ] || TYPESAFE_AI_API_KEY="$(grep -h -m1 -oP "TYPESAFE_AI_API_KEY\s*=\s*'\K[^']+" /mnt/c/Users/Gabriel/Documents/PowerShell/Microsoft.PowerShell_profile.ps1 "$HOME/Documents/PowerShell/Microsoft.PowerShell_profile.ps1" 2>/dev/null | head -1)"
export TYPESAFE_AI_API_KEY

MODEL="${1:-openrouter/stealth-alpha}"
IDS=(pipeline-approval-removed-with-stale-runbook guard-removed-with-two-callers-left-behind correct-change-that-should-end-with-no-findings)
OUT=".local/astra/behavioral-round/$(date +%Y-%m-%d)"
mkdir -p "$OUT"

for id in "${IDS[@]}"; do
  echo "=== $id ==="
  "$NODE" tools/run-activation.mjs --id "$id" --arm both --model "$MODEL" --samples 1 --concurrency 1 --record "$OUT"
done

echo "=== grading with Jev ==="
for arm in with without; do
  echo "--- $arm arm ---"
  "$NODE" tools/judge.mjs --replay "$OUT" --arm "$arm" --backend jev
done

echo "recorded streams: $OUT"
echo "A screen or a grade is not a claim that the skill improves work; the two
arms on the same fixtures, read side by side, are the claim."
