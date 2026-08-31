// @vitest-environment jsdom
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { overlayManager } from '@internal/overlay'
import { loading } from './loading'

describe('loading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    loading.closeAll()
    vi.runAllTimers()
    overlayManager.dispose()
    vi.useRealTimers()
  })

  it('suppresses fast tasks and reports a close request immediately', () => {
    const instance = loading.open({ delay: 100, minDuration: 300 })
    instance.close()

    expect(instance.isClosed()).toBe(true)
    expect(loading.size).toBe(0)
    vi.advanceTimersByTime(100)
    expect(document.querySelector('.mf-loading-mask')).toBeNull()
  })

  it('keeps a shown overlay for minDuration and restores target state', async () => {
    const target = document.createElement('div')
    target.style.position = 'static'
    target.setAttribute('aria-busy', 'false')
    document.body.appendChild(target)

    const instance = loading.open({ target, delay: 50, minDuration: 200 })
    vi.advanceTimersByTime(50)
    await nextTick()
    expect(target.querySelector('.mf-loading-mask')).not.toBeNull()
    expect(target.getAttribute('aria-busy')).toBe('true')

    instance.update({ text: '即将完成', spinner: 'circle' })
    await nextTick()
    expect(target.textContent).toContain('即将完成')

    instance.close()
    vi.advanceTimersByTime(199)
    expect(target.querySelector('.mf-loading-mask')).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(target.querySelector('.mf-loading-mask')).toBeNull()
    expect(target.style.position).toBe('static')
    expect(target.getAttribute('aria-busy')).toBe('false')
  })

  it('reference-counts target state across concurrent local tasks', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const first = loading.open({ target, minDuration: 0 })
    const second = loading.open({ target, minDuration: 0 })

    first.close()
    expect(target.getAttribute('aria-busy')).toBe('true')
    second.close()
    expect(target.hasAttribute('aria-busy')).toBe(false)
  })
})
