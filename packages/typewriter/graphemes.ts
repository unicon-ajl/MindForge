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
  // Array.from 至少能正确处理代理对，比 split('') 的降级结果更安全。
  return Array.from(text)
}
