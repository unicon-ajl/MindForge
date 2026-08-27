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
          :aria-labelledby="$slots.header ? undefined : titleId"
          :aria-label="$slots.header ? props.title || undefined : undefined"
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
import { computed, onScopeDispose, ref, watch } from 'vue'
import { activateFocusTrap, overlayManager, type OverlayHandle } from '@internal/overlay'

defineOptions({ name: 'MfModal' })

/** 组件属性 */
interface Props {
  /** 是否显示（支持 v-model:visible） */
  visible?: boolean
  /** 弹窗标题 */
  title?: string
  /** 弹窗宽度 */
  width?: string | number
  /** 是否显示关闭按钮 */
  closable?: boolean
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean
  /** 是否允许 ESC 关闭 */
  closeOnEscape?: boolean
  /** 是否捕获并循环焦点 */
  trapFocus?: boolean
  /** 是否锁定页面滚动 */
  lockScroll?: boolean
  /** 关闭按钮的无障碍文案 */
  closeLabel?: string
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

const dialogRef = ref<HTMLElement | null>(null)
const titleId = `mf-modal-title-${Math.random().toString(36).slice(2, 10)}`
const closeLabel = computed(() => props.closeLabel)
const zIndex = ref(2000)
let overlayHandle: OverlayHandle | null = null
let releaseScroll: (() => void) | null = null
let releaseFocus: (() => void) | null = null

const modalStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width
}))
const maskStyle = computed(() => ({ zIndex: zIndex.value }))

const handleClose = () => {
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
  if (overlayHandle || typeof document === 'undefined') return
  overlayHandle = overlayManager.register({
    type: 'modal',
    closeOnEscape: props.closable && props.closeOnEscape,
    onEscape: handleClose
  })
  zIndex.value = overlayHandle.zIndex
  if (props.lockScroll) releaseScroll = overlayManager.lockScroll()
}

const closeOverlay = (): void => {
  // 按创建的反序释放副作用。
  releaseFocus?.()
  releaseFocus = null
  releaseScroll?.()
  releaseScroll = null
  overlayHandle?.unregister()
  overlayHandle = null
}

const handleAfterEnter = (): void => {
  // 动画结束后再聚焦，避免聚焦尚未稳定的节点。
  if (props.trapFocus && dialogRef.value && overlayHandle) {
    releaseFocus = activateFocusTrap(dialogRef.value, () => overlayHandle?.isTopmost() ?? false)
  }
}

const handleAfterLeave = (): void => closeOverlay()

watch(
  () => props.visible,
  visible => {
    if (visible) openOverlay()
    else closeOverlay()
  },
  { immediate: true }
)

onScopeDispose(closeOverlay)
</script>

<style scoped lang="scss">
.mf-modal-mask {
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
  background: #fff;
  border-radius: var(--mf-modal-border-radius, 4px);
  box-shadow: var(--mf-shadow-light, 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04));
  max-height: 90vh;
  overflow: auto;
  min-width: var(--mf-modal-min-width, 520px);

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
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--mf-color-info, #909399);
    line-height: 1;

    &:hover {
      opacity: 0.7;
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

.mf-modal-zoom-enter-active,
.mf-modal-zoom-leave-active {
  transition:
    transform 0.3s,
    opacity 0.3s;
}

.mf-modal-zoom-enter-from,
.mf-modal-zoom-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>
