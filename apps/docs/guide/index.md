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
