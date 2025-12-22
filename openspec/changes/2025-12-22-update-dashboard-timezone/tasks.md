# Tasks

- [x] 1) 添加时区与本地日历工具（解析 IANA/offset、本地日范围、UTC 边界换算）。
- [x] 2) 更新 usage endpoints（daily/summary/hourly/monthly/heatmap）支持 `tz`/`tz_offset_minutes` 并按本地时区聚合。
- [x] 3) 前端获取浏览器时区并透传到 API；缓存 key 按时区隔离。
- [x] 4) 更新前端日期/热力图逻辑为本地日历语义，修正文案与 Tooltip 的 UTC 文本。
- [x] 5) 更新 mock 数据生成以匹配本地日期语义。
- [x] 6) 更新 `BACKEND_API.md` 文档与参数说明。
- [x] 7) 运行 `npm run build:insforge` 并记录验证步骤。
