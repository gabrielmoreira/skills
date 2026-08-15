#!/usr/bin/env bash
set -e
git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
mkdir -p .github/workflows
git add package.json src/index.js 2>/dev/null || true
git commit -qm "base" --allow-empty
git checkout -qb rate-limit-exports
git add -A
git commit -qm "feat: rate limit the export endpoint"
