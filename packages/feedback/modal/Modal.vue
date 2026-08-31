<template>
  <Teleport to="body">
    <transition
      name="mf-modal-fade"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="props.visible"
        class="mf-modal-mask"
        :style="maskStyle"
        role="presentation"
        @mousedown.self="handleMaskClick"
      >
        <div
          ref="dialogRef"
          class="mf-modal"
          :style="modalStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="dialogLabelledBy"
          :aria-label="dialogLabel || undefined"
          tabindex="-1"
          @mousedown.stop
        >
          <div class="mf-modal-header">
            <slot name="header">
              <span :id="titleId" class="mf-modal-title">{{ props.title }}</span>
            </slot>
            <button
              v-if="props.closable"
              class="mf-modal-close"
              type="button"
              :aria-label="closeLabel"
              @click="handleClose"
            >
              &times;
            </button>
          </div>
          <div class="mf-modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="mf-modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

/** @module Modal 基于 Overlay Manager 的可访问模态对话框。 */
<script setup lang="ts">
import { computed, onScopeDispose, ref, useSlots, watch } from 'vue'
import { activateFocusTrap, overlayManager, type OverlayHandle } from '@internal/overlay'

defineOptions({ name: 'MfModal' })

/** Modal 的展示、关闭方式和页面副作用配置。 */
interface Props {
  /** 是否显示，支持 v-model:visible。 */
  visible?: boolean
  /** 弹窗标题 */
  title?: string
  /** 弹窗宽度；数字按 px 处理，字符串保留 CSS 单位。 */
  width?: string | number
  /** 是否显示关闭按钮 */
  closable?: boolean
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean
  /** 是否允许 ESC 关闭 */
  closeOnEscape?: boolean
  /** 是否将 Tab 焦点限制在当前栈顶弹窗内。 */
  trapFocus?: boolean
  /** 是否锁定页面滚动 */
  lockScroll?: boolean
  /** 关闭按钮的无障碍文案 */
  closeLabel?: string
  /** 对话框的无障碍名称；使用自定义标题插槽时建议显式传入。 */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  width: '520px',
  closable: true,
  maskClosable: true,
  closeOnEscape: true,
  trapFocus: true,
  lockScroll: true,
  closeLabel: 'Close'
})

const emit = defineEmits<{
  /** v-model:visible 更新 */
  'update:visible': [value: boolean]
  /** 关闭事件 */
  close: []
}>()

const slots = useSlots()
const dialogRef = ref<HTMLElement | null>(null)
// 每个实例使用独立标题 id，避免多个 Modal 的 aria-labelledby 冲突。
const titleId = `mf-modal-title-${Math.random().toString(36).slice(2, 10)}`
const closeLabel = computed(() => props.closeLabel)
// 默认标题通过 aria-labelledby 关联；自定义标题无法安全注入 id，改用显式名称或 title。
const dialogLabel = computed(() => props.ariaLabel || (slots.header ? props.title : ''))
const dialogLabelledBy = computed(() =>
  !slots.header && props.title && !props.ariaLabel ? titleId : undefined
)
const zIndex = ref(2000)
let overlayHandle: OverlayHandle | null = null
let releaseScroll: (() => void) | null = null
let releaseFocus: (() => void) | null = null

const modalStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width
}))
const maskStyle = computed(() => ({ zIndex: zIndex.value }))

const handleClose = () => {
  // 组件遵循受控模式，只发送更新和语义事件，不直接改写 props。
  emit('update:visible', false)
  emit('close')
}

const handleMaskClick = () => {
  // 只有栈顶弹窗响应遮罩点击。
  if (props.maskClosable && overlayHandle?.isTopmost()) {
    handleClose()
  }
}

const openOverlay = (): void => {
  // 注册句柄既提供统一层级，也让 ESC 只分发给当前最顶层实例。
  if (overlayHandle || typeof document === 'undefined') return
  overlayHandle = overlayManager.register({
    type: 'modal',
    closeOnEscape: props.closeOnEscape,
    blocksEscape: true,
    onEscape: handleClose
  })
  zIndex.value = overlayHandle.zIndex
  if (props.lockScroll && !releaseScroll) releaseScroll = overlayManager.lockScroll()
}

/** 关闭开始时先退出交互栈，退场中的 Modal 不再接收 ESC。 */
const deactivateOverlay = (): void => {
  overlayHandle?.unregister()
  overlayHandle = null
}

/** 遮罩完全退场后再恢复页面状态，避免背景在动画期间提前滚动或获得焦点。 */
const releaseEffects = (): void => {
  releaseFocus?.()
  releaseFocus = null
  releaseScroll?.()
  releaseScroll = null
}

const disposeOverlay = (): void => {
  deactivateOverlay()
  releaseEffects()
}

const handleAfterEnter = (): void => {
  // 动画结束后再聚焦，避免聚焦尚未稳定的节点。
  if (props.trapFocus && dialogRef.value && overlayHandle && !releaseFocus) {
    releaseFocus = activateFocusTrap(dialogRef.value, () => overlayHandle?.isTopmost() ?? false)
  }
}

const handleAfterLeave = (): void => releaseEffects()

watch(
  () => props.visible,
  visible => {
    if (visible) openOverlay()
    else deactivateOverlay()
  },
  { immediate: true }
)

watch(
  () => props.closeOnEscape,
  closeOnEscape =>
    overlayHandle?.update({ closeOnEscape, blocksEscape: true, onEscape: handleClose })
)

watch(
  () => props.lockScroll,
  lockScroll => {
    if (!props.visible) return
    if (lockScroll && !releaseScroll) releaseScroll = overlayManager.lockScroll()
    else if (!lockScroll && releaseScroll) {
      releaseScroll()
      releaseScroll = null
    }
  }
)

watch(
  () => props.trapFocus,
  trapFocus => {
    if (!props.visible || !dialogRef.value) return
    if (trapFocus && !releaseFocus && overlayHandle) handleAfterEnter()
    else if (!trapFocus && releaseFocus) {
      releaseFocus()
      releaseFocus = null
    }
  }
)

onScopeDispose(disposeOverlay)
</script>

<style scoped lang="scss">
.mf-modal-mask {
  // 遮罩 Teleport 到 body，避免被业务容器的 overflow 和层叠上下文裁切。
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mf-modal {
  // 内容区自行滚动，弹窗整体始终限制在视口高度内。
  background: #fff;
  border-radius: var(--mf-modal-border-radius, 4px);
  box-shadow: var(--mf-shadow-light, 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04));
  max-height: 90vh;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  overflow: auto;
  min-width: min(var(--mf-modal-min-width, 520px), calc(100vw - 32px));

  &-header {
    padding: var(--mf-spacing-lg, 18px) var(--mf-spacing-lg, 18px) var(--mf-spacing-sm, 8px);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-title {
    font-size: var(--mf-font-size-lg, 18px);
    font-weight: 500;
  }

  &-close {
    display: inline-flex;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 6px;
    font-size: 24px;
    cursor: pointer;
    color: var(--mf-color-info, #909399);
    line-height: 1;

    &:hover {
      color: var(--mf-color-text-primary, #303133);
      background: var(--mf-bg-color-base, #f5f7fa);
    }

    &:focus-visible {
      outline: 2px solid rgba(64, 158, 255, 0.4);
      outline-offset: 2px;
    }
  }

  &-body {
    padding: var(--mf-spacing-sm, 8px) var(--mf-spacing-lg, 18px) var(--mf-spacing-lg, 18px);
  }

  &-footer {
    padding: var(--mf-spacing-sm, 8px) var(--mf-spacing-lg, 18px) var(--mf-spacing-lg, 18px);
    text-align: right;
  }
}

.mf-modal-fade-enter-active,
.mf-modal-fade-leave-active {
  transition: opacity var(--mf-transition-duration, 0.3s);
}

.mf-modal-fade-enter-from,
.mf-modal-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .mf-modal-fade-enter-active,
  .mf-modal-fade-leave-active {
    transition: none;
  }
}
</style>
