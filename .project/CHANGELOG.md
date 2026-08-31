# MindForge 开发日志

> 最后更新：2026-08-31

---

## 2026-08-31 Prompt Suggestions

- 新增 `mind-forge/prompt-suggestions` 子路径和 `MfPromptSuggestions`；
- 支持同步、异步上下文建议及 AbortSignal/请求序号双重竞态保护；
- 补齐分组、禁用、状态插槽、键盘导航、焦点恢复、浮层碰撞定位与减弱动画；
- 同步公共类型、自动化测试、Playground、VitePress 文档、能力目录和 README。
- 修正 Playground 能力分类，并让默认页面始终跟随目录首项，避免配置顺序与选中状态脱节。

---

## 2026-08-31 精品能力体系重构

### 阶段目标

项目从“常见 Vue 封装集合”调整为“精品通用能力实验室”：删除普通能力和无消费者的基础设施，只保留能解决真实边界问题、值得跨项目复用的正式能力。

### 架构与产品边界

- 重构为 `packages`、`internal`、`apps/playground` 和 `apps/docs` 四个明确层次；
- 新增正式能力目录 `capabilityCatalog`，统一成熟度、问题定义和发布入口；
- 建立源码、类型、测试、Demo、文档和导出的完整准入标准；
- 清理普通组件、简单工具、薄 Hook 和缺少业务价值的抽象基础设施。

### 正式能力

- **Feedback Suite**：统一 Modal、Loading、Message 的层级、滚动锁、焦点和页面副作用；
- **Typewriter**：重构为 Unicode 安全、队列驱动、控制语义完整的文本动画能力；
- **v-tooltip**：新增碰撞定位、溢出检测、键盘访问、主题和生命周期管理完整的提示指令。

### 体验与文档

- Playground 改为两层手风琴能力导航，并修复响应式侧边栏状态；
- 重构 Header、首页文案、搜索、面包屑、成熟度和页面布局；
- Message 采用紧凑四态通知体系，并修复计时暂停、关闭遮挡和退场层级问题；
- 建立项目级注释规范，所有公共 API 和复杂状态协调说明“为什么”；
- 规定设计方案默认附带可视化 Demo；
- 所有代码变更必须同步关联文档。

### 基础设施清理

- 删除无消费者的通用 Mock 服务及 CRUD、认证、短信、OSS、SSE 样板；
- 删除失效代理、启动脚本和 Express、CORS、TSX、Concurrently 等专属依赖；
- 网络模拟改为由具体正式能力驱动，默认使用能力就近 fixture。

### 质量结果

- 当前保留 3 项正式 Beta 能力；
- 自动化测试增至 34 项；
- 库、Playground 和文档构建全部通过；
- 完整决策与后续准入原则见 `SESSION_CONTEXT.md`。

---

## 2026-07-13 项目规范全面审查与修复

### 一、审查范围

基于 `STANDARDS.md` 规范文档，对 `packages/` 下全部源码进行了逐项合规性审查，覆盖 45+ 文件。

### 二、修复问题清单

#### 🔴 严重问题（2 项）

| 问题                      | 文件                        | 违反规范       | 修复方案                                                 |
| ------------------------- | --------------------------- | -------------- | -------------------------------------------------------- |
| `withDefaults` + 解构混用 | `Button/ButtonGroup.vue`    | §9.1 踩坑记录  | 改为 `const { vertical = false } = defineProps<Props>()` |
| 硬编码中文文本            | `Pagination/Pagination.vue` | §2.0 i18n 规范 | 引入 `useI18n()`，6 处文案改为 `t()` 调用                |

#### 🟡 中等问题（14 项）

**CSS 变量缺少 Fallback（§4.3）**：为以下组件补全 23 处 CSS 变量 fallback 默认值：

| 文件                          | 修复变量数                         |
| ----------------------------- | ---------------------------------- |
| `Modal/Modal.vue`             | 1 (`--mf-modal-min-width`)         |
| `Tag/Tag.vue`                 | 3 (padding/font-size/border-color) |
| `Button/Button.vue`           | 1 (padding)                        |
| `Input/Input.vue`             | 3 (padding/font-size/bg)           |
| `plugins/loading/Loading.vue` | 3 (border-radius/spacing/font)     |
| `plugins/message/Message.vue` | 12 (颜色/间距/字体/阴影)           |

#### 🟢 轻微问题（4 项）

**ref 数组响应式操作优化（§9.10）**：将 `push/splice` 改为展开运算符创建新数组：

| 文件                     | 修复方法                                              |
| ------------------------ | ----------------------------------------------------- |
| `hooks/useTree.ts`       | `toggleExpand/toggleCheck`: splice → filter/[...展开] |
| `utils/tree.ts`          | `arrayToTree`: push → [...展开]                       |
| `hooks/useFileUpload.ts` | upload: push → [...展开]                              |

#### 其他修复

| 问题           | 文件                        | 修复内容             |
| -------------- | --------------------------- | -------------------- |
| JSDoc 格式错误 | `Pagination/Pagination.vue` | §9.5: 标签与描述分行 |

### 三、i18n 语言包扩展

新增 **Pagination 组件**国际化支持：

```typescript
// zh-CN.ts / en.ts 新增
component: {
  pagination: {
    total: '共 {total} 条' / 'Total {total} items',
    prevPage: '上一页' / 'Previous',
    nextPage: '下一页' / 'Next',
    pageSize: '{size} 条/页' / '{size} / page',
    goto: '跳至' / 'Go to',
    page: '页' / 'page'
  }
}
```

### 四、影响范围

- **修改文件**: 11 个（6 组件 + 2 Hook + 1 工具 + 2 语言包）
- **修复总数**: 20+ 处
- **破坏性变更**: 无（纯内部实现优化）
- **ESLint 检查**: ✅ 全部通过

---

## 2026-07-13 新增通用国际化 (i18n) 系统

### 一、新增模块

**`packages/i18n/` — 零依赖自研 i18n 引擎**

| 文件               | 职责                                                            |
| ------------------ | --------------------------------------------------------------- |
| `types.ts`         | 核心类型定义（LocaleCode / MessageSchema / I18nOptions 等）     |
| `createI18n.ts`    | 核心引擎（语言包管理、消息解析、参数插值、fallback 机制）       |
| `useI18n.ts`       | 组合式函数（inject 获取实例，响应式翻译）                       |
| `plugin.ts`        | Vue Plugin 便捷导出（I18nPlugin，内置 zh-CN + en）              |
| `locales/zh-CN.ts` | 简体中文内置语言包（覆盖组件/插件/指令/Hook/工具函数/通用文案） |
| `locales/en.ts`    | English 内置语言包（与 zh-CN 一一对应）                         |

### 二、改造的现有模块

以下模块的硬编码中文文案已替换为 i18n 动态调用：

- **Empty 组件** → `component.empty.description`
- **Loading 插件** → `plugin.loading.text`
- **Copy 指令** → `directive.copy.ariaLabel` / `noContent` / `failed`
- **date.relativeTime()** → `util.date.justNow` / `minutesAgo` / `hoursAgo` ... （含插值）
- **useFileUpload Hook** → `hook.fileUpload.maxCountExceeded` / `sizeExceeded` （含插值）
- **tree.arrayToTree()** → `util.tree.duplicateId` （含插值）
- **file.downloadFile()** → `util.file.forbiddenProtocol` （含插值）
- **storage 插件** → `plugin.storage.setError`

### 三、核心特性

- **零依赖**：不依赖 vue-i18n，~3KB gzipped
- **响应式**：语言切换自动触发 Vue 视图更新
- **嵌套路径**：支持 `'a.b.c'` 点分隔导航
- **参数插值**：支持 `{name}` 模板语法
- **Fallback 机制**：当前语言 → fallbackLocale → key 本身
- **运行时注册**：`addLocale()` 动态添加/覆盖语言包
- **SSR 安全**：服务端渲染兼容
- **降级兜底**：i18n 未初始化时返回 key 原值
- **全链路边界防护**：null/undefined/空值/非 object params 全部有明确行为

### 四、使用方式

```typescript
// 方式一：随 MindForge 自动安装
app.use(MindForge)           // i18n 自动就绪
app.use(MindForge, { locale: 'en' })  // 指定初始语言

// 方式二：独立使用
import { createI18n, useI18n } from '@packages/i18n'
const i18n = createI18n({ locale: 'zh-CN', locales: [...] })
app.use(i18n.install())

// 组件中使用
const { t, locale, setLocale } = useI18n()
t('common.save')  // → '保存'
setLocale('en')
t('common.save')  // → 'Save'

// 非组件上下文中使用
import { getGlobalI18n } from '@packages/i18n'
getGlobalI18n()?.translate('plugin.loading.text')
```

### 五、文档与 Demo

- 新增文档：`docs/i18n.md`
- 新增 Demo：`src/demos/i18n/I18nDemo.vue`
- VitePress 导航栏 + 侧边栏已同步添加 i18n 入口

---

## 2026-07-03 全面代码审查与优化

### 一、目录结构重构

**变更前：**

```
src/components/demo/          # demo 混在 src/components 中
packages/plugins/             # UI 与逻辑混放
```

**变更后：**

```
src/
├── demos/                    # 演示页面（按 packages 分类）
│   ├── components/ directives/ hooks/ plugins/ theme/ utils/
├── layout/                   # 站点布局组件
└── config/                   # 站点配置

packages/
├── components/               # 通用组件（每个独立目录）
├── directives/               # 指令
├── hooks/                    # Hooks
├── plugins/                  # 插件（每个独立子目录）
├── request/                  # 请求封装
└── utils/                    # 工具函数

mock/                         # Mock 服务（Express）
├── server.ts                 # 启动入口
├── middleware/delay.ts       # 延迟工具
├── routes/                   # 按服务分组
│   ├── main/                 # 主服务
│   └── thirdParty/           # 第三方服务
└── utils/sse.ts              # SSE 流式工具
```

---

### 二、Mock 服务建设

**架构设计：**

- 单文件单接口，按服务分文件夹
- 标准 Express 模式，零抽象
- 支持 SSE 流式响应
- 端口自动释放 + 优雅关闭

**已支持能力：**

- REST API（GET/POST/PUT/DELETE）
- 路径参数 `/:id`
- 查询参数 `?page=1`
- 请求体 JSON
- 鉴权拦截（Authorization 头）
- 模拟延迟
- SSE 流式推送
- 静态资源服务

**响应格式：**

```json
{ "code": 200, "message": "success", "data": {...} }
```

---

### 三、组件优化

#### Button 组件

- 新增 7 种类型：primary/success/warning/danger/default/**text**/**link**
- 新增变体：ghost（幽灵）/ circle（圆形）/ round（圆角）/ block（块级）
- 新增链接模式：`href` + `target`，自动渲染为 `<a>` 标签
- 新增安全属性：`rel="noopener noreferrer"`（target=_blank 时）
- 新增防抖：`debounce` prop
- 新增 loading slot：自定义加载状态
- 新增 iconPosition：图标左右位置
- 修复：防抖定时器 onBeforeUnmount 清理

#### ButtonGroup 组件

- 新增独立组件（放在 Button 文件夹内）
- 支持水平/垂直排列
- 自动处理边框圆角

#### Input 组件

- 新增 prefix/suffix slot
- 新增 clearable 可清除按钮
- 新增 change 事件
- 新增 name 属性（autofill）
- 新增 maxlength 属性
- 修复：NaN 处理逻辑（基于 inputType 判断）

#### Modal 组件

- 滚动锁定补偿滚动条宽度（防止页面跳动）
- 新增 ESC 键盘关闭
- 新增弹窗 zoom transition 动画
- 新增 onScopeDispose 兜底清理

#### Tooltip 组件

- 新增 openDelay/closeDelay 延迟显隐
- 新增 content slot（支持 HTML 内容）
- 定时器 onScopeDispose 清理

#### Pagination 组件

- 新增 showTotal 显示总数
- 新增 showJumper 跳页
- 新增 pageSizeOptions 每页条数切换
- 新增 update:pageSize 事件

---

### 四、指令优化

| 指令         | 改进                                       |
| ------------ | ------------------------------------------ |
| v-copy       | SSR 兼容、无障碍属性、类型签名泛型化       |
| v-lazy       | 占位图、加载失败兜底、SSR 兼容             |
| v-permission | aria-hidden、SSR 兼容                      |
| v-tooltip    | role="tooltip"、aria-describedby、SSR 兼容 |
| v-debounce   | SSR 兼容、aria-disabled、类型签名          |
| v-throttle   | SSR 兼容、aria-disabled、类型签名          |

---

### 五、CSS 变量 Fallback

所有组件的 CSS 变量添加 fallback 默认值：

```scss
// 之前
color: var(--mf-color-primary);

// 之后
color: var(--mf-color-primary, #409eff);
```

---

### 六、演示接口规范

> **所有 demo 页面的接口调用必须使用 Mock 服务，禁止硬编码数据。**

**正确示例：**

```typescript
const { data, loading, run } = useRequest(
  () => request.get('/api/users/list', { params: { page: 1, pageSize: 10 } }),
  { manual: true }
)
```

**禁止示例：**

```typescript
const fetch = async () => {
  await new Promise(r => setTimeout(r, 800))
  data.value = [{ id: 1, name: '假数据' }]
}
```

---

### 七、文档站建设

- VitePress 配置完整（38 个文档、6 个侧边栏分组）
- favicon 使用 SVG data URI（⚡）
- 搜索使用 local provider
- 指南/组件/Hooks/工具/指令/插件 全覆盖

---

### 八、已知问题

| 问题                              | 状态                          |
| --------------------------------- | ----------------------------- |
| vue-tsc 版本兼容（1.x vs TS 5.9） | ✅ 已修复（升级到 2.2+）      |
| ESLint 对 index.html 报错         | ✅ 已修复（ignorePatterns）   |
| Sass legacy-js-api 警告           | ✅ 已修复（api: 'modern'）    |
| package.json exports types 顺序   | ✅ 已修复                     |
| withDefaults 响应式               | ✅ 无问题（两种写法都响应式） |

---

## 规范文档

详见 `.project/STANDARDS.md`
