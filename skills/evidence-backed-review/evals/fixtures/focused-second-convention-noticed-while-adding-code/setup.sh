#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

# Everything is committed. The user has not changed anything yet: they are
# about to add a handler, and the two error shapes are already there.
git add package.json docs/standards.md src/errors.js src/handlers.js src/handlers.test.js src/index.js
git commit -qm "base: order and invoice handlers"
