export interface SidebarItem {
  id: string
  title: string
  dir: string
}

export interface SidebarGroup {
  name: string
  title: string
  dir: string
  items: SidebarItem[]
}

/** 只展示达到正式准入标准的能力。 */
export const sidebarConfig: SidebarGroup[] = [
  {
    name: 'feedback',
    dir: 'infrastructure',
    title: '💬 反馈体系',
    items: [{ id: 'feedback', title: 'Modal / Loading / Message', dir: 'infrastructure' }]
  },
  {
    name: 'components',
    dir: 'components',
    title: '✨ 精品组件',
    items: [{ id: 'typewriter', title: 'Typewriter 打字机', dir: 'components' }]
  }
]

export const allSidebarItems: SidebarItem[] = sidebarConfig.flatMap(group => group.items)

export function findItemById(id: string): { item: SidebarItem; group: SidebarGroup } | null {
  for (const group of sidebarConfig) {
    const item = group.items.find(candidate => candidate.id === id)
    if (item) return { item, group }
  }
  return null
}
