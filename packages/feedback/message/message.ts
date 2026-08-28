/** @module Message 单宿主通知中心，避免每条消息创建独立 Vue App。 */
import { createApp, reactive, type App } from 'vue'
import MessageHost from './MessageHost.vue'
import { overlayManager } from '@internal/overlay'

export type MessageType = 'success' | 'warning' | 'error' | 'info'

/** 创建通知时的内容、时长和交互策略。 */
export interface MessageOptions {
  /** 通知正文，按纯文本渲染。 */
  message: string
  type?: MessageType
  /** 自动关闭时间，单位为 ms；0 表示持续显示。 */
  duration?: number
  /** 是否展示主动关闭按钮。 */
  closable?: boolean
  /** 悬停时是否暂停剩余倒计时。 */
  pauseOnHover?: boolean
  /** 通知被关闭且移出队列后调用。 */
  onClose?: () => void
}

/** 交给 MessageHost 渲染的标准化记录。 */
export interface MessageRecord {
  id: string
  message: string
  type: MessageType
  closable: boolean
  pauseOnHover: boolean
  zIndex: number
  onClose?: () => void
}

export interface MessageHandler {
  id: string
  close: () => void
  update: (options: string | Partial<MessageOptions>) => void
}

interface TimerState {
  timer: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

const MAX_COUNT = 5
// 所有消息共享响应式队列和单个 Vue Host，避免频繁创建独立应用实例。
const records = reactive<MessageRecord[]>([])
const timers = new Map<string, TimerState>()
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
  if (duration <= 0) return
  const state: TimerState = { timer: null, remaining: duration, startedAt: Date.now() }
  state.timer = setTimeout(() => closeById(id), duration)
  timers.set(id, state)
}

function closeById(id: string): void {
  // 先移出响应式队列，再清计时器并通知调用方，关闭顺序保持稳定。
  const index = records.findIndex(item => item.id === id)
  if (index < 0) return
  const [record] = records.splice(index, 1)
  const timer = timers.get(id)
  if (timer?.timer) clearTimeout(timer.timer)
  timers.delete(id)
  record.onClose?.()
  scheduleHostDestroy()
}

function pauseById(id: string): void {
  const record = records.find(item => item.id === id)
  const state = timers.get(id)
  if (!record?.pauseOnHover || !state?.timer) return
  clearTimeout(state.timer)
  state.timer = null
  // 记录剩余时长，恢复后不会重新完整计时。
  state.remaining = Math.max(0, state.remaining - (Date.now() - state.startedAt))
}

function resumeById(id: string): void {
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
    type: options.type ?? 'info',
    closable: options.closable ?? true,
    pauseOnHover: options.pauseOnHover ?? true,
    zIndex: overlayManager.nextZIndex(),
    onClose: options.onClose
  }
  records.push(record)
  startTimer(id, options.duration ?? 3000)
  // 超出容量时淘汰最早的消息。
  if (records.length > MAX_COUNT) closeById(records[0].id)

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
        if (update.type !== undefined) current.type = update.type
        if (update.closable !== undefined) current.closable = update.closable
        if (update.pauseOnHover !== undefined) current.pauseOnHover = update.pauseOnHover
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
      pending: string
      success: string | ((value: T) => string)
      error: string | ((error: unknown) => string)
    }
  ): Promise<T> {
    // pending 常驻，任务落定后原位切换类型并启用自动关闭。
    const handler = createMessage({ message: labels.pending, type: 'info', duration: 0 })
    return task.then(
      value => {
        handler.update({
          message: typeof labels.success === 'function' ? labels.success(value) : labels.success,
          type: 'success',
          duration: 2000
        })
        return value
      },
      error => {
        handler.update({
          message: typeof labels.error === 'function' ? labels.error(error) : labels.error,
          type: 'error',
          duration: 3000
        })
        throw error
      }
    )
  }
}

export type MessageInstance = typeof message
