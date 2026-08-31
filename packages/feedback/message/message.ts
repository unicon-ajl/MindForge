/** @module Message 单宿主通知中心，避免每条消息创建独立 Vue App。 */
import { createApp, reactive, type App } from 'vue'
import MessageHost from './MessageHost.vue'
import { overlayManager } from '@internal/overlay'

export type MessageType = 'success' | 'warning' | 'error' | 'info'

/** 创建通知时的内容、时长和交互策略。 */
export interface MessageOptions {
  /** 通知主文案，按纯文本渲染。 */
  message: string
  /** 补充上下文；信息不完整时省略，不用空文案占位。 */
  description?: string
  /** 通知语义；默认 `info`，错误类型使用更强的无障碍播报。 */
  type?: MessageType
  /** 是否展示进行中图标；Promise 的 pending 阶段默认开启。 */
  loading?: boolean
  /** 自动关闭时间，单位为 ms；0 表示持续显示。 */
  duration?: number
  /** 是否展示主动关闭按钮。 */
  closable?: boolean
  /** 关闭按钮的无障碍文案；默认继承全局配置。 */
  closeLabel?: string
  /** 悬停时是否暂停剩余倒计时。 */
  pauseOnHover?: boolean
  /** 通知被关闭且移出队列后调用。 */
  onClose?: () => void
}

/** 交给 MessageHost 渲染的标准化记录。 */
export interface MessageRecord {
  id: string
  message: string
  description?: string
  type: MessageType
  loading: boolean
  closable: boolean
  closeLabel: string
  pauseOnHover: boolean
  zIndex: number
  onClose?: () => void
}

export interface MessageHandler {
  /** 当前通知的唯一标识，可交给 `message.close` 使用。 */
  id: string
  /** 立即关闭当前通知。 */
  close: () => void
  /** 原位修改文案、状态和剩余计时策略。 */
  update: (options: string | Partial<MessageOptions>) => void
}

/** Message 宿主的全局默认策略。 */
export interface MessageConfig {
  /** 同时展示的最大数量，最小为 1，默认 5。 */
  maxCount?: number
  /** 未单独指定 duration 时的展示时间，单位为 ms，默认 3000。 */
  duration?: number
  /** 关闭按钮的默认无障碍文案。 */
  closeLabel?: string
}

interface TimerState {
  timer: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

const DEFAULT_CONFIG: Required<MessageConfig> = {
  maxCount: 5,
  duration: 3000,
  closeLabel: 'Close notification'
}
let config = { ...DEFAULT_CONFIG }
// 所有消息共享响应式队列和单个 Vue Host，避免频繁创建独立应用实例。
const records = reactive<MessageRecord[]>([])
const timers = new Map<string, TimerState>()
// 悬停与键盘焦点可能同时存在，使用深度计数避免任一交互结束后过早恢复倒计时。
const pauseDepths = new Map<string, number>()
let hostApp: App | null = null
let hostContainer: HTMLElement | null = null
let idSeed = 0
let destroyTimer: ReturnType<typeof setTimeout> | null = null

function ensureHost(): void {
  // SSR 不创建 DOM；客户端仅在第一条消息到来时按需挂载。
  if (hostApp || typeof document === 'undefined') return
  hostContainer = document.createElement('div')
  hostContainer.className = 'mf-message-root'
  document.body.appendChild(hostContainer)
  hostApp = createApp(MessageHost, {
    items: records,
    onClose: closeById,
    onPause: pauseById,
    onResume: resumeById
  })
  hostApp.mount(hostContainer)
}

function scheduleHostDestroy(): void {
  // 延迟销毁形成短暂复用窗口，连续提示不会反复 mount/unmount。
  if (records.length > 0 || destroyTimer) return
  destroyTimer = setTimeout(() => {
    destroyTimer = null
    if (records.length > 0) return
    hostApp?.unmount()
    hostContainer?.remove()
    hostApp = null
    hostContainer = null
  }, 300)
}

function startTimer(id: string, duration: number): void {
  // duration <= 0 表示常驻消息，例如 Promise 的 pending 阶段。
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0
  if (safeDuration === 0) return
  const state: TimerState = { timer: null, remaining: safeDuration, startedAt: Date.now() }
  timers.set(id, state)
  // Promise pending 阶段可能已处于悬停或聚焦状态，新计时器必须继承该暂停状态。
  if ((pauseDepths.get(id) ?? 0) === 0) {
    state.timer = setTimeout(() => closeById(id), safeDuration)
  }
}

function closeById(id: string): void {
  // 先移出响应式队列，再清计时器并通知调用方，关闭顺序保持稳定。
  const index = records.findIndex(item => item.id === id)
  if (index < 0) return
  const [record] = records.splice(index, 1)
  const timer = timers.get(id)
  if (timer?.timer) clearTimeout(timer.timer)
  timers.delete(id)
  pauseDepths.delete(id)
  try {
    record.onClose?.()
  } finally {
    // 用户回调抛错也不能阻止宿主回收，否则会遗留空 App 和容器。
    scheduleHostDestroy()
  }
}

function pauseById(id: string): void {
  const record = records.find(item => item.id === id)
  if (!record?.pauseOnHover) return
  const depth = pauseDepths.get(id) ?? 0
  pauseDepths.set(id, depth + 1)
  // 同一通知已因另一种交互暂停，无需重复扣减剩余时间。
  if (depth > 0) return
  const state = timers.get(id)
  if (!state?.timer) return
  clearTimeout(state.timer)
  state.timer = null
  // 记录剩余时长，恢复后不会重新完整计时。
  state.remaining = Math.max(0, state.remaining - (Date.now() - state.startedAt))
  if (state.remaining === 0) closeById(id)
}

function resumeById(id: string): void {
  const depth = pauseDepths.get(id) ?? 0
  if (depth > 1) {
    pauseDepths.set(id, depth - 1)
    return
  }
  pauseDepths.delete(id)
  const state = timers.get(id)
  if (!state || state.timer || state.remaining <= 0) return
  state.startedAt = Date.now()
  state.timer = setTimeout(() => closeById(id), state.remaining)
}

function createMessage(options: MessageOptions): MessageHandler {
  const id = `mf-message-${++idSeed}`
  if (typeof document === 'undefined') {
    return { id, close: () => {}, update: () => {} }
  }
  if (destroyTimer) {
    // 新消息到达时取消宿主的延迟销毁，直接复用现有 App。
    clearTimeout(destroyTimer)
    destroyTimer = null
  }
  ensureHost()
  const record: MessageRecord = {
    id,
    message: options.message,
    description: options.description,
    type: options.type ?? 'info',
    loading: options.loading ?? false,
    closable: options.closable ?? true,
    closeLabel: options.closeLabel ?? config.closeLabel,
    pauseOnHover: options.pauseOnHover ?? true,
    zIndex: overlayManager.nextZIndex(),
    onClose: options.onClose
  }
  records.push(record)
  startTimer(id, options.duration ?? config.duration)
  // 超出容量时淘汰最早的消息。
  if (records.length > config.maxCount) closeById(records[0].id)

  return {
    id,
    close: () => closeById(id),
    update(update) {
      // Promise 通知通过原位更新完成状态迁移，避免堆出三条独立消息。
      const current = records.find(item => item.id === id)
      if (!current) return
      if (typeof update === 'string') current.message = update
      else {
        if (update.message !== undefined) current.message = update.message
        if (update.description !== undefined) current.description = update.description
        if (update.type !== undefined) current.type = update.type
        if (update.loading !== undefined) current.loading = update.loading
        if (update.closable !== undefined) current.closable = update.closable
        if (update.closeLabel !== undefined) current.closeLabel = update.closeLabel
        if (update.pauseOnHover !== undefined) {
          current.pauseOnHover = update.pauseOnHover
          if (!update.pauseOnHover) {
            // 运行中关闭暂停策略时立即恢复，而不是等待下一次 mouseleave/focusout。
            pauseDepths.delete(id)
            resumeById(id)
          }
        }
        if (update.onClose !== undefined) current.onClose = update.onClose
        if (update.duration !== undefined) {
          const oldTimer = timers.get(id)
          if (oldTimer?.timer) clearTimeout(oldTimer.timer)
          timers.delete(id)
          startTimer(id, update.duration)
        }
      }
    }
  }
}

type DurationOrOptions = number | Omit<MessageOptions, 'message' | 'type'>
/** 兼容 duration 数字简写和完整选项对象。 */
function normalize(message: string, type: MessageType, value?: DurationOrOptions): MessageOptions {
  return typeof value === 'number'
    ? { message, type, duration: value }
    : { message, type, ...value }
}

export const message = {
  open: createMessage,
  /** 更新后续通知的默认策略，不影响已经展示的消息。 */
  configure(options: MessageConfig) {
    const nextMaxCount = options.maxCount ?? config.maxCount
    const nextDuration = options.duration ?? config.duration
    config = {
      maxCount: Number.isFinite(nextMaxCount)
        ? Math.max(1, Math.floor(nextMaxCount))
        : config.maxCount,
      duration: Number.isFinite(nextDuration) ? Math.max(0, nextDuration) : config.duration,
      closeLabel: options.closeLabel ?? config.closeLabel
    }
  },
  info: (text: string, options?: DurationOrOptions) =>
    createMessage(normalize(text, 'info', options)),
  success: (text: string, options?: DurationOrOptions) =>
    createMessage(normalize(text, 'success', options)),
  warning: (text: string, options?: DurationOrOptions) =>
    createMessage(normalize(text, 'warning', options)),
  error: (text: string, options?: DurationOrOptions) =>
    createMessage(normalize(text, 'error', options)),
  close: closeById,
  clearAll: () => [...records].forEach(record => closeById(record.id)),
  promise<T>(
    task: Promise<T>,
    labels: {
      pending: MessageLabel
      success: MessageLabel | ((value: T) => MessageLabel)
      error: MessageLabel | ((error: unknown) => MessageLabel)
    }
  ): Promise<T> {
    // pending 常驻，任务落定后原位切换类型并启用自动关闭。
    const handler = createMessage({
      ...normalizeLabel(labels.pending),
      type: 'info',
      loading: true,
      duration: 0
    })
    return task.then(
      value => {
        const success =
          typeof labels.success === 'function' ? labels.success(value) : labels.success
        handler.update({
          ...normalizeLabel(success),
          type: 'success',
          loading: false,
          duration: 2000
        })
        return value
      },
      error => {
        const failure = typeof labels.error === 'function' ? labels.error(error) : labels.error
        handler.update({
          ...normalizeLabel(failure),
          type: 'error',
          loading: false,
          duration: 3000
        })
        throw error
      }
    )
  }
}

/** Promise 各阶段既可只传主文案，也可补充一行上下文。 */
export type MessageLabel = string | Pick<MessageOptions, 'message' | 'description'>

function normalizeLabel(label: MessageLabel): Pick<MessageOptions, 'message' | 'description'> {
  return typeof label === 'string' ? { message: label } : label
}
