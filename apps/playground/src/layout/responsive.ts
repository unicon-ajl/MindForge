/** Playground 从固定侧栏切换为覆盖式抽屉的视口宽度。 */
export const COMPACT_BREAKPOINT = 1024

/** 断点判断集中在纯函数中，避免脚本逻辑与 CSS 媒体查询出现不同边界。 */
export function isCompactWidth(width: number): boolean {
  return width < COMPACT_BREAKPOINT
}

/** 桌面端永不继承移动抽屉的关闭状态，这是侧栏恢复行为的核心约束。 */
export function shouldCollapseSidebar(compact: boolean, drawerOpen: boolean): boolean {
  return compact && !drawerOpen
}
