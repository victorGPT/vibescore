#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "${ROOT}/scripts/open-proposal-worktrees.sh" proposal --prompt auto
