<template>
  <span ref="root" class="mf-prompt-suggestions">
    <slot name="trigger" :open="open" :trigger-props="triggerProps">
      <button class="mf-prompt-suggestions__trigger" type="button" v-bind="triggerProps">
        {{ triggerLabel }}
      </button>
    </slot>

    <Teleport to="body">
      <Transition name="mf-prompt-suggestions-fade">
        <div
          v-if="open"
          :id="panelId"
          ref="floating"
          class="mf-prompt-suggestions__panel"
          :style="panelStyle"
          @keydown="handlePanelKeydown"
        >
          <div v-if="status === 'loading'" class="mf-prompt-suggestions__state" role="status">
            <slot name="loading">{{ loadingText }}</slot>
          </div>
          <div v-else-if="status === 'error'" class="mf-prompt-suggestions__state" role="alert">
            <slot name="error" :error="loadError">{{ errorText }}</slot>
          </div>
          <div v-else-if="status === 'empty'" class="mf-prompt-suggestions__state" role="status">
            <slot name="empty">{{ emptyText }}</slot>
          </div>
          <div
            v-else
            ref="listbox"
            class="mf-prompt-suggestions__list"
            role="listbox"
            :aria-label="ariaLabel"
          >
            <div
              v-for="group in groupedItems"
              :key="group.key"
              class="mf-prompt-suggestions__group"
              role="group"
              :aria-label="group.label || undefined"
            >
              <div v-if="group.label" class="mf-prompt-suggestions__group-label" aria-hidden="true">
                {{ group.label }}
              </div>
              <button
                v-for="item in group.items"
                :id="optionId(item.id)"
                :key="item.id"
                :ref="element => setOptionRef(item.id, element)"
                type="button"
                role="option"
                class="mf-prompt-suggestions__option"
                :class="{ 'is-active': item.id === activeId }"
                :aria-selected="item.id === activeId"
                :aria-disabled="item.disabled || undefined"
                :disabled="item.disabled"
                :tabindex="item.id === activeId ? 0 : -1"
                @focus="activeId = item.id"
                @pointermove="!item.disabled && (activeId = item.id)"
                @click="select(item)"
              >
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  class="mf-prompt-suggestions__icon"
                  aria-hidden="true"
                />
                <span class="mf-prompt-suggestions__copy">
                  <span class="mf-prompt-suggestions__label">{{ item.label }}</span>
                  <span v-if="item.description" class="mf-prompt-suggestions__description">
                    {{ item.description }}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

/** @module PromptSuggestions 支持异步竞态保护和完整键盘访问的智能建议面板。 */
<script setup lang="ts">
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom'
import {
  computed,
  nextTick,
  onScopeDispose,
  ref,
  useId,
  watch,
  type ComponentPublicInstance
} from 'vue'
import type { PromptSuggestion, PromptSuggestionSource, PromptSuggestionsStatus } from './types'

defineOptions({ name: 'MfPromptSuggestions' })

interface Props {
  /** 同步建议；未提供 source 时直接展示。 */
  items?: readonly PromptSuggestion[]
  /** 打开面板时加载建议的异步数据源。 */
  source?: PromptSuggestionSource
  /** 传递给 source 的上下文；变化时中止并重新发起请求。 */
  context?: unknown
  /** 浮层首选位置，空间不足时会自动翻转和位移。 */
  placement?: Placement
  /** 列表的无障碍名称。 */
  ariaLabel?: string
  /** 默认触发按钮文本。 */
  triggerLabel?: string
  loadingText?: string
  emptyText?: string
  errorText?: string
  /** 选择后是否关闭面板。 */
  closeOnSelect?: boolean
  /** 点击组件外部时是否关闭。 */
  closeOnOutside?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  source: undefined,
  context: undefined,
  placement: 'top-start',
  ariaLabel: '智能建议',
  triggerLabel: '你可以试试…',
  loadingText: '正在获取建议…',
  emptyText: '暂无可用建议',
  errorText: '建议加载失败，请稍后重试',
  closeOnSelect: true,
  closeOnOutside: true
})

const emit = defineEmits<{
  select: [item: PromptSuggestion]
  'load-error': [error: unknown]
}>()

const open = defineModel<boolean>('open', { default: false })
const root = ref<HTMLElement | null>(null)
const floating = ref<HTMLElement | null>(null)
const listbox = ref<HTMLElement | null>(null)
const loadedItems = ref<readonly PromptSuggestion[]>([])
const status = ref<PromptSuggestionsStatus>('idle')
const loadError = ref<unknown>()
const activeId = ref<string>()
const optionRefs = new Map<string, HTMLElement>()
const panelId = `mf-prompt-suggestions-${useId()}`
let stopPositioning: (() => void) | undefined
let controller: AbortController | undefined
let requestId = 0

const displayedItems = computed(() => (props.source ? loadedItems.value : props.items))
const enabledItems = computed(() => displayedItems.value.filter(item => !item.disabled))
const groupedItems = computed(() => {
  const groups = new Map<string, PromptSuggestion[]>()
  displayedItems.value.forEach(item => {
    const key = item.group ?? ''
    const current = groups.get(key) ?? []
    current.push(item)
    groups.set(key, current)
  })
  return Array.from(groups, ([label, items], index) => ({ key: `${index}:${label}`, label, items }))
})

const panelStyle = ref<Record<string, string>>({})
const updatePosition = async (): Promise<void> => {
  const reference = root.value
  const panel = floating.value
  if (!reference || !panel) return
  const result = await computePosition(reference, panel, {
    strategy: 'fixed',
    placement: props.placement,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  })
  panelStyle.value = { left: `${result.x}px`, top: `${result.y}px`, position: result.strategy }
}

const setOptionRef = (id: string, element: Element | ComponentPublicInstance | null): void => {
  if (element instanceof HTMLElement) optionRefs.set(id, element)
  else optionRefs.delete(id)
}
const optionId = (id: string): string => `${panelId}-option-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`

const focusItem = (id?: string): void => {
  if (!id) return
  activeId.value = id
  nextTick(() => optionRefs.get(id)?.focus({ preventScroll: true }))
}

const move = (direction: 1 | -1): void => {
  const items = enabledItems.value
  if (!items.length) return
  const current = items.findIndex(item => item.id === activeId.value)
  const next =
    current < 0
      ? direction === 1
        ? 0
        : items.length - 1
      : (current + direction + items.length) % items.length
  focusItem(items[next].id)
}

const close = (restoreFocus = true): void => {
  open.value = false
  if (restoreFocus)
    nextTick(() => root.value?.querySelector<HTMLElement>('button, [tabindex]')?.focus())
}

const select = (item: PromptSuggestion): void => {
  if (item.disabled) return
  emit('select', item)
  if (props.closeOnSelect) close()
}

const handleTriggerKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) open.value = true
    nextTick(() => move(event.key === 'ArrowDown' ? 1 : -1))
  } else if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    close()
  }
}

const triggerProps = computed(() => ({
  'aria-expanded': open.value,
  'aria-controls': open.value ? panelId : undefined,
  'aria-haspopup': 'listbox' as const,
  onClick: () => {
    open.value = !open.value
  },
  onKeydown: handleTriggerKeydown
}))

const handlePanelKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    move(event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusItem(event.key === 'Home' ? enabledItems.value[0]?.id : enabledItems.value.at(-1)?.id)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

const load = async (): Promise<void> => {
  if (!props.source || !open.value) return
  controller?.abort()
  controller = new AbortController()
  const currentRequest = ++requestId
  status.value = 'loading'
  loadError.value = undefined
  try {
    const result = await props.source(props.context, controller.signal)
    if (controller.signal.aborted || currentRequest !== requestId) return
    loadedItems.value = result
    status.value = result.length ? 'ready' : 'empty'
  } catch (error) {
    if (controller.signal.aborted || currentRequest !== requestId) return
    loadError.value = error
    status.value = 'error'
    emit('load-error', error)
  }
}

const handleDocumentPointerdown = (event: PointerEvent): void => {
  if (!props.closeOnOutside || !open.value || !(event.target instanceof Node)) return
  if (!root.value?.contains(event.target) && !floating.value?.contains(event.target)) close(false)
}

watch(
  () => [open.value, props.context, props.source] as const,
  ([isOpen]) => {
    if (!isOpen) {
      controller?.abort()
      stopPositioning?.()
      stopPositioning = undefined
      return
    }
    load()
    nextTick(() => {
      if (root.value && floating.value)
        stopPositioning = autoUpdate(root.value, floating.value, updatePosition)
      if (!props.source) status.value = props.items.length ? 'ready' : 'empty'
      const preserved = enabledItems.value.find(item => item.id === activeId.value)?.id
      focusItem(preserved ?? enabledItems.value[0]?.id)
    })
  },
  { immediate: true }
)

watch(displayedItems, items => {
  if (!open.value) return
  status.value = items.length ? 'ready' : 'empty'
  const preserved = enabledItems.value.find(item => item.id === activeId.value)?.id
  focusItem(preserved ?? enabledItems.value[0]?.id)
})

if (typeof document !== 'undefined')
  document.addEventListener('pointerdown', handleDocumentPointerdown, true)

onScopeDispose(() => {
  controller?.abort()
  stopPositioning?.()
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', handleDocumentPointerdown, true)
})
</script>

<style scoped lang="scss">
.mf-prompt-suggestions {
  display: inline-flex;

  &__trigger {
    padding: 6px 10px;
    border: 1px solid var(--mf-prompt-border, #dcdfe6);
    border-radius: var(--mf-prompt-radius, 8px);
    color: var(--mf-prompt-trigger-color, #606266);
    background: var(--mf-prompt-bg, #fff);
    cursor: pointer;
  }

  &__panel {
    z-index: var(--mf-prompt-z-index, 2100);
    width: min(var(--mf-prompt-width, 360px), calc(100vw - 16px));
    max-height: min(var(--mf-prompt-max-height, 420px), calc(100vh - 16px));
    padding: 8px;
    overflow: auto;
    border: 1px solid var(--mf-prompt-border, #e4e7ed);
    border-radius: var(--mf-prompt-radius, 10px);
    color: var(--mf-prompt-text, #303133);
    background: var(--mf-prompt-bg, #fff);
    box-shadow: var(--mf-prompt-shadow, 0 8px 28px rgb(0 0 0 / 14%));
  }

  &__group + &__group {
    margin-top: 8px;
  }
  &__group-label {
    padding: 6px 10px 4px;
    color: var(--mf-prompt-muted, #909399);
    font-size: 12px;
    font-weight: 600;
  }

  &__option {
    display: flex;
    width: 100%;
    gap: 10px;
    align-items: flex-start;
    padding: 10px;
    border: 0;
    border-radius: 7px;
    color: inherit;
    background: transparent;
    text-align: left;
    cursor: pointer;

    &:hover,
    &.is-active {
      background: var(--mf-prompt-active-bg, #ecf5ff);
    }
    &:focus-visible {
      outline: 2px solid var(--mf-prompt-focus, #409eff);
      outline-offset: -2px;
    }
    &:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }
  }

  &__icon {
    width: 18px;
    height: 18px;
    flex: none;
    margin-top: 1px;
    color: var(--mf-prompt-icon, #606266);
  }
  &__copy {
    min-width: 0;
    display: grid;
    gap: 3px;
  }
  &__label {
    overflow-wrap: anywhere;
    font-size: 14px;
    font-weight: 500;
  }
  &__description {
    overflow-wrap: anywhere;
    color: var(--mf-prompt-muted, #909399);
    font-size: 12px;
    line-height: 1.45;
  }
  &__state {
    padding: 24px 16px;
    color: var(--mf-prompt-muted, #909399);
    text-align: center;
    font-size: 14px;
  }
}

.mf-prompt-suggestions-fade-enter-active,
.mf-prompt-suggestions-fade-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}
.mf-prompt-suggestions-fade-enter-from,
.mf-prompt-suggestions-fade-leave-to {
  opacity: 0;
  transform: translateY(3px);
}

@media (prefers-reduced-motion: reduce) {
  .mf-prompt-suggestions-fade-enter-active,
  .mf-prompt-suggestions-fade-leave-active {
    transition: none;
  }
}
</style>
