/** 正式能力成熟度，用于文档、发布审查和后续自动化门禁。 */
export type CapabilityMaturity = 'beta' | 'stable' | 'deprecated'

export interface CapabilityDefinition {
  id: string
  name: string
  maturity: CapabilityMaturity
  problem: string
  entry: string
}

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
  }
] as const satisfies readonly CapabilityDefinition[]
