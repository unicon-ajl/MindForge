/** @module Message 单宿主通知中心，避免每条消息创建独立 Vue App。 */
import { createApp, reactive, type App } from 'vue'
import MessageHost from './MessageHost.vue'
import { overlayManager } from '@internal/overlay'

export type MessageType = 'success' | 'warning' | 'error' | 'info'

export interface MessageOptions {
  message: string
  type?: MessageType
  duration?: number
  closable?: boolean
  pauseOnHover?: boolean
  onClose?: () => void
}

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
const records = reactive<MessageRecord[]>([])
const timers = new Map<string, TimerState>()
let hostApp: App | null = null
let hostContainer: HTMLElement | null = null
let idSeed = 0
let destroyTimer: ReturnType<typeof setTimeout> | null = null

function ensureHost(): void {
  // 所有消息共用一个 Vue 根实例，降低频繁挂载成本。
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
  // 延迟销毁，连续提示时可直接复用宿主。
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
  if (duration <= 0) return
  const state: TimerState = { timer: null, remaining: duration, startedAt: Date.now() }
  state.timer = setTimeout(() => closeById(id), duration)
  timers.set(id, state)
}

function closeById(id: string): void {
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
