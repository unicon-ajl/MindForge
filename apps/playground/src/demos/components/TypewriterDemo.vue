<template>
  <div>
    <p class="demo-desc">Unicode 安全的文本队列状态机，支持暂停、继续、跳过和减弱动画。</p>

    <section class="demo-block">
      <h4>基础与 Unicode</h4>
      <div class="demo-stage">
        <MfTypewriter items="MindForge：Emoji 👨‍👩‍👧‍👦 与组合字符 é 不会被拆开。" />
      </div>
      <p class="demo-tip">按完整字素输出，Emoji、肤色修饰符和组合字符不会出现半个字符。</p>
    </section>

    <section class="demo-block">
      <h4>文本队列</h4>
      <div class="demo-stage demo-stage--accent">
        <MfTypewriter
          :items="queue"
          loop
          :typing-speed="70"
          :deleting-speed="30"
          @item-complete="lastEvent = '当前文本输入完成'"
          @cycle="lastEvent = '开始新一轮'"
        />
      </div>
      <p class="demo-tip">
        每项可设置独立停留时间，队列之间自动删除和切换。最近事件：{{ lastEvent }}。
      </p>
    </section>

    <section class="demo-block">
      <h4>命令式控制</h4>
      <div class="demo-stage">
        <MfTypewriter
          ref="controllerRef"
          :items="controlledItems"
          :autoplay="false"
          @phase-change="phase = $event"
        />
      </div>
      <div class="controls">
        <button @click="controllerRef?.start()">开始</button>
        <button @click="controllerRef?.pause()">暂停</button>
        <button @click="controllerRef?.resume()">继续</button>
        <button @click="controllerRef?.skip()">跳过</button>
        <button @click="controllerRef?.restart()">重播</button>
        <button @click="controllerRef?.stop()">停止并保留</button>
        <button @click="controllerRef?.stop({ preserveText: false })">停止并清空</button>
      </div>
      <p class="demo-tip">
        控制器可暂停、继续、跳过或选择是否保留当前文字。当前阶段：{{ phase }}。
      </p>
    </section>

    <section class="demo-block">
      <h4>减弱动画</h4>
      <div class="demo-stage">
        <MfTypewriter
          items="系统要求减弱动态效果时，文本会立即完整显示。"
          reduced-motion="always"
        />
      </div>
      <p class="demo-tip">默认跟随系统动态效果偏好，也可通过 reduced-motion 强制指定策略。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  MfTypewriter,
  type TypewriterInstance,
  type TypewriterItem,
  type TypewriterPhase
} from '@packages/typewriter'

const queue: TypewriterItem[] = [
  { text: '只保留真正有价值的能力。', hold: 1400 },
  { text: 'API 简单，边界完整。', hold: 1000 },
  { text: '这才是 MindForge。', hold: 1800 }
]

const controlledItems: TypewriterItem[] = [
  { text: '可以暂停，也可以从剩余时间继续。' },
  { text: '跳过会直接进入下一项。' }
]

const controllerRef = ref<TypewriterInstance>()
// phase 和 lastEvent 直接展示组件对外事件，便于人工验证状态机语义。
const phase = ref<TypewriterPhase>('idle')
const lastEvent = ref('等待事件')
</script>

<style scoped lang="scss">
.demo-desc {
  color: var(--mf-color-text-secondary);
  font-size: 13px;
}

.demo-block {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--mf-bg-color-light);
  border-radius: var(--mf-border-radius-base);

  h4 {
    margin: 0 0 12px;
  }
}

.demo-stage {
  min-height: 52px;
  padding: 16px;
  border: 1px solid var(--mf-border-color-light);
  border-radius: var(--mf-border-radius-base);
  background: #fff;
  font-size: 18px;

  &--accent {
    color: var(--mf-color-primary);
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;

  button {
    padding: 7px 12px;
    border: 1px solid var(--mf-border-color-base);
    border-radius: 4px;
    background: #fff;
    cursor: pointer;

    &:hover {
      color: var(--mf-color-primary);
      border-color: var(--mf-color-primary);
    }
  }
}
</style>
