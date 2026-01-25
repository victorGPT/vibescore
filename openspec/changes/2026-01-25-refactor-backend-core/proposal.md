# Change: Refactor backend core (functions + DB + RLS)

## Why
当前 Edge Functions 逻辑分散、DB 访问路径不统一、RLS 合约分叉，导致维护成本高且性能/安全难以验证。本次重构将统一核心层与 DB 合约，提升可维护性与可验证性。

## What Changes
- 建立 shared core + db 访问层，Edge Functions 变为薄适配器。
- 统一 RLS helper 合约与策略依赖。
- 优化 usage 相关查询路径与索引使用。
- 确保构建产物与源码一致（build:insforge:check）。

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `insforge-src/functions/*`, `insforge-src/shared/*`
- Affected data: `vibeusage_tracker_*` tables and RLS policies
