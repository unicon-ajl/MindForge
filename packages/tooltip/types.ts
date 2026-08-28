import type { Placement } from '@floating-ui/dom'

export interface TooltipOptions {
  /** 提示正文。仅接受纯文本，不解析 HTML，避免产生内容注入风险。 */
  content: string
  /** 首选展示位置。空间不足时 Floating UI 会自动翻转或平移。 */
  placement?: Placement
  /** 视觉主题。内置 dark 和 light，品牌样式可通过 CSS 变量覆盖。 */
  theme?: 'dark' | 'light'
  /** 是否仅在目标内容被横向或纵向裁切时显示。 */
  overflow?: boolean
  /** 是否禁用。运行时切换为 true 会立即关闭已经显示的 Tooltip。 */
  disabled?: boolean
  /** 显示延迟，或 [显示延迟, 隐藏延迟]，单位为 ms。 */
  delay?: number | readonly [number, number]
  /** 浮层与目标元素之间的视觉间距，单位为 px。 */
  offset?: number
  /** 最大宽度，单位为 px；最终宽度仍不会超出视口。 */
  maxWidth?: number
}

/** 指令既支持字符串简写，也支持完整对象；空值和 false 表示无内容。 */
export type TooltipBindingValue = string | TooltipOptions | null | undefined | false
