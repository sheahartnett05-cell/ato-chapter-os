/** Header line e.g. "SAMPLE CHAPTER" without duplicating the word Chapter. */
export function formatChapterHeaderLine(chapterDesignation: string): string {
  const base = chapterDesignation.trim()
  if (!base) return 'CHAPTER'
  if (/\bchapter\s*$/i.test(base)) return base.toUpperCase()
  return `${base.toUpperCase()} CHAPTER`
}
