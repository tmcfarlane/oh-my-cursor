#!/usr/bin/env bash
# Pre-commit hook: enforce hard constraints before any commit.
# Place in .cursor/hooks/ and configure via Cursor's hook system.
#
# Catches anti-patterns that agents are instructed never to use,
# providing system-level enforcement as a safety net.

set -euo pipefail

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

VIOLATIONS=0

check_pattern() {
  local pattern="$1"
  local label="$2"
  local file="$3"

  if grep -qn "$pattern" "$file" 2>/dev/null; then
    echo "VIOLATION in $file: $label"
    grep -n "$pattern" "$file" 2>/dev/null | head -5
    echo ""
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

for file in $STAGED_FILES; do
  if [ ! -f "$file" ]; then
    continue
  fi

  ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      check_pattern "as any" "Type safety: 'as any' suppresses type checking" "$file"
      check_pattern "@ts-ignore" "Type safety: '@ts-ignore' suppresses errors" "$file"
      check_pattern "@ts-expect-error" "Type safety: '@ts-expect-error' suppresses errors" "$file"
      check_pattern "catch.*{[[:space:]]*}" "Error handling: empty catch block" "$file"
      ;;
    py)
      check_pattern "except:$" "Error handling: bare except clause" "$file"
      check_pattern "pass$" "Error handling: potential empty except/pass" "$file"
      ;;
  esac
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "Found $VIOLATIONS constraint violation(s). Fix before committing."
  exit 1
fi
