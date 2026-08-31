import { describe, expect, it } from 'vitest'
import { COMPACT_BREAKPOINT, isCompactWidth, shouldCollapseSidebar } from './responsive'

describe('Playground responsive layout', () => {
  it('在断点以下使用抽屉，断点及以上恢复固定侧栏', () => {
    expect(isCompactWidth(COMPACT_BREAKPOINT - 1)).toBe(true)
    expect(isCompactWidth(COMPACT_BREAKPOINT)).toBe(false)
  })

  it('移动抽屉关闭状态不会隐藏桌面侧栏', () => {
    expect(shouldCollapseSidebar(true, false)).toBe(true)
    expect(shouldCollapseSidebar(true, true)).toBe(false)
    expect(shouldCollapseSidebar(false, false)).toBe(false)
  })
})
