export type TypewriterPhase = 'idle' | 'typing' | 'holding' | 'deleting' | 'paused' | 'completed'

export interface TypewriterItem {
  text: string
  /** 打完后的停留时间，覆盖全局 hold。 */
  hold?: number
}

export type TypewriterItems = string | readonly TypewriterItem[]

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

export type ReducedMotionStrategy = 'auto' | 'always' | 'never'
