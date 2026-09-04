#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

git add package.json src
git commit -qm "base: five modules with three naming conventions between them"
