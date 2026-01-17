# Opencode Usage Audit Design

> 说明：本文档早于 VibeUsage 重命名，`vibescore-usage-*` 为历史命名，完成重命名后对应 `vibeusage-usage-*`。

## 背景
Opencode 会对 message 进行回填/重写，存在重复计数风险。当前 server 侧只保留 hourly 聚合结果，缺少 message 级别可追溯证据，因此需要本机对账来验证结果真实可靠。

## 目标
- 在本机重算 Opencode message 的 half-hour token totals。
- 调用 `vibescore-usage-hourly`（source=opencode, tz=UTC）获得 server 聚合。
- 输出可审计的差异明细与摘要（匹配率、最大差异、Top 差异）。

## 非目标
- 不做全量设备审计（仅当前设备）。
- 不修改 server 数据，不做自动修复。
- 不依赖 service role。

## 输入与配置
- Access token：优先读取 `VIBEUSAGE_ACCESS_TOKEN` / `VIBESCORE_ACCESS_TOKEN`，缺失则触发浏览器登录回调（仅本次）。
- Storage 路径：默认 `XDG_DATA_HOME/opencode/storage`，可通过 `--storage-dir` 覆盖。
- 过滤：`--from` / `--to`（YYYY-MM-DD, UTC），默认本地最小/最大日期。

## 数据流
1. 扫描本地 `message` 文件：`storage/message/**/msg_*.json`。
2. 使用 `parseOpencodeIncremental` 生成 `hourlyState.buckets`。
3. 汇总为 `hour_start` -> totals（跨模型汇总，source=opencode）。
4. 按天调用 `vibescore-usage-hourly`（UTC）获取 server totals。
5. 对账输出：逐时段对比 + 摘要统计。

## 输出格式（CLI）
- 摘要：days, slots, matched, mismatch, max_delta
- 明细：Top N 差异（hour, local, server, delta）
- 退出码：0=一致，2=存在差异，1=运行失败

## 风险与缓解
- Token 缺失：提示使用环境变量或浏览器登录。
- 本地消息缺失：输出“无本地数据”并退出 1。
- 时区偏差：强制 UTC 比对。
