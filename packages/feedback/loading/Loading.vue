<template>
  <div
    class="mf-loading-mask"
    :class="{ 'mf-loading-mask--inline': inline }"
    :style="maskStyle"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="mf-loading-spinner">
      <!-- 点状 -->
      <template v-if="spinner === 'dots'">
        <span v-for="i in 12" :key="i" class="mf-loading-dot"></span>
      </template>
      <!-- 圆环 -->
      <template v-else-if="spinner === 'circle'">
        <div class="mf-loading-circle"></div>
      </template>
      <!-- 横条 -->
      <template v-else-if="spinner === 'bars'">
        <span v-for="i in 5" :key="i" class="mf-loading-bar"></span>
      </template>
    </div>
    <div v-if="text" class="mf-loading-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadingSpinnerType } from './loading'

defineOptions({ name: 'MfLoading' })

/** 该组件只负责渲染；实例创建、计时和资源清理由 loading.ts 管理。 */
const props = defineProps<{
  text?: string
  spinner?: LoadingSpinnerType
  background?: string
  color?: string
  inline?: boolean
  zIndex?: number
}>()

const maskStyle = computed(() => {
  // 使用内联变量让单个实例可定制颜色，同时保留全局 CSS 变量的默认值。
  const styles: Record<string, string> = {}
  if (props.background) {
    styles.background = props.background
  }
  if (props.color) {
    styles.color = props.color
    styles['--mf-loading-custom-color'] = props.color
  }
  if (props.zIndex) styles.zIndex = String(props.zIndex)
  return styles
})
</script>

<style scoped lang="scss">
.mf-loading-mask {
  // 全屏默认使用 fixed；局部模式切换为 absolute 并依赖目标元素的定位上下文。
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  color: var(--mf-loading-custom-color, var(--mf-color-primary, #5267e9));
  background: var(--mf-loading-mask-bg, rgba(250, 251, 254, 0.9));
  backdrop-filter: blur(3px) saturate(0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: var(--mf-loading-z-index, 2000);

  &--inline {
    position: absolute;
  }
}

.mf-loading-spinner {
  position: relative;
  width: 42px;
  height: 42px;
  filter: drop-shadow(0 4px 8px rgba(82, 103, 233, 0.16));
}

/* 点状动画 */
.mf-loading-dot {
  position: absolute;
  left: 50%;
  top: 0;
  width: 4px;
  height: 12px;
  background: currentcolor;
  border-radius: 999px;
  transform-origin: center 21px;
  animation: loading-dot 1.2s ease-in-out infinite;

  @for $i from 1 through 12 {
    // 均匀旋转并错开动画相位，形成连续环形运动。
    &:nth-child(#{$i}) {
      transform: rotate(($i - 1) * 30deg);
      animation-delay: ($i - 1) * 0.1s;
    }
  }
}

/* 圆环动画 */
.mf-loading-circle {
  width: 36px;
  height: 36px;
  border: 3px solid color-mix(in srgb, currentcolor 16%, transparent);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: loading-circle 0.8s linear infinite;
}

/* 横条动画 */
.mf-loading-bar {
  display: inline-block;
  width: 4px;
  height: 24px;
  margin: 0 2px;
  background: currentcolor;
  border-radius: 999px;
  animation: loading-bar 1s ease-in-out infinite;

  @for $i from 1 through 5 {
    // 相邻横条错峰缩放，避免所有条同时跳动。
    &:nth-child(#{$i}) {
      animation-delay: ($i - 1) * 0.15s;
    }
  }
}

.mf-loading-text {
  margin-top: 14px;
  color: var(--mf-loading-text, var(--mf-color-text-regular, #4c566a));
  font-size: var(--mf-font-size-sm, 13px);
  font-weight: 550;
  letter-spacing: 0.01em;
}

@keyframes loading-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes loading-circle {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loading-bar {
  0%,
  100% {
    transform: scaleY(0.4);
  }
  50% {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mf-loading-dot,
  .mf-loading-circle,
  .mf-loading-bar {
    animation: none;
  }

  .mf-loading-dot {
    opacity: 0.65;
  }
}
</style>
