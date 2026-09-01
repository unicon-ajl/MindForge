// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { activateFocusTrap } from './focus'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('activateFocusTrap', () => {
  it('cycles focus and restores the trigger after release', () => {
    const trigger = document.createElement('button')
    const dialog = document.createElement('div')
    const first = document.createElement('button')
    const hidden = document.createElement('button')
    const last = document.createElement('button')
    hidden.style.display = 'none'
    dialog.append(first, hidden, last)
    document.body.append(trigger, dialog)
    trigger.focus()

    const release = activateFocusTrap(dialog)
    expect(document.activeElement).toBe(first)

    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(first)

    first.focus()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    )
    expect(document.activeElement).toBe(last)

    trigger.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(first)

    release()
    expect(document.activeElement).toBe(trigger)
  })

  it('supports contenteditable and immediately recaptures escaped focus', () => {
    const outside = document.createElement('button')
    const dialog = document.createElement('div')
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    dialog.appendChild(editable)
    document.body.append(outside, dialog)

    const release = activateFocusTrap(dialog)
    expect(document.activeElement).toBe(editable)

    outside.focus()
    expect(document.activeElement).toBe(editable)
    release()
  })
})
