// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createOverlayManager } from './manager'

describe('createOverlayManager', () => {
  it('allocates monotonically increasing z-index values', () => {
    const manager = createOverlayManager(100)
    const first = manager.register({ type: 'modal' })
    const second = manager.register({ type: 'loading' })
    expect(first.zIndex).toBe(101)
    expect(second.zIndex).toBe(102)
  })

  it('dispatches escape only to the topmost closable overlay', () => {
    const manager = createOverlayManager()
    const firstClose = vi.fn()
    const secondClose = vi.fn()
    manager.register({ type: 'modal', closeOnEscape: true, onEscape: firstClose })
    const second = manager.register({ type: 'modal', closeOnEscape: true, onEscape: secondClose })

    expect(manager.closeTopmost()).toBe(true)
    expect(secondClose).toHaveBeenCalledOnce()
    expect(firstClose).not.toHaveBeenCalled()

    second.unregister()
    manager.closeTopmost()
    expect(firstClose).toHaveBeenCalledOnce()
  })

  it('makes unregister idempotent', () => {
    const manager = createOverlayManager()
    const handle = manager.register()
    handle.unregister()
    handle.unregister()
    expect(manager.getStack()).toHaveLength(0)
  })
})
