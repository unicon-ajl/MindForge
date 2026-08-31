import type { Component } from 'vue'

/** 单条建议；payload 由消费方解释，组件不会执行任何业务动作。 */
export interface PromptSuggestion<T = unknown> {
  /** 列表内稳定且唯一的标识，用于焦点保持和异步更新。 */
  id: string
  /** 面向用户的主要建议文本。 */
  label: string
  /** 可选辅助说明，帮助用户理解选择后的结果。 */
  description?: string
  /** 相同分组名的建议会连续展示在一个有名称的选项组内。 */
  group?: string
  /** 可选视觉图标；语义仍由文本提供。 */
  icon?: Component
  /** 禁用项可见但不能通过鼠标或键盘选择。 */
  disabled?: boolean
  /** 透传给消费方的业务数据。 */
  payload?: T
}

/** 异步建议源；signal 在关闭、上下文变化或卸载时终止旧请求。 */
export type PromptSuggestionSource<T = unknown, C = unknown> = (
  context: C,
  signal: AbortSignal
) => Promise<readonly PromptSuggestion<T>[]>

export type PromptSuggestionsStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
