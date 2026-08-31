// @vitest-environment jsdom
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { message } from './message'

describe('message', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
    message.configure({ maxCount: 5, duration: 3000, closeLabel: 'Close notification' })
  })

  afterEach(() => {
    message.clearAll()
    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('limits capacity and removes the oldest notification', async () => {
    message.configure({ maxCount: 2 })
    message.info('第一条', 0)
    message.success('第二条', 0)
    message.warning('第三条', 0)
    await nextTick()

    expect(document.body.textContent).not.toContain('第一条')
    expect(document.body.textContent).toContain('第二条')
    expect(document.body.textContent).toContain('第三条')
  })

  it('pauses the remaining timer for keyboard focus', async () => {
    message.info('可聚焦通知', { duration: 100, closeLabel: '关闭当前通知' })
    await nextTick()
    const closeButton = document.querySelector<HTMLButtonElement>('.mf-message__close')
    closeButton?.focus()

    vi.advanceTimersByTime(200)
    expect(document.body.textContent).toContain('可聚焦通知')
    expect(closeButton?.getAttribute('aria-label')).toBe('关闭当前通知')

    closeButton?.blur()
    vi.advanceTimersByTime(100)
    await nextTick()
    // 记录已关闭后仍会保留一个退场动画周期，最终 DOM 才被移除。
    vi.advanceTimersByTime(250)
    await nextTick()
    expect(document.body.textContent).not.toContain('可聚焦通知')
  })

  it('updates one notification through the complete Promise lifecycle', async () => {
    let resolveTask: ((value: string) => void) | undefined
    const task = new Promise<string>(resolve => {
      resolveTask = resolve
    })
    const result = message.promise(task, {
      pending: '正在保存',
      success: value => `${value}成功`,
      error: '保存失败'
    })
    await nextTick()
    expect(document.body.textContent).toContain('正在保存')

    resolveTask?.('保存')
    await result
    await nextTick()
    expect(document.querySelectorAll('.mf-message')).toHaveLength(1)
    expect(document.body.textContent).toContain('保存成功')
  })

  it('preserves hover and focus pauses when Promise pending becomes success', async () => {
    let resolveTask: ((value: string) => void) | undefined
    const task = new Promise<string>(resolve => {
      resolveTask = resolve
    })
    const result = message.promise(task, {
      pending: '正在处理',
      success: '处理完成',
      error: '处理失败'
    })
    await nextTick()

    const notice = document.querySelector<HTMLElement>('.mf-message')
    const closeButton = notice?.querySelector<HTMLButtonElement>('.mf-message__close')
    notice?.dispatchEvent(new MouseEvent('mouseenter'))
    closeButton?.focus()

    resolveTask?.('完成')
    await result
    await nextTick()
    vi.advanceTimersByTime(3000)
    expect(document.body.textContent).toContain('处理完成')

    // 鼠标移出后焦点仍在通知内，因此倒计时仍不能恢复。
    notice?.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(3000)
    expect(document.body.textContent).toContain('处理完成')

    closeButton?.blur()
    vi.advanceTimersByTime(2000)
    await nextTick()
    vi.advanceTimersByTime(250)
    await nextTick()
    expect(document.body.textContent).not.toContain('处理完成')
  })

  it('uses assertive semantics for errors', async () => {
    message.error('提交失败', { description: '请检查网络', duration: 0 })
    await nextTick()
    expect(document.querySelector('.mf-message')?.getAttribute('role')).toBe('alert')
    expect(document.querySelector('.mf-message__description')?.textContent).toBe('请检查网络')
  })

  it('keeps the host layer while the last notification is leaving', async () => {
    const notice = message.info('即将关闭', 0)
    await nextTick()
    const host = document.querySelector<HTMLElement>('.mf-message-host')
    const activeZIndex = host?.style.zIndex

    notice.close()
    await nextTick()

    // TransitionGroup 的退场节点尚未移除，此时层级不能先降为 0。
    expect(activeZIndex).not.toBe('0')
    expect(host?.style.zIndex).toBe(activeZIndex)
  })

  it('renders a spinner and rich copy during Promise pending', async () => {
    const task = new Promise<string>(() => {})
    void message.promise(task, {
      pending: { message: '正在上传', description: '请稍候…' },
      success: '上传成功',
      error: '上传失败'
    })
    await nextTick()

    expect(document.querySelector('.mf-message__spinner')).not.toBeNull()
    expect(document.querySelector('.mf-message__title')?.textContent).toBe('正在上传')
    expect(document.querySelector('.mf-message__description')?.textContent).toBe('请稍候…')
  })
})
