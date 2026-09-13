#!/usr/bin/env bash
set -euo pipefail
# Build scratch space, used only inside this job.
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r dist "$tmp/dist"
du -sh "$tmp/dist"
