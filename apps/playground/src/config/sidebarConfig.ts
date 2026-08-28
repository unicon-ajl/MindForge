/** 单个演示入口；dir 同时用于动态导入路径匹配。 */
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
  },
  {
    name: 'directives',
    dir: 'directives',
    title: '🧭 精品指令',
    items: [{ id: 'tooltip', title: 'v-tooltip 提示', dir: 'directives' }]
  }
]

export const allSidebarItems: SidebarItem[] = sidebarConfig.flatMap(group => group.items)

/** 根据稳定 id 同时返回条目和所属分组，供面包屑、搜索和导航复用。 */
export function findItemById(id: string): { item: SidebarItem; group: SidebarGroup } | null {
  for (const group of sidebarConfig) {
    const item = group.items.find(candidate => candidate.id === id)
    if (item) return { item, group }
  }
  return null
}
