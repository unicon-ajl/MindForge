# MindForge

面向 Vue 3 的精品通用能力集合。项目不追求数量：普通封装直接删除，只保留能解决真实边界问题、值得跨项目复用的成品。

## 当前能力

| 能力           | 价值                                                     |
| -------------- | -------------------------------------------------------- |
| Feedback Suite | Modal、Loading、Message 共享层级、滚动锁、ESC 和焦点管理 |
| Typewriter     | 可控制、可循环、事件完整的打字与删除动画组件             |
| v-tooltip      | 自动翻转、溢出判断、键盘访问和完整生命周期的提示指令     |

```ts
import { MfModal, loading, message, MfTypewriter, tooltipPlugin } from 'mind-forge'
import 'mind-forge/style.css'

app.use(tooltipPlugin)
```

也可以按能力导入：

```ts
import { MfModal, loading, message } from 'mind-forge/feedback'
import { MfTypewriter } from 'mind-forge/typewriter'
import { vTooltip } from 'mind-forge/tooltip'
```

## 目录

```text
MindForge/
├── packages/
│   ├── feedback/       # 反馈组件与命令式插件
│   ├── typewriter/     # 打字机组件
│   ├── tooltip/        # Tooltip 指令
│   ├── catalog.ts      # 正式能力目录
│   └── index.ts        # 唯一发布入口
├── internal/
│   ├── overlay/        # 反馈体系内部基础设施
│   └── types/          # 工程内部类型
└── apps/
    ├── playground/     # 交互演示
    └── docs/           # 文档站
```

项目不设置实验区。未达到准入标准的能力不会进入仓库。

## 开发

```bash
npm run dev
npm test -- --run
npm run build:lib
npm run build
npm run docs:build
```

详细准入规则见 [.project/STANDARDS.md](.project/STANDARDS.md)。

## License

MIT
