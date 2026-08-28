// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DirectiveBinding, ObjectDirective } from 'vue'
import { isElementOverflowing, vTooltip } from './directive'
import type { TooltipBindingValue } from './types'

const stopAutoUpdate = vi.fn()

vi.mock('@floating-ui/dom', () => ({
  arrow: vi.fn(() => ({ name: 'arrow' })),
  flip: vi.fn(() => ({ name: 'flip' })),
  offset: vi.fn(() => ({ name: 'offset' })),
  shift: vi.fn(() => ({ name: 'shift' })),
  computePosition: vi.fn(async () => ({
    x: 20,
    y: 30,
    placement: 'top',
    strategy: 'fixed',
    middlewareData: { arrow: { x: 10 } }
  })),
  autoUpdate: vi.fn((_reference, _floating, update) => {
    update()
    return stopAutoUpdate
  })
}))

const directive = vTooltip as ObjectDirective<HTMLElement, TooltipBindingValue>

function binding(
  value: TooltipBindingValue,
  modifiers: Record<string, boolean> = {}
): DirectiveBinding<TooltipBindingValue> {
  return {
    instance: null,
    value,
    oldValue: undefined,
    arg: undefined,
    modifiers,
    dir: directive
  }
}

describe('vTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
    stopAutoUpdate.mockClear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('识别横向和纵向溢出', () => {
    const element = document.createElement('div')
    Object.defineProperties(element, {
      clientWidth: { value: 100 },
      scrollWidth: { value: 120 },
      clientHeight: { value: 20 },
      scrollHeight: { value: 20 }
    })
    expect(isElementOverflowing(element)).toBe(true)
  })

  it('键盘聚焦时显示并建立无障碍关联', async () => {
    const element = document.createElement('button')
    document.body.appendChild(element)
    directive.mounted?.(element, binding('完整提示'), {} as never, null)

    element.dispatchEvent(new FocusEvent('focusin'))
    await vi.advanceTimersByTimeAsync(120)

    const tooltip = document.querySelector<HTMLElement>('[role="tooltip"]')
    expect(tooltip?.textContent).toContain('完整提示')
    expect(element.getAttribute('aria-describedby')).toBe(tooltip?.id)
    await Promise.resolve()
    expect(tooltip?.dataset.placement).toBe('top')
    expect(tooltip?.querySelector<HTMLElement>('.mf-tooltip__arrow')?.style.bottom).toBe('-8px')
    expect(tooltip?.querySelector('path')?.getAttribute('d')).toContain('Q')

    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    expect(element.hasAttribute('aria-describedby')).toBe(false)
  })

  it('overflow 修饰符只在内容溢出时显示', async () => {
    const element = document.createElement('span')
    Object.defineProperties(element, {
      clientWidth: { value: 100 },
      scrollWidth: { value: 100 },
      clientHeight: { value: 20 },
      scrollHeight: { value: 20 }
    })
    document.body.appendChild(element)
    directive.mounted?.(element, binding('不会显示', { overflow: true }), {} as never, null)

    element.dispatchEvent(new FocusEvent('focusin'))
    await vi.advanceTimersByTimeAsync(200)
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('仅鼠标悬停时也能用 ESC 关闭，移出前不会重新显示', async () => {
    const element = document.createElement('button')
    document.body.appendChild(element)
    directive.mounted?.(element, binding({ content: '悬停提示', delay: 0 }), {} as never, null)

    const pointerEnter = new Event('pointerenter')
    Object.defineProperty(pointerEnter, 'pointerType', { value: 'mouse' })
    element.dispatchEvent(pointerEnter)
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(document.querySelector('[role="tooltip"]')).toBeNull()

    element.dispatchEvent(new FocusEvent('focusin'))
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('[role="tooltip"]')).toBeNull()

    element.dispatchEvent(new FocusEvent('focusout'))
    const pointerLeave = new Event('pointerleave')
    Object.defineProperty(pointerLeave, 'pointerType', { value: 'mouse' })
    element.dispatchEvent(pointerLeave)
    element.dispatchEvent(pointerEnter)
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
  })

  it('更新内容并在卸载时清理定位监听', async () => {
    const element = document.createElement('button')
    document.body.appendChild(element)
    directive.mounted?.(element, binding({ content: '旧内容', delay: 0 }), {} as never, null)
    element.dispatchEvent(new FocusEvent('focusin'))
    await vi.advanceTimersByTimeAsync(0)

    directive.updated?.(
      element,
      binding({ content: '新内容', placement: 'bottom', theme: 'light', delay: 0 }),
      {} as never,
      {} as never
    )
    const tooltip = document.querySelector<HTMLElement>('[role="tooltip"]')
    expect(tooltip?.textContent).toContain('新内容')
    expect(tooltip?.dataset.theme).toBe('light')

    directive.beforeUnmount?.(element, binding('新内容'), {} as never, null)
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    expect(stopAutoUpdate).toHaveBeenCalled()
  })

  it('隐藏动画结束前重新进入时取消移除', async () => {
    const element = document.createElement('button')
    document.body.appendChild(element)
    directive.mounted?.(element, binding({ content: '提示', delay: [0, 80] }), {} as never, null)
    element.dispatchEvent(new FocusEvent('focusin'))
    await vi.advanceTimersByTimeAsync(0)
    element.dispatchEvent(new FocusEvent('focusout'))
    element.dispatchEvent(new FocusEvent('focusin'))
    await vi.advanceTimersByTimeAsync(100)

    expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
  })
})
