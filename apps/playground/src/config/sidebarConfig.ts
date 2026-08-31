/** 单个演示入口；dir 同时用于动态导入路径匹配。 */
export interface SidebarItem {
  id: string
  title: string
  dir: string
  /** 页面标题上方的能力分类标识。 */
  eyebrow: string
  /** 说明能力价值，避免页面只展示实现名称。 */
  summary: string
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
    title: '反馈体系',
    items: [
      {
        id: 'feedback',
        title: 'Modal / Loading / Message',
        dir: 'infrastructure',
        eyebrow: 'FEEDBACK SUITE',
        summary: '统一管理浮层层级、页面副作用和异步任务反馈。'
      }
    ]
  },
  {
    name: 'components',
    dir: 'components',
    title: '精品组件',
    items: [
      {
        id: 'prompt-suggestions',
        title: 'Prompt Suggestions',
        dir: 'components',
        eyebrow: 'CONVERSATIONAL UX',
        summary: '处理上下文建议的异步竞态、能力发现与无障碍选择体验。'
      },
      {
        id: 'typewriter',
        title: 'Typewriter',
        dir: 'components',
        eyebrow: 'PREMIUM COMPONENT',
        summary: 'Unicode 安全、队列驱动且支持完整控制语义的文本动画。'
      }
    ]
  },
  {
    name: 'directives',
    dir: 'directives',
    title: '精品指令',
    items: [
      {
        id: 'tooltip',
        title: 'v-tooltip',
        dir: 'directives',
        eyebrow: 'PREMIUM DIRECTIVE',
        summary: '覆盖溢出判断、碰撞定位、主题和键盘访问的文本提示。'
      }
    ]
  }
]

export const allSidebarItems: SidebarItem[] = sidebarConfig.flatMap(group => group.items)

/** 初始页面始终跟随目录第一项，新增或调整能力时不再维护第二份默认值。 */
export const defaultSidebarItemId = allSidebarItems[0]?.id ?? ''

/** 根据稳定 id 同时返回条目和所属分组，供面包屑、搜索和导航复用。 */
export function findItemById(id: string): { item: SidebarItem; group: SidebarGroup } | null {
  for (const group of sidebarConfig) {
    const item = group.items.find(candidate => candidate.id === id)
    if (item) return { item, group }
  }
  return null
}
