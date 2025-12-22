#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/open-proposal-worktrees.sh proposal
#   scripts/open-proposal-worktrees.sh changes
#   scripts/open-proposal-worktrees.sh all
#   scripts/open-proposal-worktrees.sh --pattern <regex>
#
# Optional:
#   TERM_APP=Terminal|iTerm scripts/open-proposal-worktrees.sh changes

TERM_APP="${TERM_APP:-Terminal}"
CODEX_CMD="${CODEX_CMD:-codex}"
CODEX_PROMPT="${CODEX_PROMPT:-auto}"
CODEX_BIN="${CODEX_CMD%% *}"

MODE="${1:-proposal}"
PATTERN=""

print_help() {
  echo "Usage:"
  echo "  scripts/open-proposal-worktrees.sh proposal"
  echo "  scripts/open-proposal-worktrees.sh changes"
  echo "  scripts/open-proposal-worktrees.sh all"
  echo "  scripts/open-proposal-worktrees.sh --pattern <regex>"
  echo "  scripts/open-proposal-worktrees.sh --prompt \"<codex prompt|auto|none>\""
  echo
  echo "Notes:"
  echo "  proposal = only worktrees on refs/heads/proposal/*"
  echo "  changes  = only worktrees that contain openspec change proposals"
  echo "  all      = all worktrees for this repo"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      print_help
      exit 0
      ;;
    all|changes|proposal)
      MODE="$1"
      shift
      ;;
    --pattern)
      PATTERN="${2:-}"
      shift 2
      ;;
    --prompt)
      CODEX_PROMPT="${2:-auto}"
      shift 2
      ;;
    *)
      MODE="$1"
      shift
      ;;
  esac
done

open_terminal_window() {
  local path="$1"
  local label="$2"
  local changes="$3"
  local cmd="cd $(printf %q "${path}"); echo '[ready] ${label}';"
  if [[ -n "${changes}" && -d "${path}/openspec/changes/${changes}" ]]; then
    cmd="${cmd} ls openspec/changes/${changes};"
    cmd="${cmd} if [ -f openspec/changes/${changes}/proposal.md ]; then echo openspec/changes/${changes}/proposal.md; fi;"
  else
    cmd="${cmd} if [ -d openspec/changes ]; then find openspec/changes -maxdepth 2 -name proposal.md -print; fi;"
  fi

  local prompt_text="${CODEX_PROMPT}"
  if [[ "${prompt_text}" == "auto" ]]; then
    local changes_inline
    changes_inline="$(printf "%s" "${changes}" | tr '\n' ' ' | sed 's/  */ /g; s/^ *//; s/ *$//')"
    if [[ -z "${changes_inline}" ]]; then
      changes_inline="${label}"
    fi
    prompt_text="Apply the approved OpenSpec change(s) in this worktree (${changes_inline}). Follow tasks.md, update it as you complete items, and keep changes scoped."
  fi

  local codex_call="${CODEX_CMD}"
  if [[ -n "${prompt_text}" && "${prompt_text}" != "none" ]]; then
    codex_call="${codex_call} $(printf %q "${prompt_text}")"
  fi

  cmd="${cmd} if command -v ${CODEX_BIN} >/dev/null 2>&1; then ${codex_call}; else echo '[warn] codex not found: ${CODEX_BIN}'; fi"

  local osa_cmd
  osa_cmd="$(printf '%s' "${cmd}" | sed 's/\\/\\\\/g; s/\"/\\\\\"/g')"

  if command -v osascript >/dev/null 2>&1; then
    if [[ "${TERM_APP}" == "Terminal" ]]; then
      osascript <<EOF
tell application "Terminal"
  do script "${osa_cmd}"
  activate
end tell
EOF
      return 0
    fi
    if [[ "${TERM_APP}" == "iTerm" || "${TERM_APP}" == "iTerm2" ]]; then
      osascript <<EOF
tell application "iTerm"
  create window with default profile
  tell current session of current window
    write text "${osa_cmd}"
  end tell
end tell
EOF
      return 0
    fi
  fi

  echo "[manual] ${label}"
  echo "cd ${path}"
  if [[ -n "${changes}" ]]; then
    echo "changes: ${changes}"
  fi
  echo "find openspec/changes -maxdepth 2 -name proposal.md -print"
  echo
}

REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"

emit_worktree() {
  local path="$1"
  local branch="$2"

  [[ -n "${path}" && -d "${path}" ]] || return 0

  if [[ "${MODE}" == "proposal" ]]; then
    if [[ "${branch}" != refs/heads/proposal/* ]]; then
      return 0
    fi
  fi

  label="$(basename "${path}")"
  changes_list=""

  if [[ -d "${path}/openspec/changes" ]]; then
    if [[ "${branch}" == refs/heads/proposal/* ]]; then
      local suffix="${branch#refs/heads/proposal/}"
      local match=""
      while IFS= read -r -d '' file; do
        local change_dir
        change_dir="$(basename "$(dirname "${file}")")"
        if [[ "${change_dir}" == "${suffix}" || "${change_dir}" == *"-${suffix}" ]]; then
          match="${change_dir}"
          break
        fi
      done < <(find "${path}/openspec/changes" -maxdepth 2 -name proposal.md -print0 2>/dev/null)
      if [[ -n "${match}" ]]; then
        changes_list="${match}"
      fi
    fi

    if [[ -z "${changes_list}" ]]; then
      while IFS= read -r -d '' file; do
        change_dir="$(basename "$(dirname "${file}")")"
        changes_list="${changes_list}${change_dir}\n"
      done < <(find "${path}/openspec/changes" -maxdepth 2 -name proposal.md -print0 2>/dev/null)
      changes_list="$(printf "%b" "${changes_list}")"
    fi
  fi

  if [[ "${MODE}" == "changes" && -z "${changes_list}" ]]; then
    return 0
  fi

  if [[ -n "${PATTERN}" ]]; then
    if ! printf "%s\n%s" "${label}" "${changes_list}" | grep -E "${PATTERN}" >/dev/null 2>&1; then
      return 0
    fi
  fi

  open_terminal_window "${path}" "${label}" "$(printf "%s" "${changes_list}")"
}

current_path=""
current_branch=""
while IFS= read -r line || [[ -n "${line}" ]]; do
  case "${line}" in
    worktree\ *)
      if [[ -n "${current_path}" ]]; then
        emit_worktree "${current_path}" "${current_branch}"
      fi
      current_path="${line#worktree }"
      current_branch=""
      ;;
    branch\ *)
      current_branch="${line#branch }"
      ;;
    "")
      if [[ -n "${current_path}" ]]; then
        emit_worktree "${current_path}" "${current_branch}"
        current_path=""
        current_branch=""
      fi
      ;;
    *)
      ;;
  esac
done < <(git -C "${REPO_ROOT}" worktree list --porcelain)

if [[ -n "${current_path}" ]]; then
  emit_worktree "${current_path}" "${current_branch}"
fi
