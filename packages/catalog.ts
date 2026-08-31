/** 正式能力成熟度，用于文档、发布审查和后续自动化门禁。 */
export type CapabilityMaturity = 'beta' | 'stable' | 'deprecated'

export interface CapabilityDefinition {
  /** 跨文档、导航和自动化使用的稳定标识。 */
  id: string
  /** 面向使用者的能力名称。 */
  name: string
  /** 当前发布成熟度。 */
  maturity: CapabilityMaturity
  /** 该能力解决的核心问题，而不是实现技术描述。 */
  problem: string
  /** npm 子路径入口，用于校验导出完整性。 */
  entry: string
}

/** 正式能力的单一事实来源；低价值实验不得进入此清单。 */
export const capabilityCatalog = [
  {
    id: 'feedback',
    name: 'Feedback Suite',
    maturity: 'beta',
    problem: '统一管理 Modal、Loading、Message 的层级和页面副作用',
    entry: 'mind-forge/feedback'
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    maturity: 'beta',
    problem: '可控制、可循环、事件完整的打字与删除动画',
    entry: 'mind-forge/typewriter'
  },
  {
    id: 'prompt-suggestions',
    name: 'Prompt Suggestions',
    maturity: 'beta',
    problem: '处理上下文建议的异步竞态、能力发现与无障碍选择体验',
    entry: 'mind-forge/prompt-suggestions'
  },
  {
    id: 'tooltip',
    name: 'Tooltip Directive',
    maturity: 'beta',
    problem: '文本提示的溢出判断、碰撞定位、键盘访问和生命周期管理',
    entry: 'mind-forge/tooltip'
  }
] as const satisfies readonly CapabilityDefinition[]
