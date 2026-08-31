import { describe, expect, it } from 'vitest'
import { allSidebarItems, defaultSidebarItemId, findItemById, sidebarConfig } from './sidebarConfig'

describe('Playground sidebar configuration', () => {
  it('每个一级分类和二级能力都有清晰的导航文案', () => {
    expect(sidebarConfig.every(group => group.title.trim().length > 0)).toBe(true)
    expect(allSidebarItems.every(item => item.title.trim().length > 0)).toBe(true)
  })

  it('能力 id 唯一且能反查所属一级分类', () => {
    const ids = allSidebarItems.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const item of allSidebarItems) {
      expect(findItemById(item.id)?.item).toBe(item)
      expect(findItemById(item.id)?.group.items).toContain(item)
    }
  })

  it('默认页面跟随目录第一项，能力调整顺序后不会选中其他条目', () => {
    expect(defaultSidebarItemId).toBe(sidebarConfig[0]?.items[0]?.id)
  })

  it('Prompt Suggestions 归属于精品组件而不是反馈体系', () => {
    expect(findItemById('prompt-suggestions')?.group.name).toBe('components')
  })
})
