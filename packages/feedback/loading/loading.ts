/** @module Loading 基于 Overlay Manager 的全屏/局部加载任务管理器。 */
import { createApp, h, reactive, type App } from 'vue'
import LoadingComponent from './Loading.vue'
import { overlayManager, type OverlayHandle } from '@internal/overlay'

export type LoadingSpinnerType = 'dots' | 'circle' | 'bars'

export interface LoadingOptions {
  text?: string
  spinner?: LoadingSpinnerType
  background?: string
  color?: string
  target?: HTMLElement
  delay?: number
  minDuration?: number
  lockScroll?: boolean
}

export interface LoadingInstance {
  close: () => void
  setText: (text: string) => void
  isClosed: () => boolean
}

interface PositionState {
  count: number
  position: string
}

const instances: LoadingInstance[] = []
const positionStates = new WeakMap<HTMLElement, PositionState>()

function acquirePosition(target: HTMLElement): () => void {
  const existing = positionStates.get(target)
  if (existing) existing.count++
  else {
    // 局部 Loading 需要定位上下文；关闭后恢复原样。
    positionStates.set(target, { count: 1, position: target.style.position })
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative'
  }
  let released = false
  return () => {
    if (released) return
    released = true
    const state = positionStates.get(target)
    if (!state) return
    state.count--
    if (state.count === 0) {
      target.style.position = state.position
      positionStates.delete(target)
    }
  }
}

function createLoading(options: LoadingOptions = {}): LoadingInstance {
  if (typeof document === 'undefined') {
    return { close: () => {}, setText: () => {}, isClosed: () => true }
  }

  const { spinner = 'dots', target, delay = 0, minDuration = 300, lockScroll = true } = options
  const state = reactive({
    text: options.text ?? 'Loading...',
    spinner,
    background: options.background,
    color: options.color,
    inline: !!target,
    zIndex: 2000
  })
  const container = document.createElement('div')
  let app: App | null = null
  let overlay: OverlayHandle | null = null
  let releaseScroll: (() => void) | null = null
  let releasePosition: (() => void) | null = null
  let showTimer: ReturnType<typeof setTimeout> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null
  let shownAt = 0
  let shown = false
  let closed = false

  const removeInstance = (): void => {
    const index = instances.indexOf(instance)
    if (index >= 0) instances.splice(index, 1)
  }

  const finalize = (): void => {
    if (closed) return
    closed = true
    app?.unmount()
    app = null
    container.remove()
    releaseScroll?.()
    releaseScroll = null
    releasePosition?.()
    releasePosition = null
    overlay?.unregister()
    overlay = null
    removeInstance()
  }

  const show = (): void => {
    showTimer = null
    if (closed) return
    const parent = target ?? document.body
    if (target) releasePosition = acquirePosition(target)
    overlay = overlayManager.register({ type: 'loading' })
    state.zIndex = overlay.zIndex
    app = createApp({
      name: 'MfLoadingHost',
      setup: () => () => h(LoadingComponent, state)
    })
    app.mount(container)
    parent.appendChild(container)
    if (lockScroll) releaseScroll = overlayManager.lockScroll(target)
    shown = true
    shownAt = Date.now()
  }

  const close = (): void => {
    if (closed || closeTimer) return
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
      finalize()
      return
    }
    if (!shown) {
      finalize()
      return
    }
    const remaining = Math.max(0, minDuration - (Date.now() - shownAt))
    // 保证最短展示时间，避免界面闪烁。
    if (remaining > 0) closeTimer = setTimeout(finalize, remaining)
    else finalize()
  }

  const instance: LoadingInstance = {
    close,
    setText: text => {
      if (!closed) state.text = text
    },
    isClosed: () => closed
  }
  instances.push(instance)

  if (delay > 0) showTimer = setTimeout(show, delay)
  else show()

  return instance
}

export const loading = {
  open: createLoading,
  close: () => instances[instances.length - 1]?.close(),
  closeAll: () => [...instances].reverse().forEach(instance => instance.close()),
  get size() {
    return instances.length
  }
}

export type LoadingExporter = typeof loading
