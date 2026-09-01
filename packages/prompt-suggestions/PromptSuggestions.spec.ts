// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- 每个匿名宿主只服务当前挂载场景。 */
import { createApp, h, nextTick, ref, type App } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PromptSuggestions from './PromptSuggestions.vue'
import type { PromptSuggestionSource } from './types'
import { overlayManager } from '@internal/overlay'

vi.mock('@floating-ui/dom', () => ({
  offset: vi.fn(() => ({ name: 'offset' })),
  flip: vi.fn(() => ({ name: 'flip' })),
  shift: vi.fn(() => ({ name: 'shift' })),
  computePosition: vi.fn(async () => ({ x: 12, y: 24, strategy: 'fixed', placement: 'top' })),
  autoUpdate: vi.fn((_reference, _floating, update) => {
    update()
    return vi.fn()
  })
}))

let app: App<Element> | null = null

async function mount(props: Record<string, unknown>): Promise<HTMLElement> {
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp({ render: () => h(PromptSuggestions, props) })
  app.mount(root)
  await nextTick()
  return root
}

afterEach(() => {
  app?.unmount()
  app = null
  overlayManager.dispose()
  document.body.innerHTML = ''
})

describe('MfPromptSuggestions', () => {
  it('supports keyboard navigation, skips disabled items and emits selection', async () => {
    const onSelect = vi.fn()
    const root = await mount({
      items: [
        { id: 'first', label: '第一项' },
        { id: 'disabled', label: '不可用', disabled: true },
        { id: 'last', label: '最后一项' }
      ],
      onSelect
    })
    const trigger = root.querySelector<HTMLButtonElement>('button')!
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    await nextTick()

    expect(document.activeElement?.textContent).toContain('第一项')
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    )
    await nextTick()
    expect(document.activeElement?.textContent).toContain('最后一项')

    ;(document.activeElement as HTMLButtonElement).click()
    await nextTick()
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'last' }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('aborts stale async requests and only renders the newest context', async () => {
    const context = ref('old')
    const pending = new Map<string, (items: readonly { id: string; label: string }[]) => void>()
    const signals = new Map<string, AbortSignal>()
    const source: PromptSuggestionSource = (value, signal) =>
      new Promise(resolve => {
        signals.set(String(value), signal)
        pending.set(String(value), resolve)
      })

    const root = document.createElement('div')
    document.body.appendChild(root)
    app = createApp({
      render: () => h(PromptSuggestions, { open: true, context: context.value, source })
    })
    app.mount(root)
    await nextTick()
    context.value = 'new'
    await nextTick()

    expect(signals.get('old')?.aborted).toBe(true)
    pending.get('old')?.([{ id: 'old', label: '过期建议' }])
    pending.get('new')?.([{ id: 'new', label: '最新建议' }])
    await Promise.resolve()
    await nextTick()

    expect(document.body.textContent).toContain('最新建议')
    expect(document.body.textContent).not.toContain('过期建议')
  })

  it('closes on outside pointer interaction without stealing focus', async () => {
    const root = await mount({ open: true, items: [{ id: 'one', label: '建议' }] })
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await nextTick()

    expect(root.querySelector('button')?.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(outside)
  })

  it('exposes loading, empty and error states without leaking aborted errors', async () => {
    let rejectRequest: ((reason?: unknown) => void) | undefined
    const onLoadError = vi.fn()
    const source: PromptSuggestionSource = () =>
      new Promise((_resolve, reject) => {
        rejectRequest = reject
      })
    await mount({ open: true, source, onLoadError })
    expect(document.body.textContent).toContain('正在获取建议')

    rejectRequest?.(new Error('network'))
    await Promise.resolve()
    await nextTick()
    expect(document.body.textContent).toContain('建议加载失败')
    expect(onLoadError).toHaveBeenCalledOnce()
  })

  it('consumes ESC before an underlying Modal overlay', async () => {
    const closeModal = vi.fn()
    const modal = overlayManager.register({
      type: 'modal',
      closeOnEscape: true,
      blocksEscape: true,
      onEscape: closeModal
    })
    const root = await mount({ open: true, items: [{ id: 'one', label: '建议' }] })
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(root.querySelector('button')?.getAttribute('aria-expanded')).toBe('false')
    expect(closeModal).not.toHaveBeenCalled()

    overlayManager.closeTopmost()
    expect(closeModal).toHaveBeenCalledOnce()
    modal.unregister()
  })
})
