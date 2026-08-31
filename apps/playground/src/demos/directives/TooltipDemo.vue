<template>
  <div>
    <section class="demo-block">
      <h4>基础使用</h4>
      <button v-tooltip="'这是一条安全的纯文本提示'" class="demo-button">悬停或聚焦</button>
      <button
        v-tooltip="{ content: '浅色主题：白底黑字', theme: 'light' }"
        class="demo-button demo-button--plain"
      >
        浅色主题
      </button>
      <p class="demo-tip">
        内置深色与浅色主题；鼠标悬停和键盘聚焦都会显示，悬停时按 ESC 也可立即关闭。
      </p>
    </section>

    <section class="demo-block">
      <h4>仅溢出时显示</h4>
      <div class="overflow-row">
        <span v-tooltip.overflow="shortText" class="overflow-text" tabindex="0">{{
          shortText
        }}</span>
        <span v-tooltip.overflow="longText" class="overflow-text" tabindex="0">{{ longText }}</span>
      </div>
      <p class="demo-tip">同一套 API 同时识别单行横向溢出和多行纵向截断。</p>
    </section>

    <section class="demo-block demo-block--edge">
      <h4>自动翻转与视口避让</h4>
      <button
        v-tooltip="{ content: '空间不足时会自动翻转，并始终留在视口内', placement: 'left' }"
        class="demo-button"
      >
        靠近左侧边界
      </button>
      <p class="demo-tip">基于 Floating UI 跟随滚动和尺寸变化，不依赖一次性的坐标计算。</p>
    </section>

    <section class="demo-block">
      <h4>动态配置</h4>
      <button
        v-tooltip="{ content: dynamicContent, disabled, delay: [300, 80], maxWidth: 240 }"
        class="demo-button"
        @click="disabled = !disabled"
      >
        {{ disabled ? '已禁用，点击启用' : '已启用，点击禁用' }}
      </button>
      <button class="demo-button demo-button--plain" @click="changeContent">更新内容</button>
      <p class="demo-tip">内容、主题、禁用状态、位置、延迟和最大宽度都可响应式更新。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { vTooltip } from '@packages/tooltip'

const shortText = '短文本'
// 两组文本用于直观看出 overflow 模式只在真实裁切时创建 Tooltip。
const longText = '这是一段明显超过容器宽度的文本，只有真正发生溢出时才显示完整内容。'
const disabled = ref(false)
const dynamicContent = ref('支持响应式更新内容')

const changeContent = (): void => {
  // 原位切换内容，用于验证指令 updated 生命周期不会重建目标元素。
  dynamicContent.value =
    dynamicContent.value === '支持响应式更新内容'
      ? '内容已经更新，无需重新绑定指令'
      : '支持响应式更新内容'
}
</script>

<style scoped lang="scss">
.demo-block {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: var(--mf-border-radius-base);
  background: var(--mf-bg-color-light);
  h4 {
    margin: 0 0 12px;
  }
  &--edge {
    padding-left: 8px;
  }
}
.demo-button {
  margin-right: 8px;
  padding: 8px 14px;
  border: 1px solid var(--mf-color-primary);
  border-radius: 4px;
  color: #fff;
  background: var(--mf-color-primary);
  cursor: pointer;
  &--plain {
    color: var(--mf-color-primary);
    background: #fff;
  }
}
.overflow-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.overflow-text {
  display: block;
  width: 220px;
  padding: 10px;
  overflow: hidden;
  border: 1px solid var(--mf-border-color-light);
  border-radius: 4px;
  background: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
