import { DeckDocSchema, type DeckDoc } from './schema'

const firstHeading = (source: string): string => {
  for (const line of source.split('\n')) {
    const heading = line.match(/^#+\s+(.+)/)
    if (heading) return heading[1]!.trim()
  }
  return ''
}

const stripFirstHeading = (source: string): string =>
  source.replace(/^#+\s+.+\n?/, '').trim()

export function deckFromMarkdown(path: string, text: string): DeckDoc {
  const parts = text.split(/\r?\n---\r?\n/)
  const slides = parts
    .map((source) => source.trim())
    .filter(Boolean)
    .map((source, index) => {
      const title = firstHeading(source) || `Slide ${index + 1}`
      return { title, body: stripFirstHeading(source), children: [] }
    })
  return DeckDocSchema.parse({
    title: path.split('/').filter(Boolean).at(-1) ?? 'Deck',
    slides: slides.length > 0 ? slides : [{ title: 'Untitled slide', body: '', children: [] }],
  })
}
