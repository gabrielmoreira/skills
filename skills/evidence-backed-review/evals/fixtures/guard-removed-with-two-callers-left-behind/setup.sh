#!/usr/bin/env bash
set -e
# A private scratch dir: arms of one comparison run at the same time, and a
# shared path let one setup delete the copies the other had not restored yet.
keep=$(mktemp -d)
trap 'rm -rf "$keep"' EXIT
git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
# Keep the proposed versions, then plant the base: the shared helper caps the
# page size, and all three callers rely on it.
cp src/limits.js "$keep"/proposed-limits.js
cp src/reports.js "$keep"/proposed-reports.js
cat > src/limits.js <<'JS'
// Shared page-size coercion.
export function clampPageSize(n) {
  return Math.min(Number(n) || 25, 100);
}
JS
cat > src/reports.js <<'JS'
import { clampPageSize } from "./limits.js";
import { db } from "./db.js";

export async function listReports(req) {
  const size = clampPageSize(req.query.size);
  return db.query("select * from reports where account = ? limit ?", [req.account.id, size]);
}
JS
git add -A -- . ':!setup.sh' ':!PULL_REQUEST.md'
git commit -qm "base: shared page size cap"
git branch -M main
git checkout -qb move-the-cap
# The change under review: the cap leaves the helper for one caller only.
cp "$keep"/proposed-limits.js src/limits.js
cp "$keep"/proposed-reports.js src/reports.js
git add -A -- . ':!setup.sh'
git commit -qm "refactor: move the page size cap into the reports route"
