#!/usr/bin/env bash
{ # ensure entire script is downloaded before execution

set -euo pipefail

VERSION="0.2.0"
CURSOR_MODE_LABEL="Team Avatar (Cursor 2.5+)"

AGENT_FILES=(aang.md sokka.md katara.md zuko.md toph.md appa.md momo.md iroh.md)
PROTOCOL_FILES=(protocols/team-avatar.md)
COMMAND_FILES=(plan.md build.md search.md fix.md tasks.md scout.md cactus-juice.md doc.md)
HOOK_FILES=(post-edit-lint.sh pre-commit-check.sh)
RULE_FILE="orchestrator.mdc"
SKILL_DIRS=(
  architect
  codebase-search
  create-an-asset
  debugging
  design-patterns-implementation
  docs-write
  documentation-engineer
  documentation-writing
  exploring-codebases
  frontend-builder
  implementing-figma-designs
  mgrep-code-search
  planning
  refactoring
  refactoring-patterns
  technical-roadmap-planning
  vercel-composition-patterns
  vercel-react-best-practices
  web-design-guidelines
)

LEGACY_AGENT_FILES=(atlas.md explore.md generalPurpose.md hephaestus.md librarian.md metis.md momus.md multimodal-looker.md oracle.md prometheus.md sisyphus.md)
LEGACY_PROTOCOL_FILES=(protocols/swarm-coordinator.md)

FORCE=false
DRY_RUN=false
VERBOSE=false
SCOPE="user"
UNINSTALL=false
DISABLE=false
ENABLE=false
ALSO_CLAUDE=false
ALSO_CODEX=false
WITH_SKILLS=true

WORK_DIR=""

BOLD="" DIM="" GREEN="" RED="" YELLOW="" RESET=""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

cleanup() {
  if [ -n "$WORK_DIR" ] && [ -d "$WORK_DIR" ]; then
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

setup_colors() {
  if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    BOLD=$'\033[1m'
    DIM=$'\033[2m'
    GREEN=$'\033[0;32m'
    RED=$'\033[0;31m'
    YELLOW=$'\033[0;33m'
    RESET=$'\033[0m'
  fi
}

log() {
  printf '%s\n' "$*"
}

log_verbose() {
  if [ "$VERBOSE" = true ]; then
    printf '%s%s%s\n' "$DIM" "$*" "$RESET"
  fi
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
${BOLD}oh-my-cursor installer${RESET} v${VERSION}
${DIM}${CURSOR_MODE_LABEL}${RESET}

Install Team Avatar agent configurations for Cursor.

${BOLD}USAGE${RESET}
  curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh | bash
  curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh | bash -s -- [OPTIONS]
  bash install.sh [OPTIONS]

${BOLD}OPTIONS${RESET}
  --user          Install to user scope (~/.cursor/) [default]
  --project       Install to project scope (./.cursor/)
  --claude        Also install to .claude/agents/ for Claude Code compatibility
  --codex         Also install to .codex/agents/ for Codex compatibility
  --no-skills     Skip installing bundled agent skills (skills are installed by default)
  -f, --force     Overwrite existing files
  -n, --dry-run   Show what would be done without making changes
  -v, --verbose   Enable verbose output
  --uninstall     Remove installed agent and rule files
  --disable       Disable orchestration (rename rule so Cursor stops applying it)
  --enable        Re-enable orchestration (rename rule back)
  -h, --help      Show this help message
  --version       Print version

${BOLD}EXAMPLES${RESET}
  bash install.sh
  bash install.sh --project
  bash install.sh --force
  bash install.sh --dry-run
  bash install.sh --uninstall
  bash install.sh --disable
  bash install.sh --enable
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing & directory resolution
# ---------------------------------------------------------------------------

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -f|--force)    FORCE=true ;;
      -n|--dry-run)  DRY_RUN=true ;;
      -v|--verbose)  VERBOSE=true ;;
      --user)        SCOPE="user" ;;
      --project)     SCOPE="project" ;;
      --claude)       ALSO_CLAUDE=true ;;
      --codex)        ALSO_CODEX=true ;;
      --with-skills)  WITH_SKILLS=true ;;  # no-op for backwards compatibility
      --no-skills)    WITH_SKILLS=false ;;
      --uninstall)    UNINSTALL=true ;;
      --disable)     DISABLE=true ;;
      --enable)      ENABLE=true ;;
      -h|--help)     usage; exit 0 ;;
      --version)     printf '%s\n' "$VERSION"; exit 0 ;;
      *)
        log "${RED}Unknown option: $1${RESET}" >&2
        log "" >&2
        usage >&2
        exit 1
        ;;
    esac
    shift
  done
}

resolve_dirs() {
  if [ "$SCOPE" = "user" ]; then
    CURSOR_DIR="${HOME}/.cursor"
  else
    CURSOR_DIR="./.cursor"
  fi
  AGENTS_DIR="${CURSOR_DIR}/agents"
  RULES_DIR="${CURSOR_DIR}/rules"
  COMMANDS_DIR="${CURSOR_DIR}/commands"
  HOOKS_DIR="${CURSOR_DIR}/hooks"
  SKILLS_DIR="${CURSOR_DIR}/skills"
}

RULE_FILE_DISABLED="${RULE_FILE}.disabled"

# Toggle orchestration rule so Cursor loads it (--enable) or ignores it (--disable).
toggle_orchestrator_rule() {
  local rule_path="${RULES_DIR}/${RULE_FILE}"
  local disabled_path="${RULES_DIR}/${RULE_FILE_DISABLED}"

  log "${BOLD}oh-my-cursor${RESET} v${VERSION}"
  log "${DIM}${CURSOR_MODE_LABEL}${RESET}"
  log ""

  if [ "$DISABLE" = true ]; then
    if [ -f "$rule_path" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${YELLOW}[would disable]${RESET} ${RULE_FILE} in ${RULES_DIR}"
      else
        mv "$rule_path" "$disabled_path"
        log "  ${GREEN}[disabled]${RESET} ${RULE_FILE} — orchestration off. Agents and commands still available."
      fi
    else
      if [ -f "$disabled_path" ]; then
        log "  ${DIM}Already disabled${RESET} (${RULE_FILE_DISABLED} present)"
      else
        log "  ${YELLOW}No rule file found${RESET} at ${rule_path}"
      fi
    fi
  else
    if [ -f "$disabled_path" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${YELLOW}[would enable]${RESET} ${RULE_FILE} in ${RULES_DIR}"
      else
        mv "$disabled_path" "$rule_path"
        log "  ${GREEN}[enabled]${RESET} ${RULE_FILE} — Team Avatar orchestration on."
      fi
    else
      if [ -f "$rule_path" ]; then
        log "  ${DIM}Already enabled${RESET} (${RULE_FILE} present)"
      else
        log "  ${YELLOW}No disabled rule found${RESET} at ${disabled_path}"
      fi
    fi
  fi
  log ""
}

# ---------------------------------------------------------------------------
# Embedded source files (all 12 agent/rule files)
# ---------------------------------------------------------------------------

SOURCE_BASE_URL_DEFAULT="https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main"
# Override for forks/dev:
#   OH_MY_CURSOR_SOURCE_BASE_URL="https://raw.githubusercontent.com/<you>/<repo>/<ref>" bash install.sh
OH_MY_CURSOR_SOURCE_BASE_URL="${OH_MY_CURSOR_SOURCE_BASE_URL:-$SOURCE_BASE_URL_DEFAULT}"

get_script_dir() {
  local src="${BASH_SOURCE[0]:-}"
  if [ -n "$src" ] && [ -f "$src" ]; then
    (cd "$(dirname "$src")" && pwd)
    return 0
  fi
  return 1
}

copy_sources_from_local_repo() {
  local out_dir="$1"
  local script_dir

  script_dir="$(get_script_dir)" || return 1
  [ -d "${script_dir}/agents" ] || return 1
  [ -d "${script_dir}/rules" ] || return 1

  local file
  for file in "${AGENT_FILES[@]}"; do
    cp "${script_dir}/agents/${file}" "${out_dir}/${file}" || return 1
  done

  for file in "${PROTOCOL_FILES[@]}"; do
    mkdir -p "${out_dir}/$(dirname "$file")"
    cp "${script_dir}/agents/${file}" "${out_dir}/${file}" || return 1
  done

  cp "${script_dir}/rules/${RULE_FILE}" "${out_dir}/${RULE_FILE}" || return 1

  if [ -d "${script_dir}/commands" ]; then
    mkdir -p "${out_dir}/commands"
    for file in "${COMMAND_FILES[@]}"; do
      cp "${script_dir}/commands/${file}" "${out_dir}/commands/${file}" || return 1
    done
  fi

  if [ -d "${script_dir}/hooks" ]; then
    mkdir -p "${out_dir}/hooks"
    for file in "${HOOK_FILES[@]}"; do
      cp "${script_dir}/hooks/${file}" "${out_dir}/hooks/${file}" || return 1
    done
  fi

  if [ -d "${script_dir}/skills" ]; then
    cp -r "${script_dir}/skills" "${out_dir}/skills" || return 1
  fi

  return 0
}

download_sources_from_github() {
  local out_dir="$1"

  if ! command -v curl >/dev/null 2>&1; then
    log_verbose "curl not found; cannot download sources"
    return 1
  fi

  local base="$OH_MY_CURSOR_SOURCE_BASE_URL"
  local file url

  for file in "${AGENT_FILES[@]}"; do
    url="${base}/agents/${file}"
    curl -fsSL "$url" -o "${out_dir}/${file}" || return 1
  done

  for file in "${PROTOCOL_FILES[@]}"; do
    mkdir -p "${out_dir}/$(dirname "$file")"
    url="${base}/agents/${file}"
    curl -fsSL "$url" -o "${out_dir}/${file}" || return 1
  done

  url="${base}/rules/${RULE_FILE}"
  curl -fsSL "$url" -o "${out_dir}/${RULE_FILE}" || return 1

  mkdir -p "${out_dir}/commands"
  for file in "${COMMAND_FILES[@]}"; do
    url="${base}/commands/${file}"
    curl -fsSL "$url" -o "${out_dir}/commands/${file}" || return 1
  done

  mkdir -p "${out_dir}/hooks"
  for file in "${HOOK_FILES[@]}"; do
    url="${base}/hooks/${file}"
    curl -fsSL "$url" -o "${out_dir}/hooks/${file}" || return 1
  done

  local manifest_url="${base}/skills/MANIFEST"
  local manifest_tmp
  manifest_tmp="$(mktemp)"
  if curl -fsSL "$manifest_url" -o "$manifest_tmp" 2>/dev/null; then
    mkdir -p "${out_dir}/skills"
    while IFS= read -r skill_file || [ -n "$skill_file" ]; do
      [ -z "$skill_file" ] && continue
      mkdir -p "${out_dir}/skills/$(dirname "$skill_file")"
      curl -fsSL "${base}/skills/${skill_file}" -o "${out_dir}/skills/${skill_file}" || true
    done < "$manifest_tmp"
    cp "$manifest_tmp" "${out_dir}/skills/MANIFEST"
  fi
  rm -f "$manifest_tmp"

  return 0
}

create_source_files() {
  local dir="$1"
  mkdir -p "$dir"

  if copy_sources_from_local_repo "$dir"; then
    log_verbose "Using local repo sources"
    return 0
  fi

  if download_sources_from_github "$dir"; then
    log_verbose "Downloaded sources from ${OH_MY_CURSOR_SOURCE_BASE_URL}"
    return 0
  fi

  log "${RED}Failed to acquire source files.${RESET}" >&2
  log "${DIM}Tried local repo checkout and GitHub raw download.${RESET}" >&2
  log "${DIM}Override the download base with OH_MY_CURSOR_SOURCE_BASE_URL=...${RESET}" >&2
  return 1
}

# ---------------------------------------------------------------------------
# Install a set of files from src_dir to dest_dir
# ---------------------------------------------------------------------------

install_file_set() {
  local src_dir="$1"
  local dest_dir="$2"
  local label="$3"
  shift 3
  local files=("$@")
  local installed=0
  local skipped=0
  local updated=0
  local failed=0

  if [ ${#files[@]} -eq 0 ]; then
    return 0
  fi

  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$dest_dir"
  fi

  log "Installing ${label} to ${BOLD}${dest_dir}${RESET}"
  log ""

  local file src dest
  for file in "${files[@]}"; do
    src="${src_dir}/${file}"
    dest="${dest_dir}/${file}"

    if [ ! -f "$src" ]; then
      log_verbose "  ${DIM}[skip]${RESET} ${file} (source not found)"
      continue
    fi

    local dest_subdir
    dest_subdir="$(dirname "$dest")"
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$dest_subdir"
    fi

    if [ ! -f "$dest" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${GREEN}[new]${RESET} ${file}"
      else
        if cp "$src" "$dest" 2>/dev/null; then
          log "  ${GREEN}[installed]${RESET} ${file}"
        else
          log "  ${RED}[failed]${RESET} ${file}"
          failed=$((failed + 1))
          continue
        fi
      fi
      installed=$((installed + 1))
    elif cmp -s "$src" "$dest"; then
      log "  ${DIM}[unchanged]${RESET} ${file}"
      skipped=$((skipped + 1))
    elif [ "$FORCE" = true ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${YELLOW}[update]${RESET} ${file}"
      else
        if cp "$src" "$dest" 2>/dev/null; then
          log "  ${YELLOW}[updated]${RESET} ${file}"
        else
          log "  ${RED}[failed]${RESET} ${file}"
          failed=$((failed + 1))
          continue
        fi
      fi
      updated=$((updated + 1))
    else
      log "  ${YELLOW}[skipped]${RESET} ${file} ${DIM}(use --force to overwrite)${RESET}"
      skipped=$((skipped + 1))
    fi
  done

  log ""
  return $failed
}

# ---------------------------------------------------------------------------
# Migrate legacy agent files (Greek mythology -> ATLA)
# ---------------------------------------------------------------------------

migrate_legacy_agents() {
  local agents_dir="$1"
  local migrated=0

  for file in "${LEGACY_AGENT_FILES[@]}"; do
    local target="${agents_dir}/${file}"
    if [ -f "$target" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${YELLOW}[migrate]${RESET} removing legacy ${file}"
      else
        rm -f "$target"
        log "  ${YELLOW}[migrated]${RESET} removed legacy ${file}"
      fi
      migrated=$((migrated + 1))
    fi
  done

  for file in "${LEGACY_PROTOCOL_FILES[@]}"; do
    local target="${agents_dir}/${file}"
    if [ -f "$target" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${YELLOW}[migrate]${RESET} removing legacy ${file}"
      else
        rm -f "$target"
        log "  ${YELLOW}[migrated]${RESET} removed legacy ${file}"
      fi
      migrated=$((migrated + 1))
    fi
  done

  if [ "$migrated" -gt 0 ]; then
    log ""
    log "  ${YELLOW}Migrated from v0.1 (Greek mythology) to v0.2 (Team Avatar)${RESET}"
    log ""
  fi
}

# ---------------------------------------------------------------------------
# Install to a specific tool directory (cursor, claude, or codex)
# ---------------------------------------------------------------------------

install_to_dir() {
  local cursor_dir="$1"
  local agents_dir="${cursor_dir}/agents"
  local rules_dir="${cursor_dir}/rules"
  local commands_dir="${cursor_dir}/commands"
  local hooks_dir="${cursor_dir}/hooks"

  migrate_legacy_agents "$agents_dir"

  install_file_set "$WORK_DIR" "$agents_dir" "agents" "${AGENT_FILES[@]}"
  install_file_set "$WORK_DIR" "$agents_dir" "protocols" "${PROTOCOL_FILES[@]}"
  install_file_set "${WORK_DIR}/commands" "$commands_dir" "commands" "${COMMAND_FILES[@]}"
  install_file_set "${WORK_DIR}/hooks" "$hooks_dir" "hooks" "${HOOK_FILES[@]}"

  # Install rule file
  log "Installing rules to ${BOLD}${rules_dir}${RESET}"
  log ""

  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$rules_dir"
  fi

  local src="${WORK_DIR}/${RULE_FILE}"
  local dest="${rules_dir}/${RULE_FILE}"

  if [ ! -f "$dest" ]; then
    if [ "$DRY_RUN" = true ]; then
      log "  ${GREEN}[new]${RESET} ${RULE_FILE}"
    else
      cp "$src" "$dest" 2>/dev/null && log "  ${GREEN}[installed]${RESET} ${RULE_FILE}" || log "  ${RED}[failed]${RESET} ${RULE_FILE}"
    fi
  elif cmp -s "$src" "$dest"; then
    log "  ${DIM}[unchanged]${RESET} ${RULE_FILE}"
  elif [ "$FORCE" = true ]; then
    if [ "$DRY_RUN" = true ]; then
      log "  ${YELLOW}[update]${RESET} ${RULE_FILE}"
    else
      cp "$src" "$dest" 2>/dev/null && log "  ${YELLOW}[updated]${RESET} ${RULE_FILE}" || log "  ${RED}[failed]${RESET} ${RULE_FILE}"
    fi
  else
    log "  ${YELLOW}[skipped]${RESET} ${RULE_FILE} ${DIM}(use --force to overwrite)${RESET}"
  fi
  log ""
}

# ---------------------------------------------------------------------------
# Main install logic
# ---------------------------------------------------------------------------

install_agents() {
  local src_dir="$1"

  log "Installing to ${BOLD}${CURSOR_DIR}${RESET}"
  log ""
  install_to_dir "$CURSOR_DIR"

  if [ "$ALSO_CLAUDE" = true ]; then
    local claude_dir
    if [ "$SCOPE" = "user" ]; then
      claude_dir="${HOME}/.claude"
    else
      claude_dir="./.claude"
    fi
    log "${DIM}Also installing to ${claude_dir} (Claude Code compatibility)${RESET}"
    log ""
    install_to_dir "$claude_dir"
  fi

  if [ "$ALSO_CODEX" = true ]; then
    local codex_dir
    if [ "$SCOPE" = "user" ]; then
      codex_dir="${HOME}/.codex"
    else
      codex_dir="./.codex"
    fi
    log "${DIM}Also installing to ${codex_dir} (Codex compatibility)${RESET}"
    log ""
    install_to_dir "$codex_dir"
  fi

  log "${BOLD}Summary${RESET}"
  log "  ${DIM}Mode: ${CURSOR_MODE_LABEL}${RESET}"
  if [ "$WITH_SKILLS" = true ]; then
    log "  ${GREEN}Agents: ${#AGENT_FILES[@]} | Commands: ${#COMMAND_FILES[@]} | Hooks: ${#HOOK_FILES[@]} | Skills: ${#SKILL_DIRS[@]}${RESET}"
  else
    log "  ${GREEN}Agents: ${#AGENT_FILES[@]} | Commands: ${#COMMAND_FILES[@]} | Hooks: ${#HOOK_FILES[@]} | Skills: skipped${RESET}"
  fi
  log ""
}

# ---------------------------------------------------------------------------
# Uninstall logic
# ---------------------------------------------------------------------------

uninstall_agents() {
  log "${BOLD}oh-my-cursor${RESET} v${VERSION}"
  log "${DIM}${CURSOR_MODE_LABEL}${RESET}"
  log ""

  if [ "$DRY_RUN" = true ]; then
    log "${YELLOW}Dry run mode -- no changes will be made${RESET}"
    log ""
  fi

  local removed=0
  local file target

  log "Removing agents from ${BOLD}${AGENTS_DIR}${RESET}"
  log ""

  for file in "${AGENT_FILES[@]}" "${LEGACY_AGENT_FILES[@]}"; do
    target="${AGENTS_DIR}/${file}"
    if [ -f "$target" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${RED}[remove]${RESET} ${file}"
      else
        rm -f "$target"
        log "  ${RED}[removed]${RESET} ${file}"
      fi
      removed=$((removed + 1))
    fi
  done

  for file in "${PROTOCOL_FILES[@]}" "${LEGACY_PROTOCOL_FILES[@]}"; do
    target="${AGENTS_DIR}/${file}"
    if [ -f "$target" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${RED}[remove]${RESET} ${file}"
      else
        rm -f "$target"
        log "  ${RED}[removed]${RESET} ${file}"
      fi
      removed=$((removed + 1))
    fi
  done

  if [ -d "${AGENTS_DIR}/protocols" ]; then
    [ "$DRY_RUN" = false ] && rmdir "${AGENTS_DIR}/protocols" 2>/dev/null || true
  fi

  log ""
  log "Removing commands from ${BOLD}${COMMANDS_DIR}${RESET}"
  log ""

  for file in "${COMMAND_FILES[@]}"; do
    target="${COMMANDS_DIR}/${file}"
    if [ -f "$target" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${RED}[remove]${RESET} ${file}"
      else
        rm -f "$target"
        log "  ${RED}[removed]${RESET} ${file}"
      fi
      removed=$((removed + 1))
    fi
  done

  log ""
  log "Removing hooks from ${BOLD}${HOOKS_DIR}${RESET}"
  log ""

  for file in "${HOOK_FILES[@]}"; do
    target="${HOOKS_DIR}/${file}"
    if [ -f "$target" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${RED}[remove]${RESET} ${file}"
      else
        rm -f "$target"
        log "  ${RED}[removed]${RESET} ${file}"
      fi
      removed=$((removed + 1))
    fi
  done

  log ""
  log "Removing rules from ${BOLD}${RULES_DIR}${RESET}"
  log ""

  target="${RULES_DIR}/${RULE_FILE}"
  if [ -f "$target" ]; then
    if [ "$DRY_RUN" = true ]; then
      log "  ${RED}[remove]${RESET} ${RULE_FILE}"
    else
      rm -f "$target"
      log "  ${RED}[removed]${RESET} ${RULE_FILE}"
    fi
    removed=$((removed + 1))
  fi

  target="${RULES_DIR}/${RULE_FILE_DISABLED}"
  if [ -f "$target" ]; then
    if [ "$DRY_RUN" = true ]; then
      log "  ${RED}[remove]${RESET} ${RULE_FILE_DISABLED}"
    else
      rm -f "$target"
      log "  ${RED}[removed]${RESET} ${RULE_FILE_DISABLED}"
    fi
    removed=$((removed + 1))
  fi

  log ""
  log "Removing skills from ${BOLD}${SKILLS_DIR}${RESET}"
  log ""

  local skill skill_dir
  for skill in "${SKILL_DIRS[@]}"; do
    skill_dir="${SKILLS_DIR}/${skill}"
    if [ -d "$skill_dir" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${RED}[remove]${RESET} ${skill}/"
      else
        rm -rf "$skill_dir"
        log "  ${RED}[removed]${RESET} ${skill}/"
      fi
      removed=$((removed + 1))
    fi
  done

  log ""
  log "${BOLD}Summary${RESET}"
  log "  ${DIM}Mode: ${CURSOR_MODE_LABEL}${RESET}"
  if [ "$removed" -gt 0 ]; then
    log "  ${RED}Removed: ${removed}${RESET}"
  else
    log "  ${DIM}Nothing to remove${RESET}"
  fi
}

# ---------------------------------------------------------------------------
# Skills installation
# ---------------------------------------------------------------------------

install_skills() {
  local src_skills_dir="${WORK_DIR}/skills"

  if [ ! -d "$src_skills_dir" ]; then
    log "${YELLOW}Warning: bundled skills not found in work directory. Skipping.${RESET}"
    log ""
    return 0
  fi

  log "Installing skills to ${BOLD}${SKILLS_DIR}${RESET}"
  log ""

  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$SKILLS_DIR"
  fi

  local installed=0 skipped=0 updated=0
  local skill skill_src skill_dest

  for skill in "${SKILL_DIRS[@]}"; do
    skill_src="${src_skills_dir}/${skill}"
    skill_dest="${SKILLS_DIR}/${skill}"

    if [ ! -d "$skill_src" ]; then
      log_verbose "  ${DIM}[skip]${RESET} ${skill} (source not found)"
      continue
    fi

    if [ ! -d "$skill_dest" ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${GREEN}[new]${RESET} ${skill}/"
      else
        cp -r "$skill_src" "$skill_dest"
        log "  ${GREEN}[installed]${RESET} ${skill}/"
      fi
      installed=$((installed + 1))
    elif diff -rq --exclude='.DS_Store' "$skill_src" "$skill_dest" >/dev/null 2>&1; then
      log "  ${DIM}[unchanged]${RESET} ${skill}/"
      skipped=$((skipped + 1))
    elif [ "$FORCE" = true ]; then
      if [ "$DRY_RUN" = true ]; then
        log "  ${YELLOW}[update]${RESET} ${skill}/"
      else
        rm -rf "$skill_dest"
        cp -r "$skill_src" "$skill_dest"
        log "  ${YELLOW}[updated]${RESET} ${skill}/"
      fi
      updated=$((updated + 1))
    else
      log "  ${YELLOW}[skipped]${RESET} ${skill}/ ${DIM}(use --force to overwrite)${RESET}"
      skipped=$((skipped + 1))
    fi
  done

  log ""

  if [ -d "${HOME}/.agents/skills" ]; then
    local legacy_count=0
    for skill in "${SKILL_DIRS[@]}"; do
      [ -d "${HOME}/.agents/skills/${skill}" ] && legacy_count=$((legacy_count + 1))
    done
    if [ "$legacy_count" -gt 0 ]; then
      log "${DIM}Note: ${legacy_count} matching skill(s) found in ~/.agents/skills/ (legacy location).${RESET}"
      log "${DIM}They show as 'Rules' in Cursor UI. The new installs in ~/.cursor/skills/ show as 'Skills'.${RESET}"
      log "${DIM}You can safely delete ~/.agents/skills/ once verified.${RESET}"
      log ""
    fi
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  setup_colors
  parse_args "$@"
  resolve_dirs

  if [ "$DISABLE" = true ] && [ "$ENABLE" = true ]; then
    log "${RED}Cannot use --disable and --enable together.${RESET}" >&2
    exit 1
  fi

  if [ "$DISABLE" = true ] || [ "$ENABLE" = true ]; then
    toggle_orchestrator_rule
    return 0
  fi

  if [ "$UNINSTALL" = true ]; then
    uninstall_agents
    return 0
  fi

  WORK_DIR=$(mktemp -d)

  log "${BOLD}oh-my-cursor${RESET} v${VERSION}"
  log "${DIM}${CURSOR_MODE_LABEL}${RESET}"
  log ""

  if [ "$DRY_RUN" = true ]; then
    log "${YELLOW}Dry run mode -- no changes will be made${RESET}"
    log ""
  fi

  log_verbose "Scope: ${SCOPE}"
  log_verbose "Target: ${CURSOR_DIR}"
  log_verbose "Force: ${FORCE}"

  create_source_files "$WORK_DIR"
  install_agents "$WORK_DIR"

  if [ "$WITH_SKILLS" = true ]; then
    install_skills
  fi
}

main "$@"
} # ensure entire script is downloaded before execution
