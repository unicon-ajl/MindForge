<template>
  <span :class="['mf-typewriter', { 'mf-typewriter--cursor': showCursor }]" :style="cursorStyle">
    <!-- 已打出的文本 -->
    <span class="mf-typewriter__text">{{ displayText }}</span>
    <!-- 光标 -->
    <span v-if="showCursor" class="mf-typewriter__cursor" />
  </span>
</template>

/** @module Typewriter 打字机效果组件，支持逐字显示、打字速度控制、光标样式（可配置）、循环播放 */
<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from 'vue'

defineOptions({ name: 'MfTypewriter' })

/** 打字机模式 */
export type TypewriterMode = 'type' | 'delete' | 'loop'

/** 组件属性 */
interface Props {
  /** 要显示的完整文本 */
  text: string
  /** 每个字符的打字间隔（毫秒），默认 100 */
  speed?: number
  /** 删除每个字符的间隔（毫秒），默认 50 */
  deleteSpeed?: number
  /** 打完后的停顿时间（毫秒），默认 2000 */
  pauseDuration?: number
  /** 是否显示光标，默认 true */
  showCursor?: boolean
  /** 是否循环播放（仅 mode=loop 时生效），默认 false */
  loop?: boolean
  /** 播放模式：type(只打字) / delete(打完后删除) / loop(循环)，默认 type */
  mode?: TypewriterMode
  /** 是否立即开始，默认 true */
  immediate?: boolean
  /** 光标颜色，默认继承 --mf-typewriter-cursor-color 或 --mf-color-primary */
  cursorColor?: string
  /** 光标闪烁周期（毫秒），默认 1000 */
  cursorBlinkSpeed?: number
}

const props = withDefaults(defineProps<Props>(), {
  speed: 100,
  deleteSpeed: 50,
  pauseDuration: 2000,
  showCursor: true,
  loop: false,
  mode: 'type',
  immediate: true,
  cursorColor: undefined,
  cursorBlinkSpeed: 1000
})

const emit = defineEmits<{
  /** 每打出一个字符时触发 */
  type: [char: string, index: number]
  /** 打字完成时触发 */
  done: []
  /** 删除完成时触发（mode=delete 或 loop 时） */
  deleted: []
  /** 循环开始新一轮时触发 */
  loop: []
}>()

/** 当前已显示的文本 */
const currentText = ref('')
/** 是否正在运行 */
const isRunning = ref(false)
/** 当前阶段：typing / pausing / deleting */
const phase = ref<'idle' | 'typing' | 'pausing' | 'deleting'>('idle')

/** 计算最终显示文本 */
const displayText = computed(() => currentText.value)

/** 动态光标样式（通过 CSS 变量注入） */
const cursorStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.cursorColor) {
    style['--mf-typewriter-cursor-bg'] = props.cursorColor
  }
  if (props.cursorBlinkSpeed !== 1000) {
    style['--mf-typewriter-blink-duration'] = `${props.cursorBlinkSpeed}ms`
  }
  return style
})

/** 定时器引用 */
let timer: ReturnType<typeof setTimeout> | null = null

/** 清理定时器 */
function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

/** 打下一个字符 */
function typeNextChar() {
  if (!isRunning.value) return

  const fullText = props.text
  if (currentText.value.length < fullText.length) {
    // 还有字符需要打出
    const nextChar = fullText[currentText.value.length]
    currentText.value += nextChar
    emit('type', nextChar, currentText.value.length - 1)

    clearTimer()
    timer = setTimeout(typeNextChar, props.speed)
  } else {
    // 打字完成
    emit('done')
    phase.value = 'pausing'

    if (props.mode === 'type') {
      // 只打字模式，结束
      isRunning.value = false
      phase.value = 'idle'
      return
    }

    // delete 或 loop 模式，暂停后删除
    clearTimer()
    timer = setTimeout(startDeleting, props.pauseDuration)
  }
}

/** 删除字符 */
function deleteNextChar() {
  if (!isRunning.value) return

  if (currentText.value.length > 0) {
    currentText.value = currentText.value.slice(0, -1)

    clearTimer()
    timer = setTimeout(deleteNextChar, props.deleteSpeed)
  } else {
    // 删除完成
    emit('deleted')

    if (props.mode === 'loop' || props.loop) {
      // 循环模式，重新开始
      emit('loop')
      clearTimer()
      timer = setTimeout(startTyping, props.pauseDuration)
    } else {
      // delete 模式，结束
      isRunning.value = false
      phase.value = 'idle'
    }
  }
}

/** 开始打字 */
function startTyping() {
  isRunning.value = true
  phase.value = 'typing'
  currentText.value = ''
  typeNextChar()
}

/** 开始删除 */
function startDeleting() {
  phase.value = 'deleting'
  deleteNextChar()
}

/** 开始播放（外部调用） */
function start() {
  stop()
  startTyping()
}

/** 停止播放 */
function stop() {
  isRunning.value = false
  phase.value = 'idle'
  clearTimer()
  currentText.value = ''
}

/** 重置到初始状态 */
function reset() {
  stop()
}

/** 监听 text 变化，自动重启 */
watch(
  () => props.text,
  () => {
    if (props.immediate && !isRunning.value) {
      start()
    }
  }
)

// 组件挂载后自动开始
import { onMounted } from 'vue'
onMounted(() => {
  if (props.immediate) {
    start()
  }
})

// 作用域卸载时清理定时器
onScopeDispose(() => {
  clearTimer()
})

// 暴露方法给父组件
defineExpose({
  start,
  stop,
  reset,
  /** 当前是否正在运行 */
  isRunning: () => isRunning.value,
  /** 当前阶段 */
  getPhase: () => phase.value
})
</script>

<style scoped lang="scss">
.mf-typewriter {
  /* ===== 组件布局 ===== */
  display: inline-flex;
  align-items: center;
  font-family: inherit;
  font-size: inherit;
  color: inherit;

  &__text {
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ===== 光标样式（通过 CSS 变量可配置） ===== */
  &__cursor {
    display: inline-block;
    /* 光标宽度 */
    width: var(--mf-typewriter-cursor-width, 2px);
    /* 光标高度 */
    height: var(--mf-typewriter-cursor-height, 1em);
    /* 光标与文字间距 */
    margin-left: var(--mf-typewriter-cursor-gap, 2px);
    /* 光标背景（支持纯色或渐变，优先级：变量 > 主题 > 默认值） */
    background: var(--mf-typewriter-cursor-bg, var(--mf-color-primary, #409eff));
    /* 光标闪烁动画时长 */
    animation: mf-cursor-blink var(--mf-typewriter-blink-duration, 1s) step-end infinite;
    vertical-align: text-bottom;
    /* 光标圆角 */
    border-radius: var(--mf-typewriter-cursor-radius, 0);
  }
}

@keyframes mf-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
