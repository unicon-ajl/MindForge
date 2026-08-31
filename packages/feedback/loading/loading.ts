/** @module Loading 基于 Overlay Manager 的全屏/局部加载任务管理器。 */
import { createApp, h, reactive, type App } from 'vue'
import LoadingComponent from './Loading.vue'
import { overlayManager, type OverlayHandle } from '@internal/overlay'

export type LoadingSpinnerType = 'dots' | 'circle' | 'bars'

/** 创建 Loading 实例时可配置的展示与生命周期策略。 */
export interface LoadingOptions {
  /** 辅助说明文本，默认 Loading...。 */
  text?: string
  /** 内置加载动画类型。 */
  spinner?: LoadingSpinnerType
  /** 遮罩背景色。 */
  background?: string
  /** 动画与文字颜色。 */
  color?: string
  /** 指定时仅覆盖该元素；省略时覆盖整个页面。 */
  target?: HTMLElement
  /** 延迟显示时间，单位为 ms；任务提前结束时不会创建 DOM。 */
  delay?: number
  /** 显示后的最短可见时间，单位为 ms，用于抑制闪烁。 */
  minDuration?: number
  /** 是否禁止目标容器滚动。 */
  lockScroll?: boolean
}

/** 单个 Loading 任务的命令式控制句柄。 */
export interface LoadingInstance {
  /** 请求关闭；重复调用安全，最短展示时间结束后才移除 DOM。 */
  close: () => void
  /** 更新仍在运行的任务文案。 */
  setText: (text: string) => void
  /** 原位更新展示信息，不重建 Vue 应用和遮罩节点。 */
  update: (options: Pick<LoadingOptions, 'text' | 'spinner' | 'background' | 'color'>) => void
  /** 已请求关闭或已经完成清理时返回 true。 */
  isClosed: () => boolean
}

interface PositionState {
  /** 同一容器可叠加多个 Loading，最后一个关闭后才恢复定位。 */
  count: number
  /** 打开前的内联 position，释放时原样恢复。 */
  position: string
  /** 打开前的忙碌状态；局部 Loading 关闭后原样恢复。 */
  ariaBusy: string | null
}

// 保存仍未关闭的任务，支持关闭最新实例和统一 closeAll。
const instances: LoadingInstance[] = []
const positionStates = new WeakMap<HTMLElement, PositionState>()

/** 为局部遮罩建立定位上下文，并返回幂等释放函数。 */
function acquirePosition(target: HTMLElement): () => void {
  const existing = positionStates.get(target)
  if (existing) existing.count++
  else {
    // 局部 Loading 需要定位上下文；关闭后恢复原样。
    positionStates.set(target, {
      count: 1,
      position: target.style.position,
      ariaBusy: target.getAttribute('aria-busy')
    })
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative'
    target.setAttribute('aria-busy', 'true')
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
      if (state.ariaBusy === null) target.removeAttribute('aria-busy')
      else target.setAttribute('aria-busy', state.ariaBusy)
      positionStates.delete(target)
    }
  }
}

function createLoading(options: LoadingOptions = {}): LoadingInstance {
  // SSR 中返回相同形状的空实现，让业务无需额外判断运行环境。
  if (typeof document === 'undefined') {
    return { close: () => {}, setText: () => {}, update: () => {}, isClosed: () => true }
  }

  const { spinner = 'dots', target, lockScroll = true } = options
  const delay = Number.isFinite(options.delay) ? Math.max(0, options.delay ?? 0) : 0
  const minDuration = Number.isFinite(options.minDuration)
    ? Math.max(0, options.minDuration ?? 300)
    : 300
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
  let shownAt = 0
  let shown = false
  let closing = false
  let closed = false

  const removeInstance = (): void => {
    const index = instances.indexOf(instance)
    if (index >= 0) instances.splice(index, 1)
  }

  const finalize = (): void => {
    // 所有副作用集中从这里释放，close 的不同分支不会遗漏资源。
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
    // close 允许被业务、路由销毁或 closeAll 重复调用，但只生效一次。
    if (closed || closing) return
    closing = true
    // 已请求关闭的任务立即退出控制栈；DOM 可因 minDuration 暂时保留，但不应阻塞后续 close。
    removeInstance()
    if (showTimer) {
      // 延迟期间完成的快速任务不应产生一闪而过的遮罩。
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
    if (remaining > 0) setTimeout(finalize, remaining)
    else finalize()
  }

  const instance: LoadingInstance = {
    close,
    setText: text => {
      if (!closed && !closing) state.text = text
    },
    update: next => {
      if (closed || closing) return
      if (next.text !== undefined) state.text = next.text
      if (next.spinner !== undefined) state.spinner = next.spinner
      if (next.background !== undefined) state.background = next.background
      if (next.color !== undefined) state.color = next.color
    },
    isClosed: () => closing || closed
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
