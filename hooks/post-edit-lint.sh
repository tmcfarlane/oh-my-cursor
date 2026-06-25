#!/usr/bin/env bash
# afterFileEdit hook — lints a file right after the agent edits it.
#
# Reads a JSON payload on stdin (fields: file_path, edits, hook_event_name, ...).
# afterFileEdit is INFORMATIONAL: Cursor ignores the output, so this hook only
# surfaces lint findings; it cannot (and should not) block the edit.
#
# Surfaces lint errors immediately rather than relying on agents to remember
# to run ReadLints after every change.

set -uo pipefail

INPUT="$(cat)"

FILE="$(printf '%s' "$INPUT" | python3 -c 'import sys, json
try:
    print(json.load(sys.stdin).get("file_path", ""))
except Exception:
    print("")' 2>/dev/null)"

[ -z "$FILE" ] && exit 0
[ -f "$FILE" ] || exit 0

ext="${FILE##*.}"

case "$ext" in
  ts|tsx|js|jsx)
    if command -v npx >/dev/null 2>&1; then
      npx eslint --no-error-on-unmatched-pattern "$FILE" 2>/dev/null || true
    fi
    ;;
  py)
    if command -v ruff >/dev/null 2>&1; then
      ruff check "$FILE" 2>/dev/null || true
    elif command -v flake8 >/dev/null 2>&1; then
      flake8 "$FILE" 2>/dev/null || true
    fi
    ;;
  rs)
    command -v cargo >/dev/null 2>&1 && cargo clippy --message-format=short 2>/dev/null || true
    ;;
  go)
    command -v golangci-lint >/dev/null 2>&1 && golangci-lint run "$FILE" 2>/dev/null || true
    ;;
esac

exit 0
