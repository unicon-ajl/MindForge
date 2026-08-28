<template>
  <transition name="mf-message-fade">
    <div v-if="visible" :class="['mf-message', `mf-message--${type}`]">
      <span class="mf-message__icon">{{ icon }}</span>
      <span class="mf-message__content">{{ message }}</span>
      <span class="mf-message__close" @click="handleClose">&times;</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onScopeDispose } from 'vue'
import type { MessageType } from './message'

defineOptions({ name: 'MfMessage' })

/** 单消息表现组件；队列版通知由 MessageHost 统一渲染。 */
interface Props {
  message: string
  type: MessageType
  onClose: () => void
}

const props = defineProps<Props>()
// visible 先驱动退场动画，动画结束后再通知调用方真正移除记录。
const visible = ref(true)

const icon = computed(() => {
  const icons: Record<MessageType, string> = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  }
  return icons[props.type]
})

let closeTimer: ReturnType<typeof setTimeout> | null = null

/** 播放退场状态，并在持续时间结束后执行外部关闭动作。 */
const handleClose = () => {
  visible.value = false
  closeTimer = setTimeout(() => {
    props.onClose()
    closeTimer = null
  }, 300)
}

// 组件卸载时清理定时器，避免对已销毁的组件继续调用回调。
onScopeDispose(() => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
})
</script>

<style scoped lang="scss">
.mf-message {
  // 独立组件使用 fixed 居中；消息队列场景由 MessageHost 接管布局。
  position: fixed;
  top: var(--mf-message-top, 20px);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--mf-message-padding, 10px 16px);
  border-radius: var(--mf-border-radius-base, 4px);
  display: flex;
  align-items: center;
  box-shadow: var(--mf-shadow-light, 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04));
  z-index: 99999;
  background: #f4f4f5;
  color: var(--mf-color-info, #909399);

  &--success {
    background: #f0f9eb;
    color: var(--mf-color-success, #67c23a);
  }

  &--warning {
    background: #fdf6ec;
    color: var(--mf-color-warning, #e6a23c);
  }

  &--error {
    background: #fef0f0;
    color: var(--mf-color-danger, #f56c6c);
  }

  &--info {
    background: #f4f4f5;
    color: var(--mf-color-info, #909399);
  }

  &__icon {
    margin-right: var(--mf-spacing-sm, 8px);
    font-size: var(--mf-font-size-md, 16px);
  }

  &__content {
    font-size: var(--mf-font-size-base, 14px);
  }

  &__close {
    margin-left: 12px;
    cursor: pointer;
    font-size: var(--mf-font-size-base, 14px);

    &:hover {
      opacity: 0.7;
    }
  }
}

.mf-message-fade-enter-active,
.mf-message-fade-leave-active {
  transition: all var(--mf-transition-duration, 0.3s);
}

.mf-message-fade-enter-from,
.mf-message-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
