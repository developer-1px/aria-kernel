import PptxGenJS from 'pptxgenjs'
import { DeckDocSchema, type DeckDoc, type SlideNode } from './schema'

/**
 * exportDeckToPptx — DeckDoc → PPTX bytes.
 *
 * DOM 읽지 않음. DeckDocSchema.parse 게이트 후 슬라이드 트리를 평탄화하여
 * 각 노드 = 한 슬라이드. depth 는 들여쓰기로 표현.
 */
export async function exportDeckToPptx(deck: DeckDoc): Promise<Uint8Array> {
  DeckDocSchema.parse(deck)

  const pptx = new PptxGenJS()
  pptx.title = deck.title

  const walk = (node: SlideNode, depth: number): void => {
    const slide = pptx.addSlide()
    const indent = '  '.repeat(depth)
    slide.addText(node.title, { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 32, bold: true })
    if (node.body) {
      slide.addText(indent + node.body, { x: 0.5, y: 1.3, w: 9, h: 4, fontSize: 18 })
    }
    for (const child of node.children) walk(child, depth + 1)
  }
  for (const slide of deck.slides) walk(slide, 0)

  const out = await pptx.write({ outputType: 'uint8array' })
  return out as Uint8Array
}
