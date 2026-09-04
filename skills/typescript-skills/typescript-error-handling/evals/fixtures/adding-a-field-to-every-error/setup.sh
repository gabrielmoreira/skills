#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

git add package.json docs/compliance-request.md src/errors.ts src/errors.test.ts
git commit -qm "base: the code the question is about"
