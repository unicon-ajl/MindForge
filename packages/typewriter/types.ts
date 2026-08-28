/** 状态机对外可观察的阶段。 */
export type TypewriterPhase = 'idle' | 'typing' | 'holding' | 'deleting' | 'paused' | 'completed'

export interface TypewriterItem {
  /** 当前队列项的完整文本。 */
  text: string
  /** 打完后的停留时间，单位为 ms；设置后覆盖全局 hold。 */
  hold?: number
}

/** 字符串用于单段简写，数组用于逐项打字、停留和删除。 */
export type TypewriterItems = string | readonly TypewriterItem[]

/** 组件通过 defineExpose 暴露的命令式控制器。 */
export interface TypewriterController {
  start: () => void
  pause: () => void
  resume: () => void
  restart: () => void
  skip: () => void
  stop: (options?: { preserveText?: boolean }) => void
  getPhase: () => TypewriterPhase
  isRunning: () => boolean
}

/** auto 跟随系统设置，always/never 用于业务强制覆盖。 */
export type ReducedMotionStrategy = 'auto' | 'always' | 'never'
