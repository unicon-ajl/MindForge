/** @module OverlayManager 统一管理浮层层级、ESC 分发与滚动锁。 */

export type OverlayType = 'modal' | 'loading' | 'notification' | 'custom'

export interface OverlayRegistration {
  type?: OverlayType
  closeOnEscape?: boolean
  onEscape?: () => void
}

export interface OverlayHandle {
  id: number
  zIndex: number
  unregister: () => void
  isTopmost: () => boolean
}

interface OverlayEntry extends Required<Pick<OverlayRegistration, 'type' | 'closeOnEscape'>> {
  id: number
  zIndex: number
  onEscape?: () => void
}

interface ScrollLockState {
  count: number
  overflow: string
  paddingRight: string
}

export interface OverlayManager {
  register: (registration?: OverlayRegistration) => OverlayHandle
  nextZIndex: () => number
  closeTopmost: () => boolean
  lockScroll: (target?: HTMLElement) => () => void
  getStack: () => ReadonlyArray<Readonly<OverlayEntry>>
  dispose: () => void
}

/** 创建独立 Overlay Manager；多应用或 SSR 请求应各自创建实例。 */
export function createOverlayManager(baseZIndex = 2000): OverlayManager {
  const stack: OverlayEntry[] = []
  const scrollLocks = new Map<HTMLElement, ScrollLockState>()
  let seed = baseZIndex
  let idSeed = 0
  let listening = false

  const getDocument = (): Document | undefined =>
    typeof document === 'undefined' ? undefined : document

  const closeTopmost = (): boolean => {
    // 从顶层向下找，跳过不响应 ESC 的浮层。
    for (let index = stack.length - 1; index >= 0; index--) {
      const entry = stack[index]
      if (entry.closeOnEscape && entry.onEscape) {
        entry.onEscape()
        return true
      }
    }
    return false
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return
    if (closeTopmost()) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const syncListener = (): void => {
    // 栈为空时立即卸载全局监听，避免常驻副作用。
    const doc = getDocument()
    if (!doc) return
    if (stack.length > 0 && !listening) {
      doc.addEventListener('keydown', handleKeydown, true)
      listening = true
    } else if (stack.length === 0 && listening) {
      doc.removeEventListener('keydown', handleKeydown, true)
      listening = false
    }
  }

  const nextZIndex = (): number => ++seed

  const register = (registration: OverlayRegistration = {}): OverlayHandle => {
    const entry: OverlayEntry = {
      id: ++idSeed,
      zIndex: nextZIndex(),
      type: registration.type ?? 'custom',
      closeOnEscape: registration.closeOnEscape ?? false,
      onEscape: registration.onEscape
    }
    stack.push(entry)
    syncListener()
    let active = true

    return {
      id: entry.id,
      zIndex: entry.zIndex,
      unregister() {
        if (!active) return
        active = false
        const index = stack.findIndex(item => item.id === entry.id)
        if (index >= 0) stack.splice(index, 1)
        syncListener()
      },
      isTopmost: () => stack.at(-1)?.id === entry.id
    }
  }

  const lockScroll = (target?: HTMLElement): (() => void) => {
    const doc = getDocument()
    const element = target ?? doc?.body
    if (!element) return () => {}

    const existing = scrollLocks.get(element)
    if (existing) {
      // 引用计数保证嵌套浮层不会提前恢复滚动。
      existing.count++
    } else {
      const state: ScrollLockState = {
        count: 1,
        overflow: element.style.overflow,
        paddingRight: element.style.paddingRight
      }
      scrollLocks.set(element, state)
      if (element === doc?.body && typeof window !== 'undefined') {
        // 补偿滚动条宽度，防止页面横向跳动。
        const scrollbarWidth = window.innerWidth - doc.documentElement.clientWidth
        if (scrollbarWidth > 0) {
          const currentPadding =
            Number.parseFloat(window.getComputedStyle(element).paddingRight) || 0
          element.style.paddingRight = `${currentPadding + scrollbarWidth}px`
        }
      }
      element.style.overflow = 'hidden'
    }

    let released = false
    return () => {
      if (released) return
      released = true
      const state = scrollLocks.get(element)
      if (!state) return
      state.count--
      if (state.count === 0) {
        element.style.overflow = state.overflow
        element.style.paddingRight = state.paddingRight
        scrollLocks.delete(element)
      }
    }
  }

  const dispose = (): void => {
    stack.splice(0)
    const doc = getDocument()
    if (doc && listening) doc.removeEventListener('keydown', handleKeydown, true)
    listening = false
    scrollLocks.forEach((state, element) => {
      element.style.overflow = state.overflow
      element.style.paddingRight = state.paddingRight
    })
    scrollLocks.clear()
  }

  return { register, nextZIndex, closeTopmost, lockScroll, getStack: () => [...stack], dispose }
}

/** 默认单应用实例；多应用场景可自行创建并注入独立实例。 */
export const overlayManager = createOverlayManager()
