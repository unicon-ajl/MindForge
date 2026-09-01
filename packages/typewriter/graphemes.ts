/**
 * 按用户看到的字素簇分段，而不是按 UTF-16 码元拆分。
 *
 * 优先使用 Intl.Segmenter，避免 Emoji、肤色修饰符和组合字符被打散；旧环境退化为码点分割。
 */
export function splitGraphemes(text: string): string[] {
  const Segmenter = (
    Intl as typeof Intl & {
      Segmenter?: new (
        locale?: string,
        options?: { granularity: 'grapheme' }
      ) => { segment: (input: string) => Iterable<{ segment: string }> }
    }
  ).Segmenter
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), part => part.segment)
  }

  // 旧环境没有 Intl.Segmenter 时覆盖常见扩展字素规则：组合标记、变体选择符、
  // 肤色修饰符、ZWJ 序列、旗帜区域指示符、键帽和 Emoji tag 序列。
  const points = Array.from(text)
  const groups: string[] = []
  let joinNext = false
  let regionalCount = 0

  const isMark = (point: string): boolean => /\p{Mark}/u.test(point)
  const codePoint = (point: string): number => point.codePointAt(0) ?? 0
  const isVariationSelector = (value: number): boolean =>
    (value >= 0xfe00 && value <= 0xfe0f) || (value >= 0xe0100 && value <= 0xe01ef)
  const isEmojiModifier = (value: number): boolean => value >= 0x1f3fb && value <= 0x1f3ff
  const isRegionalIndicator = (value: number): boolean => value >= 0x1f1e6 && value <= 0x1f1ff
  const isTag = (value: number): boolean => value >= 0xe0020 && value <= 0xe007f

  for (const point of points) {
    const value = codePoint(point)
    const previous = groups.at(-1)
    const regional = isRegionalIndicator(value)
    const extendsPrevious =
      !!previous &&
      (joinNext ||
        isMark(point) ||
        isVariationSelector(value) ||
        isEmojiModifier(value) ||
        isTag(value) ||
        value === 0x200d ||
        value === 0x20e3 ||
        (regional && regionalCount % 2 === 1) ||
        (point === '\n' && previous.endsWith('\r')))

    if (extendsPrevious) groups[groups.length - 1] += point
    else groups.push(point)

    if (value === 0x200d) joinNext = true
    else if (joinNext) joinNext = false

    if (regional) regionalCount++
    else if (!isMark(point) && !isVariationSelector(value)) regionalCount = 0
  }

  return groups
}
