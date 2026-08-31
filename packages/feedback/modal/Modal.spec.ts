// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- 每个匿名宿主只服务当前挂载场景。 */
import { createApp, h, nextTick, type App } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { overlayManager } from '@internal/overlay'
import Modal from './Modal.vue'

let app: App<Element> | null = null

afterEach(() => {
  app?.unmount()
  app = null
  overlayManager.dispose()
  document.body.innerHTML = ''
})

describe('MfModal', () => {
  it('keeps close button visibility independent from ESC behavior', async () => {
    const onUpdate = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    app = createApp({
      render: () =>
        h(Modal, {
          visible: true,
          title: '不可见关闭按钮',
          closable: false,
          closeOnEscape: true,
          'onUpdate:visible': onUpdate
        })
    })
    app.mount(root)
    await nextTick()

    expect(document.querySelector('.mf-modal-close')).toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onUpdate).toHaveBeenCalledWith(false)
  })

  it('uses an explicit accessible name with a custom header slot', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    app = createApp({
      render: () =>
        h(
          Modal,
          { visible: true, ariaLabel: '编辑个人资料' },
          { header: () => h('h2', '自定义视觉标题') }
        )
    })
    app.mount(root)
    await nextTick()

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-label')).toBe('编辑个人资料')
    expect(dialog?.hasAttribute('aria-labelledby')).toBe(false)
  })
})
