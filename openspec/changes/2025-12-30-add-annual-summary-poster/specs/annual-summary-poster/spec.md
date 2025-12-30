# 年度总结海报（annual-summary-poster）

## ADDED Requirements

### Requirement: Poster view for 2025
系统 SHALL 提供一个 2025 年度总结海报视图，用于静态发布与截图导出。

#### Scenario: Render poster
- **WHEN** 用户打开年度总结海报视图
- **THEN** 页面以静态方式渲染，不出现安装步骤、Details 模块或顶部按钮

### Requirement: Narrow single-column layout
系统 SHALL 使用收窄的单列纵向布局，以竖向海报形式展示。

#### Scenario: Layout structure
- **WHEN** 海报视图加载
- **THEN** 主内容在单列内纵向堆叠，身份模块与热力图位于纵向流中

### Requirement: Fixed annual range (2025)
系统 SHALL 在海报视图中固定使用 2025 年范围的数据视角。

#### Scenario: Annual range
- **WHEN** 海报视图渲染
- **THEN** 视角固定为 2025-01-01 至 2025-12-31 的年度范围

### Requirement: Hide input breakdown metrics
系统 SHALL 在海报视图中隐藏输入/输出/缓存输入/推理输出四项明细模块，仅保留总量摘要。

#### Scenario: Summary only
- **WHEN** 海报视图渲染
- **THEN** Usage 区域不展示四项输入相关明细模块

### Requirement: Poster headline copy
系统 SHALL 展示“年度总结”标题文案，并从 copy registry 读取。

#### Scenario: Copy registry
- **WHEN** 海报视图渲染
- **THEN** 标题文案来自 `dashboard/src/content/copy.csv`

### Requirement: Final poster image output
系统 SHALL 产出一张可发布的静态海报图片，并记录生成命令与结果。

#### Scenario: Image export
- **WHEN** 生成海报图片
- **THEN** 输出静态图片文件，并在回归记录中保留命令与结果
