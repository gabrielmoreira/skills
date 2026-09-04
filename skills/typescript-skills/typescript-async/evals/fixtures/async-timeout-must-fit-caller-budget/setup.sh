#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

git add package.json template.yaml src/http.ts src/handler.ts src/http.test.ts
git commit -qm "base: the code the question is about"
