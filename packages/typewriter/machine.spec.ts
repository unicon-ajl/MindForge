import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { splitGraphemes } from './graphemes'
import { TypewriterMachine } from './machine'

const options = {
  typingSpeed: 10,
  deletingSpeed: 5,
  hold: 20,
  loop: false
}

describe('TypewriterMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('按字素输出 Emoji 和组合字符', () => {
    const typed: string[] = []
    const machine = new TypewriterMachine('A👨‍👩‍👧‍👦é', options, {
      onType: character => typed.push(character)
    })

    machine.start()
    vi.runAllTimers()

    expect(typed).toEqual(splitGraphemes('A👨‍👩‍👧‍👦é'))
    expect(machine.getText()).toBe('A👨‍👩‍👧‍👦é')
    expect(machine.getPhase()).toBe('completed')
  })

  it('依次打字、停留、删除并进入下一项', () => {
    const phases: string[] = []
    const machine = new TypewriterMachine([{ text: 'AB' }, { text: 'CD' }], options, {
      onPhase: phase => phases.push(phase)
    })

    machine.start()
    vi.advanceTimersByTime(20)
    expect(machine.getText()).toBe('AB')
    expect(machine.getPhase()).toBe('holding')

    vi.advanceTimersByTime(30)
    expect(machine.getText()).toBe('')
    expect(machine.getPhase()).toBe('typing')

    vi.runAllTimers()
    expect(machine.getText()).toBe('CD')
    expect(machine.getPhase()).toBe('completed')
    expect(phases).toContain('deleting')
  })

  it('暂停后保留剩余等待时间并可继续', () => {
    const machine = new TypewriterMachine('AB', options)
    machine.start()
    vi.advanceTimersByTime(5)
    machine.pause()
    vi.advanceTimersByTime(100)

    expect(machine.getText()).toBe('')
    expect(machine.getPhase()).toBe('paused')

    machine.resume()
    vi.advanceTimersByTime(5)
    expect(machine.getText()).toBe('A')
  })

  it('停止默认保留文字，也可显式清空', () => {
    const machine = new TypewriterMachine('AB', options)
    machine.start()
    vi.advanceTimersByTime(10)
    machine.stop()
    expect(machine.getText()).toBe('A')

    machine.stop({ preserveText: false })
    expect(machine.getText()).toBe('')
    expect(machine.getPhase()).toBe('idle')
  })

  it('skip 直接进入下一项，最后一项直接完成', () => {
    const machine = new TypewriterMachine([{ text: 'AB' }, { text: 'CD' }], options)
    machine.start()
    machine.skip()
    expect(machine.getText()).toBe('')
    expect(machine.getPhase()).toBe('typing')

    machine.skip()
    expect(machine.getText()).toBe('CD')
    expect(machine.getPhase()).toBe('completed')
  })

  it('减弱动画时立即显示完整文本', () => {
    const machine = new TypewriterMachine('无需动画', { ...options, reducedMotion: true })
    machine.start()

    expect(machine.getText()).toBe('无需动画')
    expect(machine.getPhase()).toBe('completed')
    expect(vi.getTimerCount()).toBe(0)
  })
})
