# Verification Report

## Scope
- notify 本地 runtime 依赖安装与回退路径

## Tests Run
- `node scripts/acceptance/notify-local-runtime-deps.cjs`
- Manual notify chain verification (temp HOME): `init` → `notify` → `status --diagnostics`
- Real environment chain verification: `init` → `notify` → `status --diagnostics`
- Uninstall/restore verification: `uninstall` → `status --diagnostics` → `init`

## Results
- Passed

## Evidence
- Output includes `ok: local runtime dependencies installed`
- `parse.updated_at` changed after notify: `2025-12-23T23:08:26.233Z` → `2025-12-23T23:08:26.354Z`
- `uninstall` restored Codex notify to `bash ~/.codex/codex_notify.sh`

## Remaining Risks
- 无
