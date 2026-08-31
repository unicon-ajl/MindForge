# 快速开始

MindForge 只发布经过筛选的 Vue 通用能力，不提供实验入口或普通工具合集。

```ts
import { MfModal, loading, message, MfTypewriter, tooltipPlugin } from 'mind-forge'
import 'mind-forge/style.css'

app.use(tooltipPlugin)
```

按能力导入：

```ts
import { MfModal, loading, message } from 'mind-forge/feedback'
import { MfTypewriter } from 'mind-forge/typewriter'
import { vTooltip } from 'mind-forge/tooltip'
```

当前能力均为 Beta：核心 API 已明确，仍需继续补充真实项目验证。

## Playground 能力导航

Playground 使用两级目录：一级按反馈体系、精品组件和精品指令划分，二级直接进入具体能力。目录同一时刻只展开当前分类，能力继续增加时由侧栏内部滚动承载，避免导航无限拉长。

一级分类以清晰的分类行、数量和折叠状态呈现；展开后，二级能力通过缩进与细轨道归属到分类，不使用独立白色卡片。当前能力通过短指示条和浅色高亮识别；完整名称始终保留足够的阅读宽度，过长名称可悬停查看。顶部标题与底部准入说明不随目录滚动。

一级分类采用单开手风琴交互：悬停、按压、键盘焦点和展开状态分别提供反馈，标准 Chevron 图标从向右平滑旋转为向下，展开动画按子项真实高度过渡，并遵循系统的减弱动画偏好。一级分类只表示目录展开状态，当前页面状态仅由二级能力承担，避免两层菜单同时高亮。
