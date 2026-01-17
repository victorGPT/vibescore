# CLI Doctor 模式设计

## 目标
- 新增 `doctor` 命令，提供可读诊断 + 机器可读 JSON 输出。
- 单一事实来源：所有运行时配置统一解析，避免分散重复。
- 保持 `diagnostics` 原有 JSON 输出不变，doctor 仅包装并新增检查。

## 非目标
- 不引入任何向后兼容路径或历史别名字段。
- 不改变现有 `diagnostics` JSON 结构。
- 不在 doctor 中执行数据修复或写入业务数据（仅诊断）。
- doctor 不触发 tracker 目录迁移（仅只读诊断）。

## 破坏性变更
- 移除 `VIBESCORE_*` 兼容环境变量：
  - `VIBESCORE_INSFORGE_BASE_URL`
  - `VIBESCORE_DEVICE_TOKEN`
  - `VIBESCORE_DASHBOARD_URL`
  - `VIBESCORE_HTTP_TIMEOUT_MS`
  - `VIBESCORE_DEBUG`
  - `VIBESCORE_INSFORGE_ANON_KEY`
  - `VIBESCORE_AUTO_RETRY_NO_SPAWN`
- 仅保留 `VIBEUSAGE_*` 作为运行时配置来源（忽略 `INSFORGE_ANON_KEY`）。

## 命令体验
- `npx vibeusage doctor`：人类可读输出。
- `npx vibeusage doctor --json`：输出 JSON schema。
- `npx vibeusage doctor --out doctor.json`：写文件并仅输出 JSON。

## 诊断检查（扩展版）
1) Runtime 配置（单一事实来源）
   - baseUrl（来源明确、值存在）
   - deviceToken（是否已设置）
   - dashboardUrl / httpTimeoutMs / debug / insforgeAnonKey / autoRetryNoSpawn
2) 文件系统
   - tracker 目录可读写
   - config.json 可读（区分缺失与 JSON 解析失败）
3) CLI 可用性
   - 当前 CLI 路径可读 + 具备执行权限（POSIX 额外检查 X_OK）
4) 网络连通性（第一性原则）
   - 对 base_url 发起 GET
   - 任意 HTTP 响应 => “可达”
   - 仅超时/网络异常 => “不可达”
5) 通知/上传状态
   - 从 diagnostics 快照推导（不新增写入）

## 判定矩阵
| Check | OK | WARN | FAIL | Critical |
| --- | --- | --- | --- | --- |
| runtime.base_url | 有 base_url | - | 缺失 | 否 |
| runtime.device_token | 已设置 | 缺失 | - | 否 |
| fs.tracker_dir | 可读 | 不存在 | 权限/IO 错误 | 是（权限/IO 错误） |
| fs.config_json | 读取成功 | 文件不存在 | JSON 无效/IO 错误 | 是（IO 错误） |
| cli.entrypoint | 可读/可执行 | - | 不可读/不可执行 | 否 |
| network.base_url | 有响应 | 缺少 base_url（跳过） | 超时/网络异常 | 否 |
| notify.configured | 已配置 | 未配置 | - | 否 |
| upload.last_error | 无错误 | 有错误 | - | 否 |

## 输出设计
### 人类可读
- 使用现有 `cli-ui` 渲染，状态：OK / WARN / FAIL。
- 列表展示关键检查，并附简要建议。

### JSON Schema（doctor 专用）
```json
{
  "version": 1,
  "generated_at": "2026-01-16T00:00:00.000Z",
  "ok": true,
  "summary": {
    "ok": 5,
    "warn": 2,
    "fail": 0,
    "critical": 0
  },
  "checks": [
    {
      "id": "network.base_url",
      "status": "ok",
      "detail": "HTTP 401 (reachable)",
      "critical": false,
      "meta": {
        "status_code": 401,
        "latency_ms": 128,
        "base_url": "https://example"
      }
    }
  ],
  "diagnostics": { "...": "existing diagnostics snapshot" }
}
```

## 退出码
- 若存在 critical 失败 => exit 1
- 其他情况 => exit 0

## 单一事实来源
- 新增 `resolveRuntimeConfig` 统一解析配置来源（CLI flags > config/env/default）。
- `init` / `sync` / `doctor` 复用该解析逻辑。
- 仅接受 `VIBEUSAGE_*`，不再支持其他 env 入口。

## 严格读取
- 新增严格 JSON 读取，用于区分“文件缺失”与“文件损坏”。
- 现有 `readJson` 保持不变，避免影响现有行为。

## 风险
- 网络探测需要明确超时与错误区分（仅网络错误失败）。
- `diagnostics` 脱敏逻辑必须保持一致。
