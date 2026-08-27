const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true'
  )
}

/** 激活焦点捕获并在释放时恢复触发元素。 */
export function activateFocusTrap(
  container: HTMLElement,
  isActive: () => boolean = () => true
): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const focusable = getFocusable(container)
  ;(focusable[0] ?? container).focus({ preventScroll: true })

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || !isActive()) return
    const items = getFocusable(container)
    if (items.length === 0) {
      event.preventDefault()
      container.focus({ preventScroll: true })
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    // Tab 到边界时绕回，焦点始终留在浮层内。
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  document.addEventListener('keydown', handleKeydown, true)
  return () => {
    document.removeEventListener('keydown', handleKeydown, true)
    if (previous?.isConnected) previous.focus({ preventScroll: true })
  }
}
