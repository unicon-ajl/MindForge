<template>
  <span class="mf-typewriter" :style="cursorStyle">
    <span class="mf-typewriter__text" aria-hidden="true">{{ displayText }}</span>
    <span v-if="cursor" class="mf-typewriter__cursor" aria-hidden="true" />
    <span class="mf-typewriter__announcement" aria-live="polite">{{ announcement }}</span>
  </span>
</template>

/** @module Typewriter Unicode 安全、队列驱动的打字机组件。 */
<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { TypewriterMachine } from './machine'
import type {
  ReducedMotionStrategy,
  TypewriterController,
  TypewriterItem,
  TypewriterItems,
  TypewriterPhase
} from './types'

defineOptions({ name: 'MfTypewriter' })

interface Props {
  /** 单段文本或文本队列；队列项可单独覆盖停留时间。 */
  items: TypewriterItems
  /** 输入单个字素的间隔，单位为 ms。 */
  typingSpeed?: number
  /** 删除单个字素的间隔，单位为 ms。 */
  deletingSpeed?: number
  /** 输入完成后的默认停留时间，单位为 ms。 */
  hold?: number
  /** 是否在队尾回到队首持续播放。 */
  loop?: boolean
  /** 挂载后以及 items 更新后是否自动启动。 */
  autoplay?: boolean
  /** 是否显示视觉光标。 */
  cursor?: boolean
  /** 光标颜色；默认继承项目主色变量。 */
  cursorColor?: string
  /** 光标完整闪烁周期，单位为 ms。 */
  cursorBlinkSpeed?: number
  /** 减少动态效果策略；auto 跟随操作系统设置。 */
  reducedMotion?: ReducedMotionStrategy
}

const props = withDefaults(defineProps<Props>(), {
  typingSpeed: 80,
  deletingSpeed: 40,
  hold: 1200,
  loop: false,
  autoplay: true,
  cursor: true,
  cursorColor: undefined,
  cursorBlinkSpeed: 1000,
  reducedMotion: 'auto'
})

const emit = defineEmits<{
  type: [character: string, characterIndex: number, itemIndex: number]
  'item-complete': [item: TypewriterItem, itemIndex: number]
  'item-delete': [item: TypewriterItem, itemIndex: number]
  cycle: []
  complete: []
  'phase-change': [phase: TypewriterPhase]
}>()

const displayText = ref('')
// 视觉文本逐字变化过于频繁，只在单项完成时通过 aria-live 播报完整内容。
const announcement = ref('')
const phase = ref<TypewriterPhase>('idle')
const prefersReducedMotion = ref(false)
let mediaQuery: MediaQueryList | null = null
const handleMediaChange = (event: MediaQueryListEvent): void => {
  prefersReducedMotion.value = event.matches
  syncOptions()
  if (props.autoplay) machine.restart()
}

const shouldReduceMotion = (): boolean =>
  props.reducedMotion === 'always' || (props.reducedMotion === 'auto' && prefersReducedMotion.value)

const machineOptions = () => ({
  typingSpeed: props.typingSpeed,
  deletingSpeed: props.deletingSpeed,
  hold: props.hold,
  loop: props.loop,
  reducedMotion: shouldReduceMotion()
})

const machine = new TypewriterMachine(props.items, machineOptions(), {
  onText: text => {
    displayText.value = text
  },
  onPhase: nextPhase => {
    phase.value = nextPhase
    emit('phase-change', nextPhase)
  },
  onType: (character, characterIndex, itemIndex) =>
    emit('type', character, characterIndex, itemIndex),
  onItemComplete: (item, itemIndex) => {
    announcement.value = item.text
    emit('item-complete', item, itemIndex)
  },
  onItemDelete: (item, itemIndex) => emit('item-delete', item, itemIndex),
  onCycle: () => emit('cycle'),
  onComplete: () => emit('complete')
})

const syncOptions = (): void => machine.setOptions(machineOptions())

watch(() => [props.typingSpeed, props.deletingSpeed, props.hold, props.loop] as const, syncOptions)

watch(
  () => props.items,
  items => {
    // 新队列意味着新的播报上下文，旧公告必须先清空。
    syncOptions()
    announcement.value = ''
    machine.setItems(items, props.autoplay)
  },
  { deep: true }
)

watch(
  () => props.autoplay,
  autoplay => {
    if (autoplay) machine.start()
    else machine.stop()
  }
)

watch(
  () => props.reducedMotion,
  () => {
    syncOptions()
    if (props.autoplay) machine.restart()
  }
)

const cursorStyle = computed(() => ({
  '--mf-typewriter-cursor-bg': props.cursorColor,
  '--mf-typewriter-blink-duration': `${Math.max(0, props.cursorBlinkSpeed)}ms`
}))

const controller: TypewriterController = {
  start: () => machine.start(),
  pause: () => machine.pause(),
  resume: () => machine.resume(),
  restart: () => machine.restart(),
  skip: () => machine.skip(),
  stop: options => machine.stop(options),
  getPhase: () => phase.value,
  isRunning: () => machine.isRunning()
}

onMounted(() => {
  // matchMedia 只在客户端访问；auto 模式下持续响应系统偏好变化。
  if (typeof window !== 'undefined' && props.reducedMotion === 'auto') {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleMediaChange)
  }
  syncOptions()
  if (props.autoplay) machine.start()
})

onScopeDispose(() => {
  // 组件销毁时同时释放媒体监听和状态机计时器。
  mediaQuery?.removeEventListener('change', handleMediaChange)
  machine.destroy()
})

defineExpose(controller)
</script>

<style scoped lang="scss">
.mf-typewriter {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font: inherit;

  &__text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  &__cursor {
    width: var(--mf-typewriter-cursor-width, 2px);
    height: var(--mf-typewriter-cursor-height, 1em);
    margin-left: var(--mf-typewriter-cursor-gap, 2px);
    border-radius: var(--mf-typewriter-cursor-radius, 0);
    background: var(--mf-typewriter-cursor-bg, var(--mf-color-primary, #409eff));
    animation: mf-cursor-blink var(--mf-typewriter-blink-duration, 1s) step-end infinite;
  }

  &__announcement {
    // 保留给读屏软件，视觉上隐藏但不能使用 display: none。
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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

@media (prefers-reduced-motion: reduce) {
  // 即使业务强制播放文字动画，也尊重系统设置关闭纯装饰性的光标闪烁。
  .mf-typewriter__cursor {
    animation: none;
  }
}
</style>
