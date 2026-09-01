# Prompt Suggestions

> 成熟度：Beta

面向 AI 对话、搜索和命令入口的智能建议面板。它负责异步竞态、碰撞定位和无障碍选择，不绑定聊天 Store，也不执行具体业务动作。

## 基础使用

```vue
<script setup lang="ts">
import { MfPromptSuggestions, type PromptSuggestion } from 'mind-forge/prompt-suggestions'

const items: PromptSuggestion[] = [
  { id: 'review', label: '检查当前改动', group: '开发' },
  { id: 'docs', label: '同步文档', description: '检查 API 与 Demo' }
]

function handleSelect(item: PromptSuggestion) {
  // 由业务决定填入输入框、立即提交、导航或执行命令。
}
</script>

<template>
  <MfPromptSuggestions :items="items" @select="handleSelect" />
</template>
```

## 异步上下文建议

```ts
import type { PromptSuggestionSource } from 'mind-forge/prompt-suggestions'

const source: PromptSuggestionSource = async (context, signal) => {
  const response = await fetch(`/api/suggestions?q=${encodeURIComponent(String(context))}`, {
    signal
  })
  return response.json()
}
```

```vue
<MfPromptSuggestions :source="source" :context="draft" @load-error="reportError" />
```

面板关闭、`context` 变化或组件卸载时，旧请求的 `AbortSignal` 会终止。即使数据源忽略取消，组件也会通过请求序号拒绝迟到结果。

面板打开期间会注册到 MindForge 共享浮层栈。在 Modal 内使用时，ESC 只关闭最顶层建议面板，不会继续穿透关闭 Modal；面板层级也由共享管理器统一分配。

## 建议模型

```ts
interface PromptSuggestion<T = unknown> {
  id: string
  label: string
  description?: string
  group?: string
  icon?: Component
  disabled?: boolean
  payload?: T
}
```

`id` 必须在当前列表内稳定且唯一，它用于活动项保持、渲染复用和列表更新后的焦点恢复。

## Props

| 属性               | 默认值        | 说明                                     |
| ------------------ | ------------- | ---------------------------------------- |
| `items`            | `[]`          | 同步建议；设置 `source` 后由异步结果接管 |
| `source`           | —             | `(context, signal) => Promise<items>`    |
| `context`          | —             | 异步源上下文；变化时重新加载             |
| `placement`        | `top-start`   | Floating UI 首选位置                     |
| `offset`           | `8`           | 面板与触发元素的间距，单位为 px          |
| `aria-label`       | `智能建议`    | 列表无障碍名称                           |
| `trigger-label`    | `你可以试试…` | 默认触发器文本                           |
| `close-on-select`  | `true`        | 选择后关闭                               |
| `close-on-outside` | `true`        | 点击外部关闭                             |

## 插槽与事件

- `trigger`：接收 `{ open, triggerProps }`；自定义触发元素必须完整绑定 `triggerProps`。
- `loading`、`empty`、`error`：替换对应状态内容；`error` 接收当前错误。
- `select(item)`：用户选择可用建议。
- `load-error(error)`：当前有效请求加载失败；已中止或过期的失败不会触发。

## 键盘与焦点

- 触发器上的 `↑` / `↓` 打开列表并进入首尾可用项；
- 列表中使用方向键循环移动，`Home` / `End` 跳转首尾；
- `Enter` 或空格选择，`Esc` 关闭并恢复触发器焦点；
- 禁用项不会进入键盘移动序列；
- 浮层自动翻转并保持在视口安全区域内；动画遵循 `prefers-reduced-motion`。
- 自定义触发器需要完整绑定 `triggerProps`，面板会以该元素而不是外层包装节点作为定位锚点。
