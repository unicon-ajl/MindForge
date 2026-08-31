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
        <span class="mf-message__icon" aria-hidden="true">
          <svg v-if="item.loading" class="mf-message__spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="9" stroke-dasharray="18 42" />
          </svg>
          <svg v-else-if="item.type === 'success'" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.6 2.6L16 9" />
          </svg>
          <svg v-else-if="item.type === 'warning'" viewBox="0 0 24 24">
            <path
              d="M10.4 4.2 3.2 17a2 2 0 0 0 1.7 3h14.2a2 2 0 0 0 1.7-3L13.6 4.2a1.8 1.8 0 0 0-3.2 0Z"
            />
            <path d="M12 9v4M12 16h.01" />
          </svg>
          <svg v-else-if="item.type === 'error'" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="m9 9 6 6M15 9l-6 6" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </span>
        <span class="mf-message__copy">
          <strong class="mf-message__title">{{ item.message }}</strong>
          <span v-if="item.description" class="mf-message__description">{{
            item.description
          }}</span>
        </span>
        <button
          v-if="item.closable"
          type="button"
          class="mf-message__close"
          :aria-label="item.closeLabel"
          @click="$emit('close', item.id)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

/** @module MessageHost 集中渲染消息，并提供无障碍播报。 */
<script setup lang="ts">
import { computed } from 'vue'
import type { MessageRecord } from './message'

defineOptions({ name: 'MfMessageHost' })
const props = defineProps<{ items: MessageRecord[] }>()
defineEmits<{ close: [id: string]; pause: [id: string]; resume: [id: string] }>()

// fixed Host 会形成统一堆叠上下文，其层级必须覆盖当前队列中层级最高的消息。
const hostZIndex = computed(() => Math.max(0, ...props.items.map(item => item.zIndex)))
</script>

<style scoped lang="scss">
.mf-message-host {
  // Host 不拦截页面操作，只有具体消息恢复 pointer-events。
  position: fixed;
  inset: var(--mf-message-top, 24px) 0 auto;
  pointer-events: none;
}

.mf-message-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mf-message-gap, 10px);
}

.mf-message {
  // position 让每条消息的动态 z-index 生效，支持与其他浮层按创建顺序叠放。
  position: relative;
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  // 380px 足够容纳常规双行信息，又不会在桌面端形成笨重的大卡片。
  width: min(var(--mf-message-width, 380px), calc(100vw - 32px));
  min-width: 0;
  padding: var(--mf-message-padding, 15px 13px 15px 16px);
  overflow: hidden;
  border: 1px solid var(--mf-message-border, #e4e9f1);
  border-radius: var(--mf-message-radius, 12px);
  box-shadow: var(--mf-message-shadow, 0 10px 26px rgba(31, 48, 76, 0.14));
  background: var(--mf-message-bg, #fff);
  color: var(--mf-message-text, #202939);

  // 细色条只承担状态识别，不用整块底色抢占正文注意力。
  &::before {
    position: absolute;
    inset: 13px auto 13px 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--mf-message-status);
    content: '';
  }

  &--info {
    --mf-message-status: var(--mf-color-primary, #3b82f6);
    --mf-message-status-soft: var(--mf-message-info-soft, #eaf3ff);
  }

  &--success {
    --mf-message-status: var(--mf-color-success, #16a36a);
    --mf-message-status-soft: var(--mf-message-success-soft, #e9f8f1);
  }
  &--warning {
    --mf-message-status: var(--mf-color-warning, #d98a0b);
    --mf-message-status-soft: var(--mf-message-warning-soft, #fff6e3);
  }
  &--error {
    --mf-message-status: var(--mf-color-danger, #dc4c4c);
    --mf-message-status-soft: var(--mf-message-error-soft, #fff0f0);
  }
  &__icon {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 50%;
    color: var(--mf-message-status);
    background: var(--mf-message-status-soft);
  }
  &__icon svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
  &__spinner {
    animation: mf-message-spin 1s linear infinite;
  }
  &__spinner circle:first-child {
    opacity: 0.24;
  }
  &__copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  &__title,
  &__description {
    overflow-wrap: anywhere;
  }
  &__title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.45;
  }
  &__description {
    color: var(--mf-message-muted, #6f7c90);
    font-size: 12px;
    line-height: 1.5;
  }
  &__close {
    display: grid;
    width: 32px;
    height: 32px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--mf-message-muted, #6f7c90);
    cursor: pointer;
    transition:
      color 0.16s ease,
      background-color 0.16s ease;
  }
  &__close:hover {
    color: var(--mf-message-text, #202939);
    background: var(--mf-message-status-soft);
  }
  &__close:focus-visible {
    outline: 2px solid var(--mf-message-status);
    outline-offset: 2px;
  }
  &__close svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-width: 2;
  }
}

@keyframes mf-message-spin {
  to {
    transform: rotate(360deg);
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
  .mf-message__spinner {
    animation: none;
  }
}
</style>
