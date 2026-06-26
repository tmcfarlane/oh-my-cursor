#!/usr/bin/env bash
# beforeShellExecution hook — guards the agent's shell calls.
#
# Reads a JSON payload on stdin (fields: command, cwd, hook_event_name, ...) and prints a
# JSON decision on stdout per Cursor's hook protocol:
#   {"continue": <bool>, "permission": "allow|deny|ask", "userMessage": "...", "agentMessage": "..."}
#
# Blocks (deny) clearly destructive commands and commits that contain the anti-patterns
# Team Avatar agents are told never to introduce.
#
# Robustness notes (learned from validation on Cursor 3.8.23):
#  - Cursor runs hooks with the GUI app's PATH, which often LACKS /opt/homebrew/bin, so we
#    cannot assume `python3` or `jq` are on PATH. We try jq, then python3 at known absolute
#    paths, then /usr/bin/perl (always present on macOS). If the payload can't be parsed we
#    return "ask" (surface) rather than silently allowing.
#  - We cd into the payload's `cwd` before running git checks so `git diff --cached` resolves
#    in the agent's actual worktree.
#  - Pair with "failClosed": true in hooks.json so a script error denies instead of allowing.
#
# Env switches:
#   OMC_HOOKS_OBSERVE=1  run non-blocking: downgrade every deny to allow + an informational note.
#   OMC_HOOKS_DEBUG=1    append each invocation's command to hooks/last-invocation.log (proves firing).

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="$(cat)"

# --- Robust JSON string-field extraction (no reliance on PATH) ---
json_field() {
  local field="$1" data="$2" out py
  if command -v jq >/dev/null 2>&1; then
    if out="$(printf '%s' "$data" | jq -r --arg f "$field" '.[$f] // empty' 2>/dev/null)"; then
      printf '%s' "$out"; return 0
    fi
  fi
  for py in python3 /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
    if "$py" -c '' >/dev/null 2>&1; then
      if out="$(printf '%s' "$data" | "$py" -c "import sys,json;print(json.load(sys.stdin).get('$field',''))" 2>/dev/null)"; then
        printf '%s' "$out"; return 0
      fi
    fi
  done
  if [ -x /usr/bin/perl ]; then
    printf '%s' "$data" | /usr/bin/perl -0777 -ne 'if(/"'"$field"'"\s*:\s*"((?:[^"\\]|\\.)*)"/s){my $x=$1;$x=~s/\\n/\n/g;$x=~s/\\t/\t/g;$x=~s/\\(.)/$1/g;print $x}' 2>/dev/null
    return 0
  fi
  return 1
}

COMMAND="$(json_field command "$INPUT")"; PARSE_RC=$?
CWD="$(json_field cwd "$INPUT")"

if [ "${OMC_HOOKS_DEBUG:-}" = "1" ]; then
  printf '%s\t%s\n' "$(date '+%FT%T' 2>/dev/null)" "${COMMAND:-<unparsed>}" >> "$HERE/last-invocation.log" 2>/dev/null || true
fi

allow() { printf '{"continue": true, "permission": "allow"}\n'; exit 0; }
ask() { printf '{"continue": true, "permission": "ask", "userMessage": "%s", "agentMessage": "%s"}\n' "$1" "$1"; exit 0; }
decide() {
  local reason="$1"
  if [ "${OMC_HOOKS_OBSERVE:-}" = "1" ]; then
    printf '{"continue": true, "permission": "allow", "agentMessage": "[observe] would block: %s"}\n' "$reason"
    exit 0
  fi
  printf '{"continue": false, "permission": "deny", "userMessage": "Blocked by oh-my-cursor: %s", "agentMessage": "Denied by policy: %s. Adjust .cursor/hooks/guard-shell.sh or set OMC_HOOKS_OBSERVE=1 to override."}\n' "$reason" "$reason"
  exit 0
}

# Received a payload but couldn't parse the command -> surface instead of silently allowing.
if [ -n "$INPUT" ] && { [ "$PARSE_RC" -ne 0 ] || { [ -z "$COMMAND" ] && printf '%s' "$INPUT" | grep -q '"command"'; }; }; then
  [ "${OMC_HOOKS_OBSERVE:-}" = "1" ] && allow
  ask "oh-my-cursor guard could not parse the shell command; review before running"
fi

[ -z "$COMMAND" ] && allow

# Resolve git checks in the agent's real worktree.
if [ -n "$CWD" ] && [ -d "$CWD" ]; then cd "$CWD" 2>/dev/null || true; fi

# --- Destructive command denylist (unambiguous, always guarded) ---
case "$COMMAND" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf /*"*|*":(){ :|:& };:"*) decide "destructive filesystem command" ;;
  *"git push"*"--force"*"main"*|*"git push"*"--force"*"master"*|*"git push -f"*"main"*|*"git push -f"*"master"*) decide "force-push to a protected branch" ;;
  *"git reset --hard origin/main"*|*"git reset --hard origin/master"*) decide "hard reset of a shared branch" ;;
  *"chmod -R 777 /"*|*"mkfs"*|*"dd if="*"of=/dev/"*) decide "system-level destructive command" ;;
esac

# --- Commit anti-pattern guard ---
case "$COMMAND" in
  *"git commit"*)
    if [ -x "$HERE/pre-commit-check.sh" ]; then
      if ! OUT="$("$HERE/pre-commit-check.sh" 2>&1)"; then
        decide "commit contains forbidden anti-patterns ($(printf '%s' "$OUT" | tr '\n' ' ' | cut -c1-160))"
      fi
    fi
    ;;
esac

allow
