#!/usr/bin/env bash
set -e
git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
# Pre-existing code the change builds on.
git add package.json src/db.js src/log.js
git commit -qm "base: storage and logging helpers"
git branch -M main
git checkout -qb release/3
# release/3 moves too, so the two three-dot ranges differ: picking main drags
# this commit into the range under review.
printf 'export const RETENTION_DAYS = 30;\n' > src/retention.js
git add src/retention.js
git commit -qm "chore: retention constant on release/3"
# main moves on separately, so picking it as the base shows a spurious change.
git checkout -q main
mkdir -p src/reports
printf 'export function summary() {\n  return {};\n}\n' > src/reports/summary.js
git add src/reports/summary.js
git commit -qm "chore: unrelated report helper on main"
git checkout -q release/3
git checkout -qb task-412-create-export-job
git add -A -- . ':!setup.sh'
git commit -qm "feat: create export jobs"
