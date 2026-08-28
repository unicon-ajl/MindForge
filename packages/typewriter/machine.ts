import { splitGraphemes } from './graphemes'
import type { TypewriterItem, TypewriterItems, TypewriterPhase } from './types'

export interface TypewriterMachineOptions {
  /** 输入单个字素的间隔，单位为 ms。 */
  typingSpeed: number
  /** 删除单个字素的间隔，单位为 ms。 */
  deletingSpeed: number
  /** 单项输入完成后的默认停留时间，单位为 ms。 */
  hold: number
  /** 最后一项完成后是否回到第一项继续。 */
  loop: boolean
  /** 跳过逐字动画并立即展示结果。 */
  reducedMotion?: boolean
}

/** 状态机通过回调与 Vue 等渲染层解耦。 */
export interface TypewriterMachineEvents {
  onText?: (text: string) => void
  onPhase?: (phase: TypewriterPhase) => void
  onType?: (character: string, characterIndex: number, itemIndex: number) => void
  onItemComplete?: (item: TypewriterItem, itemIndex: number) => void
  onItemDelete?: (item: TypewriterItem, itemIndex: number) => void
  onCycle?: () => void
  onComplete?: () => void
}

/** 非法或负延迟归零，防止计时器进入不可预测状态。 */
const normalizeDelay = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0)

/** 复制外部队列，避免状态机运行期间意外修改调用方数据。 */
export function normalizeItems(items: TypewriterItems): TypewriterItem[] {
  if (typeof items === 'string') return [{ text: items }]
  return items.map(item => ({ text: String(item.text), hold: item.hold }))
}

/**
 * 与 Vue 无关的打字机状态机，集中负责队列、计时和控制语义。
 *
 * 渲染层只订阅事件，因此暂停、恢复、跳过和 Unicode 边界都可以独立测试。
 */
export class TypewriterMachine {
  private items: TypewriterItem[]
  private options: TypewriterMachineOptions
  private readonly events: TypewriterMachineEvents
  private timer: ReturnType<typeof setTimeout> | null = null
  /** 暂停时保留待执行任务，恢复后从剩余时间继续，而不是重新开始当前阶段。 */
  private pendingTask: (() => void) | null = null
  private dueAt = 0
  private remainingDelay = 0
  private resumePhase: TypewriterPhase = 'idle'
  private itemIndex = 0
  private characterIndex = 0
  private characters: string[] = []
  private text = ''
  private phase: TypewriterPhase = 'idle'

  constructor(
    items: TypewriterItems,
    options: TypewriterMachineOptions,
    events: TypewriterMachineEvents = {}
  ) {
    this.items = normalizeItems(items)
    this.options = options
    this.events = events
  }

  getPhase(): TypewriterPhase {
    return this.phase
  }

  getText(): string {
    return this.text
  }

  isRunning(): boolean {
    return !['idle', 'paused', 'completed'].includes(this.phase)
  }

  setOptions(options: TypewriterMachineOptions): void {
    this.options = options
  }

  setItems(items: TypewriterItems, restart = true): void {
    this.items = normalizeItems(items)
    if (restart) this.start()
    else this.stop({ preserveText: false })
  }

  start(): void {
    // start 始终从队列首项重置，区别于 resume 的断点续播。
    this.clearTimer()
    this.itemIndex = 0
    this.characterIndex = 0
    this.setText('')
    if (this.items.length === 0) return this.complete()
    if (this.options.reducedMotion) {
      // 减少动态效果时直接展示首项，但仍发出完成事件保持业务语义一致。
      this.setText(this.items[0].text)
      this.events.onItemComplete?.(this.items[0], 0)
      return this.complete()
    }
    this.beginTyping()
  }

  restart(): void {
    this.start()
  }

  pause(): void {
    if (!this.isRunning() || !this.pendingTask) return
    this.remainingDelay = Math.max(0, this.dueAt - Date.now())
    this.resumePhase = this.phase
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.setPhase('paused')
  }

  resume(): void {
    if (this.phase !== 'paused' || !this.pendingTask) return
    const task = this.pendingTask
    this.setPhase(this.resumePhase)
    this.schedule(task, this.remainingDelay)
  }

  stop(options: { preserveText?: boolean } = {}): void {
    this.clearTimer()
    if (options.preserveText === false) this.setText('')
    this.setPhase('idle')
  }

  skip(): void {
    if (this.phase === 'idle' || this.phase === 'completed') return
    this.clearTimer()
    const item = this.items[this.itemIndex]
    if (!item) return this.complete()
    if (this.text !== item.text) {
      // 跳过输入阶段也要补齐 item-complete，避免事件消费者漏掉状态。
      this.setText(item.text)
      this.events.onItemComplete?.(item, this.itemIndex)
    }
    if (!this.hasNext()) return this.complete()
    this.setText('')
    this.events.onItemDelete?.(item, this.itemIndex)
    this.advance()
    this.beginTyping()
  }

  destroy(): void {
    this.clearTimer()
    this.setPhase('idle')
  }

  private beginTyping(): void {
    const item = this.items[this.itemIndex]
    if (!item) return this.complete()
    this.characters = splitGraphemes(item.text)
    this.characterIndex = 0
    this.setPhase('typing')
    if (this.characters.length === 0) return this.finishTyping()
    this.schedule(() => this.typeNext(), normalizeDelay(this.options.typingSpeed))
  }

  private typeNext(): void {
    const character = this.characters[this.characterIndex]
    if (character === undefined) return this.finishTyping()
    this.characterIndex++
    this.setText(this.characters.slice(0, this.characterIndex).join(''))
    this.events.onType?.(character, this.characterIndex - 1, this.itemIndex)
    if (this.characterIndex >= this.characters.length) return this.finishTyping()
    this.schedule(() => this.typeNext(), normalizeDelay(this.options.typingSpeed))
  }

  private finishTyping(): void {
    const item = this.items[this.itemIndex]
    if (!item) return this.complete()
    this.events.onItemComplete?.(item, this.itemIndex)
    if (!this.hasNext()) return this.complete()
    this.setPhase('holding')
    this.schedule(() => this.beginDeleting(), normalizeDelay(item.hold ?? this.options.hold))
  }

  private beginDeleting(): void {
    this.setPhase('deleting')
    this.characters = splitGraphemes(this.text)
    this.schedule(() => this.deleteNext(), normalizeDelay(this.options.deletingSpeed))
  }

  private deleteNext(): void {
    this.characters.pop()
    this.setText(this.characters.join(''))
    if (this.characters.length > 0) {
      this.schedule(() => this.deleteNext(), normalizeDelay(this.options.deletingSpeed))
      return
    }
    const item = this.items[this.itemIndex]
    if (item) this.events.onItemDelete?.(item, this.itemIndex)
    this.advance()
    this.beginTyping()
  }

  private hasNext(): boolean {
    return this.itemIndex < this.items.length - 1 || this.options.loop
  }

  private advance(): void {
    if (this.itemIndex < this.items.length - 1) this.itemIndex++
    else {
      // cycle 只在从队尾回到队首时触发，不等同于单项完成。
      this.itemIndex = 0
      this.events.onCycle?.()
    }
  }

  private complete(): void {
    this.clearTimer()
    this.setPhase('completed')
    this.events.onComplete?.()
  }

  private setText(text: string): void {
    this.text = text
    this.events.onText?.(text)
  }

  private setPhase(phase: TypewriterPhase): void {
    this.phase = phase
    this.events.onPhase?.(phase)
  }

  private schedule(task: () => void, delay: number): void {
    // 同时记录截止时间和任务，pause 才能精确计算剩余时长并恢复。
    this.pendingTask = task
    this.remainingDelay = delay
    this.dueAt = Date.now() + delay
    this.timer = setTimeout(() => {
      this.timer = null
      this.pendingTask = null
      task()
    }, delay)
  }

  private clearTimer(): void {
    // 清空 pendingTask 可阻止已停止的实例被 resume 重新激活。
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.pendingTask = null
    this.remainingDelay = 0
  }
}
