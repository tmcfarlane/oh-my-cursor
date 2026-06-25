#!/usr/bin/env bash
# beforeShellExecution hook — guards the agent's shell calls.
#
# Reads a JSON payload on stdin (fields: command, cwd, hook_event_name, ...),
# and prints a JSON decision on stdout per Cursor's hook protocol:
#   {"continue": <bool>, "permission": "allow|deny|ask", "userMessage": "...", "agentMessage": "..."}
#
# Blocks (deny) clearly destructive commands and commits that contain the
# anti-patterns Team Avatar agents are told never to introduce.
#
# Set OMC_HOOKS_OBSERVE=1 to run in observe-only mode: nothing is blocked,
# decisions are downgraded to "allow" with an informational agentMessage.
# Use this to validate the hook fires correctly before trusting it to block.

set -uo pipefail

INPUT="$(cat)"

# Extract the command string from the JSON payload (python3 is reliably present on macOS).
COMMAND="$(printf '%s' "$INPUT" | python3 -c 'import sys, json
try:
    print(json.load(sys.stdin).get("command", ""))
except Exception:
    print("")' 2>/dev/null)"

allow() { printf '{"continue": true, "permission": "allow"}\n'; exit 0; }

decide() {
  # $1 = reason. Honors observe mode.
  local reason="$1"
  if [ "${OMC_HOOKS_OBSERVE:-}" = "1" ]; then
    printf '{"continue": true, "permission": "allow", "agentMessage": "[observe] would block: %s"}\n' "$reason"
    exit 0
  fi
  printf '{"continue": false, "permission": "deny", "userMessage": "Blocked by oh-my-cursor: %s", "agentMessage": "Denied by policy: %s. Adjust .cursor/hooks/guard-shell.sh or set OMC_HOOKS_OBSERVE=1 to override."}\n' "$reason" "$reason"
  exit 0
}

[ -z "$COMMAND" ] && allow

# --- Destructive command denylist (unambiguous, always guarded) ---
case "$COMMAND" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf /*"*|*":(){ :|:& };:"*) decide "destructive filesystem command" ;;
  *"git push"*"--force"*"main"*|*"git push"*"--force"*"master"*|*"git push -f"*"main"*|*"git push -f"*"master"*) decide "force-push to a protected branch" ;;
  *"git reset --hard origin/main"*|*"git reset --hard origin/master"*) decide "hard reset of a shared branch" ;;
  *"chmod -R 777 /"*|*"mkfs"*|*"dd if="*"of=/dev/"*) decide "system-level destructive command" ;;
esac

# --- Commit anti-pattern guard: run the existing checker on git commit ---
case "$COMMAND" in
  *"git commit"*)
    HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -x "$HERE/pre-commit-check.sh" ]; then
      if ! OUT="$("$HERE/pre-commit-check.sh" 2>&1)"; then
        decide "commit contains forbidden anti-patterns ($(printf '%s' "$OUT" | tr '\n' ' ' | cut -c1-160))"
      fi
    fi
    ;;
esac

allow
