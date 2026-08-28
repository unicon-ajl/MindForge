import type { App, Plugin } from 'vue'
import { vTooltip } from './directive'
import './tooltip.scss'

export { vTooltip } from './directive'
export type { Placement } from './directive'
export type { TooltipBindingValue, TooltipOptions } from './types'

/**
 * 将指令注册为全局 `v-tooltip`。
 *
 * 若只在少量组件中使用，可直接导入 `vTooltip`，避免全局注册。
 */
export const tooltipPlugin: Plugin = {
  install(app: App) {
    app.directive('tooltip', vTooltip)
  }
}
