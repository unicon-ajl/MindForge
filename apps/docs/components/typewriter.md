# Typewriter

> 成熟度：Beta

Unicode 安全、队列驱动的打字机组件。适合标题轮播、引导语和需要命令式控制的文本动画。

## 基础使用

```vue
<script setup lang="ts">
import { MfTypewriter } from 'mind-forge/typewriter'
</script>

<template>
  <MfTypewriter items="Emoji 👨‍👩‍👧‍👦 不会被拆开" />
</template>
```

## 文本队列

```vue
<MfTypewriter
  :items="[
    { text: '第一段', hold: 1200 },
    { text: '第二段', hold: 1800 }
  ]"
  loop
  :typing-speed="80"
  :deleting-speed="40"
/>
```

每项输入完成后停留，随后删除并进入下一项。非循环队列会在最后一项完成后保留全文。

## 命令式控制

```ts
type TypewriterController = {
  start(): void
  pause(): void
  resume(): void
  restart(): void
  skip(): void
  stop(options?: { preserveText?: boolean }): void
  getPhase(): TypewriterPhase
  isRunning(): boolean
}
```

`stop()` 默认保留当前文字；传入 `{ preserveText: false }` 才会清空。

## 状态阶段

```ts
type TypewriterPhase = 'idle' | 'typing' | 'holding' | 'deleting' | 'paused' | 'completed'
```

## 事件

| 事件            | 说明               |
| --------------- | ------------------ |
| `type`          | 输出一个完整字素   |
| `item-complete` | 当前文本输入完成   |
| `item-delete`   | 当前文本删除完成   |
| `cycle`         | 循环开始新一轮     |
| `complete`      | 非循环队列全部完成 |
| `phase-change`  | 状态阶段发生变化   |

## 无障碍

- 使用 `Intl.Segmenter` 避免拆开 Emoji 和组合字符；
- 动画文字不逐字触发读屏，完整文本输入完成后才播报；
- 默认遵循 `prefers-reduced-motion`，需要时可设置 `reduced-motion="always"`；
- 光标在减弱动画模式下停止闪烁。

## 视觉定制

组件继承所在文本环境的字体和颜色，只为光标提供必要的默认视觉。可通过以下变量接入业务主题：

```css
.hero-title {
  --mf-typewriter-cursor-bg: #5267e9;
  --mf-typewriter-cursor-width: 2px;
  --mf-typewriter-cursor-gap: 2px;
  --mf-typewriter-cursor-radius: 999px;
}
```
