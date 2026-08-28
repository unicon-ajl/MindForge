/** 按用户看到的字符分段，避免拆开 Emoji 和组合字符。 */
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
  return Array.from(text)
}
