# Dashboard screenshot mode

## ADDED Requirements

### Requirement: Screenshot mode trigger
系统 SHALL 支持通过查询参数 `screenshot=1|true` 启用截图模式，未启用时行为不变。

#### Scenario: Enable screenshot mode
- **WHEN** 用户访问带参数 `?screenshot=1` 的 Dashboard
- **THEN** Dashboard 进入截图模式

### Requirement: Narrow layout in screenshot mode
系统 SHALL 在截图模式下将 Dashboard 主内容区域收窄为单列纵向布局。

#### Scenario: Narrow content
- **WHEN** 截图模式启用
- **THEN** Dashboard 内容区域为窄屏布局并居中显示

### Requirement: Hide install section
系统 SHALL 在截图模式下隐藏安装区模块。

#### Scenario: Install section removed
- **WHEN** 截图模式启用
- **THEN** 安装区模块不显示

### Requirement: Hide details section
系统 SHALL 在截图模式下隐藏明细表区域。

#### Scenario: Details removed
- **WHEN** 截图模式启用
- **THEN** 明细表区域不显示

### Requirement: Hide Core Index breakdown modules
系统 SHALL 在截图模式下隐藏 Core Index 区域的输入/输出/缓存输入/推理输出四项明细模块。

#### Scenario: Core Index simplified
- **WHEN** 截图模式启用
- **THEN** Core Index 仅保留总量摘要，四项明细模块不显示

### Requirement: Simplify usage header in screenshot mode
系统 SHALL 在截图模式下隐藏 Usage 区域的 `day` 选项与范围区间展示。

#### Scenario: Usage header simplified
- **WHEN** 截图模式启用
- **THEN** Usage 区域不显示 `day` 选项与范围区间

### Requirement: Hide range captions in screenshot mode
系统 SHALL 在截图模式下隐藏范围说明文字（包括活动热力图范围与页脚范围）。

#### Scenario: Range captions removed
- **WHEN** 截图模式启用
- **THEN** 页面不显示范围说明文字
