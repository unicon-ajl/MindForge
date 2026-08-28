const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/** 返回当前仍可参与 Tab 顺序的元素；每次按键都重新查询以支持动态内容。 */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true'
  )
}

/**
 * 将 Tab 焦点限制在指定浮层内，并在释放时恢复到打开浮层前的元素。
 *
 * `isActive` 用于嵌套浮层：只有栈顶实例处理循环，底层实例保留监听但不抢夺焦点。
 */
export function activateFocusTrap(
  container: HTMLElement,
  isActive: () => boolean = () => true
): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const focusable = getFocusable(container)
  // 没有可聚焦子项时聚焦容器，确保键盘不会落回页面背景。
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
    // 触发元素可能已随路由或条件渲染卸载，恢复前必须确认仍在文档中。
    if (previous?.isConnected) previous.focus({ preventScroll: true })
  }
}
