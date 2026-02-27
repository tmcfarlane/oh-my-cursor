#!/usr/bin/env bash
# Post-edit hook: automatically run lints on changed files after agent edits.
# Place in .cursor/hooks/ and configure via Cursor's hook system.
#
# This surfaces lint errors immediately rather than relying on agents
# to remember to run ReadLints after every change.

set -euo pipefail

CHANGED_FILES=("$@")

if [ ${#CHANGED_FILES[@]} -eq 0 ]; then
  exit 0
fi

for file in "${CHANGED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    continue
  fi

  ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx >/dev/null 2>&1; then
        npx eslint --no-error-on-unmatched-pattern "$file" 2>/dev/null || true
      fi
      ;;
    py)
      if command -v ruff >/dev/null 2>&1; then
        ruff check "$file" 2>/dev/null || true
      elif command -v flake8 >/dev/null 2>&1; then
        flake8 "$file" 2>/dev/null || true
      fi
      ;;
    rs)
      if command -v cargo >/dev/null 2>&1; then
        cargo clippy --message-format=short 2>/dev/null || true
      fi
      ;;
    go)
      if command -v golangci-lint >/dev/null 2>&1; then
        golangci-lint run "$file" 2>/dev/null || true
      fi
      ;;
  esac
done
