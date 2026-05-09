import { describe, expect, it } from 'vitest'
import {
  APG_PATTERN_EXAMPLE_SPEC,
  ApgPatternExampleSpecSchema,
  allApgExamples,
} from '../spec/apgExampleSpec'
import { IMPL_CHORDS } from '../spec/implChords'

describe('APG pattern example manifest', () => {
  it('is plain JSON that passes the zod gate', () => {
    const json = JSON.parse(JSON.stringify(APG_PATTERN_EXAMPLE_SPEC))
    expect(ApgPatternExampleSpecSchema.parse(json)).toEqual(APG_PATTERN_EXAMPLE_SPEC)
  })

  it('tracks the current APG pattern/example inventory', () => {
    const patternCount = APG_PATTERN_EXAMPLE_SPEC.length
    const exampleCount = allApgExamples().length
    const emptyExamplePatterns = APG_PATTERN_EXAMPLE_SPEC
      .filter((pattern) => pattern.examples.length === 0)
      .map((pattern) => pattern.patternSlug)

    expect({ patternCount, exampleCount, emptyExamplePatterns }).toMatchInlineSnapshot(`
      {
        "emptyExamplePatterns": [
          "landmarks",
          "tooltip",
          "windowsplitter",
        ],
        "exampleCount": 58,
        "patternCount": 30,
      }
    `)
  })

  it('routes every example axis recipe key through impl chord coverage', () => {
    const known = new Set(Object.keys(IMPL_CHORDS))
    const unknown = APG_PATTERN_EXAMPLE_SPEC.flatMap((pattern) => [
      ...pattern.axisRecipeKeys.map((key) => `${pattern.patternSlug}:${key}`),
      ...pattern.examples.flatMap((example) =>
        example.axisRecipeKeys.map((key) => `${pattern.patternSlug}/${example.slug}:${key}`),
      ),
    ]).filter((entry) => {
      const key = entry.split(':').at(-1)
      return key == null || !known.has(key)
    })

    expect(unknown).toEqual([])
  })

  it('keeps every example URL under the W3C APG pattern namespace', () => {
    const badUrls = allApgExamples()
      .map((example) => example.url)
      .filter((url) => !url.startsWith('https://www.w3.org/WAI/ARIA/apg/patterns/'))

    expect(badUrls).toEqual([])
  })
})
