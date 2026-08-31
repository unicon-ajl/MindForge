// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createOverlayManager } from './manager'

afterEach(() => {
  document.body.removeAttribute('style')
})

describe('OverlayManager DOM effects', () => {
  it('reference-counts scroll locks and restores original inline styles', () => {
    const manager = createOverlayManager()
    const target = document.createElement('div')
    target.style.overflow = 'auto'
    target.style.paddingRight = '6px'
    document.body.appendChild(target)

    const releaseFirst = manager.lockScroll(target)
    const releaseSecond = manager.lockScroll(target)
    expect(target.style.overflow).toBe('hidden')

    releaseFirst()
    expect(target.style.overflow).toBe('hidden')

    releaseSecond()
    expect(target.style.overflow).toBe('auto')
    expect(target.style.paddingRight).toBe('6px')
  })
})
