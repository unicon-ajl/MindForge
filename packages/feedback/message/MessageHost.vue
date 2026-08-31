<template>
  <div class="mf-message-host" :style="{ zIndex: hostZIndex }">
    <TransitionGroup name="mf-message-list" tag="div" class="mf-message-list">
      <div
        v-for="item in items"
        :key="item.id"
        :class="['mf-message', `mf-message--${item.type}`]"
        :style="{ zIndex: item.zIndex }"
        :role="item.type === 'error' ? 'alert' : 'status'"
        aria-atomic="true"
        @mouseenter="$emit('pause', item.id)"
        @mouseleave="$emit('resume', item.id)"
        @focusin="$emit('pause', item.id)"
        @focusout="$emit('resume', item.id)"
      >
        <span class="mf-message__icon" aria-hidden="true">{{ icons[item.type] }}</span>
        <span class="mf-message__content">{{ item.message }}</span>
        <button
          v-if="item.closable"
          type="button"
          class="mf-message__close"
          :aria-label="item.closeLabel"
          @click="$emit('close', item.id)"
        >
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

/** @module MessageHost 集中渲染消息，并提供无障碍播报。 */
<script setup lang="ts">
import { computed } from 'vue'
import type { MessageRecord, MessageType } from './message'

defineOptions({ name: 'MfMessageHost' })
const props = defineProps<{ items: MessageRecord[] }>()
defineEmits<{ close: [id: string]; pause: [id: string]; resume: [id: string] }>()

// fixed Host 会形成统一堆叠上下文，其层级必须覆盖当前队列中层级最高的消息。
const hostZIndex = computed(() => Math.max(0, ...props.items.map(item => item.zIndex)))
const icons: Record<MessageType, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ'
}
</script>

<style scoped lang="scss">
.mf-message-host {
  // Host 不拦截页面操作，只有具体消息恢复 pointer-events。
  position: fixed;
  inset: var(--mf-message-top, 20px) 0 auto;
  pointer-events: none;
}

.mf-message-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.mf-message {
  // position 让每条消息的动态 z-index 生效，支持与其他浮层按创建顺序叠放。
  position: relative;
  pointer-events: auto;
  max-width: min(560px, calc(100vw - 32px));
  padding: var(--mf-message-padding, 10px 16px);
  border-radius: var(--mf-border-radius-base, 4px);
  display: flex;
  align-items: center;
  box-shadow: var(--mf-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
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
  &__icon {
    margin-right: 8px;
    font-size: 16px;
  }
  &__content {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 14px;
  }
  &__close {
    margin-left: 12px;
    padding: 0;
    border: 0;
    background: transparent;
    color: currentColor;
    cursor: pointer;
    font-size: 16px;
  }
}

.mf-message-list-enter-active,
.mf-message-list-leave-active,
.mf-message-list-move {
  transition: all 0.25s ease;
}
.mf-message-list-enter-from,
.mf-message-list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .mf-message-list-enter-active,
  .mf-message-list-leave-active,
  .mf-message-list-move {
    transition: none;
  }
}
</style>
