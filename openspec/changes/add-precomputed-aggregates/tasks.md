# add-precomputed-aggregates 任务清单

## 1) 设计与验证
- [ ] 明确聚合表/快照表字段与索引（含唯一键）
- [ ] 明确刷新策略（频率、触发方式、回填策略）

## 2) 数据层
- [ ] 创建/迁移聚合表或物化视图
- [ ] 创建排行榜快照表
- [ ] 添加必要索引（按 user_id/day、period/window 等）

## 3) 计算与刷新
- [ ] 编写/配置刷新任务（定时或触发式）
- [ ] 回填历史数据并校验一致性

## 4) Functions 改造
- [ ] usage-summary/daily/heatmap 读取聚合表
- [ ] leaderboard 读取快照表

## 5) 验证与回滚
- [ ] 加入验证脚本或 smoke 测试
- [ ] 记录回滚策略与回滚步骤

## 6) 文档
- [ ] 更新 `BACKEND_API.md` 与 `openspec/specs/vibescore-tracker/spec.md`
