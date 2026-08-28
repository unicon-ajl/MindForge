import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement
} from '@floating-ui/dom'
import type { Directive, DirectiveBinding } from 'vue'
import type { TooltipBindingValue, TooltipOptions } from './types'

/** 指令内部使用的完整配置，避免交互阶段反复处理默认值。 */
interface ResolvedTooltipOptions extends Required<Omit<TooltipOptions, 'delay'>> {
  showDelay: number
  hideDelay: number
}

/**
 * 单个目标元素的完整运行状态。
 *
 * 状态挂在 WeakMap 中而不是元素属性上，既不污染业务 DOM，元素释放后也可被自动回收。
 */
interface TooltipState {
  /** 最近一次指令更新后得到的标准配置。 */
  options: ResolvedTooltipOptions
  /** 当前浮层及箭头节点；未显示时为 null。 */
  tooltip: HTMLDivElement | null
  arrow: HTMLDivElement | null
  arrowPath: SVGPathElement | null
  /** Floating UI 自动定位监听的清理函数。 */
  stopAutoUpdate: (() => void) | null
  /** 延迟显示与延迟隐藏互相独立，快速移入移出时可准确取消。 */
  showTimer: ReturnType<typeof setTimeout> | null
  hideTimer: ReturnType<typeof setTimeout> | null
  /** 鼠标和焦点可能同时存在，任一仍活跃时都不能误隐藏。 */
  pointerActive: boolean
  focusActive: boolean
  /** ESC 主动关闭后的锁；所有触发源离开后才重置。 */
  dismissed: boolean
  /** 保留业务已有的 aria-describedby，关闭时必须原样恢复。 */
  previousDescribedBy: string | null
  handlers: {
    pointerEnter: (event: PointerEvent) => void
    pointerLeave: () => void
    focusIn: () => void
    focusOut: () => void
  }
}

const states = new WeakMap<HTMLElement, TooltipState>()
/**
 * 当前响应 ESC 的 Tooltip。
 *
 * 页面切换或快速跨元素悬停时可能短暂存在多个浮层节点，但 ESC 只应关闭最后显示的实例。
 */
let activeTooltip: { element: HTMLElement; state: TooltipState } | null = null
let idSeed = 0

/**
 * 从 document 接收 ESC，而不是监听目标元素。
 *
 * 仅鼠标悬停时目标元素通常没有焦点，键盘事件不会经过它；提升监听层级才能保证两种触发方式行为一致。
 */
function handleDocumentKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !activeTooltip) return
  const { element, state } = activeTooltip
  state.dismissed = true
  hide(element, state, true)
}

/** 切换当前活动实例；重复注册同一函数不会产生重复监听。 */
function setActiveTooltip(element: HTMLElement, state: TooltipState): void {
  activeTooltip = { element, state }
  document.addEventListener('keydown', handleDocumentKeyDown)
}

/** 仅允许活动实例释放全局监听，防止旧实例的延迟清理影响新实例。 */
function clearActiveTooltip(state: TooltipState): void {
  // 旧实例延迟销毁时不能误删新实例注册的全局监听。
  if (activeTooltip?.state !== state) return
  activeTooltip = null
  document.removeEventListener('keydown', handleDocumentKeyDown)
}

/** 将外部数值收敛为安全的非负数，NaN 和 Infinity 均回退为 0。 */
const normalizeDelay = (value: number | undefined): number =>
  Number.isFinite(value) ? Math.max(0, value ?? 0) : 0

/**
 * 将字符串简写、对象配置和 `.overflow` 修饰符统一为内部配置。
 * 默认值只在这里收敛，后续交互逻辑无需反复处理 undefined。
 */
function resolveOptions(binding: DirectiveBinding<TooltipBindingValue>): ResolvedTooltipOptions {
  const value = binding.value
  const source: TooltipOptions =
    typeof value === 'string' ? { content: value } : value || { content: '' }
  const delay = source.delay ?? 120
  const [showDelay, hideDelay] = Array.isArray(delay) ? delay : [delay, 80]
  return {
    content: String(source.content ?? ''),
    placement: source.placement ?? 'top',
    theme: source.theme ?? 'dark',
    overflow: binding.modifiers.overflow || source.overflow === true,
    disabled: source.disabled === true,
    offset: normalizeDelay(source.offset ?? 8),
    maxWidth: Math.max(80, source.maxWidth ?? 320),
    showDelay: normalizeDelay(showDelay),
    hideDelay: normalizeDelay(hideDelay)
  }
}

/**
 * 判断目标内容是否被容器裁切。
 *
 * 宽度差覆盖单行省略，长度差覆盖多行截断；任一方向超出都应允许显示完整提示。
 */
export function isElementOverflowing(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight
}

/** 清除指定定时器并同步归零引用，避免旧任务在新一轮交互中执行。 */
function clearTimer(state: TooltipState, key: 'showTimer' | 'hideTimer'): void {
  if (state[key]) clearTimeout(state[key])
  state[key] = null
}

/** 恢复指令挂载前的无障碍描述关系，而不是简单删除整个属性。 */
function restoreAria(element: HTMLElement, state: TooltipState): void {
  // Tooltip 只追加自己的 id，销毁时不得覆盖业务原有的描述关系。
  if (state.previousDescribedBy === null) element.removeAttribute('aria-describedby')
  else element.setAttribute('aria-describedby', state.previousDescribedBy)
}

/** 统一释放一次 Tooltip 展示产生的全部运行资源。 */
function removeTooltip(element: HTMLElement, state: TooltipState): void {
  // DOM、全局键盘监听、自动定位监听和无障碍属性必须在同一出口成对清理。
  state.stopAutoUpdate?.()
  state.stopAutoUpdate = null
  state.tooltip?.remove()
  state.tooltip = null
  state.arrow = null
  state.arrowPath = null
  clearActiveTooltip(state)
  restoreAria(element, state)
}

/**
 * 根据目标元素、视口空间和首选位置计算最终坐标。
 * flip 负责换边，shift 负责留在视口内，arrow 负责让箭头继续指向目标。
 */
async function updatePosition(element: HTMLElement, state: TooltipState): Promise<void> {
  const tooltip = state.tooltip
  const arrowElement = state.arrow
  if (!tooltip || !arrowElement) return
  const result = await computePosition(element, tooltip, {
    // fixed 不受祖先定位上下文影响，适合挂载在 body 下的浮层。
    strategy: 'fixed',
    placement: state.options.placement,
    middleware: [
      offset(state.options.offset),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowElement, padding: 6 })
    ]
  })
  // 定位是异步的；结果返回前浮层可能已关闭或被新实例替换。
  if (state.tooltip !== tooltip) return
  tooltip.style.left = `${result.x}px`
  tooltip.style.top = `${result.y}px`
  tooltip.dataset.placement = result.placement

  const arrowData = result.middlewareData.arrow
  const side = result.placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left'
  // 不旋转正方形：每个方向单独绘制曲线路径，避免露出被遮住的方形边角。
  const arrowPaths: Record<typeof side, string> = {
    top: 'M1 2 Q1 1 2 1 H8 Q9 1 9 2 L5.8 8.2 Q5 9 4.2 8.2 Z',
    right: 'M8 1 Q9 1 9 2 V8 Q9 9 8 9 L1.8 5.8 Q1 5 1.8 4.2 Z',
    bottom: 'M1 8 Q1 9 2 9 H8 Q9 9 9 8 L5.8 1.8 Q5 1 4.2 1.8 Z',
    left: 'M2 1 Q1 1 1 2 V8 Q1 9 2 9 L8.2 5.8 Q9 5 8.2 4.2 Z'
  }
  state.arrowPath?.setAttribute('d', arrowPaths[side])
  const staticSide: Record<typeof side, 'top' | 'right' | 'bottom' | 'left'> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right'
  }
  Object.assign(arrowElement.style, {
    left: arrowData?.x == null ? '' : `${arrowData.x}px`,
    top: arrowData?.y == null ? '' : `${arrowData.y}px`,
    right: '',
    bottom: '',
    [staticSide[side]]: '-8px'
  })
}

/** 校验展示条件，并在延迟结束后创建浮层、无障碍关系和自动定位监听。 */
function show(element: HTMLElement, state: TooltipState): void {
  clearTimer(state, 'hideTimer')
  // ESC 代表用户明确拒绝当前提示；触发源未离开前不得再次打扰用户。
  if (state.dismissed) return
  if (state.tooltip) {
    state.tooltip.classList.add('mf-tooltip--open')
    return
  }
  if (
    state.options.disabled ||
    !state.options.content ||
    (state.options.overflow && !isElementOverflowing(element))
  ) {
    return
  }
  clearTimer(state, 'showTimer')
  state.showTimer = setTimeout(() => {
    state.showTimer = null
    // 延迟期内用户可能已经移出或失焦，此时不能创建过期浮层。
    if (!state.pointerActive && !state.focusActive) return

    const tooltip = document.createElement('div')
    const arrowElement = document.createElement('div')
    const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    tooltip.id = `mf-tooltip-${++idSeed}`
    tooltip.className = 'mf-tooltip'
    tooltip.role = 'tooltip'
    tooltip.dataset.theme = state.options.theme
    // 指令定位为纯文本提示，使用 textContent 从源头杜绝 HTML 注入。
    tooltip.textContent = state.options.content
    tooltip.style.setProperty('--mf-tooltip-max-width', `${state.options.maxWidth}px`)
    arrowElement.className = 'mf-tooltip__arrow'
    arrowSvg.setAttribute('viewBox', '0 0 10 10')
    arrowSvg.setAttribute('aria-hidden', 'true')
    arrowSvg.appendChild(arrowPath)
    arrowElement.appendChild(arrowSvg)
    tooltip.appendChild(arrowElement)
    document.body.appendChild(tooltip)
    state.tooltip = tooltip
    state.arrow = arrowElement
    state.arrowPath = arrowPath
    setActiveTooltip(element, state)

    const ids = [state.previousDescribedBy, tooltip.id].filter(Boolean).join(' ')
    // 追加而不是覆盖，让读屏软件同时读取业务描述和 Tooltip 内容。
    element.setAttribute('aria-describedby', ids)
    // 自动跟随滚动、缩放及目标元素尺寸变化。
    state.stopAutoUpdate = autoUpdate(element, tooltip, () => void updatePosition(element, state))
    requestAnimationFrame(() => {
      if (state.tooltip === tooltip) tooltip.classList.add('mf-tooltip--open')
    })
  }, state.options.showDelay)
}

/** 取消待显示任务，并按关闭原因选择立即释放或播放退场动画。 */
function hide(element: HTMLElement, state: TooltipState, immediate = false): void {
  // 无论浮层是否已创建，都要先取消尚未执行的显示任务。
  clearTimer(state, 'showTimer')
  if (!state.tooltip) return
  clearTimer(state, 'hideTimer')
  const remove = (): void => removeTooltip(element, state)
  // ESC、禁用和卸载要求立即释放；普通移出保留退场动画。
  if (immediate) return remove()
  state.tooltip.classList.remove('mf-tooltip--open')
  state.hideTimer = setTimeout(() => {
    state.hideTimer = null
    remove()
  }, state.options.hideDelay)
}

/** 为目标元素创建独立状态，并绑定鼠标与键盘焦点两套触发通道。 */
function bind(element: HTMLElement, binding: DirectiveBinding<TooltipBindingValue>): void {
  const state = {} as TooltipState
  state.options = resolveOptions(binding)
  state.tooltip = null
  state.arrow = null
  state.arrowPath = null
  state.stopAutoUpdate = null
  state.showTimer = null
  state.hideTimer = null
  state.pointerActive = false
  state.focusActive = false
  state.dismissed = false
  state.previousDescribedBy = element.getAttribute('aria-describedby')
  state.handlers = {
    pointerEnter: event => {
      // 触摸设备没有稳定的悬停语义，忽略触摸指针可避免点击时意外弹出。
      if (event.pointerType === 'touch') return
      state.pointerActive = true
      show(element, state)
    },
    pointerLeave: () => {
      state.pointerActive = false
      if (!state.focusActive) {
        // 仅当鼠标和焦点都离开，才结束本轮交互并解除 ESC 锁。
        state.dismissed = false
        hide(element, state)
      }
    },
    focusIn: () => {
      state.focusActive = true
      show(element, state)
    },
    focusOut: () => {
      state.focusActive = false
      if (!state.pointerActive) {
        // 仅当鼠标和焦点都离开，才结束本轮交互并解除 ESC 锁。
        state.dismissed = false
        hide(element, state)
      }
    }
  }
  element.addEventListener('pointerenter', state.handlers.pointerEnter)
  element.addEventListener('pointerleave', state.handlers.pointerLeave)
  element.addEventListener('focusin', state.handlers.focusIn)
  element.addEventListener('focusout', state.handlers.focusOut)
  states.set(element, state)
}

/** 指令卸载总出口：停止异步任务、释放浮层资源并移除全部事件。 */
function destroy(element: HTMLElement): void {
  const state = states.get(element)
  if (!state) return
  clearTimer(state, 'showTimer')
  clearTimer(state, 'hideTimer')
  removeTooltip(element, state)
  element.removeEventListener('pointerenter', state.handlers.pointerEnter)
  element.removeEventListener('pointerleave', state.handlers.pointerLeave)
  element.removeEventListener('focusin', state.handlers.focusIn)
  element.removeEventListener('focusout', state.handlers.focusOut)
  states.delete(element)
}

/**
 * Vue Tooltip 指令。
 *
 * mounted 建立状态，updated 原位同步动态配置，beforeUnmount 保证资源完整释放。
 */
export const vTooltip: Directive<HTMLElement, TooltipBindingValue> = {
  mounted: bind,
  updated(element, binding) {
    const state = states.get(element)
    if (!state) return bind(element, binding)
    state.options = resolveOptions(binding)
    if (state.options.disabled || !state.options.content) hide(element, state, true)
    else if (state.tooltip) {
      // 第一个子节点固定为文本节点，更新它不会破坏后面的 SVG 箭头。
      state.tooltip.firstChild && (state.tooltip.firstChild.textContent = state.options.content)
      state.tooltip.dataset.theme = state.options.theme
      state.tooltip.style.setProperty('--mf-tooltip-max-width', `${state.options.maxWidth}px`)
      void updatePosition(element, state)
    }
  },
  beforeUnmount: destroy
}

export type { Placement }
